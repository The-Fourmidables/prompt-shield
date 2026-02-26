import { getComputedTheme } from "../../theme/theme";
import MessageBubble from "./MessageBubble";
import type { ChatTurn } from "../../types";

export default function ChatWindow({
  theme,
  turns,
  inspectionMode,
  shieldActive,
  rightPanelStack,
}: {
  theme: "dark" | "light";
  turns: ChatTurn[];
  inspectionMode: boolean;
  shieldActive: boolean;
  rightPanelStack: ("pipeline" | "vault")[];
}) {
  const colors = getComputedTheme(theme, shieldActive);
  void rightPanelStack;

  const isInitialState = turns.length === 0;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        overflow: "hidden", // prevents card movement
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          height: "100%",
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: "20px",
          boxShadow: `
            0 0 0 1px rgba(255,255,255,0.02),
            0 20px 60px rgba(0,0,0,0.6),
            inset 0 0 40px rgba(255,255,255,0.02)
          `,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden", // locks card
        }}
      >
        {/* Scrollable message area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {isInitialState ? (
            <>
              {/* KEEP YOUR EXISTING INITIAL STATE CONTENT HERE */}
            </>
          ) : (
            turns.map((turn) => (
              <div
                key={turn.id}
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <MessageBubble
                  theme={theme}
                  role="user"
                  originalText={turn.user.original}
                  maskedText={turn.user.masked}
                  isInspecting={inspectionMode}
                  shieldActive={shieldActive}
                />

                <MessageBubble
                  theme={theme}
                  role="llm"
                  originalText={turn.llm.rehydrated}
                  maskedText={turn.llm.masked}
                  isInspecting={inspectionMode}
                  loading={turn.llm.loading}
                  shieldActive={shieldActive}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}