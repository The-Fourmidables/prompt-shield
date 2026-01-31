from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import openai

# Load .env
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

openai.api_key = OPENAI_API_KEY

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("/", response_model=ChatResponse)
async def chat_with_gpt(request: ChatRequest):
    if not OPENAI_API_KEY:
        return {"reply": "OpenAI API key not set in .env. Please add it."}
    
    try:
        # New 2.x SDK method
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": request.message}
            ]
        )
        # Extract GPT reply
        gpt_reply = response.choices[0].message.content
        return {"reply": gpt_reply}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

