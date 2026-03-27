//types.ts
// Represents one full privacy-aware chat turn 
export type ChatTurn = {
  id: string;

  user: {
    original: string;      // Raw user input
    masked?: string;       // Masked prompt (from backend)
  };

  llm: {
    rehydrated?: string;   // Clean reply (left panel)
    masked?: string;       // Raw masked reply (right panel)
    loading: boolean;
    error?: string;
  };
  attachments?: { name: string }[];
  vaultMap?: Record<string, string>; // Entity mappings
  shieldActive?: boolean; // Indicates if the shield was active for this turn
};
