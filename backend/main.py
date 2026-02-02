# backend/main.py

import re
import json
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.routes.chat import router as chat_router

app = FastAPI(title="Prompt-Shield API")

# =========================================================
# 1. CORS MIDDLEWARE
# =========================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# 2. GLOBAL JSON SANITIZER (The "Shield" Middleware)
# =========================================================
@app.middleware("http")
async def sanitize_json_middleware(request: Request, call_next):
    """
    Intercepts the request body and strips out control characters 
    that break the JSON parser before FastAPI even sees them.
    """
    if request.method in ["POST", "PUT", "PATCH"]:
        content_type = request.headers.get("Content-Type", "")
        
        # Only sanitize if it's a JSON request
        if "application/json" in content_type:
            body = await request.body()
            if body:
                # 1. Decode safely: ignore byte errors that crash standard decoders
                body_str = body.decode("utf-8", errors="ignore")
                
                # 2. Remove illegal control characters (0-31) EXCEPT:
                #    \t (tab), \n (newline), \r (carriage return)
                clean_body = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', ' ', body_str)
                
                # 3. Create a new request with the clean body
                async def receive():
                    return {"type": "http.request", "body": clean_body.encode("utf-8")}
                
                request._receive = receive

    response = await call_next(request)
    return response

# =========================================================
# 3. ROUTES
# =========================================================
@app.get("/")
def root():
    return {
        "status": "online",
        "system": "Prompt-Shield Security Engine",
        "version": "2.0.3",
        "protection": "JSON Control-Char Sanitizer Active"
    }

app.include_router(chat_router, prefix="/chat")

if __name__ == "__main__":
    import uvicorn
    # 0.0.0.0 allows access from other devices on your local network
    uvicorn.run(app, host="0.0.0.0", port=8000)