import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import ImpactDashboard from "../components/ui/ImpactDashboard";
import SecurityTicker from "../components/ui/SecurityTicker";
import { theme as themeConfig } from "../theme/theme";

function parseVault(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

const SCORE_MAP: Record<string, number> = {
  Aadhaar: 500,
  PAN: 500,
  CreditCard: 800,
  RuPayCard: 800,
  BankAccount: 600,
  IFSC: 150,
  UPI: 150,
  UPITxnID: 150,
  SSN: 1000,
  MRN: 800,
  PatientID: 800,
  Email: 50,
  Phone: 75,
  URL: 50,
  IPAddress: 100,
  MACAddress: 100,
  JWTToken: 500,
  APIKey: 1000,
  Password: 1000,
  OpenAIKey: 1500,
  AnthropicKey: 1500,
  OpenRouterKey: 1500,
  GoogleAPIKey: 1200,
  AWSAccessKey: 1200,
  AWSSecretKey: 2000,
  GitHubToken: 1000,
  StripeKey: 1500,
  TwilioToken: 1200,
  SendGridKey: 1200,
  SlackToken: 900,
  HuggingFaceToken: 900,
  PrivateKeyBlock: 3000,
  Certificate: 1200,
  PostgresConn: 2500,
  MySQLConn: 2500,
  MongoDBConn: 2500,
  RedisConn: 2500,
  MSSQLConn: 2500,
};

export default function Dashboard({
  theme,
  setTheme,
}: {
  theme: "dark" | "light";
  setTheme: React.Dispatch<React.SetStateAction<"dark" | "light">>;
}) {
  const navigate = useNavigate();
  const colors = themeConfig[theme];

  const [shieldActive, setShieldActive] = useState<boolean>(() => {
    const saved = localStorage.getItem("ps_shield");
    return saved === "false" ? false : true;
  });

  const [vault, setVault] = useState<Record<string, string>>(() =>
    parseVault(localStorage.getItem("ps_vault")),
  );

  useEffect(() => {
    localStorage.setItem("ps_shield", String(shieldActive));
  }, [shieldActive]);

  const totalValue = useMemo(() => {
    let total = 0;
    for (const key of Object.keys(vault)) {
      const typeMatch = key.match(/<([A-Za-z]+)(?:_?\d+)?>/);
      const type = typeMatch ? typeMatch[1] : "PII";
      total += SCORE_MAP[type] ?? 50;
    }
    return total;
  }, [vault]);

  return (
    <div
      style={{
        height: "100vh",
        backgroundColor: colors.background,
        color: colors.textPrimary,
        display: "flex",
        flexDirection: "column",
        transition:
          "background-color 0.6s cubic-bezier(0.4,0,0.2,1), color 0.6s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <Header
        theme={theme}
        shieldActive={shieldActive}
        setShieldActive={setShieldActive}
      />

      <div style={{ flex: 1, display: "flex", padding: "20px", gap: "20px", overflow: "hidden" }}>
        <div
          style={{
            width: "260px",
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: "18px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <button
            onClick={() => navigate("/app")}
            style={{
              width: "100%",
              height: "52px",
              borderRadius: "14px",
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surfaceAlt,
              color: colors.textPrimary,
              cursor: "pointer",
              fontWeight: 700,
              letterSpacing: "0.4px",
            }}
          >
            Back to Chat
          </button>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            style={{
              width: "100%",
              height: "52px",
              borderRadius: "14px",
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Toggle Theme
          </button>

          <button
            onClick={() => setVault(parseVault(localStorage.getItem("ps_vault")))}
            style={{
              width: "100%",
              height: "52px",
              borderRadius: "14px",
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Refresh Data
          </button>

          <SecurityTicker themeMode={theme} totalValue={totalValue} shieldActive={shieldActive} />
        </div>

        <div
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: "16px",
            boxShadow: `0 0 40px ${colors.glow}`,
            padding: "20px",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <ImpactDashboard themeMode={theme} vaultMap={vault} shieldActive={shieldActive} />

          <div
            style={{
              borderRadius: "14px",
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surfaceAlt,
              padding: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.8px", color: colors.textSecondary }}>
                DATA SOURCE
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600 }}>
                Local Vault Snapshot
              </div>
            </div>
            <div style={{ fontSize: "12px", color: colors.textSecondary }}>
              {Object.keys(vault).length === 0 ? "No vault data yet. Send a message with Shield ON." : "Loaded from localStorage key ps_vault."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

