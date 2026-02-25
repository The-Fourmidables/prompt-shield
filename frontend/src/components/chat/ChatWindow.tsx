import { getComputedTheme } from "../../theme/theme";
import MessageBubble from "./MessageBubble";
import type { ChatTurn } from "../../types";

import React from "react";

export default function ChatWindow({
  theme,
  turns,
  inspectionMode,
  shieldActive,
}: {
  theme: "dark" | "light";
  turns: ChatTurn[];
  inspectionMode: boolean;
  shieldActive: boolean;
}) {
  const colors = getComputedTheme(theme, shieldActive);
  const isInitialState = turns.length === 0;
  const mysticStyle: React.CSSProperties = {
    position: "relative",
  };

  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: isInitialState ? "center" : "flex-start",
        alignItems: isInitialState ? "center" : "stretch",
        gap: "20px",
        padding: "24px",
        textAlign: isInitialState ? "center" : "left",

        ...mysticStyle,
        transition:
          "box-shadow 0.4s ease, background-image 0.4s ease",
      }}
    >
      {isInitialState ? (
        <>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              backgroundColor: colors.surfaceAlt,
              border: `1px solid ${colors.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 40px ${colors.accent}22`,
              marginBottom: "20px",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke={colors.accent}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z" />
            </svg>
          </div>

          <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>
            PRIVACY-FIRST AI CHAT
          </h2>

          <p
            style={{
              color: colors.textSecondary,
              maxWidth: "420px",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            Type naturally. Our shield detects and masks PII
            before it ever touches the model.
          </p>
        </>
      ) : (
        turns.map((turn) => (
          <div
            key={turn.id}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px", // 👈 controls space between user & LLM
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
  );
}