import React from "react";
import { getComputedTheme } from "../../theme/theme";
import type { ThemeMode } from "../../theme/theme";

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
  highlightMode?: "none" | "placeholders" | "rehydrated";
  vaultMap?: Record<string, string>;
  onClick?: () => void;
}

// ── Chip colour map (same palette as ChatInput) ───────────────────────────────

const CHIP_COLORS: Record<string, { bg: string; text: string }> = {
  "OpenAI key":        { bg: "#FCEBEB", text: "#A32D2D" },
  "Anthropic key":     { bg: "#FCEBEB", text: "#A32D2D" },
  "OpenRouter key":    { bg: "#FCEBEB", text: "#A32D2D" },
  "Stripe key":        { bg: "#FCEBEB", text: "#A32D2D" },
  "Google API key":    { bg: "#FCEBEB", text: "#A32D2D" },
  "AWS access key":    { bg: "#FAEEDA", text: "#854F0B" },
  "AWS secret key":    { bg: "#FAEEDA", text: "#854F0B" },
  "GitHub token":      { bg: "#EAF3DE", text: "#3B6D11" },
  "Slack token":       { bg: "#EAF3DE", text: "#3B6D11" },
  "SendGrid key":      { bg: "#FAEEDA", text: "#854F0B" },
  "HuggingFace token": { bg: "#EAF3DE", text: "#3B6D11" },
  "Firebase key":      { bg: "#FAEEDA", text: "#854F0B" },
  "Azure key":         { bg: "#FAEEDA", text: "#854F0B" },
  "JWT token":         { bg: "#EEEDFE", text: "#3C3489" },
  "Postgres URI":      { bg: "#FAEEDA", text: "#854F0B" },
  "MySQL URI":         { bg: "#FAEEDA", text: "#854F0B" },
  "MongoDB URI":       { bg: "#FAEEDA", text: "#854F0B" },
  "Redis URI":         { bg: "#FAEEDA", text: "#854F0B" },
  "MSSQL URI":         { bg: "#FAEEDA", text: "#854F0B" },
  "DB password":       { bg: "#FCEBEB", text: "#A32D2D" },
  "Internal IP":       { bg: "#E6F1FB", text: "#0C447C" },
  "Internal URL":      { bg: "#E6F1FB", text: "#0C447C" },
  "Localhost URL":     { bg: "#E6F1FB", text: "#0C447C" },
  "S3 URL":            { bg: "#FAEEDA", text: "#854F0B" },
  "Password":          { bg: "#FCEBEB", text: "#A32D2D" },
  "Env secret":        { bg: "#EAF3DE", text: "#3B6D11" },
  "API key":           { bg: "#FCEBEB", text: "#A32D2D" },
  "Secret key":        { bg: "#FCEBEB", text: "#A32D2D" },
  "Auth token":        { bg: "#EEEDFE", text: "#3C3489" },
  "Private key":       { bg: "#FCEBEB", text: "#A32D2D" },
  "Private key block": { bg: "#FCEBEB", text: "#A32D2D" },
  "Certificate":       { bg: "#FAEEDA", text: "#854F0B" },
  "Email":             { bg: "#E1F5EE", text: "#0F6E56" },
  "Phone":             { bg: "#E1F5EE", text: "#0F6E56" },
  "Aadhaar":           { bg: "#E6F1FB", text: "#0C447C" },
  "PAN card":          { bg: "#E6F1FB", text: "#0C447C" },
  "Credit card":       { bg: "#FCEBEB", text: "#A32D2D" },
  "SSN":               { bg: "#FCEBEB", text: "#A32D2D" },
  "UPI ID":            { bg: "#EAF3DE", text: "#3B6D11" },
  "Bank account":      { bg: "#FAEEDA", text: "#854F0B" },
  "IFSC code":         { bg: "#E6F1FB", text: "#0C447C" },
};

const DEFAULT_CHIP = { bg: "#F1EFE8", text: "#5F5E5A" };

