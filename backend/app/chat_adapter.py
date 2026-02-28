"""
chat_adapter.py  –  Frontend Compatibility Layer
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import json
import asyncio

from app.masker import PIIMasker
from app.llm_proxy import LLMProxy
from app.rehydrator import Rehydrator
from app.ocr_processor import OCRProcessor

router = APIRouter()

masker = PIIMasker()
llm_proxy = LLMProxy()
rehydrator = Rehydrator()
ocr = OCRProcessor()


# ── Schemas ─────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    shield_active: bool = True
    vault: dict | None = None   # ← previous persistent vault from frontend


class ChatResponse(BaseModel):
    reply: str
    masked_reply: str
    masked_prompt: str
    vault_map: dict
    pipeline_stage: str
    shield_active: bool


# ── Helper ──────────────────────────────────────────────────────

def convert_entity_map(entity_map: dict) -> dict:
    vault_map = {}
    for original, info in entity_map.items():
        placeholder = info.get("placeholder")
        if placeholder:
            vault_map[placeholder] = original
    return vault_map


# ── /chat/ (Text Streaming) ─────────────────────────────────────

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
                structured_messages.append(
                    {"role": "user", "content": msg.content}
                )
                latest_user_index = i
            else:
                structured_messages.append(
                    {"role": "assistant", "content": msg.content}
                )

        if latest_user_index is None:
            yield f"data: {json.dumps({'error': 'No user message found.'})}\n\n"
            return

        latest_user_message = request.messages[latest_user_index].content.strip()

        if not latest_user_message:
            yield f"data: {json.dumps({'error': 'Empty prompt.'})}\n\n"
            return

        # Stage 1
        yield f"data: {json.dumps({'stage': 'DETECTING'})}\n\n"
        await asyncio.sleep(0.05)

        # ── Shield OFF ──
        if not request.shield_active:

            yield f"data: {json.dumps({'stage': 'TRANSMITTING'})}\n\n"

            llm_response = await llm_proxy.send_messages(structured_messages)

            final_payload = {
                "stage": "COMPLETE",
                "reply": llm_response,
                "masked_reply": llm_response,
                "masked_prompt": latest_user_message,
                "vault_map": {},
                "shield_active": False,
            }

            yield f"data: {json.dumps(final_payload)}\n\n"
            return

        # ── Shield ON ──

        masked_prompt, entity_map, _ = masker.mask(latest_user_message)
        structured_messages[latest_user_index]["content"] = masked_prompt

        yield f"data: {json.dumps({'stage': 'MASKING_COMPLETE'})}\n\n"
        yield f"data: {json.dumps({'stage': 'TRANSMITTING'})}\n\n"

        try:
            llm_response = await llm_proxy.send_messages(structured_messages)
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return

        yield f"data: {json.dumps({'stage': 'REHYDRATING'})}\n\n"

        # 🔥 MERGE PREVIOUS VAULT WITH CURRENT ENTITY MAP

        combined_entity_map = {}

        # Add previous vault mappings (from frontend)
        if request.vault:
            for placeholder, original in request.vault.items():
                combined_entity_map[original] = {
                    "placeholder": placeholder,
                    "type": "PII",
                    "name": "FROM_MEMORY"
                }

        # Add current turn entities
        combined_entity_map.update(entity_map)

        final_response = rehydrator.rehydrate(
            llm_response,
            combined_entity_map
        )

        final_payload = {
            "stage": "COMPLETE",
            "reply": final_response,
            "masked_reply": llm_response,
            "masked_prompt": masked_prompt,
            "vault_map": convert_entity_map(entity_map),
            "shield_active": True,
        }

        yield f"data: {json.dumps(final_payload)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ── /chat/upload ─────────────────────────────────────────

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
        llm_response = await llm_proxy.send_messages(
            [{"role": "user", "content": masked_prompt}]
        )
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