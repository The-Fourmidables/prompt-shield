import { sendToAI as rawSendToAI } from './gemini';

interface BackendResponse {
  reply: string;
  masked_reply: string;
  masked_prompt: string;
  vault_map: Record<string, string>;
}

export const secureChatBridge = async (
  message: string,
  shieldActive: boolean = true
) => {

  // ❌ SHIELD OFF → bypass masking completely
  if (!shieldActive) {
    const data = await rawSendToAI(message) as BackendResponse;

    return {
      reply: data.reply,          // ✅ string
      masked_reply: data.reply,  // same string
      masked_prompt: message,    // raw text
      entities: []
    };
  }

  // ✅ SHIELD ON → original masking flow from backend
  const data = await rawSendToAI(message) as BackendResponse;

  const entities = Object.entries(data.vault_map || {}).map(([placeholder, value]) => {
    const type = placeholder.replace(/[<>\d_/]/g, '') || 'ENTITY';
    return {
      id: Math.random().toString(36).substr(2, 9),
      type: type,
      placeholder: placeholder,
      value: value as string
    };
  });

  return {
    reply: data.reply,
    masked_reply: data.masked_reply,
    masked_prompt: data.masked_prompt,
    entities: entities
  };
};