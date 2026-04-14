// enterprise/AIToolPanel.tsx — data from ps_vault
// Shows what secret types would be at risk without PromptShield,
// all derived from the real vault. No fake tool usage tables.
import { useMemo } from "react";
import { getTheme } from "../theme/theme";
import { computeVaultStats } from "./useVaultData";
import { Shield, AlertTriangle, Lightbulb, Lock } from "lucide-react";

type Props = { theme: "dark" | "light" };

// Map secret categories to what kind of AI exposure risk they represent
const RISK_MESSAGES: Record<string, { title: string; desc: string }> = {
  Secrets: {
    title: "API Keys & Credentials at Risk",
    desc: "API keys, passwords, tokens, and DB connection strings sent to an LLM without masking can be scraped, logged, and leaked. PromptShield replaced these with safe placeholders.",
  },
  Financial: {
    title: "Financial Data at Risk",
    desc: "Credit card numbers, bank account details, UPI IDs, and PAN/Aadhaar numbers are PCI-DSS and DPDP regulated. Without Shield, these would leave your device unencrypted.",
  },
  Identity: {
    title: "Identity Documents at Risk",
    desc: "Aadhaar, SSN, driving license, and voter ID numbers are sensitive identity documents. Leaking these to an LLM API violates DPDP Act 2023 and GDPR Article 9.",
  },
  Contact: {
    title: "Contact & PII at Risk",
    desc: "Emails, phone numbers, and URLs pinpoint real people. Once sent to a third-party LLM API, GDPR Article 4 requires explicit consent. Shield prevents this automatically.",
  },
  Medical: {
    title: "Medical Data at Risk",
    desc: "Diagnoses, medications, blood types, and patient IDs are HIPAA sensitive (US) and DPDP Sensitive Personal Data (India). Sending these to an LLM without Shield is a compliance violation.",
  },
};

function EmptyState({ colors }: { colors: ReturnType<typeof getTheme> }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "40px" }}>
      <div style={{ color: colors.textSecondary }}><Shield size={44} strokeWidth={1} /></div>
      <div style={{ fontSize: "15px", fontWeight: 700, color: colors.textPrimary }}>No exposure risks detected yet</div>
      <div style={{ fontSize: "13px", color: colors.textSecondary, textAlign: "center", lineHeight: "1.7", maxWidth: "320px" }}>
        As you send prompts, PromptShield will show you exactly what <strong>would have leaked</strong> to the AI if Shield was off.
      </div>
    </div>
  );
}

export default function AIToolPanel({ theme }: Props) {
  const colors = getTheme(theme);
  const stats = useMemo(() => computeVaultStats(), [localStorage.getItem("ps_vault")]);
  const { categoryCounts, totalSecrets, totalRiskScore, riskLevel, shieldActive, hasData, topTypes } = stats;

  const activeCategories = Object.entries(categoryCounts).filter(([, c]) => c > 0);
  const riskColor = riskLevel === "LOW" ? "#10B981" : riskLevel === "MEDIUM" ? "#F59E0B" : "#EF4444";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%", overflow: "auto" }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: "20px", fontWeight: 800, color: colors.textPrimary }}>🤖 AI Exposure Risk Monitor</div>
        <div style={{ fontSize: "13px", color: colors.textSecondary, marginTop: "3px" }}>
          What would have leaked to AI services without PromptShield — based on your real session
        </div>
      </div>

      {/* Shield protection summary */}
      <div style={{
        padding: "16px 20px", borderRadius: "14px",
        background: shieldActive ? "linear-gradient(90deg, #10B98118 0%, #10B98108 100%)" : "linear-gradient(90deg, #EF444418 0%, #EF444408 100%)",
        border: `1px solid ${shieldActive ? "#10B98133" : "#EF444433"}`,
        display: "flex", alignItems: "center", gap: "14px",
      }}>
        <div style={{ color: shieldActive ? "#10B981" : "#EF4444" }}>
          {shieldActive ? <Shield size={28} /> : <AlertTriangle size={28} />}
        </div>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: shieldActive ? "#10B981" : "#EF4444" }}>
            {shieldActive
              ? `Shield protected ${totalSecrets} secret${totalSecrets !== 1 ? "s" : ""} from reaching the LLM`
              : "Shield is OFF — all secrets went to the LLM unmasked"}
          </div>
          <div style={{ fontSize: "12px", color: colors.textSecondary, marginTop: "2px" }}>
            Estimated breach value blocked: <strong style={{ color: colors.textPrimary }}>${totalRiskScore.toLocaleString()}</strong>
            {" · "}Risk level: <strong style={{ color: riskColor }}>{riskLevel}</strong>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div style={{
          flex: 1, background: `linear-gradient(145deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
          border: `1px solid ${colors.border}`, borderRadius: "18px",
        }}>
          <EmptyState colors={colors} />
        </div>
      ) : (
        <>
          {/* Risk category cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {activeCategories.map(([cat, count]) => {
              const info = RISK_MESSAGES[cat];
              const catColors: Record<string, string> = { Financial: "#EC4899", Identity: "#F59E0B", Secrets: "#EF4444", Contact: "#3B82F6", Medical: "#A78BFA" };
              const c = catColors[cat] ?? colors.accent;
              return (
                <div key={cat} style={{
                  background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
                  border: `1px solid ${c}33`, borderRadius: "16px",
                  padding: "18px 20px",
                  display: "flex", gap: "16px", alignItems: "flex-start",
                  boxShadow: `0 4px 20px ${c}10`,
                }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
                    background: `${c}20`, border: `1px solid ${c}33`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: c,
                  }}>
                    <Lock size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 800, color: colors.textPrimary }}>{info?.title ?? cat}</span>
                      <span style={{ padding: "2px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, background: `${c}18`, color: c }}>
                        {count} masked
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: colors.textSecondary, lineHeight: "1.6" }}>
                      {info?.desc ?? `${count} ${cat} secrets were masked before transmission.`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Highest value secrets */}
          <div style={{
            background: `linear-gradient(145deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
            border: `1px solid ${colors.border}`, borderRadius: "18px", padding: "20px",
          }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: colors.textPrimary, marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Lightbulb size={16} color={colors.accent} /> Highest-Value Secrets Protected
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {topTypes.slice(0, 8).map((t) => (
                <div key={t.type} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "8px 12px", borderRadius: "10px",
                  background: `${t.color}08`, border: `1px solid ${t.color}18`,
                }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: "13px", fontWeight: 600, color: colors.textPrimary }}>{t.type}</span>
                  <span style={{ fontSize: "12px", color: colors.textSecondary }}>{t.count}×</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: t.color }}>${t.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
