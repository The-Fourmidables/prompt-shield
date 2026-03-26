"""
main.py  -  Prompt Shield FastAPI Application v3.0
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

from app.masker import PIIMasker
from app.code_masker import CodeMasker
from app.llm_proxy import LLMProxy
from app.rehydrator import Rehydrator
from app.ocr_processor import OCRProcessor
from app.chat_adapter import router as chat_router

app = FastAPI(title="Prompt Shield API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

masker = PIIMasker()
code_masker = CodeMasker()
llm_proxy = LLMProxy()
rehydrator = Rehydrator()
ocr = OCRProcessor()


# ── Schemas ───────────────────────────────────────────────────────────────────

class PromptRequest(BaseModel):
    prompt: str
    model: Optional[str] = "openai/gpt-3.5-turbo"
    session_id: Optional[str] = None


class PromptResponse(BaseModel):
    original_prompt: str
    masked_prompt: str
    llm_response_masked: str
    final_response: str
    entities_found: list


class MaskOnlyRequest(BaseModel):
    text: str
    session_id: Optional[str] = None


class MaskOnlyResponse(BaseModel):
    masked_text: str
    entities_found: list
    session_id: str


class CodeRequest(BaseModel):
    code: str
    language: Optional[str] = "auto"   # python, javascript, java, etc.
    model: Optional[str] = "openai/gpt-3.5-turbo"
    prompt: Optional[str] = "Review this code and help with any issues."
    session_id: Optional[str] = None


class CodeMaskOnlyRequest(BaseModel):
    code: str
    session_id: Optional[str] = None


class CodeResponse(BaseModel):
    original_code: str
    masked_code: str
    llm_response_masked: str
    final_response: str
    secrets_found: list
    session_id: str


class FileProcessResponse(BaseModel):
    filename: str
    file_type: str
    extraction_method: str
    extracted_text: str
    masked_text: str
    llm_response_masked: str
    final_response: str
    entities_found: list
    session_id: str


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "message": "Prompt Shield API v2.0 ✅",
        "supports": ["text", "image", "pdf", "code"]
    }

# ── Frontend Compatibility Layer (/chat routes) ─────────────
app.include_router(chat_router, prefix="/chat")

# ── Text Routes ───────────────────────────────────────────────────────────────

@app.post("/mask", response_model=MaskOnlyResponse)
def mask_text(req: MaskOnlyRequest):
    """Mask PII/PHI/PCI in plain text only."""
    masked_text, entity_map, session_id = masker.mask(req.text, req.session_id)
    return MaskOnlyResponse(
        masked_text=masked_text,
        entities_found=list(entity_map.values()),
        session_id=session_id,
    )


@app.post("/process", response_model=PromptResponse)
async def process_prompt(req: PromptRequest):
    """Full pipeline for plain text: mask → LLM → rehydrate."""
    masked_prompt, entity_map, session_id = masker.mask(req.prompt, req.session_id)

    try:
        llm_response = await llm_proxy.send(masked_prompt, req.model)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {str(e)}")

    final_response = rehydrator.rehydrate(llm_response, entity_map)

    return PromptResponse(
        original_prompt=req.prompt,
        masked_prompt=masked_prompt,
        llm_response_masked=llm_response,
        final_response=final_response,
        entities_found=[
            {"placeholder": v["placeholder"], "type": v["type"]}
            for v in entity_map.values()
        ],
    )


# ── Code Routes ───────────────────────────────────────────────────────────────

@app.post("/mask-code")
def mask_code_only(req: CodeMaskOnlyRequest):
    """
    Mask secrets inside code ONLY — no LLM call.
    Use this to preview what will be masked before sending code to AI.

    Detects: API keys, passwords, DB connections, tokens,
             private IPs, internal URLs, certificates, .env secrets
    """
    masked_code, entity_map, session_id = code_masker.mask_code(
        req.code, req.session_id
    )
    summary = code_masker.get_summary(entity_map)

    return {
        "original_code": req.code,
        "masked_code": masked_code,
        "secrets_found": list(entity_map.values()),
        "summary": summary,
        "session_id": session_id,
    }


@app.post("/process-code", response_model=CodeResponse)
async def process_code(req: CodeRequest):
    """
    Full pipeline for code:
      1. Mask all secrets (API keys, passwords, DB creds, tokens, IPs)
      2. Send masked code + prompt to LLM
      3. Rehydrate LLM response with real values
      4. Return safe final response

    Example prompts:
      - 'Review this code for bugs'
      - 'Explain what this code does'
      - 'Optimize this code'
      - 'Find security vulnerabilities'
    """
    # Step 1: Mask secrets in code
    masked_code, entity_map, session_id = code_masker.mask_code(
        req.code, req.session_id
    )

    # Step 2: Build prompt for LLM
    lang_hint = f"Language: {req.language}\n\n" if req.language != "auto" else ""
    full_prompt = (
        f"{req.prompt}\n\n"
        f"{lang_hint}"
        f"```\n{masked_code}\n```"
    )

    # Step 3: Send to LLM
    try:
        llm_response = await llm_proxy.send(full_prompt, req.model)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {str(e)}")

    # Step 4: Rehydrate
    final_response = rehydrator.rehydrate(llm_response, entity_map)

    return CodeResponse(
        original_code=req.code,
        masked_code=masked_code,
        llm_response_masked=llm_response,
        final_response=final_response,
        secrets_found=[
            {
                "placeholder": v["placeholder"],
                "type": v["type"],
                "pattern": v["name"],
            }
            for v in entity_map.values()
        ],
        session_id=session_id,
    )


# ── File Routes ───────────────────────────────────────────────────────────────

@app.post("/mask-file", response_model=FileProcessResponse)
async def mask_file(
    file: UploadFile = File(...),
    model: str = Form(default="openai/gpt-3.5-turbo"),
    prompt: str = Form(default="Summarize the key information in this document."),
    session_id: Optional[str] = Form(default=None),
):
    """Full pipeline for IMAGE or PDF: OCR → mask → LLM → rehydrate."""
    content_type = file.content_type or ""
    filename = file.filename or "uploaded_file"

    if not ocr.is_supported(content_type):
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {content_type}. Supported: PNG, JPG, BMP, TIFF, WEBP, PDF"
        )

    file_bytes = await file.read()
    file_type = ocr.get_file_type(content_type)

    try:
        if file_type == "image":
            extracted_text, method = ocr.extract_text_from_image(file_bytes, filename)
        else:
            extracted_text, method = ocr.extract_text_from_pdf(file_bytes)
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not extracted_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract any text from the file.")

    full_prompt = f"{prompt}\n\n--- Extracted Content ---\n{extracted_text}"
    masked_prompt, entity_map, session_id = masker.mask(full_prompt, session_id)

    try:
        llm_response = await llm_proxy.send(masked_prompt, model)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {str(e)}")

    final_response = rehydrator.rehydrate(llm_response, entity_map)

    return FileProcessResponse(
        filename=filename,
        file_type=file_type,
        extraction_method=method,
        extracted_text=extracted_text,
        masked_text=masked_prompt,
        llm_response_masked=llm_response,
        final_response=final_response,
        entities_found=[
            {"placeholder": v["placeholder"], "type": v["type"], "pattern": v["name"]}
            for v in entity_map.values()
        ],
        session_id=session_id,
    )


@app.post("/extract-text")
async def extract_text_only(file: UploadFile = File(...)):
    """Extract and mask text from image/PDF WITHOUT sending to LLM."""
    content_type = file.content_type or ""
    filename = file.filename or "uploaded_file"

    if not ocr.is_supported(content_type):
        raise HTTPException(status_code=415, detail=f"Unsupported: {content_type}")

    file_bytes = await file.read()
    file_type = ocr.get_file_type(content_type)

    try:
        if file_type == "image":
            extracted_text, method = ocr.extract_text_from_image(file_bytes, filename)
        else:
            extracted_text, method = ocr.extract_text_from_pdf(file_bytes)
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))

    masked_text, entity_map, session_id = masker.mask(extracted_text)

    return {
        "filename": filename,
        "file_type": file_type,
        "extraction_method": method,
        "extracted_text": extracted_text,
        "masked_text": masked_text,
        "entities_found": list(entity_map.values()),
        "session_id": session_id,
    }


@app.delete("/session/{session_id}")
def clear_session(session_id: str):
    masker.clear_session(session_id)
    code_masker.clear_session(session_id)
    return {"message": f"Session {session_id} cleared."}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
