import { theme as themeConfig } from "../../theme/theme";

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
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
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

            color: shieldActive
              ? colors.accent
              : colors.danger,

            border: `1px solid ${shieldActive ? colors.border : colors.danger
              }`,

            transition: "all 0.25s ease",
          }}
        >
          {shieldActive ? "SHIELD ACTIVE" : "SHIELD OFF"}
        </div>
      </div>
    </div>
  );
}