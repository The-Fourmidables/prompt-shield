// frontend2.0/src/services/api.ts

export interface ChatResponse {
  reply: string
  masked_reply: string
  masked_prompt: string
  vault_map: Record<string, string>
  pipeline_stage: string
  shield_active: boolean
}

const BASE_URL = "http://localhost:8000"

export async function sendMessage(
  message: string,
  shieldActive: boolean
): Promise<ChatResponse> {
  const response = await fetch(`${BASE_URL}/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      shield_active: shieldActive
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Backend Error: ${response.status} - ${text}`)
  }

  return response.json()
}