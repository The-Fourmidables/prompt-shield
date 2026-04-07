import { useEffect, useRef } from "react";
import { getComputedTheme } from "../../theme/theme";
import MessageBubble from "./MessageBubble";
import type { ChatTurn } from "../../types";
import { Shield } from "lucide-react";

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

  const panelStyle = {
    width: "100%",
    height: "100%",
    background: `linear-gradient(180deg, ${colors.surface} 0%, ${colors.surfaceAlt} 160%)`,
    border: `1px solid ${colors.border}`,
    borderRadius: "22px",
    boxShadow: `0 24px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)`,
    display: "flex" as const,
    flexDirection: "column" as const,
    overflow: "hidden" as const,
  };

  return (
    <div style={{ flex: 1, display: "flex", gap: "16px", overflow: "hidden" }}>
      <div style={{ ...panelStyle, flex: 1 }}>
        <div
          ref={leftScrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "26px",
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
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", textAlign: "center" }}>
                <div
                  style={{
                    width: "54px",
                    height: "54px",
                    borderRadius: "16px",
                    background: `linear-gradient(180deg, ${colors.surfaceAlt} 0%, ${colors.surface} 100%)`,
                    border: `1px solid ${colors.accent}55`,
                    boxShadow: `0 22px 70px ${colors.glow}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: colors.accent,
                  }}
                >
                  <Shield size={22} strokeWidth={2.4} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <div style={{ fontSize: "16px", fontWeight: 900, letterSpacing: "2.2px", color: colors.textPrimary }}>
                    PRIVACY-FIRST AI CHAT
                  </div>
                  <div style={{ maxWidth: "560px", fontSize: "14px", lineHeight: "1.7", color: colors.textSecondary }}>
                    Type naturally. Our shield detects and masks sensitive data before it ever reaches the model.
                  </div>
                </div>
              </div>
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

      {inspectionMode && (
        <div style={{ ...panelStyle, flex: 1 }}>
          <div
            style={{
              padding: "14px 20px",
              borderBottom: `1px solid ${colors.border}`,
              color: colors.accent,
              fontWeight: 700,
              letterSpacing: "0.6px",
            }}
          >
            AI VIEW
          </div>

          <div
            ref={rightScrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "26px",
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
      )}
    </div>
  );
}
