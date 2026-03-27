"main.tsx"
import { theme as themeConfig } from "../theme/theme";
import { sendMessage } from "../services/api";
import { useState, useEffect } from "react";
import type { ChatTurn } from "../types";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";
import ProcessingPipeline from "../components/ui/ProcessingPipeline";
import VaultCard from "../components/ui/VaultCard";

type RightPanelItem = "pipeline" | "vault";

export default function Main({
  theme,
  setTheme,
}: {
  theme: "dark" | "light";
  setTheme: React.Dispatch<React.SetStateAction<"dark" | "light">>;
}) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [persistentVault, setPersistentVault] = useState<Record<string, string>>({});

  // 10 prompts worth of vault data should be more than enough to keep relevant info without bloating the payload
  
  const MAX_VAULT_TURNS = 10;
  const [pipelineStage, setPipelineStage] = useState<string>("IDLE");

  const [shieldActive, setShieldActive] = useState<boolean>(() => {
    const saved = localStorage.getItem("ps_shield");
    return saved === "false" ? false : true;
  });

  const [inspectionMode, setInspectionMode] = useState(false);
  const [rightPanelStack, setRightPanelStack] =
    useState<RightPanelItem[]>([]);

  const baseColors = themeConfig[theme];

  let colors = baseColors;

  if (!shieldActive) {
    colors = {
      ...baseColors,
      accent: baseColors.danger!,
      accentHover: baseColors.dangerHover!,
      accentText: baseColors.dangerText!,
      glow: `${baseColors.danger}40`,
      border: `${baseColors.danger}33`,
    };
  }

  useEffect(() => {
    if (turns.length === 0) {
      setPipelineStage("IDLE");
    }
  }, [turns]);

  useEffect(() => {
    localStorage.setItem("ps_shield", String(shieldActive));
  }, [shieldActive]);

  const handleClearChat = () => {
    setTurns([]);
    setPipelineStage("IDLE");
    setPersistentVault({});
  };

  const handleSend = async (
    text: string,
    attachments?: File[]
  ) => {
    const file = attachments?.[0];
    const turnId = crypto.randomUUID();

    const newTurn: ChatTurn = {
      id: turnId,
      user: {
        original: text,
      },
      llm: { loading: true },
      attachments: file
        ? [{ name: file.name }]
        : undefined,
    };

    // Use functional update to guarantee correct snapshot
    setTurns((prevTurns) => {
      const updated = [...prevTurns, newTurn];
      return updated;
    });

    try {
      // Build history from latest snapshot safely
      const history = [...turns, newTurn].flatMap(turn => [
        {
          role: "user",
          content: turn.user.masked ?? turn.user.original
        },
        ...(turn.llm.masked
          ? [{ role: "assistant", content: turn.llm.masked }]
          : [])
      ]);

      const response = await sendMessage(
        history,
        shieldActive,
        (stage) => setPipelineStage(stage),
        persistentVault,
        file
      );

      await new Promise((r) => setTimeout(r, 300));

      // 🔥 CRITICAL FIX — state-safe update
      setTurns((prev) => {
        const updatedTurns = prev.map((turn) =>
          turn.id === turnId
            ? {
              ...turn,
              user: {
                ...turn.user,
                masked: response.masked_prompt,
              },
              llm: {
                loading: false,
                rehydrated: response.reply,
                masked: response.masked_reply,
              },
              vaultMap: response.vault_map,
              shieldActive: response.shield_active,
            }
            : turn
        );

        // ---- Persistent Vault Logic ----
        if (response.vault_map) {
          const recentTurns = updatedTurns.slice(-MAX_VAULT_TURNS);

          const allowedKeys = new Set<string>();
          recentTurns.forEach((t) => {
            if (t.vaultMap) {
              Object.keys(t.vaultMap).forEach((k) => allowedKeys.add(k));
            }
          });

          setPersistentVault((prevVault) => {
            const merged = { ...prevVault, ...response.vault_map };

            const trimmed: Record<string, string> = {};
            Object.entries(merged).forEach(([k, v]) => {
              if (allowedKeys.has(k)) {
                trimmed[k] = v;
              }
            });

            return trimmed;
          });
        }

        return updatedTurns;
      });

    } catch {
      setPipelineStage("COMPLETE");

      setTurns((prev) =>
        prev.map((turn) =>
          turn.id === turnId
            ? {
              ...turn,
              llm: {
                loading: false,
                rehydrated:
                  "⚠️ Backend connection failed.",
              },
            }
            : turn
        )
      );
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        backgroundColor: colors.background,
        color: colors.textPrimary,
        display: "flex",
        flexDirection: "column",
        transition:
          "background-color 0.6s cubic-bezier(0.4,0,0.2,1), color 0.6s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <Header
        theme={theme}
        shieldActive={shieldActive}
        setShieldActive={setShieldActive}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          padding: "20px",
          gap: "20px",
          overflow: "hidden",
        }}
      >
        <Sidebar
          theme={theme}
          setTheme={setTheme}
          inspectionMode={inspectionMode}
          setInspectionMode={setInspectionMode}
          rightPanelStack={rightPanelStack}
          setRightPanelStack={setRightPanelStack}
          colors={colors}
        />

        <div
          style={{
            flex: rightPanelStack.length === 0 ? 1 : 2,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: "16px",
            boxShadow: `0 0 40px ${colors.glow}`,
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "hidden",
          }}
        >
          <ChatWindow
            theme={theme}
            turns={turns}
            shieldActive={shieldActive}
            inspectionMode={inspectionMode}
            rightPanelStack={rightPanelStack}
          />

          <ChatInput
            theme={theme}
            shieldActive={shieldActive}
            onSend={handleSend}
            onClear={handleClearChat}
          />
        </div>

        {rightPanelStack.length > 0 && (
          <div
            style={{
              width: "340px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {rightPanelStack.includes("pipeline") && (
              <ProcessingPipeline
                stage={pipelineStage}
                hasVault={
                  turns.length > 0 &&
                  !!turns[turns.length - 1].vaultMap
                }
                colors={colors}
              />
            )}

            {rightPanelStack.includes("vault") && (
              <VaultCard
                themeMode={theme}
                hasTurns={turns.length > 0}
                shieldActive={shieldActive}
                vaultMap={persistentVault}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
