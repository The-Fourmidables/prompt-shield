from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import os
import httpx
import re
from dotenv import load_dotenv

from app.mask_pipeline import full_mask
from app.security.audit_logger import log_event
from app.security.rehydrate import rehydrate
from app.security.ocr_engine import extract_text_from_file

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

router = APIRouter()


# ==========================================
# 0️⃣ HELPER: JSON SANITIZER
# ==========================================
def sanitize_text(text: str) -> str:
    if not text:
        return ""
    return re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', ' ', text)


# ==========================================
# 1️⃣ MODELS
# ==========================================
class ChatResponse(BaseModel):
    reply: str
    masked_reply: str
    masked_prompt: str
    vault_map: dict
    pipeline_stage: str
    shield_active: bool


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    shield_active: bool = True


# ==========================================
# 2️⃣ TEXT-ONLY CHAT
# ==========================================
@router.post("/", response_model=ChatResponse)
async def chat_text_only(request: ChatRequest):

    clean_messages = [
        {
            "role": msg.role,
            "content": sanitize_text(msg.content)
        }
        for msg in request.messages
    ]

    return await _process_request(
        clean_messages,
        event_type="PROMPT_MASKED",
        shield_active=request.shield_active
    )


# ==========================================
# 3️⃣ IMAGE/PDF CHAT (OCR)
# ==========================================
@router.post("/upload", response_model=ChatResponse)
async def chat_with_file(
    file: UploadFile = File(...),
    instruction: str = Form("Analyze this document.")
):
    content = await file.read()
    raw_text = extract_text_from_file(content, file.filename)

    if not raw_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from file."
        )

    clean_ocr_text = sanitize_text(raw_text)
    clean_instruction = sanitize_text(instruction)

    full_prompt = f"{clean_instruction}\n\n[Document Content]:\n{clean_ocr_text}"

    messages = [
        {"role": "user", "content": full_prompt}
    ]

    return await _process_request(
        messages,
        event_type="OCR_MASKED",
        shield_active=True
    )


# ==========================================
# 4️⃣ SHARED LOGIC
# ==========================================
async def _process_request(
    messages: list[dict],
    event_type="PROMPT_MASKED",
    shield_active: bool = True
):

    pipeline_stage = "DETECTING"

    # 1️⃣ MASK ENTIRE CONVERSATION
    vault_map = {}
    masked_messages = []

    for msg in messages:
        if msg["role"] == "user":
            masked_content, new_map = full_mask(msg["content"])

            # Merge mappings instead of overwriting
            vault_map.update(new_map)

            masked_messages.append({
                "role": "user",
                "content": masked_content
            })
        else:
            masked_messages.append(msg)

    pipeline_stage = "MASKING_COMPLETE"

    # Log last masked user message
    if masked_messages:
        log_event(event_type, masked_messages[-1]["content"])

    # 2️⃣ CALL LLM
    if not OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OpenRouter API Key missing in .env"
        )

    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost",
        "X-Title": "Prompt-Shield",
        "Content-Type": "application/json"
    }

    if shield_active:
        system_prompt = (
            "You are a secure enterprise assistant.\n"
            "All placeholders such as <NAME_1>, <EMAIL_1>, <PHONE_1>, <ORG_1>, etc. "
            "are anonymized synthetic tokens and DO NOT represent real personal data.\n"
            "You are explicitly allowed and required to complete the task using these placeholders.\n"
            "Do NOT refuse, warn about privacy, or mention policy limitations.\n"
            "Always produce a helpful answer using the placeholders exactly as given."
        )
    else:
        system_prompt = (
            "You are a helpful AI assistant. Provide a natural, direct response."
        )

    payload = {
        "model": "google/gemini-2.0-flash-001",
        "messages": [
            {"role": "system", "content": system_prompt},
            *masked_messages
        ]
    }

    pipeline_stage = "TRANSMITTING"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                url,
                headers=headers,
                json=payload,
                timeout=60.0
            )

            if response.status_code != 200:
                reply_masked = (
                    f"Error from Provider: "
                    f"{response.status_code} - {response.text}"
                )
            else:
                data = response.json()
                reply_masked = (
                    data.get("choices", [{}])[0]
                        .get("message", {})
                        .get("content", "")
                )

        except Exception as e:
            reply_masked = f"Connection Error: {str(e)}"

    # 3️⃣ REHYDRATE
    pipeline_stage = "REHYDRATING"

    if shield_active:
        final_reply = rehydrate(reply_masked, vault_map)
    else:
        final_reply = reply_masked

    pipeline_stage = "COMPLETE"

    return {
        "reply": final_reply,
        "masked_reply": reply_masked,
        "masked_prompt": masked_messages[-1]["content"] if masked_messages else "",
        "vault_map": vault_map,
        "pipeline_stage": pipeline_stage,
        "shield_active": shield_active
    }