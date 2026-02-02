
import { GoogleGenAI } from "@google/genai";
import { ChatAttachment } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function sendToAI(maskedPrompt: string, attachments: ChatAttachment[] = []): Promise<string> {
  try {
    const parts: any[] = [{ text: maskedPrompt }];
    
    // Add attachments to request parts
    attachments.forEach(att => {
      // Note: Only image mime types are directly supported via inlineData for Gemini usually, 
      // but we send them as blobs if available. Gemini 3 models are multimodal.
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts }],
      config: {
        systemInstruction: "You are a helpful assistant. You will see placeholders like {{PERSON_1}} or {{EMAIL_1}} in the user prompt. DO NOT attempt to guess the real values. Always use the SAME placeholders in your response so the gateway can rehydrate them later. Maintain the grammar and context of the placeholders."
      }
    });
    
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to communicate with AI model.");
  }
}
