"""
chat_adapter.py  –  Frontend Compatibility Layer

Provides /chat and /chat/upload routes
that match frontend v2.0 expectations,
while internally using backend v2 engine.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List

from app.masker import PIIMasker
from app.llm_proxy import LLMProxy
from app.rehydrator import Rehydrator
from app.ocr_processor import OCRProcessor

router = APIRouter()

masker = PIIMasker()
llm_proxy = LLMProxy()
rehydrator = Rehydrator()
ocr = OCRProcessor()


# ── Frontend Schemas ──────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    shield_active: bool = True


class ChatResponse(BaseModel):
    reply: str
    masked_reply: str
    masked_prompt: str
    vault_map: dict
    pipeline_stage: str
    shield_active: bool


# ── Helper: Convert 2.0 entity_map → frontend vault_map ──────────────────────

def convert_entity_map(entity_map: dict) -> dict:
    """
    Convert:
        { original: { placeholder: "<Email1>", ... } }

    Into:
        { "<Email1>": original }
    """
    vault_map = {}
    for original, info in entity_map.items():
        placeholder = info.get("placeholder")
        if placeholder:
            vault_map[placeholder] = original
    return vault_map


# ── /chat/ (Text) ─────────────────────────────────────────────────────────────

@router.post("/", response_model=ChatResponse)
async def chat_text(request: ChatRequest):

    # Combine all user messages into one prompt
    user_messages = [m.content for m in request.messages if m.role == "user"]
    full_prompt = "\n".join(user_messages).strip()

    if not full_prompt:
        raise HTTPException(status_code=400, detail="Empty prompt.")

    # If shield disabled → skip masking entirely
    if not request.shield_active:
        llm_response = await llm_proxy.send(full_prompt)
        return ChatResponse(
            reply=llm_response,
            masked_reply=llm_response,
            masked_prompt=full_prompt,
            vault_map={},
            pipeline_stage="COMPLETE",
            shield_active=False,
        )

    # Shield ON → full pipeline
    masked_prompt, entity_map, _ = masker.mask(full_prompt)

    try:
        llm_response = await llm_proxy.send(masked_prompt)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {str(e)}")

    final_response = rehydrator.rehydrate(llm_response, entity_map)

    return ChatResponse(
        reply=final_response,
        masked_reply=llm_response,
        masked_prompt=masked_prompt,
        vault_map=convert_entity_map(entity_map),
        pipeline_stage="COMPLETE",
        shield_active=True,
    )


# ── /chat/upload (File) ───────────────────────────────────────────────────────

@router.post("/upload", response_model=ChatResponse)
async def chat_upload(
    file: UploadFile = File(...),
    instruction: str = Form(default="Analyze this document."),
):

    content_type = file.content_type or ""

    if not ocr.is_supported(content_type):
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {content_type}")

    file_bytes = await file.read()
    file_type = ocr.get_file_type(content_type)

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

    masked_prompt, entity_map, _ = masker.mask(full_prompt)

    try:
        llm_response = await llm_proxy.send(masked_prompt)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {str(e)}")

    final_response = rehydrator.rehydrate(llm_response, entity_map)

    return ChatResponse(
        reply=final_response,
        masked_reply=llm_response,
        masked_prompt=masked_prompt,
        vault_map=convert_entity_map(entity_map),
        pipeline_stage="COMPLETE",
        shield_active=True,
    )