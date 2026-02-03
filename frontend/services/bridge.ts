import { sendToAI as rawSendToAI } from './gemini';

interface BackendResponse {
  reply: string;
  masked_reply: string; // <-- NEW FIELD from Backend
  masked_prompt: string;
  vault_map: Record<string, string>;
}

export const secureChatBridge = async (message: string) => {
  // 1. Get data from backend
  const data = await rawSendToAI(message) as BackendResponse;

  // 2. Build the entities table
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