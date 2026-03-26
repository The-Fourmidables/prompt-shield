# 🛡️ Prompt Shield – Backend

Real-time PII/PHI/PCI masking proxy for public AI tools.

---

## Architecture

```
User Prompt
    │
    ▼
[PIIMasker]          ← regex + Presidio NER
    │  masked prompt
    ▼
[LLMProxy]           ← LiteLLM (OpenAI / Gemini / Anthropic / Ollama)
    │  masked response
    ▼
[Rehydrator]         ← replace placeholders → real values (local only)
    │
    ▼
Final Response to User
```

---

## What Gets Masked

| Entity | Example Input | Placeholder |
|---|---|---|
| Aadhaar | `2345 6789 0123` | `<Aadhaar1>` |
| PAN | `ABCDE1234F` | `<PAN1>` |
| Email | `john@gmail.com` | `<Email1>` |
| Phone (India) | `+91 9876543210` | `<Phone1>` |
| Credit Card | `4111111111111111` | `<CreditCard1>` |
| CVV | `cvv: 123` | `<CVV1>` |
| UPI ID | `rahul@paytm` | `<UPI1>` |
| IFSC | `HDFC0001234` | `<IFSC1>` |
| Bank Account | `0123456789012` | `<BankAccount1>` |
| SSN | `123-45-6789` | `<SSN1>` |
| API Key | `sk-abc...` | `<APIKey1>` |
| JWT Token | `eyJ...` | `<JWTToken1>` |
| Person Name* | `Rahul Sharma` | `<Personname1>` |
| Address* | `123 MG Road` | `<LocationAddress1>` |

*requires Presidio + spaCy

---

## Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Download spaCy model (for name/address detection)
python -m spacy download en_core_web_lg

# 3. Configure API keys
cp .env.example .env
# Edit .env with your LLM API keys

# 4. Run the server
uvicorn main:app --reload --port 8000

# 5. Test masking locally (no server needed)
python test_pipeline.py
```

---

## API Endpoints

### `POST /mask`
Mask PII only (no LLM call). Good for testing.
```json
Request:  { "text": "My email is john@gmail.com", "session_id": null }
Response: { "masked_text": "My email is <Email1>", "entities_found": [...], "session_id": "uuid" }
```

### `POST /process`
Full pipeline: mask → LLM → rehydrate.
```json
Request:
{
  "prompt": "Send OTP to 9876543210 and confirm with john@example.com",
  "model": "gpt-3.5-turbo",
  "session_id": null
}

Response:
{
  "original_prompt": "Send OTP to 9876543210...",
  "masked_prompt": "Send OTP to <Phone1> and confirm with <Email1>",
  "llm_response_masked": "OTP sent to <Phone1> and confirmation to <Email1>",
  "final_response": "OTP sent to 9876543210 and confirmation to john@example.com",
  "entities_found": [{"placeholder": "<Phone1>", "type": "PII"}, ...]
}
```

### `DELETE /session/{session_id}`
Clears the entity map for a session from memory.

---

## Supported LLM Models (via LiteLLM)

| Model String | Provider |
|---|---|
| `gpt-4o` | OpenAI |
| `gpt-3.5-turbo` | OpenAI |
| `gemini/gemini-1.5-pro` | Google |
| `anthropic/claude-3-5-sonnet-20241022` | Anthropic |
| `ollama/llama3` | Local Ollama |

---

## Files

```
prompt-shield-backend/
├── main.py           ← FastAPI app, routes
├── masker.py         ← PII/PHI/PCI detection & masking
├── llm_proxy.py      ← LiteLLM gateway
├── rehydrator.py     ← Replace placeholders → real values
├── test_pipeline.py  ← Local tests (no server needed)
├── requirements.txt
└── .env.example
```
