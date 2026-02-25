import { theme as themeConfig } from "../../theme/theme";

export default function MessageBubble({
    theme,
    role,
    originalText,
    maskedText,
    attachments,
    loading,
    shieldActive,
    isInspecting,
}: {
    theme: "dark" | "light";
    role: "user" | "llm";
    originalText?: string;
    maskedText?: string;
    attachments?: any[];
    loading?: boolean;
    shieldActive: boolean;
    isInspecting: boolean;
}) {
    const colors = themeConfig[theme];
    const isUser = role === "user";

    const displayText =
        isInspecting && shieldActive && maskedText
            ? maskedText
            : originalText;

    const isLoading = loading === true;
    const dotStyle: React.CSSProperties = {
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        backgroundColor: isUser
            ? colors.accentText
            : colors.textPrimary,
        animation: "typing 1s infinite ease-in-out",
    };

    return (
        <div
            style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: isUser ? "flex-end" : "flex-start",
                gap: "12px",
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
                        color: !shieldActive ? colors.danger : colors.accent,
                        boxShadow: !shieldActive
                            ? `0 0 12px ${colors.danger}33`
                            : `0 0 12px ${colors.accent}33`,
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
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
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
                    backgroundColor:
                        isUser && !shieldActive
                            ? theme === "light"
                                ? `${colors.danger}15`
                                : `${colors.danger}22`
                            : isUser
                                ? theme === "light"
                                    ? `${colors.accent}25`
                                    : colors.accent
                                : colors.surfaceAlt,

                    color:
                        isUser && !shieldActive
                            ? theme === "light"
                                ? colors.textPrimary
                                : colors.danger
                            : isUser
                                ? theme === "light"
                                    ? colors.textPrimary
                                    : colors.accentText
                                : colors.textPrimary,

                    padding: "14px 18px",
                    borderRadius: "18px",

                    boxShadow:
                        isUser && !shieldActive
                            ? `0 0 12px ${colors.danger}22`
                            : "none",

                    border:
                        isUser && !shieldActive
                            ? `1px solid ${colors.danger}55`
                            : isUser
                                ? "none"
                                : `1px solid ${colors.border}`,

                    maxWidth: "60%",
                    fontSize: "14px",

                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                }}
            >
                <>
                    {attachments && attachments.length > 0 && (
                        <div style={{ marginBottom: displayText ? "8px" : "0px" }}>
                            {attachments.map((att, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: "6px 10px",
                                        borderRadius: "8px",
                                        backgroundColor: "rgba(255,255,255,0.08)",
                                        fontSize: "12px",
                                        marginBottom: "6px",
                                    }}
                                >
                                    📎 {att.name}
                                </div>
                            ))}
                        </div>
                    )}

                    {isLoading ? (
                        <div style={{ display: "flex", gap: "6px" }}>
                            <span style={dotStyle} />
                            <span style={{ ...dotStyle, animationDelay: "0.2s" }} />
                            <span style={{ ...dotStyle, animationDelay: "0.4s" }} />
                        </div>
                    ) : (
                        displayText
                    )}
                </>
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
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M6 20c0-4 3-6 6-6s6 2 6 6" />
                    </svg>
                </div>
            )}
        </div>
    );
}