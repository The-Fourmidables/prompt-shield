// frontend/src/services/api.ts

export interface ChatResponse {
  reply: string;
  masked_reply: string;
  masked_prompt: string;
  vault_map: Record<string, string>;
  stage: string; // now comes from streaming payload
  shield_active: boolean;
}

const BASE_URL = "http://localhost:8000";

export async function sendMessage(
  messages: { role: string; content: string }[],
  shieldActive: boolean,
  onStageUpdate: (stage: string) => void,
  persistentVault: Record<string, string>,   // 🔥 NEW
  file?: File
): Promise<ChatResponse> {

  // ── FILE UPLOAD (still normal JSON for now) ──
  if (file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "instruction",
      messages[messages.length - 1]?.content || "Analyze this document."
    );

    const response = await fetch(`${BASE_URL}/chat/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Backend Error: ${response.status} - ${text}`);
    }

    const json = await response.json();
    return {
      ...json,
      stage: "COMPLETE",
    };
  }

  // ── STREAMING CHAT ──
  const response = await fetch(`${BASE_URL}/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      shield_active: shieldActive,
      vault: persistentVault,   // 🔥 SEND PREVIOUS VAULT
    }),
  });

  if (!response.body) {
    throw new Error("No response body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let buffer = "";
  let finalData: any = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      if (part.startsWith("data: ")) {
        const jsonStr = part.replace("data: ", "").trim();
        const parsed = JSON.parse(jsonStr);

        if (parsed.stage) {
          onStageUpdate(parsed.stage);
        }

        if (parsed.stage === "COMPLETE") {
          finalData = parsed;
        }
      }
    }
  }

  if (!finalData) {
    throw new Error("No final data received.");
  }

  if (finalData?.vault_map) {
  Object.assign(persistentVault, finalData.vault_map);
}

return finalData;
}