import { useMemo } from "react";
import { theme as themeConfig } from "../../theme/theme";

interface Props {
  themeMode: "dark" | "light";
  vaultMap?: Record<string, string>;
  shieldActive: boolean;
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

export default function ImpactDashboard({
  themeMode,
  vaultMap,
  shieldActive,
}: Props) {
  const colors = themeConfig[themeMode];

  const stats = useMemo(() => {
    if (!vaultMap) return { total: 0, count: 0, categories: { Financial: 0, Identity: 0, Secrets: 0, Contact: 0 } };

    let total = 0;
    const categories: Record<string, number> = {
      Financial: 0,
      Identity: 0,
      Secrets: 0,
      Contact: 0,
    };

    Object.keys(vaultMap).forEach((key) => {
      const typeMatch = key.match(/<([A-Za-z]+)(?:_?\d+)?>/);
      const type = typeMatch ? typeMatch[1] : "PII";

      const value = SCORE_MAP[type] ?? 50;
      total += value;

      if (["CreditCard", "RuPayCard", "BankAccount", "UPI", "UPITxnID", "PAN", "IFSC"].includes(type)) {
        categories.Financial += 1;
      } else if (["Aadhaar", "SSN", "DOB", "Gender", "MRN", "PatientID"].includes(type)) {
        categories.Identity += 1;
      } else if (/(Key|Secret|Token|Conn)/.test(type)) {
        categories.Secrets += 1;
      } else {
        categories.Contact += 1;
      }
    });

    return { total, count: Object.keys(vaultMap).length, categories };
  }, [vaultMap]);

  return (
    <div
      style={{
        borderRadius: "16px",
        border: `1px solid ${shieldActive ? colors.border : colors.danger}`,
        padding: "24px",
        backgroundColor: colors.surfaceAlt,
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        boxShadow: `0 8px 32px ${shieldActive ? colors.glow : `${colors.danger}22`}`,
        animation: "slideIn 0.4s ease-out",
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: colors.textPrimary }}>
          🛡️ Privacy Impact Dashboard
        </h3>
        <span style={{ fontSize: "11px", color: shieldActive ? colors.accent : colors.danger, fontWeight: 600, letterSpacing: "1px" }}>
          {shieldActive ? "REAL-TIME PROTECTION" : "SHIELD OFF"}
        </span>
      </header>

      {/* Main Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={{ 
          padding: "16px", 
          borderRadius: "12px", 
          backgroundColor: colors.surface, 
          border: `1px solid ${shieldActive ? colors.border : colors.danger}` 
        }}>
          <div style={{ fontSize: "11px", color: colors.textSecondary, marginBottom: "4px" }}>
            RISK MITIGATED (EST.)
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: shieldActive ? colors.accent : colors.danger }}>
            ${stats.total.toLocaleString()}
          </div>
        </div>

        <div style={{ 
          padding: "16px", 
          borderRadius: "12px", 
          backgroundColor: colors.surface, 
          border: `1px solid ${shieldActive ? colors.border : colors.danger}` 
        }}>
          <div style={{ fontSize: "11px", color: colors.textSecondary, marginBottom: "4px" }}>
            ENTITIES PROTECTED
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: colors.textPrimary }}>
            {stats.count}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: colors.textSecondary }}>
          Compliance Categories Blocked
        </div>
        
        {Object.entries(stats.categories).map(([name, count]) => {
          const percentage = stats.count > 0 ? ((count as number) / stats.count) * 100 : 0;
          return (
            <div key={name} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <span>{name}</span>
                <span style={{ fontWeight: 700 }}>{count as number}</span>
              </div>
              <div style={{ 
                height: "6px", 
                width: "100%", 
                backgroundColor: colors.surface, 
                borderRadius: "3px", 
                overflow: "hidden" 
              }}>
                <div style={{ 
                  height: "100%", 
                  width: `${percentage}%`, 
                  backgroundColor: shieldActive ? colors.accent : colors.danger, 
                  transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)" 
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <footer style={{ 
        marginTop: "8px", 
        paddingTop: "16px", 
        borderTop: `1px solid ${colors.border}`,
        fontSize: "11px",
        color: colors.textSecondary,
        fontStyle: "italic",
        textAlign: "center"
      }}>
        "Shielding your data from LLM leaks, one token at a time."
      </footer>

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
