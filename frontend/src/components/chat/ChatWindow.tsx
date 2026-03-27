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
  const colors         = getComputedTheme(theme, shieldActive);
  void rightPanelStack;

  const scrollRef      = useRef<HTMLDivElement | null>(null);
  const isInitialState = turns.length === 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [turns]);

  const panelStyle = {
    width:        "100%",
    height:       "100%",
    background:   colors.surface,
    border:       `1px solid ${colors.border}`,
    borderRadius: "20px",
    boxShadow:    `0 0 0 1px ${colors.border}, 0 20px 60px ${colors.glow}, inset 0 0 40px ${colors.glow}`,
    display:      "flex" as const,
    flexDirection:"column" as const,
    overflow:     "hidden" as const,
  };

  return (
    <div style={{ flex: 1, display: "flex", padding: "24px", gap: "16px", overflow: "hidden" }}>

      {/* ── LEFT: Original / rehydrated chat ── */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ ...panelStyle, maxWidth: inspectionMode ? "unset" : "1100px" }}>
          <div
            ref={scrollRef}
            style={{
              flex:          1,
              overflowY:     "auto",
              padding:       "32px",
              display:       "flex",
              flexDirection: "column",
              gap:           "20px",
            }}
          >
            {isInitialState ? (
              <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", color: colors.textSecondary }}>
                Start chatting...
              </div>
            ) : (
              turns.map((turn) => (
                <div key={turn.id} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <MessageBubble
                    theme={theme}
                    role="user"
                    originalText={turn.user.original}
                    attachments={turn.attachments}
                    isInspecting={false}
                    shieldActive={turn.shieldActive ?? shieldActive}
                    secretTypes={turn.secretTypes}   // ← NEW
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

      {/* ── RIGHT: AI VIEW (masked) ── */}
      {inspectionMode && (
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={panelStyle}>
            <div
              style={{
                padding:      "16px 24px",
                borderBottom: `1px solid ${colors.border}`,
                color:        colors.accent,
                fontWeight:   600,
                letterSpacing:"1px",
              }}
            >
              AI VIEW
            </div>
            <div
              style={{
                flex:          1,
                overflowY:     "auto",
                padding:       "32px",
                display:       "flex",
                flexDirection: "column",
                gap:           "20px",
              }}
            >
              {turns.map((turn) => (
                <div key={turn.id} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <MessageBubble
                    theme={theme}
                    role="user"
                    originalText={turn.user.masked || "—"}
                    isInspecting={false}
                    shieldActive={true}
                    // No secretTypes in AI VIEW — badges belong on the real prompt side
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
