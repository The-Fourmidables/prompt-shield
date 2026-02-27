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
  messages: { role: string; content: string }[],
  shieldActive: boolean,
  file?: File
): Promise<ChatResponse> {

  if (file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("instruction", messages[messages.length - 1]?.content || "Analyze this document.");

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

  const response = await fetch(`${BASE_URL}/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      shield_active: shieldActive,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Backend Error: ${response.status} - ${text}`);
  }

  return response.json();
}