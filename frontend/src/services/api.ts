// frontend/src/services/api.ts

export interface ChatResponse {
  reply: string;
  masked_reply: string;
  masked_prompt: string;
  vault_map: Record<string, string>;
  pipeline_stage: string;
  shield_active: boolean;
}

const BASE_URL = "http://localhost:8000";

export async function sendMessage(
  message: string,
  shieldActive: boolean,
  file?: File
): Promise<ChatResponse> {

  // 🟢 FILE UPLOAD (OCR)
  if (file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("instruction", message || "Analyze this document.");

    const response = await fetch(`${BASE_URL}/chat/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Backend Error: ${response.status} - ${text}`);
    }

    return response.json();
  }

  // 🔵 TEXT-ONLY
  const response = await fetch(`${BASE_URL}/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      shield_active: shieldActive,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Backend Error: ${response.status} - ${text}`);
  }

  return response.json();
}