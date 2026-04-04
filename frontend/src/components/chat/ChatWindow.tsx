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

  // ✅ TWO SCROLL REFS
  const leftScrollRef = useRef<HTMLDivElement | null>(null);
  const rightScrollRef = useRef<HTMLDivElement | null>(null);
  const isSyncingScroll = useRef(false);

  const isInitialState = turns.length === 0;

  // ✅ AUTO SCROLL BOTH PANELS
  useEffect(() => {
    if (leftScrollRef.current && rightScrollRef.current) {
      leftScrollRef.current.scrollTo({
        top: leftScrollRef.current.scrollHeight,
        behavior: "smooth",
      });

      rightScrollRef.current.scrollTo({
        top: rightScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [turns]);

  // ✅ SYNC FUNCTION
  const syncScroll = (source: "left" | "right") => {
    if (isSyncingScroll.current) return;

    isSyncingScroll.current = true;

    const sourceEl = source === "left" ? leftScrollRef.current : rightScrollRef.current;
    const targetEl = source === "left" ? rightScrollRef.current : leftScrollRef.current;

    if (sourceEl && targetEl) {
      const ratio =
        sourceEl.scrollTop /
        (sourceEl.scrollHeight - sourceEl.clientHeight);

      targetEl.scrollTop =
        ratio * (targetEl.scrollHeight - targetEl.clientHeight);
    }

    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  const panelStyle = {
    width: "100%",
    height: "100%",
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: "20px",
    boxShadow: `0 0 0 1px ${colors.border}, 0 20px 60px ${colors.glow}, inset 0 0 40px ${colors.glow}`,
    display: "flex" as const,
    flexDirection: "column" as const,
    overflow: "hidden" as const,
  };

  return (
    <div style={{ flex: 1, display: "flex", padding: "24px", gap: "16px", overflow: "hidden" }}>
      
      {/* ── LEFT: Original chat ── */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ ...panelStyle, maxWidth: inspectionMode ? "unset" : "1100px" }}>
          <div
            ref={leftScrollRef}
            onScroll={() => syncScroll("left")}
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
                <div key={turn.id} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  
                  <MessageBubble
                    theme={theme}
                    role="user"
                    originalText={turn.user.original}
                    attachments={turn.attachments}
                    isInspecting={false}
                    shieldActive={turn.shieldActive ?? shieldActive}
                    secretTypes={turn.secretTypes}
                    highlightMode="rehydrated"
                    vaultMap={turn.vaultMap}
                  />

                  <MessageBubble
                    theme={theme}
                    role="llm"
                    originalText={turn.llm.rehydrated}
                    isInspecting={false}
                    loading={turn.llm.loading}
                    shieldActive={turn.shieldActive ?? shieldActive}
                    highlightMode="rehydrated"
                    vaultMap={turn.vaultMap}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT: AI VIEW ── */}
      {inspectionMode && (
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={panelStyle}>
            
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

            <div
              ref={rightScrollRef}
              onScroll={() => syncScroll("right")}
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
                <div key={turn.id} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  
                  <MessageBubble
                    theme={theme}
                    role="user"
                    originalText={turn.user.masked || "—"}
                    isInspecting={false}
                    shieldActive={turn.shieldActive ?? shieldActive}
                    highlightMode="placeholders"
                  />

                  <MessageBubble
                    theme={theme}
                    role="llm"
                    originalText={turn.llm.masked || "—"}
                    isInspecting={false}
                    loading={turn.llm.loading}
                    shieldActive={turn.shieldActive ?? shieldActive}
                    highlightMode="placeholders"
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
