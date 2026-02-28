"""
llm_proxy.py  -  Direct OpenRouter API call using httpx (no LiteLLM)
"""

import os
import httpx
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT = (
    "You are a helpful assistant. "
    "The user's message may contain placeholder tokens like <Email1>, <Aadhaar1>, <Phone1> etc. "
    "Treat them as opaque identifiers and use the SAME placeholders in your response "
    "wherever you refer to them. Do NOT invent or guess real values behind placeholders."
)


class LLMProxy:

    async def send(self, masked_prompt: str, model: str = "openai/gpt-3.5-turbo") -> str:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://promptshield.local",
            "X-Title": "Prompt Shield",
        }

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": masked_prompt},
            ],
            "temperature": 0.7,
            "max_tokens": 1000,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                OPENROUTER_URL,
                headers=headers,
                json=payload,
            )

        if response.status_code != 200:
            raise RuntimeError(
                f"OpenRouter returned {response.status_code}: {response.text}"
            )

        data = response.json()

        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as e:
            raise RuntimeError(f"Unexpected OpenRouter response format: {data}")

    def send_sync(self, masked_prompt: str, model: str = "openai/gpt-3.5-turbo") -> str:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://promptshield.local",
            "X-Title": "Prompt Shield",
        }

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": masked_prompt},
            ],
            "temperature": 0.7,
            "max_tokens": 1000,
        }

        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                OPENROUTER_URL,
                headers=headers,
                json=payload,
            )

        if response.status_code != 200:
            raise RuntimeError(
                f"OpenRouter returned {response.status_code}: {response.text}"
            )

        data = response.json()

        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError):
            raise RuntimeError(f"Unexpected OpenRouter response format: {data}")
