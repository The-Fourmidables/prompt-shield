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


export default function Main({
  theme,
  setTheme,
}: {
  theme: "dark" | "light";
  setTheme: React.Dispatch<React.SetStateAction<"dark" | "light">>;
}) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [pipelineStage, setPipelineStage] = useState<string>("IDLE");
  const [activeMapping, setActiveMapping] = useState(false);
  const [shieldActive, setShieldActive] = useState(true);
  const [inspectionMode, setInspectionMode] = useState(false);

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

  const handleClearChat = () => {
    setTurns([]);
    setPipelineStage("IDLE");
  };

  const handleSend = async (text: string) => {
    const turnId = crypto.randomUUID();

    // Stage 1 — Detecting
    setPipelineStage("DETECTING");

    const newTurn: ChatTurn = {
      id: turnId,
      user: { original: text },
      llm: { loading: true },
    };

    setTurns((prev) => [...prev, newTurn]);

    // Short visual pause
    await new Promise((r) => setTimeout(r, 300));

    // Stage 2 — Masking
    setPipelineStage("MASKING_COMPLETE");

    await new Promise((r) => setTimeout(r, 300));

    // Stage 3 — Transmission (real async phase)
    setPipelineStage("TRANSMITTING");

    try {
      const response = await sendMessage(text, shieldActive);

      // Stage 4 — Rehydrating
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

      // Final stage
      setPipelineStage("COMPLETE");
    } catch (error) {
      setPipelineStage("COMPLETE");

      setTurns((prev) =>
        prev.map((turn) =>
          turn.id === turnId
            ? {
              ...turn,
              llm: {
                loading: false,
                rehydrated: "⚠️ Backend connection failed.",
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
          "background-color 0.6s cubic-bezier(0.4, 0, 0.2, 1), color 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
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
          activeMapping={activeMapping}
          setActiveMapping={setActiveMapping}
          inspectionMode={inspectionMode}
          setInspectionMode={setInspectionMode}
          colors={colors}
        />

        <div
          style={{
            flex: 2,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: "16px",
            boxShadow: `0 0 40px ${colors.glow}`,
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
            transition:
              "background-color 0.6s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              
          }}
        >
          <ChatWindow
            theme={theme}
            turns={turns}
            shieldActive={shieldActive}
            inspectionMode={inspectionMode}
          />

          <ChatInput
            theme={theme}
            shieldActive={shieldActive}
            onSend={handleSend}
            onClear={handleClearChat}
          />
        </div>

        <div
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: "16px",
            boxShadow: `0 0 40px ${colors.glow}`,
            padding: "20px",
            transition:
              "background-color 0.6s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              gap: "16px",
            }}
          >
            {!shieldActive && (
              <div
                style={{
                  padding: "14px 18px",
                  borderRadius: "12px",
                  backgroundColor: colors.surface,
                  border: `1px solid ${baseColors.danger}55`,
                  borderLeft: `4px solid ${baseColors.danger}`,
                  color: baseColors.danger,
                  fontSize: "13px",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  boxShadow: `0 0 25px ${baseColors.danger}33`,
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: baseColors.danger,
                    boxShadow: `0 0 10px ${baseColors.danger}`,
                  }}
                />

                <div>
                  Privacy Protection Disabled
                  <div style={{ fontSize: "12px", opacity: 0.75, marginTop: "3px" }}>
                    Sensitive data is being transmitted without masking.
                  </div>
                </div>
              </div>
            )}
            {/* PIPELINE CARD */}
            <div
              style={{
                flex: activeMapping ? 1 : 1,
                minHeight: 0,
                display: "flex",
              }}
            >
              <ProcessingPipeline
                stage={pipelineStage}
                hasVault={
                  turns.length > 0 &&
                  !!turns[turns.length - 1].vaultMap
                }
                colors={colors}
              />
            </div>

            {/* VAULT CARD */}
            {activeMapping && (
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                }}
              >
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}