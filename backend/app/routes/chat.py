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
    reply: str           # Clean text (Rehydrated) -> For Left Panel
    masked_reply: str    # Raw text (With Tags)    -> For Right Panel (NEW)
    masked_prompt: str   # Masked User Input       -> For Right Panel
    vault_map: dict

class ChatRequest(BaseModel):
    message: str


# ==========================================
# 2️⃣ TEXT-ONLY CHAT
# ==========================================
@router.post("/", response_model=ChatResponse)
async def chat_text_only(request: ChatRequest):
    print("🔥 BACKEND RECEIVED:", request.message)
    clean_message = sanitize_text(request.message)
    return await _process_request(clean_message, event_type="PROMPT_MASKED")


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
        raise HTTPException(status_code=400, detail="Could not extract text from file.")
    
    clean_ocr_text = sanitize_text(raw_text)
    clean_instruction = sanitize_text(instruction)
    
    full_prompt = f"{clean_instruction}\n\n[Document Content]:\n{clean_ocr_text}"
    
    return await _process_request(full_prompt, event_type="OCR_MASKED")


# ==========================================
# 4️⃣ SHARED LOGIC (The Brain)
# ==========================================
async def _process_request(text_input: str, event_type="PROMPT_MASKED"):
    # 1. Mask
    masked_prompt, vault_map = full_mask(text_input)
    
    # 2. Log
    log_event(event_type, masked_prompt)

    # 3. Call LLM
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API Key missing in .env")

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost",
        "X-Title": "Prompt-Shield",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "google/gemini-2.0-flash-001",
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a secure enterprise assistant.\n"
                    "All placeholders such as <NAME_1>, <EMAIL_1>, <PHONE_1>, <ORG_1>, etc. "
                    "are anonymized synthetic tokens and DO NOT represent real personal data.\n"
                    "You are explicitly allowed and required to complete the task using these placeholders.\n"
                    "Do NOT refuse, warn about privacy, or mention policy limitations.\n"
                    "Always produce a helpful answer using the placeholders exactly as given."
                )
            },
            {"role": "user", "content": masked_prompt}
        ]
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=payload, timeout=60.0)
            
            if response.status_code != 200:
                reply_masked = f"Error from Provider: {response.status_code} - {response.text}"
            else:
                data = response.json()
                reply_masked = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        except Exception as e:
            reply_masked = f"Connection Error: {str(e)}"

    # 4. Rehydrate (Swap placeholders back for the local user view)
    final_reply = rehydrate(reply_masked, vault_map)

    # 5. Return EVERYTHING
    return {
        "reply": final_reply,           # GOES TO LEFT PANEL (User)
        "masked_reply": reply_masked,   # GOES TO RIGHT PANEL (Model)
        "masked_prompt": masked_prompt,
        "vault_map": vault_map
    }

# from fastapi import APIRouter, HTTPException, UploadFile, File, Form
# from pydantic import BaseModel
# import os
# import httpx
# import re
# from dotenv import load_dotenv

# # Absolute imports
# from app.mask_pipeline import full_mask
# from app.security.audit_logger import log_event
# from app.security.rehydrate import rehydrate
# from app.security.ocr_engine import extract_text_from_file

# load_dotenv()

# OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# router = APIRouter()

# # ==========================================
# # 0️⃣ HELPER: JSON SANITIZER
# # ==========================================
# def sanitize_text(text: str) -> str:
#     """Removes non-printable control characters that break JSON."""
#     if not text:
#         return ""
#     # Matches control characters (0-31) except for \t, \n, \r
#     return re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', ' ', text)

# # ==========================================
# # 1️⃣ MODELS
# # ==========================================
# class ChatResponse(BaseModel):
#     reply: str
#     masked_prompt: str
#     vault_map: dict

# class ChatRequest(BaseModel):
#     message: str


