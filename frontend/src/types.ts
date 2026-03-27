// types.ts
// Represents one full privacy-aware chat turn

export type ChatTurn = {
  id: string;
  user: {
    original: string;       // Raw user input
    masked?: string;        // Masked prompt (from backend)
  };
  llm: {
    rehydrated?: string;    // Clean reply shown to user (left panel)
    masked?: string;        // Raw masked reply (AI VIEW panel)
    loading: boolean;
    error?: string;
  };
  attachments?: { name: string }[];
  vaultMap?: Record<string, string>;  // placeholder → original
  shieldActive?: boolean;
  secretTypes?: string[];             // ← NEW: ["OpenAI key", "Postgres URI", ...]
};
