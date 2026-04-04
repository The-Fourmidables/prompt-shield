# 🛡 PromptShield

Privacy-preserving AI chat interface that masks sensitive data **before** it reaches the LLM.

PromptShield acts as a security firewall between users and GPT/LLM APIs, ensuring personal information never leaves the system.

---

## 🚨 Problem

Users frequently paste real-world information into AI tools without realizing the risks.

Sensitive data commonly exposed:
- Code Secrets
- Names
- Emails
- Phone numbers
- Addresses
- Employee IDs
- Medical or financial information
- Internal or confidential company data

Since prompts are sent directly to third-party APIs, this data leaves the device — creating serious **privacy, compliance, and enterprise security risks**.

Most AI systems rely on user caution.  
There is no architectural guarantee that personal data is protected.

---

## 💡 Solution

PromptShield enforces privacy **by architecture, not policy**.

Before any prompt leaves the device:

1. Sensitive data is detected
2. It is replaced with placeholders (`<NAME_1>`, `<PHONE_1>`)
3. Only masked content is sent to the model
4. Original values are restored locally after response

### Flow

User → Masking → LLM → Rehydration → User

---

## 🧩 Split Architecture

- **LEFT:** Human View (Real Data)
- **RIGHT:** Model View (Masked Data Only)

This guarantees zero raw personal data reaches external APIs.

---

## ✨ Features

- 🔒 Real-time sensitive data masking
- 🧠 Compatible with Gemini / OpenAI / any LLM
- 🔁 Deterministic rehydration
- 🧩 Split-screen privacy visualization
- ⚡ Fast local processing
- 🛡 Zero raw data sent externally
- 🧾 Security audit logging
- 🔍 Optional OCR support

---

## 🔐 Privacy Model

- Masking occurs server-side before LLM transmission.
- Only placeholder tokens are sent to external APIs.
- Original sensitive values never leave the system.
- Rehydration happens locally after model response.
- Vault mappings are stateless and scoped per request.

---

## 🛠 Tech Stack

### Frontend
- React
- TypeScript
- Vite

### Backend
- FastAPI
- Python

### 🤖 AI Integration

- OpenRouter API (model-agnostic LLM routing)
- Compatible with OpenAI, Gemini, Anthropic and other providers via OpenRouter
- Secure masked transmission using HTTPX

---

## 📂 Project Structure

```
backend/
│── app/
│   ├── main.py              # FastAPI entry point
│   ├── chat_adapter.py      # Frontend compatibility layer (/chat routes)
│   ├── masker.py            # PII masking engine
│   ├── rehydrator.py        # Local placeholder restoration
│   ├── llm_proxy.py         # LLM routing (OpenRouter/httpx)
│   ├── ocr_processor.py     # OCR support for files
│   ├── code_masker.py       # Secret masking for source code
│   └── __init__.py
│── tests/
│   ├── test_code_masker.py
│   └── test_pipeline.py

frontend/
│── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── theme/
│   ├── types.ts
│   └── main.tsx
│── index.html
│── vite.config.ts
```


---

## ⚙️ Installation

### 1️⃣ Clone Repository

```bash
git clone <repo-url>
cd prompt-shield
````

---

### 2️⃣ Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # mac/linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend runs at:

```
http://localhost:8000
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:3000
```

---

## 🔑 Environment Variables

Create a `.env` file inside `backend/`:

```
GEMINI_API_KEY=your_key
OPENAI_API_KEY=your_key
```

---

## 🚀 Usage

1. Start backend
2. Start frontend
3. Enter text in the LEFT panel
4. Masked content is sent to the model
5. Response is rehydrated locally

No personal data ever leaves the system.

---

## 🔌 API Endpoints

### POST `/chat/`
Processes text input through masking → LLM → rehydration pipeline.

### POST `/chat/upload`
Processes uploaded image/PDF through OCR → masking → LLM → rehydration.

### GET `/`
Basic service status endpoint.

## 🧪 Running Tests

```bash
cd backend
pytest
```
---

## 🤝 Contributing

Pull requests are welcome.
Please open an issue before major structural changes.

---

## 📜 License

MIT License
