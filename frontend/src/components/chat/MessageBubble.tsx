import React from "react";
import { getComputedTheme } from "../../theme/theme";
import type { ThemeMode } from "../../theme/theme";
import LinkVisualizer from "./LinkVisualizer";

interface MessageBubbleProps {
  theme: ThemeMode;
  role: "user" | "llm";
  originalText?: string;
  maskedText?: string;
  attachments?: { name: string }[];
  loading?: boolean;
  shieldActive: boolean;
  isInspecting: boolean;
  secretTypes?: string[];   // ← NEW: shown as badges on user messages
  onClick?: () => void;
}

// ── Label to Palette mapping ──
const getChipPalette = (label: string, palettes: any) => {
  const l = label.toLowerCase();
  
  if (l.includes("key") || l.includes("password") || l.includes("credit card") || l.includes("ssn") || l.includes("pass")) {
    return palettes.danger;
  }
  if (l.includes("uri") || l.includes("connection") || l.includes("aws") || l.includes("certificate") || l.includes("account") || l.includes("s3")) {
    return palettes.warning;
  }
  if (l.includes("token") || l.includes("secret") || l.includes("upi")) {
    return palettes.success;
  }
  if (l.includes("jwt") || l.includes("auth")) {
    return palettes.purple;
  }
  if (l.includes("ip") || l.includes("url") || l.includes("host") || l.includes("aadhaar") || l.includes("pan") || l.includes("ifsc") || l.includes("code")) {
    return palettes.blue;
  }
  if (l.includes("email") || l.includes("phone")) {
    return palettes.teal;
  }
  
  return palettes.neutral;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function MessageBubble({
  theme,
  role,
  originalText,
  attachments,
  loading = false,
  shieldActive,
  isInspecting,
  secretTypes,
  onClick,
}: MessageBubbleProps) {
  const colors    = getComputedTheme(theme, shieldActive);
  const isUser    = role === "user";
  const displayText = originalText;

  const dotStyle: React.CSSProperties = {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: isUser ? colors.accentText : colors.textPrimary,
    animation: "typing 1s infinite ease-in-out",
  };

  const bubbleBackground = isUser
    ? shieldActive
      ? theme === "dark"
        ? colors.textPrimary
        : `${colors.accent}22`
      : theme === "dark"
        ? `${colors.danger}22`
        : `${colors.danger}18`
    : colors.surfaceAlt;

  const bubbleBorder = isUser
    ? `1px solid ${shieldActive ? `${colors.accent}35` : `${colors.danger}55`}`
    : `1px solid ${colors.border}`;

  // Show badges only on user messages when shield caught something
  const showBadges =
    isUser &&
    shieldActive &&
    secretTypes &&
    secretTypes.length > 0;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        gap: "5px",
        padding: "2px 0",
      }}
    >
      {/* ── Secret type badges (above bubble, right-aligned for user) ── */}
      {showBadges && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "5px",
            justifyContent: "flex-end",
            maxWidth: "680px",
            paddingRight: "46px", // align with bubble edge (avatar width + gap)
          }}
        >
          {secretTypes!.map((label) => {
            const c = getChipPalette(label, colors.chips);
            return (
              <span
                key={label}
                title={`${label} was masked before sending`}
                style={{
                  background: c.bg,
                  color: c.text,
                  border: `0.5px solid ${c.text}33`,
                  borderRadius: "4px",
                  padding: "1px 7px",
                  fontSize: "10px",
                  fontWeight: 500,
                  letterSpacing: "0.2px",
                  cursor: "default",
                }}
              >
                🔒 {label}
              </span>
            );
          })}
        </div>
      )}

      {/* ── Bubble row (avatar + bubble) ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: isUser ? "flex-end" : "flex-start",
          gap: "10px",
          width: "100%",
          cursor: isInspecting ? "pointer" : "default",
        }}
      >
        {/* LLM avatar */}
        {!isUser && (
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: colors.accent,
              boxShadow: `0 0 12px ${colors.glow}`,
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="8" width="18" height="10" rx="2" />
              <circle cx="8" cy="13" r="1" />
              <circle cx="16" cy="13" r="1" />
              <line x1="12" y1="2" x2="12" y2="6" />
            </svg>
          </div>
        )}

        {/* Bubble */}
        <div
          style={{
            backgroundColor: bubbleBackground,
            color: isUser
              ? shieldActive
                ? theme === "dark"
                  ? colors.accentText
                  : colors.textPrimary
                : colors.danger
              : colors.textPrimary,
            padding: "16px 20px",
            borderRadius: "18px",
            border: bubbleBorder,
            maxWidth: "680px",
            minWidth: "120px",
            fontSize: "14px",
            lineHeight: "1.6",
            letterSpacing: "0.2px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            backdropFilter: "blur(6px)",
            transition: "all 0.18s ease",
          }}
        >
          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div style={{ marginBottom: displayText ? "8px" : "0px" }}>
              {attachments.map((att, i) => (
                <div
                  key={i}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    fontSize: "12px",
                    marginBottom: "6px",
                  }}
                >
                  📎 {att.name}
                </div>
              ))}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div style={{ display: "flex", gap: "6px" }}>
              <span style={dotStyle} />
              <span style={{ ...dotStyle, animationDelay: "0.2s" }} />
              <span style={{ ...dotStyle, animationDelay: "0.4s" }} />
            </div>
          ) : (
            <LinkVisualizer text={displayText!} color={colors.info} />
          )}
        </div>

        {/* User avatar */}
        {isUser && (
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: colors.surfaceAlt,
              border: `1px solid ${colors.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: colors.textPrimary,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M6 20c0-4 3-6 6-6s6 2 6 6" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
