from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import os
import httpx
import re
from dotenv import load_dotenv

# Absolute imports
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
    """Removes non-printable control characters that break JSON."""
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


class ChatRequest(BaseModel):
    message: str
    shield_active: bool = True


# ==========================================
# 2️⃣ TEXT-ONLY CHAT
# ==========================================
@router.post("/", response_model=ChatResponse)
async def chat_text_only(request: ChatRequest):
    print("🔥 BACKEND RECEIVED:", request.message)

    clean_message = sanitize_text(request.message)

    return await _process_request(
        clean_message,
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

    return await _process_request(
        full_prompt,
        event_type="OCR_MASKED",
        shield_active=True
    )


# ==========================================
# 4️⃣ SHARED LOGIC (The Brain)
# ==========================================
async def _process_request(
    text_input: str,
    event_type="PROMPT_MASKED",
    shield_active: bool = True
):
    pipeline_stage = "DETECTING"

    # 1️⃣ Mask
    masked_prompt, vault_map = full_mask(text_input)
    pipeline_stage = "MASKING_COMPLETE"

    # 2️⃣ Log
    log_event(event_type, masked_prompt)

    # 3️⃣ Call LLM
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

    # 🔹 FIXED: model_input definition (nothing else changed)
    if shield_active:
        model_input = masked_prompt
    else:
        model_input = text_input

    payload = {
        "model": "google/gemini-2.0-flash-001",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": model_input}
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

    # 4️⃣ Rehydrate
    pipeline_stage = "REHYDRATING"

    if shield_active:
        final_reply = rehydrate(reply_masked, vault_map)
    else:
        final_reply = reply_masked

    # 5️⃣ Return EVERYTHING
    pipeline_stage = "COMPLETE"

    return {
        "reply": final_reply,
        "masked_reply": reply_masked,
        "masked_prompt": masked_prompt,
        "vault_map": vault_map,
        "pipeline_stage": pipeline_stage,
        "shield_active": shield_active
    }