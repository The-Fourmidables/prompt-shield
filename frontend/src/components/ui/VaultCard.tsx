import { theme } from "../../theme/theme";

interface Props {
  themeMode: "dark" | "light";
  vaultMap?: Record<string, string>;
  hasTurns: boolean;
  shieldActive: boolean;
}

export default function VaultCard({
  themeMode,
  vaultMap,
  hasTurns,
  shieldActive,
}: Props) {
  const colors = theme[themeMode];

  return (
    <div
      style={{
        flex: 1,
        borderRadius: "12px",
        border: shieldActive
          ? `1px solid ${colors.border}`
          : `1px solid ${colors.danger}`,
        padding: "16px",
        backgroundColor: colors.surfaceAlt,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 0,
        boxShadow: shieldActive
          ? "none"
          : `0 0 20px ${colors.danger}22`,
      }}
    >
      <h3
        style={{
          marginBottom: "16px",
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Active Vault Mappings</span>

        {vaultMap && (
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: shieldActive ? colors.accent : colors.danger,
              backgroundColor: shieldActive
                ? colors.surface
                : `${colors.danger}15`,
              padding: "4px 8px",
              borderRadius: "20px",
              border: `1px solid ${
                shieldActive ? colors.border : colors.danger
              }`,
            }}
          >
            {Object.keys(vaultMap).length}
          </span>
        )}
      </h3>

      {!hasTurns && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colors.textSecondary,
            fontSize: "13px",
            opacity: 0.7,
          }}
        >
          Vault is empty. Waiting for masked entities...
        </div>
      )}

      {hasTurns && !vaultMap && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colors.textSecondary,
            fontSize: "13px",
            opacity: 0.7,
          }}
        >
          No sensitive entities detected.
        </div>
      )}

      {hasTurns && vaultMap && (
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            paddingRight: "4px",
          }}
        >
          {Object.entries(vaultMap).map(([key, value]) => (
            <div
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "13px",
                padding: "10px 12px",
                borderRadius: "8px",
                backgroundColor: shieldActive
                  ? colors.surface
                  : `${colors.danger}10`,
                border: `1px solid ${
                  shieldActive ? colors.border : colors.danger
                }`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {!shieldActive && (
                  <span
                    style={{
                      color: colors.danger,
                      fontWeight: 700,
                      fontSize: "12px",
                    }}
                  >
                    ✕
                  </span>
                )}

                <span
                  style={{
                    color: shieldActive
                      ? colors.accent
                      : colors.danger,
                    fontWeight: 600,
                    fontSize: "11px",
                    letterSpacing: "0.5px",
                  }}
                >
                  {key}
                </span>
              </div>

              <span
                style={{
                  color: colors.textSecondary,
                  fontSize: "12px",
                  maxWidth: "55%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {String(value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}