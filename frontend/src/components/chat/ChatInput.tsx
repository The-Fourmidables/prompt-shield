import { useRef, useState, useEffect, useCallback } from "react";
import { getTheme } from "../../theme/theme";

// ── Client-side detection rules (mirrors code_masker.py + masker.py patterns)
// Used only for the LIVE PREVIEW — the real masking always happens on the backend.
// ─────────────────────────────────────────────────────────────────────────────

interface PreviewRule {
  id: string;
  label: string;
  pattern: RegExp;
}

const PREVIEW_RULES: PreviewRule[] = [
  // Provider API keys
  { id: "openai",     label: "OpenAI key",     pattern: /sk-(?:proj-)?[A-Za-z0-9]{20,}/g },
  { id: "anthropic",  label: "Anthropic key",  pattern: /sk-ant-[A-Za-z0-9_-]{20,}/g },
  { id: "openrouter", label: "OpenRouter key", pattern: /sk-or-[A-Za-z0-9_-]{20,}/g },
  { id: "stripe",     label: "Stripe key",     pattern: /(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{20,}/g },
  { id: "google",     label: "Google API key", pattern: /AIza[0-9A-Za-z_-]{35}/g },
  { id: "aws_key",    label: "AWS access key", pattern: /AKIA[0-9A-Z]{16}/g },
  { id: "github",     label: "GitHub token",   pattern: /ghp_[A-Za-z0-9]{36}/g },
  { id: "sendgrid",   label: "SendGrid key",   pattern: /SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/g },
  { id: "slack",      label: "Slack token",    pattern: /xox[baprs]-[A-Za-z0-9-]{10,}/g },
  { id: "hf",         label: "HuggingFace token", pattern: /hf_[A-Za-z0-9]{30,}/g },
  // JWT
  { id: "jwt",        label: "JWT token",      pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g },
  // Database URIs
  { id: "postgres",   label: "Postgres URI",   pattern: /postgres(?:ql)?:\/\/[^\s"'`<>)[\]]+/gi },
  { id: "mysql",      label: "MySQL URI",      pattern: /mysql(?:\+\w+)?:\/\/[^\s"'`<>)[\]]+/gi },
  { id: "mongodb",    label: "MongoDB URI",    pattern: /mongodb(?:\+srv)?:\/\/[^\s"'`<>)[\]]+/gi },
  { id: "redis",      label: "Redis URI",      pattern: /redis:\/\/[^\s"'`<>)[\]]+/gi },
  // Network
  { id: "priv_ip",    label: "Internal IP",    pattern: /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?::\d+)?\b/g },
  { id: "int_url",    label: "Internal URL",   pattern: /https?:\/\/[a-z0-9._-]*\.(?:internal|corp|local|intranet|lan)(?:\/[^\s"'`]*)*/gi },
  // Generic secrets
  { id: "password",   label: "Password",       pattern: /(?:password|passwd|pwd)\s*[=:]\s*["']([^"']{4,})["']/gi },
  { id: "env_secret", label: "Env secret",     pattern: /\b[A-Z][A-Z0-9_]{3,}(?:KEY|SECRET|TOKEN|PASSWORD|PASS|PWD|AUTH|CRED)[A-Z0-9_]*\s*=\s*[^\s\n"'`]{6,}/g },
  // PII
  { id: "email",      label: "Email",          pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  { id: "privkey",    label: "Private key",    pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g },
];

interface PreviewResult {
  maskedText: string;
  detectedLabels: string[];
}

function clientPreviewMask(text: string): PreviewResult {
  if (!text.trim()) return { maskedText: text, detectedLabels: [] };

  let masked = text;
  const detectedLabels: string[] = [];
  let counter = 0;

  for (const rule of PREVIEW_RULES) {
    rule.pattern.lastIndex = 0;
    const before = masked;
    masked = masked.replace(rule.pattern, () => {
      counter++;
      return `<${rule.id.toUpperCase()}_${counter}>`;
    });
    if (masked !== before && !detectedLabels.includes(rule.label)) {
      detectedLabels.push(rule.label);
    }
  }

  return { maskedText: masked, detectedLabels };
}

// ── Colour map for secret type chips ─────────────────────────────────────────

const CHIP_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "OpenAI key":        { bg: "#FCEBEB", text: "#A32D2D", dot: "#E24B4A" },
  "Anthropic key":     { bg: "#FCEBEB", text: "#A32D2D", dot: "#E24B4A" },
  "OpenRouter key":    { bg: "#FCEBEB", text: "#A32D2D", dot: "#E24B4A" },
  "Stripe key":        { bg: "#FCEBEB", text: "#A32D2D", dot: "#E24B4A" },
  "Google API key":    { bg: "#FCEBEB", text: "#A32D2D", dot: "#E24B4A" },
  "AWS access key":    { bg: "#FAEEDA", text: "#854F0B", dot: "#BA7517" },
  "GitHub token":      { bg: "#EAF3DE", text: "#3B6D11", dot: "#639922" },
  "Slack token":       { bg: "#EAF3DE", text: "#3B6D11", dot: "#639922" },
  "SendGrid key":      { bg: "#FAEEDA", text: "#854F0B", dot: "#BA7517" },
  "HuggingFace token": { bg: "#EAF3DE", text: "#3B6D11", dot: "#639922" },
  "JWT token":         { bg: "#EEEDFE", text: "#3C3489", dot: "#7F77DD" },
  "Postgres URI":      { bg: "#FAEEDA", text: "#854F0B", dot: "#BA7517" },
  "MySQL URI":         { bg: "#FAEEDA", text: "#854F0B", dot: "#BA7517" },
  "MongoDB URI":       { bg: "#FAEEDA", text: "#854F0B", dot: "#BA7517" },
  "Redis URI":         { bg: "#FAEEDA", text: "#854F0B", dot: "#BA7517" },
  "Internal IP":       { bg: "#E6F1FB", text: "#0C447C", dot: "#378ADD" },
  "Internal URL":      { bg: "#E6F1FB", text: "#0C447C", dot: "#378ADD" },
  "Password":          { bg: "#FCEBEB", text: "#A32D2D", dot: "#E24B4A" },
  "Env secret":        { bg: "#EAF3DE", text: "#3B6D11", dot: "#639922" },
  "Email":             { bg: "#E1F5EE", text: "#0F6E56", dot: "#1D9E75" },
  "Private key":       { bg: "#FCEBEB", text: "#A32D2D", dot: "#E24B4A" },
};

const DEFAULT_CHIP = { bg: "#F1EFE8", text: "#5F5E5A", dot: "#888780" };

function getChipColor(label: string) {
  return CHIP_COLORS[label] ?? DEFAULT_CHIP;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChatInput({
  theme,
  shieldActive,
  onSend,
  onClear,
}: {
  theme: "dark" | "light";
  shieldActive: boolean;
  onSend: (text: string, attachments?: File[]) => void;
  onClear: () => void;
}) {
  const colors = getTheme(theme);

  const [message, setMessage]             = useState("");
  const [file, setFile]                   = useState<File | null>(null);
  const [showPreview, setShowPreview]     = useState(false);
  const [previewResult, setPreviewResult] = useState<PreviewResult>({ maskedText: "", detectedLabels: [] });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const BASE_HEIGHT = 52;

  // Debounced live preview
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPreviewResult(clientPreviewMask(message));
    }, 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [message]);

  const hasSecrets = previewResult.detectedLabels.length > 0;

  const handleSend = useCallback(() => {
    if (!message.trim() && !file) return;
    onSend(message.trim(), file ? [file] : undefined);
    setMessage("");
    setFile(null);
    setShowPreview(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = BASE_HEIGHT + "px";
    }
  }, [message, file, onSend]);

  // Theme-aware colours for the preview panel
  const previewBg     = theme === "dark" ? "#0E0E0E" : "#F7F5F0";
  const previewBorder = theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const previewText   = theme === "dark" ? "#9A9A9A" : "#555";
  const labelColor    = theme === "dark" ? colors.textSecondary : "#666";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

      {/* ── Detected type chips + preview toggle ── */}
      {shieldActive && hasSecrets && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: labelColor, flexShrink: 0 }}>
            Will mask:
          </span>

          {previewResult.detectedLabels.map((label) => {
            const c = getChipColor(label);
            return (
              <span
                key={label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  background: c.bg,
                  color: c.text,
                  border: `0.5px solid ${c.text}33`,
                  borderRadius: "5px",
                  padding: "2px 8px",
                  fontSize: "11px",
                  fontWeight: 500,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
                {label}
              </span>
            );
          })}

          <button
            onClick={() => setShowPreview((v) => !v)}
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: `0.5px solid ${colors.border}`,
              borderRadius: "6px",
              padding: "2px 10px",
              fontSize: "11px",
              color: labelColor,
              cursor: "pointer",
            }}
          >
            {showPreview ? "Hide preview" : "Preview masked"}
          </button>
        </div>
      )}

      {/* ── Masked preview panel ── */}
      {shieldActive && showPreview && hasSecrets && (
        <div
          style={{
            background: previewBg,
            border: `1px solid ${previewBorder}`,
            borderRadius: "10px",
            padding: "10px 14px",
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: "12px",
            lineHeight: 1.65,
            color: previewText,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            maxHeight: "160px",
            overflowY: "auto",
          }}
        >
          {previewResult.maskedText}
        </div>
      )}

      {/* ── Main input row ── */}
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>

        {/* Plus button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.surfaceAlt,
            color: colors.textPrimary,
            cursor: "pointer",
            fontSize: "20px",
            flexShrink: 0,
          }}
        >
          +
        </button>

        {/* Clear chat button */}
        <button
          onClick={() => {
            onClear();
            setMessage("");
            setFile(null);
            setShowPreview(false);
            if (textareaRef.current) {
              textareaRef.current.style.height = BASE_HEIGHT + "px";
            }
          }}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.surfaceAlt,
            color: colors.textSecondary,
            cursor: "pointer",
            fontSize: "18px",
            flexShrink: 0,
          }}
        >
          🗑
        </button>

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*,.pdf"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setFile(e.target.files[0]);
            }
          }}
        />

        {/* Textarea wrapper */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>

          {/* File chip */}
          {file && (
            <div
              style={{
                alignSelf: "flex-start",
                backgroundColor: colors.surfaceAlt,
                border: `1px solid ${colors.border}`,
                borderRadius: "10px",
                padding: "6px 10px",
                fontSize: "12px",
                color: colors.textSecondary,
                display: "flex",
                gap: "8px",
                alignItems: "center",
                maxWidth: "70%",
              }}
            >
              {file.name}
              <span style={{ cursor: "pointer" }} onClick={() => setFile(null)}>✕</span>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your prompt..."
            rows={1}
            style={{
              width: "100%",
              minHeight: BASE_HEIGHT + "px",
              maxHeight: "200px",
              resize: "none",
              borderRadius: "12px",
              border: `1px solid ${shieldActive ? colors.accent : colors.danger}`,
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              padding: "12px 16px",
              outline: "none",
              overflowY: "hidden",
              lineHeight: "1.4",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          style={{
            height: BASE_HEIGHT + "px",
            padding: "0 20px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: shieldActive ? colors.accent : colors.danger,
            color: shieldActive ? colors.accentText : colors.dangerText,
            cursor: "pointer",
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
