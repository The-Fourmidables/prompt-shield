import { getTheme } from "../../theme/theme";
import { Shield, Lock } from "lucide-react";

export default function Header({
  theme,
  shieldActive,
  setShieldActive,
  enforceShield,
}: {
  theme: "dark" | "light";
  shieldActive: boolean;
  setShieldActive: React.Dispatch<React.SetStateAction<boolean>>;
  enforceShield?: boolean;
}) {
  const colors = getTheme(theme);

  const activeColor = shieldActive ? colors.accent : colors.danger!;
  const glowColor = shieldActive ? colors.glow : `${colors.danger}40`;

  return (
    <div
      style={{
        height: "76px",
        padding: "0 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: `linear-gradient(180deg, ${colors.background} 0%, ${colors.background}CC 100%)`,
        borderBottom: `1px solid ${colors.border}`,
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(10px)",
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
            background: `linear-gradient(180deg, ${colors.surfaceAlt} 0%, ${colors.surface} 100%)`,
            border: `1px solid ${activeColor}66`,
            boxShadow: `0 10px 30px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.08)`,
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
            letterSpacing: "0.6px",
          }}
        >
          Prompt Shield
        </div>

        {/* Toggle */}
        <div
          onClick={() => {
            if (!enforceShield) setShieldActive((prev) => !prev);
          }}
          style={{
            padding: "7px 14px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: enforceShield ? "not-allowed" : "pointer",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            gap: "6px",

            backgroundColor: shieldActive
              ? colors.surfaceAlt
              : `${colors.danger}22`,

            color: activeColor,
            border: `1px solid ${activeColor}80`,
            boxShadow: shieldActive ? `0 8px 26px ${glowColor}` : "none",
            opacity: enforceShield ? 0.8 : 1,

            transition: "all 0.25s ease",
          }}
          title={enforceShield ? "Shield is enforced by Administrator" : "Click to toggle"}
        >
          {enforceShield && <Lock size={12} />}
          {shieldActive ? (enforceShield ? "SHIELD MANDATORY" : "SHIELD ACTIVE") : "SHIELD OFF"}
        </div>
      </div>

      {/* RIGHT SIDE - VERSION */}
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.6px",
          color: colors.textSecondary,
        }}
      >
        v3.4.2
      </div>
    </div>
  );
}
