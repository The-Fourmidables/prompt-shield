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
        padding: "24px",
        gap: "16px",
        overflow: "hidden",
      }}
    >
      {/* LEFT: ORIGINAL CHAT */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: inspectionMode ? "unset" : "1100px",
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
            overflow: "hidden",
          }}
        >
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
                  justifyContent: "center",
                  alignItems: "center",
                  color: colors.textSecondary,
                }}
              >
                Start chatting...
              </div>
            ) : (
              turns.map((turn) => (
                <div
                  key={turn.id}
                  style={{
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
                    isInspecting={false}
                    shieldActive={turn.shieldActive ?? shieldActive}
                  />

                  <MessageBubble
                    theme={theme}
                    role="llm"
                    originalText={turn.llm.rehydrated}
                    isInspecting={false}
                    loading={turn.llm.loading}
                    shieldActive={turn.shieldActive ?? shieldActive}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: AI VIEW */}
      {inspectionMode && (
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "100%",
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
              overflow: "hidden",
            }}
          >
            {/* HEADER */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: `1px solid ${colors.border}`,
                color: colors.accent,
                fontWeight: 600,
                letterSpacing: "1px",
              }}
            >
              AI VIEW
            </div>

            {/* CONTENT */}
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
              {turns.map((turn) => (
                <div
                  key={turn.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <MessageBubble
                    theme={theme}
                    role="user"
                    originalText={turn.user.masked || "—"}
                    isInspecting={false}
                    shieldActive={true}
                  />

                  <MessageBubble
                    theme={theme}
                    role="llm"
                    originalText={turn.llm.masked || "—"}
                    isInspecting={false}
                    loading={turn.llm.loading}
                    shieldActive={true}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}