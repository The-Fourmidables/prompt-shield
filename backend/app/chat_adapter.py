"""
chat_adapter.py  –  Frontend Compatibility Layer
CHANGED: CodeMasker now runs FIRST (before PIIMasker) so full DB URIs
         are caught before PIIMasker splits them on @ signs.
         Entity maps are merged before sending to LLM.
         secret_types[] is returned so the frontend can show type chips.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import json
import asyncio

from app.masker import PIIMasker
from app.code_masker import CodeMasker
from app.llm_proxy import LLMProxy
from app.rehydrator import Rehydrator
from app.ocr_processor import OCRProcessor

router = APIRouter()

masker      = PIIMasker()
code_masker = CodeMasker()
llm_proxy   = LLMProxy()
rehydrator  = Rehydrator()
ocr         = OCRProcessor()


# ── Schemas ──────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    shield_active: bool = True
    vault: dict | None = None


class ChatResponse(BaseModel):
    reply: str
    masked_reply: str
    masked_prompt: str
    vault_map: dict
    pipeline_stage: str
    shield_active: bool
    secret_types: list[str] = []


# ── Helpers ───────────────────────────────────────────────────────────────────

def convert_entity_map(entity_map: dict) -> dict:
    """entity_map (original→info)  →  vault_map (placeholder→original)"""
    vault_map = {}
    for original, info in entity_map.items():
        placeholder = info.get("placeholder")
        if placeholder:
            vault_map[placeholder] = original
    return vault_map


def merge_entity_maps(code_map: dict, pii_map: dict) -> dict:
    """
    Merge code and PII entity maps (both keyed by original value).
    Code map is base — PII map updates on top.
    PII map wins on collision since its placeholder is written into text last.
    """
    merged = dict(code_map)
    merged.update(pii_map)
    return merged


_LABEL_MAP: dict[str, str] = {
    "OPENAI_API_KEY":             "OpenAI key",
    "ANTHROPIC_API_KEY":          "Anthropic key",
    "AWS_ACCESS_KEY":             "AWS access key",
    "AWS_SECRET_KEY":             "AWS secret key",
    "GOOGLE_API_KEY":             "Google API key",
    "GITHUB_TOKEN":               "GitHub token",
    "STRIPE_SECRET_KEY":          "Stripe key",
    "STRIPE_PUBLISHABLE_KEY":     "Stripe public key",
    "TWILIO_ACCOUNT_SID":         "Twilio SID",
    "TWILIO_AUTH_TOKEN":          "Twilio token",
    "SENDGRID_API_KEY":           "SendGrid key",
    "SLACK_TOKEN":                "Slack token",
    "OPENROUTER_API_KEY":         "OpenRouter key",
    "HUGGINGFACE_TOKEN":          "HuggingFace token",
    "AZURE_API_KEY":              "Azure key",
    "FIREBASE_API_KEY":           "Firebase key",
    "GENERIC_API_KEY_ASSIGNMENT": "API key",
    "GENERIC_API_KEY":            "API key",
    "SECRET_KEY_ASSIGNMENT":      "Secret key",
    "TOKEN_ASSIGNMENT":           "Auth token",
    "PASSWORD_ASSIGNMENT":        "Password",
    "PASSWORD_IN_TEXT":           "Password",
    "PRIVATE_KEY_ASSIGNMENT":     "Private key",
    "PRIVATE_KEY_BLOCK":          "Private key block",
    "CERTIFICATE_BLOCK":          "Certificate",
    "MYSQL_CONNECTION":           "MySQL URI",
    "POSTGRES_CONNECTION":        "Postgres URI",
    "MONGODB_CONNECTION":         "MongoDB URI",
    "REDIS_CONNECTION":           "Redis URI",
    "MSSQL_CONNECTION":           "MSSQL URI",
    "DB_PASSWORD_IN_URL":         "DB password",
    "JWT_TOKEN":                  "JWT token",
    "PRIVATE_IP":                 "Internal IP",
    "INTERNAL_URL":               "Internal URL",
    "INTERNAL_HOSTNAME":          "Internal host",
    "LOCALHOST_WITH_PORT":        "Localhost URL",
    "AWS_S3_BUCKET_URL":          "S3 URL",
    "AWS_REGION":                 "AWS region",
    "GCP_PROJECT_ID":             "GCP project",
    "ENV_SECRET":                 "Env secret",
    "EMAIL":                      "Email",
    "AADHAAR":                    "Aadhaar",
    "PAN":                        "PAN card",
    "INDIAN_PHONE":               "Phone",
    "PHONE_INTL":                 "Phone",
    "CREDIT_CARD_VISA":           "Credit card",
    "CREDIT_CARD_MASTERCARD":     "Credit card",
    "CREDIT_CARD_AMEX":           "Credit card",
    "CREDIT_CARD_RUPAY":          "RuPay card",
    "SSN_US":                     "SSN",
    "IFSC":                       "IFSC code",
    "UPI_ID":                     "UPI ID",
    "INDIAN_BANK_ACCOUNT":        "Bank account",
}


def extract_secret_types(entity_map: dict) -> list[str]:
    """Return deduplicated friendly labels for every masked entity."""
    seen: set[str] = set()
    result: list[str] = []
    for info in entity_map.values():
        label = _LABEL_MAP.get(info.get("name", ""), info.get("type", "SECRET"))
        if label not in seen:
            seen.add(label)
            result.append(label)
    return result


def dual_mask(text: str, session_id: str | None = None):
    """
    Run CodeMasker FIRST, then PIIMasker.

    Order matters:
      1. CodeMasker → catches full DB URIs, API keys, JWTs before @ signs
         confuse the PII detector. e.g. postgresql://admin:pass@host gets
         swallowed whole as <PostgresConn1> instead of being split.
      2. PIIMasker → scans already-code-masked text for emails, phones,
         Aadhaar etc. that CodeMasker doesn't cover.

    This prevents PIIMasker from eating the password portion of a DB URI
    as a fake email match on the @ symbol.

    Returns (final_masked_text, merged_entity_map, session_id).
    """
    # Step 1 — Code secrets first (DB URIs, API keys, JWTs, private IPs)
    code_masked, code_entity_map, sid = code_masker.mask_code(text, session_id)

    # Step 2 — PII on already-code-masked text (emails, phones, Aadhaar)
    pii_masked, pii_entity_map, _ = masker.mask(code_masked, sid)

    # Merge: code map is base, PII map wins on collision
    merged = merge_entity_maps(code_entity_map, pii_entity_map)

    return pii_masked, merged, sid


# ── /chat/ (Streaming SSE) ────────────────────────────────────────────────────

@router.post("/")
async def chat_text(request: ChatRequest):

    async def event_stream():

        if not request.messages:
            yield f"data: {json.dumps({'error': 'Empty prompt.'})}\n\n"
            return

        structured_messages = []
        latest_user_index = None

        for i, msg in enumerate(request.messages):
            if msg.role == "user":
                structured_messages.append({"role": "user", "content": msg.content})
                latest_user_index = i
            else:
                structured_messages.append({"role": "assistant", "content": msg.content})

        if latest_user_index is None:
            yield f"data: {json.dumps({'error': 'No user message found.'})}\n\n"
            return

        latest_user_message = request.messages[latest_user_index].content.strip()

        if not latest_user_message:
            yield f"data: {json.dumps({'error': 'Empty prompt.'})}\n\n"
            return

        yield f"data: {json.dumps({'stage': 'DETECTING'})}\n\n"
        await asyncio.sleep(0.05)

        # ── Shield OFF ──────────────────────────────────────────────────────
        if not request.shield_active:
            yield f"data: {json.dumps({'stage': 'TRANSMITTING'})}\n\n"
            llm_response = await llm_proxy.send_messages(structured_messages)
            yield f"data: {json.dumps({'stage': 'COMPLETE', 'reply': llm_response, 'masked_reply': llm_response, 'masked_prompt': latest_user_message, 'vault_map': {}, 'shield_active': False, 'secret_types': []})}\n\n"
            return

        # ── Shield ON ───────────────────────────────────────────────────────

        # CodeMasker first, then PIIMasker
        masked_prompt, entity_map, session_id = dual_mask(latest_user_message)
        structured_messages[latest_user_index]["content"] = masked_prompt
        secret_types = extract_secret_types(entity_map)

        yield f"data: {json.dumps({'stage': 'MASKING_COMPLETE'})}\n\n"
        yield f"data: {json.dumps({'stage': 'TRANSMITTING'})}\n\n"

        try:
            llm_response = await llm_proxy.send_messages(structured_messages)
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return

        yield f"data: {json.dumps({'stage': 'REHYDRATING'})}\n\n"

        # Merge with previous vault sent from frontend
        combined_entity_map = {}
        if request.vault:
            for placeholder, original in request.vault.items():
                combined_entity_map[original] = {
                    "placeholder": placeholder,
                    "type": "PII",
                    "name": "FROM_MEMORY",
                }
        combined_entity_map.update(entity_map)

        final_response = rehydrator.rehydrate(llm_response, combined_entity_map)

        final_payload = {
            "stage":         "COMPLETE",
            "reply":         final_response,
            "masked_reply":  llm_response,
            "masked_prompt": masked_prompt,
            "vault_map":     convert_entity_map(entity_map),
            "shield_active": True,
            "secret_types":  secret_types,
        }

        yield f"data: {json.dumps(final_payload)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ── /chat/upload ──────────────────────────────────────────────────────────────

@router.post("/upload", response_model=ChatResponse)
async def chat_upload(
    file: UploadFile = File(...),
    instruction: str = Form(default="Analyze this document."),
):
    content_type = file.content_type or ""

    if not ocr.is_supported(content_type):
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {content_type}")

    file_bytes = await file.read()
    file_type  = ocr.get_file_type(content_type)

    try:
        if file_type == "image":
            extracted_text, _ = ocr.extract_text_from_image(file_bytes, file.filename)
        else:
            extracted_text, _ = ocr.extract_text_from_pdf(file_bytes)
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not extracted_text.strip():
        raise HTTPException(status_code=422, detail="No text extracted from file.")

    full_prompt = f"{instruction}\n\n--- Extracted Content ---\n{extracted_text}"

    masked_prompt, entity_map, _ = dual_mask(full_prompt)

    try:
        llm_response = await llm_proxy.send_messages(
            [{"role": "user", "content": masked_prompt}]
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {str(e)}")

    final_response = rehydrator.rehydrate(llm_response, entity_map)

    return ChatResponse(
        reply          = final_response,
        masked_reply   = llm_response,
        masked_prompt  = masked_prompt,
        vault_map      = convert_entity_map(entity_map),
        pipeline_stage = "COMPLETE",
        shield_active  = True,
        secret_types   = extract_secret_types(entity_map),
    )