# # ==========================================
# # 2️⃣ TEXT-ONLY CHAT
# # ==========================================
# @router.post("/", response_model=ChatResponse)
# async def chat_text_only(request: ChatRequest):
#     print("🔥 BACKEND RECEIVED:", request.message)
#     # Sanitize user input immediately
#     clean_message = sanitize_text(request.message)
#     return await _process_request(clean_message, event_type="PROMPT_MASKED")


# # ==========================================
# # 3️⃣ IMAGE/PDF CHAT (OCR)
# # ==========================================
# @router.post("/upload", response_model=ChatResponse)
# async def chat_with_file(
#     file: UploadFile = File(...),
#     instruction: str = Form("Analyze this document.") 
# ):
#     content = await file.read()
#     raw_text = extract_text_from_file(content, file.filename)
    
#     if not raw_text.strip():
#         raise HTTPException(status_code=400, detail="Could not extract text from file.")
    
#     # 🔥 CRITICAL FIX: Sanitize the OCR text before building the prompt
#     clean_ocr_text = sanitize_text(raw_text)
#     clean_instruction = sanitize_text(instruction)
    
#     full_prompt = f"{clean_instruction}\n\n[Document Content]:\n{clean_ocr_text}"
    
#     return await _process_request(full_prompt, event_type="OCR_MASKED")


# # ==========================================
# # 4️⃣ SHARED LOGIC (The Brain)
# # ==========================================
# async def _process_request(text_input: str, event_type="PROMPT_MASKED"):
#     # 1. Mask (Uses your en_core_web_lg + Custom Rules)
#     masked_prompt, vault_map = full_mask(text_input)
    
#     # 2. Log
#     log_event(event_type, masked_prompt)

#     # 3. Call LLM
#     if not OPENROUTER_API_KEY:
#         raise HTTPException(status_code=500, detail="OpenRouter API Key missing in .env")

#     url = "https://openrouter.ai/api/v1/chat/completions"
#     headers = {
#         "Authorization": f"Bearer {OPENROUTER_API_KEY}",
#         "HTTP-Referer": "http://localhost",
#         "X-Title": "Prompt-Shield",
#         "Content-Type": "application/json"
#     }
    
#     # payload = {
#     #     "model": "google/gemini-2.0-flash-001", # High accuracy for placeholders
#     #     "messages": [
#     #         {
#     #             "role": "system", 
#     #             "content": "You are a secure enterprise assistant. Use the exact placeholders provided (e.g., <NAME_1>, <ORG_1>) in your response. Do not reveal real names if they appear in your internal knowledge."
#     #         },
#     #         {"role": "user", "content": masked_prompt}
#     #     ]
#     # }

#     payload = {
#         "model": "google/gemini-2.0-flash-001",
#         "messages": [
#             {
#                 "role": "system",
#                 "content": (
#                     "You are a secure enterprise assistant.\n"
#                     "All placeholders such as <NAME_1>, <EMAIL_1>, <PHONE_1>, <ORG_1>, etc. "
#                     "are anonymized synthetic tokens and DO NOT represent real personal data.\n"
#                     "You are explicitly allowed and required to complete the task using these placeholders.\n"
#                     "Do NOT refuse, warn about privacy, or mention policy limitations.\n"
#                     "Always produce a helpful answer using the placeholders exactly as given."
#                 )
#             },
#             {"role": "user", "content": masked_prompt}
#         ]
#     }

#     async with httpx.AsyncClient() as client:
#         try:
#             # Added long timeout for heavy OCR prompts
#             response = await client.post(url, headers=headers, json=payload, timeout=60.0)
            
#             if response.status_code != 200:
#                 reply_masked = f"Error from Provider: {response.status_code} - {response.text}"
#             else:
#                 data = response.json()
#                 reply_masked = data.get("choices", [{}])[0].get("message", {}).get("content", "")
#         except Exception as e:
#             reply_masked = f"Connection Error: {str(e)}"

#     # 4. Rehydrate (Swap placeholders back for the local user view)
#     # 
#     final_reply = rehydrate(reply_masked, vault_map)

#     return {
#         "reply": final_reply,
#         "masked_prompt": masked_prompt,
#         "vault_map": vault_map
#     }