import { theme as themeConfig } from "../../theme/theme";
import { Shield } from "lucide-react";

export default function Header({
  theme,
  shieldActive,
  setShieldActive,
}: {
  theme: "dark" | "light";
  shieldActive: boolean;
  setShieldActive: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const colors = themeConfig[theme];

  const activeColor = shieldActive ? colors.accent : colors.danger!;
  const glowColor = shieldActive ? colors.glow : `${colors.danger}40`;

  return (
    <div
      style={{
        height: "80px",
        padding: "0 30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.background,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      {/* LEFT SIDE */}
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        
        {/* Shield Block */}
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.surfaceAlt,
            border: `1px solid ${activeColor}`,
            boxShadow: `0 0 18px ${glowColor}`,
            transition: "all 0.3s ease",
          }}
        >
          <Shield
            size={20}
            strokeWidth={2.4}
            color={activeColor}
          />
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: colors.textPrimary,
            letterSpacing: "1px",
          }}
        >
          PROMPT-SHIELD
        </div>

        {/* Toggle */}
        <div
          onClick={() => setShieldActive((prev) => !prev)}
          style={{
            padding: "6px 14px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            userSelect: "none",

            backgroundColor: shieldActive
              ? colors.surfaceAlt
              : `${colors.danger}22`,

            color: activeColor,
            border: `1px solid ${activeColor}`,

            transition: "all 0.25s ease",
          }}
        >
          {shieldActive ? "SHIELD ACTIVE" : "SHIELD OFF"}
        </div>
      </div>

      {/* RIGHT SIDE - VERSION */}
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "1px",
          color: colors.textSecondary,
        }}
      >
        v2.0
      </div>
    </div>
  );
}