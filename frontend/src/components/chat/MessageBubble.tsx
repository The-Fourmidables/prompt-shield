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
}

export default function MessageBubble({
    theme,
    role,
    originalText,
    maskedText,
    attachments,
    loading = false,
    shieldActive,
    isInspecting,
}: MessageBubbleProps) {
    const colors = getComputedTheme(theme, shieldActive);

    const isUser = role === "user";

    const displayText =
        isInspecting && shieldActive && maskedText
            ? maskedText
            : originalText;

    const dotStyle: React.CSSProperties = {
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        backgroundColor: isUser
            ? colors.accentText
            : colors.textPrimary,
        animation: "typing 1s infinite ease-in-out",
    };

    const bubbleBackground = isUser
        ? shieldActive
            ? theme === "dark"
                ? `${colors.accent}18`
                : `${colors.accent}22`
            : theme === "dark"
                ? `${colors.danger}22`
                : `${colors.danger}18`
        : colors.surfaceAlt;

    const bubbleBorder = isUser
        ? `1px solid ${shieldActive
            ? `${colors.accent}35`
            : `${colors.danger}55`
        }`
        : `1px solid ${colors.border}`;

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isUser ? "flex-end" : "flex-start",
                gap: "10px",
                padding: "2px 0",
            }}
        >
            {/* LLM Avatar */}
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
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <rect x="3" y="8" width="18" height="10" rx="2" />
                        <circle cx="8" cy="13" r="1" />
                        <circle cx="16" cy="13" r="1" />
                        <line x1="12" y1="2" x2="12" y2="6" />
                    </svg>
                </div>
            )}

            {/* Message Bubble */}
            <div
                style={{
                    backgroundColor: bubbleBackground,
                    color: isUser
    ? shieldActive
        ? colors.textPrimary
        : colors.danger
    : colors.textPrimary,
                    padding: "16px 20px",
                    borderRadius: "18px",
                    border: `1px solid ${bubbleBorder}`,
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
                    <div
                        style={{
                            marginBottom: displayText ? "8px" : "0px",
                        }}
                    >
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

                {/* Loading indicator */}
                {loading ? (
                    <div style={{ display: "flex", gap: "6px" }}>
                        <span style={dotStyle} />
                        <span style={{ ...dotStyle, animationDelay: "0.2s" }} />
                        <span style={{ ...dotStyle, animationDelay: "0.4s" }} />
                    </div>
                ) : (
                    displayText
                )}
            </div>

            {/* User Avatar */}
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
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M6 20c0-4 3-6 6-6s6 2 6 6" />
                    </svg>
                </div>
            )}
        </div>
    );
}