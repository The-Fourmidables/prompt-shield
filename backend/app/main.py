"""
main.py  -  Prompt Shield FastAPI Application
FIXED:
  - llm_proxy.send() now exists (added in llm_proxy.py)
  - All file/OCR routes now use dual_mask() — PII + code secrets both applied
  - /process-code also runs PIIMasker in addition to CodeMasker
  - /extract-text uses dual_mask
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

from app.masker      import PIIMasker
from app.code_masker import CodeMasker
from app.llm_proxy   import LLMProxy
from app.rehydrator  import Rehydrator
from app.ocr_processor import OCRProcessor
from app.chat_adapter  import router as chat_router, dual_mask, extract_secret_types

app = FastAPI(title="Prompt Shield API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

masker      = PIIMasker()
code_masker = CodeMasker()
llm_proxy   = LLMProxy()
rehydrator  = Rehydrator()
ocr         = OCRProcessor()


# ── Schemas ───────────────────────────────────────────────────────────────────

class PromptRequest(BaseModel):
    prompt:     str
    model:      Optional[str] = "openai/gpt-3.5-turbo"
    session_id: Optional[str] = None


class PromptResponse(BaseModel):
    original_prompt:    str
    masked_prompt:      str
    llm_response_masked: str
    final_response:     str
    entities_found:     list


class MaskOnlyRequest(BaseModel):
    text:       str
    session_id: Optional[str] = None


class MaskOnlyResponse(BaseModel):
    masked_text:    str
    entities_found: list
    session_id:     str


class CodeRequest(BaseModel):
    code:       str
    language:   Optional[str] = "auto"
    model:      Optional[str] = "openai/gpt-3.5-turbo"
    prompt:     Optional[str] = "Review this code and help with any issues."
    session_id: Optional[str] = None


class CodeMaskOnlyRequest(BaseModel):
    code:       str
    session_id: Optional[str] = None


class CodeResponse(BaseModel):
    original_code:        str
    masked_code:          str
    llm_response_masked:  str
    final_response:       str
    secrets_found:        list
    session_id:           str


class FileProcessResponse(BaseModel):
    filename:             str
    file_type:            str
    extraction_method:    str
    extracted_text:       str
    masked_text:          str
    llm_response_masked:  str
    final_response:       str
    entities_found:       list
    secret_types:         list   # ← NEW: friendly labels of what was masked
    session_id:           str


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "message":  "Prompt Shield API v2.0 ✅",
        "supports": ["text", "image", "pdf", "code"],
    }


# ── Frontend chat routes (/chat/*) ────────────────────────────────────────────

app.include_router(chat_router, prefix="/chat")


# ── Text routes ───────────────────────────────────────────────────────────────

@app.post("/mask", response_model=MaskOnlyResponse)
def mask_text(req: MaskOnlyRequest):
    """Mask PII/PHI/PCI + code secrets in plain text. No LLM call."""
    masked_text, entity_map, session_id = dual_mask(req.text, req.session_id)
    return MaskOnlyResponse(
        masked_text    = masked_text,
        entities_found = list(entity_map.values()),
        session_id     = session_id,
    )


@app.post("/process", response_model=PromptResponse)
async def process_prompt(req: PromptRequest):
    """Full pipeline for plain text: dual_mask → LLM → rehydrate."""
    masked_prompt, entity_map, session_id = dual_mask(req.prompt, req.session_id)

    try:
        llm_response = await llm_proxy.send(masked_prompt, req.model)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {str(e)}")

    final_response = rehydrator.rehydrate(llm_response, entity_map)

    return PromptResponse(
        original_prompt     = req.prompt,
        masked_prompt       = masked_prompt,
        llm_response_masked = llm_response,
        final_response      = final_response,
        entities_found      = [
            {"placeholder": v["placeholder"], "type": v["type"]}
            for v in entity_map.values()
        ],
    )


# ── Code routes ───────────────────────────────────────────────────────────────

@app.post("/mask-code")
def mask_code_only(req: CodeMaskOnlyRequest):
    """
    Mask secrets inside code — runs BOTH PIIMasker and CodeMasker.
    No LLM call. Use this to preview masking before sending code to AI.
    """
    # dual_mask: PII first, then code secrets on the result
    masked_code, entity_map, session_id = dual_mask(req.code, req.session_id)
    summary     = code_masker.get_summary(entity_map)
    secret_types = extract_secret_types(entity_map)

    return {
        "original_code":  req.code,
        "masked_code":    masked_code,
        "secrets_found":  list(entity_map.values()),
        "summary":        summary,
        "secret_types":   secret_types,
        "session_id":     session_id,
    }


@app.post("/process-code", response_model=CodeResponse)
async def process_code(req: CodeRequest):
    """
    Full pipeline for code:
      1. dual_mask — PII + all code secrets (API keys, DB URIs, tokens, IPs…)
      2. Send masked code + prompt to LLM
      3. Rehydrate LLM response
    """
    # Step 1: dual mask (PII + code secrets)
    masked_code, entity_map, session_id = dual_mask(req.code, req.session_id)

    # Step 2: build prompt
    lang_hint   = f"Language: {req.language}\n\n" if req.language != "auto" else ""
    full_prompt = f"{req.prompt}\n\n{lang_hint}```\n{masked_code}\n```"

    # Step 3: send to LLM
    try:
        llm_response = await llm_proxy.send(full_prompt, req.model)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {str(e)}")

    # Step 4: rehydrate
    final_response = rehydrator.rehydrate(llm_response, entity_map)

    return CodeResponse(
        original_code       = req.code,
        masked_code         = masked_code,
        llm_response_masked = llm_response,
        final_response      = final_response,
        secrets_found       = [
            {
                "placeholder": v["placeholder"],
                "type":        v["type"],
                "pattern":     v["name"],
            }
            for v in entity_map.values()
        ],
        session_id          = session_id,
    )


# ── File / OCR routes ─────────────────────────────────────────────────────────

@app.post("/mask-file", response_model=FileProcessResponse)
async def mask_file(
    file:       UploadFile      = File(...),
    model:      str             = Form(default="openai/gpt-3.5-turbo"),
    prompt:     str             = Form(default="Summarize the key information in this document."),
    session_id: Optional[str]   = Form(default=None),
):
    """
    Full OCR pipeline: extract text → dual_mask (PII + code secrets) → LLM → rehydrate.
    Works on PNG, JPG, BMP, TIFF, WEBP, PDF.
    All masking features are applied: emails, phones, Aadhaar, cards, API keys,
    DB URIs, tokens, internal IPs, env secrets, private keys, certificates.
    """
    content_type = file.content_type or ""
    filename     = file.filename or "uploaded_file"

    if not ocr.is_supported(content_type):
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {content_type}. Supported: PNG, JPG, BMP, TIFF, WEBP, PDF",
        )

    file_bytes = await file.read()
    file_type  = ocr.get_file_type(content_type)

    # ── OCR ──────────────────────────────────────────────────────────────────
    try:
        if file_type == "image":
            extracted_text, method = ocr.extract_text_from_image(file_bytes, filename)
        else:
            extracted_text, method = ocr.extract_text_from_pdf(file_bytes)
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not extracted_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract any text from the file.")

    # ── dual_mask: PII + code secrets on the extracted text ──────────────────
    full_prompt_text          = f"{prompt}\n\n--- Extracted Content ---\n{extracted_text}"
    masked_text, entity_map, session_id = dual_mask(full_prompt_text, session_id)
    secret_types              = extract_secret_types(entity_map)

    # ── LLM ──────────────────────────────────────────────────────────────────
    try:
        llm_response = await llm_proxy.send(masked_text, model)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {str(e)}")

    # ── Rehydrate ─────────────────────────────────────────────────────────────
    final_response = rehydrator.rehydrate(llm_response, entity_map)

    return FileProcessResponse(
        filename            = filename,
        file_type           = file_type,
        extraction_method   = method,
        extracted_text      = extracted_text,
        masked_text         = masked_text,
        llm_response_masked = llm_response,
        final_response      = final_response,
        entities_found      = [
            {"placeholder": v["placeholder"], "type": v["type"], "pattern": v["name"]}
            for v in entity_map.values()
        ],
        secret_types        = secret_types,
        session_id          = session_id,
    )


@app.post("/extract-text")
async def extract_text_only(file: UploadFile = File(...)):
    """
    Extract text from image/PDF and dual_mask it — WITHOUT sending to LLM.
    Use this to preview what will be masked before committing to the full pipeline.
    """
    content_type = file.content_type or ""
    filename     = file.filename or "uploaded_file"

    if not ocr.is_supported(content_type):
        raise HTTPException(status_code=415, detail=f"Unsupported: {content_type}")

    file_bytes = await file.read()
    file_type  = ocr.get_file_type(content_type)

    try:
        if file_type == "image":
            extracted_text, method = ocr.extract_text_from_image(file_bytes, filename)
        else:
            extracted_text, method = ocr.extract_text_from_pdf(file_bytes)
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # dual_mask — all features
    masked_text, entity_map, session_id = dual_mask(extracted_text)
    secret_types = extract_secret_types(entity_map)

    return {
        "filename":        filename,
        "file_type":       file_type,
        "extraction_method": method,
        "extracted_text":  extracted_text,
        "masked_text":     masked_text,
        "entities_found":  list(entity_map.values()),
        "secret_types":    secret_types,
        "session_id":      session_id,
    }


# ── Session cleanup ───────────────────────────────────────────────────────────

@app.delete("/session/{session_id}")
def clear_session(session_id: str):
    masker.clear_session(session_id)
    code_masker.clear_session(session_id)
    return {"message": f"Session {session_id} cleared."}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
