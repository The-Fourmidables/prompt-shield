import { useEffect, useRef } from "react";
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
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isInitialState = turns.length === 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [turns]);

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
  0 0 0 1px ${colors.border},
  0 20px 60px ${colors.glow},
  inset 0 0 40px ${colors.glow}
`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden", // locks card
        }}
      >
        {/* Scrollable message area */}
        <div
          ref={scrollRef}
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
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                gap: "24px",
                opacity: 0.95,
              }}
            >
              {/* Shield Icon Container */}
              <div
                style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${colors.border}`,
                  background: colors.surfaceAlt,
                  boxShadow: `
          0 0 40px ${colors.glow},
          inset 0 0 20px rgba(255,255,255,0.03)
        `,
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="28"
                  height="28"
                  stroke={colors.accent}
                  strokeWidth="1.8"
                  fill="none"
                >
                  <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z" />
                </svg>
              </div>

              {/* Title */}
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  letterSpacing: "1px",
                  color: colors.textPrimary,
                }}
              >
                PRIVACY-FIRST AI CHAT
              </div>

              {/* Subtitle */}
              <div
                style={{
                  maxWidth: "520px",
                  fontSize: "14px",
                  color: shieldActive
                    ? colors.textSecondary
                    : colors.danger,
                  lineHeight: 1.6,
                  transition: "color 0.25s ease",
                }}
              >
                {shieldActive
                  ? "Type naturally. Our shield detects and masks sensitive data before it ever reaches the model."
                  : "Shield is currently OFF. Your prompts will be sent without masking or privacy protection."}
              </div>
            </div>
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
                  attachments={turn.attachments}
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