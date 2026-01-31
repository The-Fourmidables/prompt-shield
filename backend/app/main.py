from fastapi import FastAPI
from app.routes import chat

app = FastAPI(title="Prompt-Shield Backend Day 1")

app.include_router(chat.router, prefix="/chat")

@app.get("/")
def root():
    return {"message": "Backend is live! Go to /chat"}
