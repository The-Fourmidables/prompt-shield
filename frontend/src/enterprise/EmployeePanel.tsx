// enterprise/EmployeePanel.tsx — all data from ps_vault
// In a single-user setup, "Employee Monitor" shows your own session profile.
// No hardcoded fake employees.
import { useMemo } from "react";
import { getTheme } from "../theme/theme";
import { computeVaultStats } from "./useVaultData";
import { User, Lock, UserCircle } from "lucide-react";

type Props = { theme: "dark" | "light" };

function EmptyState({ colors }: { colors: ReturnType<typeof getTheme> }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "40px" }}>
      <div style={{ color: colors.textSecondary }}><User size={44} strokeWidth={1} /></div>
      <div style={{ fontSize: "15px", fontWeight: 700, color: colors.textPrimary }}>No session data yet</div>
      <div style={{ fontSize: "13px", color: colors.textSecondary, textAlign: "center", lineHeight: "1.7", maxWidth: "300px" }}>
        Send prompts with Shield ON in the Chat. Your secrets profile will build up here automatically.
      </div>
    </div>
  );
}

export default function EmployeePanel({ theme }: Props) {
  const colors = getTheme(theme);
  const stats = useMemo(() => computeVaultStats(), [localStorage.getItem("ps_vault")]);
  const { entries, totalSecrets, totalRiskScore, categoryCounts, riskLevel, shieldActive, hasData } = stats;

  const riskColor = riskLevel === "LOW" ? "#10B981" : riskLevel === "MEDIUM" ? "#F59E0B" : "#EF4444";

  // Group entries by category for the table view
  const byCategory: Record<string, typeof entries> = {};
  for (const e of entries) {
    if (!byCategory[e.category]) byCategory[e.category] = [];
    byCategory[e.category].push(e);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%", overflow: "auto" }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: "20px", fontWeight: 800, color: colors.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
          <UserCircle size={22} /> Your Session Profile
        </div>
        <div style={{ fontSize: "13px", color: colors.textSecondary, marginTop: "3px" }}>
          A full breakdown of every secret masked in your chat session — derived from your real vault
        </div>
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
        <>
          {/* Profile summary card */}
          <div style={{
            background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
            border: `1px solid ${colors.border}`,
            borderRadius: "18px", padding: "20px",
            display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center",
            boxShadow: `0 4px 24px ${colors.glow}`,
          }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: `linear-gradient(135deg, ${colors.accent}44, ${colors.accent}22)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: colors.accent, border: `2px solid ${colors.accent}33`, flexShrink: 0,
            }}>
              <User size={26} />
            </div>
            <div style={{ flex: 1, minWidth: "160px" }}>
              <div style={{ fontSize: "16px", fontWeight: 800, color: colors.textPrimary }}>Current Session</div>
              <div style={{ fontSize: "12px", color: colors.textSecondary, marginTop: "2px" }}>
                Shield {shieldActive ? "ON" : "OFF"} · {totalSecrets} secrets masked · ${totalRiskScore.toLocaleString()} protected
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {[
                { label: "Total Masked",   val: totalSecrets,                    color: colors.accent },
                { label: "Risk Score",      val: `$${totalRiskScore.toLocaleString()}`, color: "#A78BFA" },
                { label: "Risk Level",      val: riskLevel,                        color: riskColor },
                { label: "Shield",         val: shieldActive ? "ON" : "OFF",     color: shieldActive ? "#10B981" : "#EF4444" },
              ].map((s) => (
                <div key={s.label} style={{
                  padding: "10px 14px", borderRadius: "12px",
                  background: `${s.color}10`, border: `1px solid ${s.color}22`,
                  textAlign: "center", minWidth: "80px",
                }}>
                  <div style={{ fontSize: "11px", color: colors.textSecondary, fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: s.color, marginTop: "2px" }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Category breakdown */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {Object.entries(categoryCounts)
              .filter(([, c]) => c > 0)
              .map(([cat, count]) => {
                const catColors: Record<string, string> = { Financial: "#EC4899", Identity: "#F59E0B", Secrets: "#EF4444", Contact: "#3B82F6", Medical: "#A78BFA" };
                const c = catColors[cat] ?? colors.accent;
                return (
                  <div key={cat} style={{
                    padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
                    background: `${c}18`, border: `1px solid ${c}33`, color: c,
                  }}>
                    {count} {cat}
                  </div>
                );
              })}
          </div>

          {/* Full masked secrets table */}
          <div style={{
            background: `linear-gradient(145deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
            border: `1px solid ${colors.border}`, borderRadius: "18px",
            overflow: "hidden", flex: 1, overflowY: "auto",
          }}>
            <div style={{ padding: "16px 18px", borderBottom: `1px solid ${colors.border}`, fontSize: "14px", fontWeight: 700, color: colors.textPrimary, display: "flex", alignItems: "center", gap: "6px" }}>
              <Lock size={16} /> All Masked Secrets ({totalSecrets})
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: `${colors.accent}08`, borderBottom: `1px solid ${colors.border}` }}>
                  {["Placeholder", "Type", "Category", "Risk Score", "Original Value (masked)"].map((h) => (
                    <th key={h} style={{
                      padding: "10px 14px", textAlign: "left",
                      fontSize: "11px", fontWeight: 700, letterSpacing: "0.7px",
                      color: colors.textSecondary, textTransform: "uppercase",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const TYPE_COLORS: Record<string, string> = {
                    Email: "#3B82F6", Phone: "#A78BFA", Name: "#10B981",
                    APIKey: "#EF4444", Password: "#DC2626", Aadhaar: "#F59E0B",
                    PAN: "#F59E0B", CreditCard: "#EC4899", JWTToken: "#8B5CF6",
                    IPAddress: "#84CC16", URL: "#84CC16", PostgresConn: "#06B6D4",
                  };
                  const catColors: Record<string, string> = { Financial: "#EC4899", Identity: "#F59E0B", Secrets: "#EF4444", Contact: "#3B82F6", Medical: "#A78BFA" };
                  const tc = TYPE_COLORS[e.prefix] ?? colors.accent;
                  const cc = catColors[e.category] ?? colors.accent;
                  // Show original partially masked for privacy in the dashboard itself
                  const displayOriginal =
                    e.original.length > 20
                      ? `${e.original.slice(0, 6)}${"•".repeat(8)}${e.original.slice(-4)}`
                      : `${e.original.slice(0, 2)}${"•".repeat(Math.max(0, e.original.length - 2))}`;

                  return (
                    <tr key={e.placeholder} style={{ borderBottom: `1px solid ${colors.border}` }}
                      onMouseEnter={(ev) => { (ev.currentTarget as HTMLTableRowElement).style.background = `${colors.accent}05`; }}
                      onMouseLeave={(ev) => { (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                    >
                      <td style={{ padding: "10px 14px" }}>
                        <code style={{
                          fontSize: "12px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px",
                          background: `${tc}18`, color: tc, border: `1px solid ${tc}22`,
                        }}>
                          {e.placeholder}
                        </code>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: "13px", fontWeight: 600, color: tc }}>{e.prefix}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
                          background: `${cc}18`, color: cc,
                        }}>
                          {e.category}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: "13px", fontWeight: 700, color: colors.textPrimary }}>
                        ${e.riskScore.toLocaleString()}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: "12px", color: colors.textSecondary, fontFamily: "monospace" }}>
                        {displayOriginal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
