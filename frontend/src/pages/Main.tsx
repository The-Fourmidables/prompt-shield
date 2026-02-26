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
  const [pipelineStage, setPipelineStage] =
    useState<string>("IDLE");

  const [shieldActive, setShieldActive] = useState<boolean>(() => {
    const saved = localStorage.getItem("ps_shield");
    return saved === "false" ? false : true;
  });
  const [inspectionMode, setInspectionMode] =
    useState(false);

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
  // 🔐 Persist shield state
  useEffect(() => {
    localStorage.setItem("ps_shield", String(shieldActive));
  }, [shieldActive]);

  const handleClearChat = () => {
    setTurns([]);
    setPipelineStage("IDLE");
  };

  const handleSend = async (
    text: string,
    attachments?: File[]
  ) => {
    const file = attachments?.[0];
    const turnId = crypto.randomUUID();

    setPipelineStage("DETECTING");

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

    setTurns((prev) => [...prev, newTurn]);

    await new Promise((r) => setTimeout(r, 300));

    setPipelineStage("MASKING_COMPLETE");

    await new Promise((r) => setTimeout(r, 300));

    setPipelineStage("TRANSMITTING");

    try {
      const response = await sendMessage(
        text,
        shieldActive,
        file
      );

      setPipelineStage("REHYDRATING");

      await new Promise((r) => setTimeout(r, 300));

      setTurns((prev) =>
        prev.map((turn) =>
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
        )
      );

      setPipelineStage("COMPLETE");
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

        {/* CHAT CONTAINER */}
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

        {/* RIGHT PANEL */}
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
                vaultMap={
                  turns.length > 0
                    ? turns[turns.length - 1].vaultMap
                    : undefined
                }
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}