import { getTheme } from "../../theme/theme";

interface Props {
  themeMode: "dark" | "light";
  totalValue: number;
  shieldActive: boolean;
}

export default function SecurityTicker({
  themeMode,
  totalValue,
  shieldActive,
}: Props) {
  const colors = getTheme(themeMode);

  return (
    <div
      style={{
        width: "100%",
        padding: "16px",
        borderRadius: "14px",
        backgroundColor: colors.surface,
        border: `1px solid ${shieldActive ? colors.border : colors.danger}`,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        boxShadow: `0 4px 12px ${shieldActive ? colors.glow : `${colors.danger}22`}`,
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: totalValue > 0
            ? (shieldActive ? colors.accent : colors.danger)
            : colors.textSecondary,
          boxShadow: totalValue > 0
            ? `0 0 8px ${shieldActive ? colors.accent : colors.danger}`
            : "none",
          animation: totalValue > 0 && shieldActive ? "pulse 2s infinite" : "none"
        }} />
        <span style={{ fontSize: "11px", fontWeight: 700, color: colors.textSecondary, letterSpacing: "1px" }}>
          {shieldActive ? "RISK MITIGATION STATUS" : "SHIELD OFF"}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: "20px", fontWeight: 800, color: shieldActive ? colors.accent : colors.danger }}>
          ${totalValue.toLocaleString()}
        </span>
        <span style={{ fontSize: "10px", color: colors.textSecondary, opacity: 0.7 }}>
          USD SAVED (EST.)
        </span>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
