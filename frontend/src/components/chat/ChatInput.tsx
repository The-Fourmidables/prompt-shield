import { useRef, useState } from "react";
import { theme as themeConfig } from "../../theme/theme";

export default function ChatInput({
  theme,
  shieldActive,
  onSend,
  onClear,
}: {
  theme: "dark" | "light";
  shieldActive: boolean;
  onSend: (text: string, attachments?: any[]) => void;
  onClear: () => void;
}) {
  const colors = themeConfig[theme];

  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const BASE_HEIGHT = 52; // slightly larger modern feel

  const handleSend = () => {
    if (!message.trim() && !file) return;

    onSend(message.trim(), file ? [file] : undefined);

    setMessage("");
    setFile(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = BASE_HEIGHT + "px";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "flex-end",
      }}
    >
      {/* PLUS BUTTON */}
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
        }}
      >
        +
      </button>

      {/* CLEAR CHAT BUTTON */}
      <button
        onClick={() => {
          onClear();
          setMessage("");
          setFile(null);
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
        }}
      >
        🗑
      </button>

      {/* Hidden File Input */}
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

      {/* INPUT WRAPPER */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {/* File Chip ABOVE textarea */}
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
            <span
              style={{ cursor: "pointer" }}
              onClick={() => setFile(null)}
            >
              ✕
            </span>
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
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            padding: "12px 16px",
            outline: "none",
            overflowY: "hidden",
            lineHeight: "1.4",
          }}
        />
      </div>

      {/* SEND BUTTON OUTSIDE WRAPPER */}
      <button
        onClick={handleSend}
        style={{
          height: BASE_HEIGHT + "px",
          padding: "0 20px",
          borderRadius: "12px",
          border: "none",
          backgroundColor: !shieldActive
            ? colors.danger
            : colors.accent,

          color: !shieldActive
            ? colors.dangerText
            : colors.accentText,
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Send
      </button>
    </div>
  );
}