"""
llm_proxy.py  -  Direct OpenRouter API call using httpx (no LiteLLM)
"""

import os
import httpx
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL     = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT = (
    "You are a helpful AI assistant operating inside a privacy-preserving system.\n\n"
    "User input may contain anonymized placeholder tokens such as <Email1>, "
    "<PostgresConn1>, <OpenAIKey1>, <InternalHost1> etc. "
    "These tokens represent masked sensitive data.\n\n"
    "Rules:\n"
    "- Treat placeholders as real values for the purpose of answering.\n"
    "- For example, if you see <PostgresConn1>, treat it as a real database URL.\n"
    "- If you see <InternalHost1>, treat it as a real internal service endpoint.\n"
    "- Do NOT modify, expand, or fabricate placeholder values.\n"
    "- Do NOT warn about privacy or refuse to help because of placeholders.\n"
    "- Answer the user's actual question fully and helpfully as if the "
    "real values were present.\n\n"
    "The user needs real, actionable help. Give it to them."
)


class LLMProxy:

    # ── Primary method: takes a messages list (used by chat_adapter) ──────────
    async def send_messages(
        self,
        messages: list,
        model: str = "openrouter/free",
    ) -> str:
        headers = self._headers()
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                *messages,
            ],
            "temperature": 0.7,
            "max_tokens":  1000,
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(OPENROUTER_URL, headers=headers, json=payload)
        return self._parse(response)

    # ── Convenience method: takes a single prompt string (used by main.py) ────
    # main.py calls:  await llm_proxy.send(masked_prompt, model)
    async def send(
        self,
        prompt: str,
        model: str = "openrouter/free",
    ) -> str:
        """Async single-prompt wrapper — converts string to messages list."""
        return await self.send_messages(
            [{"role": "user", "content": prompt}],
            model=model,
        )

    # ── Synchronous version (for non-async contexts / tests) ─────────────────
    def send_sync(
        self,
        masked_prompt: str,
        model: str = "openrouter/free",
    ) -> str:
        headers = self._headers()
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": masked_prompt},
            ],
            "temperature": 0.7,
            "max_tokens":  1000,
        }
        with httpx.Client(timeout=60.0) as client:
            response = client.post(OPENROUTER_URL, headers=headers, json=payload)
        return self._parse(response)

    # ── Shared helpers ────────────────────────────────────────────────────────
    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type":  "application/json",
            "HTTP-Referer":  "https://promptshield.local",
            "X-Title":       "Prompt Shield",
        }

    def _parse(self, response: httpx.Response) -> str:
        if response.status_code != 200:
            raise RuntimeError(
                f"OpenRouter returned {response.status_code}: {response.text}"
            )
        data = response.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError):
            raise RuntimeError(f"Unexpected OpenRouter response format: {data}")