type MatchType = "url" | "placeholder" | "rehydrated";
type Match = { start: number; end: number; type: MatchType; href?: string };

const HIGHLIGHT_BLUE = "#2563EB";
const URL_RE = /https?:\/\/[^\s<>()]+/gi;
const PLACEHOLDER_RE = /<[^>\s]{1,80}>/g;

function getMatches(text: string, matchType: MatchType, items: string[]): Match[] {
  const lower = text.toLowerCase();
  const matches: Match[] = [];

  for (const raw of items) {
    const token = raw.trim();
    if (!token) continue;
    const tokenLower = token.toLowerCase();

    let from = 0;
    while (from < lower.length) {
      const at = lower.indexOf(tokenLower, from);
      if (at === -1) break;
      matches.push({ start: at, end: at + token.length, type: matchType });
      from = at + token.length;
    }
  }

  return matches;
}

function buildRichText({
  text,
  highlightMode,
  vaultMap,
}: {
  text: string;
  highlightMode: "none" | "placeholders" | "rehydrated";
  vaultMap?: Record<string, string>;
}): React.ReactNode {
  const matches: Match[] = [];

  const urlMatches: Match[] = [];
  URL_RE.lastIndex = 0;
  for (let m = URL_RE.exec(text); m; m = URL_RE.exec(text)) {
    urlMatches.push({ start: m.index, end: m.index + m[0].length, type: "url", href: m[0] });
  }
  matches.push(...urlMatches);

  if (highlightMode === "placeholders") {
    PLACEHOLDER_RE.lastIndex = 0;
    for (let m = PLACEHOLDER_RE.exec(text); m; m = PLACEHOLDER_RE.exec(text)) {
      matches.push({ start: m.index, end: m.index + m[0].length, type: "placeholder" });
    }
  }

  if (highlightMode === "rehydrated" && vaultMap) {
    const tokens = Array.from(
      new Set(Object.values(vaultMap).map((v) => (typeof v === "string" ? v : ""))),
    )
      .map((s) => s.trim())
      .filter((s) => s.length >= 2)
      .sort((a, b) => b.length - a.length);
    matches.push(...getMatches(text, "rehydrated", tokens));
  }

  if (matches.length === 0) return text;

  const typePriority: Record<MatchType, number> = {
    url: 0,
    placeholder: 1,
    rehydrated: 2,
  };

  matches.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    const pa = typePriority[a.type];
    const pb = typePriority[b.type];
    if (pa !== pb) return pa - pb;
    return b.end - a.end;
  });

  const picked: Match[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start < cursor) continue;
    picked.push(m);
    cursor = m.end;
  }

  const nodes: React.ReactNode[] = [];
  let pos = 0;

  picked.forEach((m, i) => {
    if (m.start > pos) nodes.push(text.slice(pos, m.start));

    const segment = text.slice(m.start, m.end);

    if (m.type === "url" && m.href) {
      nodes.push(
        <a
          key={`m-${i}`}
          href={m.href}
          target="_blank"
          rel="noreferrer noopener"
          style={{ color: HIGHLIGHT_BLUE, textDecoration: "underline" }}
        >
          {segment}
        </a>,
      );
    } else if (m.type === "placeholder") {
      nodes.push(
        <span key={`m-${i}`} style={{ color: HIGHLIGHT_BLUE, fontWeight: 600 }}>
          {segment}
        </span>,
      );
    } else {
      nodes.push(
        <span key={`m-${i}`} style={{ color: HIGHLIGHT_BLUE }}>
          {segment}
        </span>,
      );
    }

    pos = m.end;
  });

  if (pos < text.length) nodes.push(text.slice(pos));

  return nodes;
}

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
  highlightMode = "none",
  vaultMap,
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
      ? `${colors.accent}1F`
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
            const c = CHIP_COLORS[label] ?? DEFAULT_CHIP;
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
            color: isUser ? colors.textPrimary : colors.textPrimary,
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
            displayText
              ? buildRichText({ text: displayText, highlightMode, vaultMap })
              : null
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
