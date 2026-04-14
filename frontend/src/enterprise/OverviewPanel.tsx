// enterprise/OverviewPanel.tsx — all data from ps_vault
import { useMemo } from "react";
import { getTheme } from "../theme/theme";
import { computeVaultStats } from "./useVaultData";
import { Lock, Shield, ShieldAlert, CheckCircle, AlertTriangle, Info } from "lucide-react";

type Props = { theme: "dark" | "light" };

function StatCard({ label, value, sub, accent, colors }: {
  label: string; value: string | number; sub?: string;
  accent: string; colors: ReturnType<typeof getTheme>;
}) {
  return (
    <div style={{
      flex: 1, minWidth: "140px",
      background: `linear-gradient(145deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
      border: `1px solid ${colors.border}`,
      borderRadius: "16px", padding: "20px 18px",
      boxShadow: `0 4px 24px ${colors.glow}`,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${accent}, transparent)`, borderRadius: "16px 16px 0 0" }} />
      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.8px", color: colors.textSecondary, textTransform: "uppercase", marginBottom: "10px" }}>{label}</div>
      <div style={{ fontSize: "30px", fontWeight: 800, color: colors.textPrimary, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: "12px", color: colors.textSecondary, marginTop: "6px" }}>{sub}</div>}
    </div>
  );
}

function EmptyState({ colors }: { colors: ReturnType<typeof getTheme> }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px", padding: "32px" }}>
      <div style={{ color: colors.textSecondary }}><Lock size={48} strokeWidth={1} /></div>
      <div style={{ fontSize: "16px", fontWeight: 700, color: colors.textPrimary }}>No session data yet</div>
      <div style={{ fontSize: "13px", color: colors.textSecondary, textAlign: "center", lineHeight: "1.7", maxWidth: "320px" }}>
        Go to the <strong style={{ color: colors.accent }}>Chat</strong> and send a message containing secrets —
        emails, API keys, passwords, Aadhaar, PAN, etc. — with Shield ON.
        All masked data will appear here instantly.
      </div>
    </div>
  );
}

export default function OverviewPanel({ theme }: Props) {
  const colors = getTheme(theme);
  const stats = useMemo(() => computeVaultStats(), [localStorage.getItem("ps_vault")]);
  const { totalSecrets, totalRiskScore, riskLevel, shieldActive, hasData, topTypes, categoryCounts } = stats;

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good Morning" : now.getHours() < 17 ? "Good Afternoon" : "Good Evening";

  const riskColor = riskLevel === "LOW" ? "#10B981" : riskLevel === "MEDIUM" ? "#F59E0B" : "#EF4444";
  const riskBg = riskLevel === "LOW" ? "#10B98120" : riskLevel === "MEDIUM" ? "#F59E0B20" : "#EF444420";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%", overflow: "auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: colors.textPrimary }}>
            {greeting}, <span style={{ color: colors.accent }}>Command Center</span>
          </div>
          <div style={{ fontSize: "13px", color: colors.textSecondary, marginTop: "3px" }}>
            All data below is from your real chat session · {now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          padding: "4px 12px", borderRadius: "20px",
          background: shieldActive ? "#10B98120" : "#EF444420",
          border: `1px solid ${shieldActive ? "#10B98144" : "#EF444444"}`,
          color: shieldActive ? "#10B981" : "#EF4444",
          fontSize: "12px", fontWeight: 700,
        }}>
          {shieldActive ? <><Shield size={14} /> Shield ON</> : <><ShieldAlert size={14} /> Shield OFF</>}
        </span>
      </div>

      {/* KPI cards */}
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
        <StatCard label="Secrets Caught" value={totalSecrets} sub="real secrets masked this session" accent={colors.accent} colors={colors} />
        <StatCard label="Risk Score" value={`$${totalRiskScore.toLocaleString()}`} sub="estimated data breach value" accent="#A78BFA" colors={colors} />
        <StatCard
          label="Risk Level"
          value={riskLevel}
          sub={riskLevel === "LOW" ? "you're protected" : riskLevel === "MEDIUM" ? "some sensitive data" : "high-value secrets found"}
          accent={riskColor}
          colors={colors}
        />
        <StatCard label="Secret Types" value={topTypes.length} sub={topTypes.slice(0, 3).map(t => t.type).join(", ") || "none yet"} accent="#10B981" colors={colors} />
      </div>

      {!hasData ? (
        <div style={{
          flex: 1,
          background: `linear-gradient(145deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
          border: `1px solid ${colors.border}`, borderRadius: "18px",
        }}>
          <EmptyState colors={colors} />
        </div>
      ) : (
        <div style={{ display: "flex", gap: "16px", flex: 1, minHeight: 0, flexWrap: "wrap" }}>

          {/* Compliance Categories */}
          <div style={{
            flex: 1, minWidth: "220px",
            background: `linear-gradient(145deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
            border: `1px solid ${colors.border}`, borderRadius: "18px", padding: "20px",
            display: "flex", flexDirection: "column", gap: "14px",
          }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: colors.textPrimary }}>📂 Compliance Categories</div>
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const pct = totalSecrets > 0 ? (count / totalSecrets) * 100 : 0;
              const catColors: Record<string, string> = {
                Financial: "#EC4899", Identity: "#F59E0B",
                Secrets: "#EF4444", Contact: "#3B82F6", Medical: "#A78BFA",
              };
              const c = catColors[cat] ?? colors.accent;
              return (
                <div key={cat}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px" }}>
                    <span style={{ fontWeight: 600, color: colors.textPrimary }}>{cat}</span>
                    <span style={{ fontWeight: 700, color: c }}>{count}</span>
                  </div>
                  <div style={{ height: "6px", borderRadius: "6px", background: colors.border, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: c, borderRadius: "6px", transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Risk summary */}
          <div style={{
            flex: 1, minWidth: "220px",
            background: `linear-gradient(145deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
            border: `1px solid ${colors.border}`, borderRadius: "18px", padding: "20px",
            display: "flex", flexDirection: "column", gap: "14px",
          }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: colors.textPrimary }}>⚠️ Risk Breakdown</div>

            <div style={{
              padding: "14px 16px", borderRadius: "12px",
              background: riskBg, border: `1px solid ${riskColor}44`,
              display: "flex", alignItems: "center", gap: "12px",
            }}>
              <div style={{ color: riskColor }}>
                {riskLevel === "LOW" ? <CheckCircle size={28} /> : riskLevel === "MEDIUM" ? <Info size={28} /> : <AlertTriangle size={28} />}
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: riskColor }}>{riskLevel} RISK</div>
                <div style={{ fontSize: "12px", color: colors.textSecondary, marginTop: "2px" }}>
                  {totalSecrets} secret{totalSecrets !== 1 ? "s" : ""} masked · estimated ${totalRiskScore.toLocaleString()} breach value protected
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {topTypes.slice(0, 6).map((t) => (
                <div key={t.type} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px", borderRadius: "10px",
                  background: `${t.color}10`, border: `1px solid ${t.color}22`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: t.color }} />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary }}>{t.type}</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: t.color }}>{t.count}×</span>
                    <span style={{ fontSize: "11px", color: colors.textSecondary }}>${t.score.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
