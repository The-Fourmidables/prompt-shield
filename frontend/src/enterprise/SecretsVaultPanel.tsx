// enterprise/SecretsVaultPanel.tsx — all data from ps_vault
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getTheme } from "../theme/theme";
import { computeVaultStats } from "./useVaultData";
import { BarChart2, Search as SearchIcon, DollarSign, Check, Ban } from "lucide-react";

type Props = { theme: "dark" | "light" };

const CATEGORY_COLORS: Record<string, string> = {
  Financial: "#EC4899",
  Identity: "#F59E0B",
  Secrets: "#EF4444",
  Contact: "#3B82F6",
  Medical: "#A78BFA",
};

function EmptyState({ colors }: { colors: ReturnType<typeof getTheme> }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "40px" }}>
      <div style={{ color: colors.textSecondary }}><BarChart2 size={44} strokeWidth={1} /></div>
      <div style={{ fontSize: "15px", fontWeight: 700, color: colors.textPrimary }}>No secrets detected yet</div>
      <div style={{ fontSize: "13px", color: colors.textSecondary, textAlign: "center", lineHeight: "1.7", maxWidth: "320px" }}>
        Charts will populate automatically as you send prompts with Shield ON in the Chat.
      </div>
    </div>
  );
}

export default function SecretsVaultPanel({ theme }: Props) {
  const colors = getTheme(theme);
  const stats = useMemo(() => computeVaultStats(), [localStorage.getItem("ps_vault")]);
  const { topTypes, categoryCounts, totalSecrets, totalRiskScore, hasData } = stats;

  const axisFontStyle = { fill: colors.textSecondary, fontSize: 11 };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: colors.surface, border: `1px solid ${colors.border}`,
        borderRadius: "10px", padding: "10px 14px",
        boxShadow: `0 4px 24px ${colors.glow}`,
      }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: colors.textSecondary, marginBottom: "6px" }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ fontSize: "13px", fontWeight: 700, color: p.color ?? colors.accent }}>
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  };

  // Type chart data sorted by count
  const typeChartData = topTypes.map((t) => ({
    name: t.type,
    count: t.count,
    score: t.score,
    color: t.color,
  }));

  // Category chart data
  const catChartData = Object.entries(categoryCounts)
    .filter(([, c]) => c > 0)
    .map(([cat, count]) => ({ name: cat, count, color: CATEGORY_COLORS[cat] ?? colors.accent }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%", overflow: "auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: colors.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
            <SearchIcon size={22} /> Secrets Vault Analytics
          </div>
          <div style={{ fontSize: "13px", color: colors.textSecondary, marginTop: "3px" }}>
            Real-time breakdown of secrets detected in your session
          </div>
        </div>
        {hasData && (
          <div style={{
            padding: "6px 14px", borderRadius: "20px",
            background: "#10B98120", border: "1px solid #10B98133",
            fontSize: "13px", fontWeight: 800, color: "#10B981",
          }}>
            {totalSecrets} masked · ${totalRiskScore.toLocaleString()} protected
          </div>
        )}
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
          {/* Bar chart — secret type counts */}
          <div style={{
            background: `linear-gradient(145deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
            border: `1px solid ${colors.border}`, borderRadius: "18px",
            padding: "22px 20px 14px", boxShadow: `0 4px 24px ${colors.glow}`,
          }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: colors.textPrimary, marginBottom: "18px" }}>
              Secret Types Caught — by count
            </div>
            <ResponsiveContainer width="100%" height={Math.max(160, typeChartData.length * 36)}>
              <BarChart data={typeChartData} layout="vertical" margin={{ top: 0, right: 30, left: 90, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} horizontal={false} />
                <XAxis type="number" tick={axisFontStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={axisFontStyle} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Count" radius={[0, 6, 6, 0]}>
                  {typeChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category bar chart */}
          {catChartData.length > 0 && (
            <div style={{
              background: `linear-gradient(145deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
              border: `1px solid ${colors.border}`, borderRadius: "18px",
              padding: "22px 20px 14px", boxShadow: `0 4px 24px ${colors.glow}`,
            }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: colors.textPrimary, marginBottom: "18px" }}>
                Compliance Category Breakdown
              </div>
              <ResponsiveContainer width="100%" height={Math.max(140, catChartData.length * 40)}>
                <BarChart data={catChartData} layout="vertical" margin={{ top: 0, right: 30, left: 80, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} horizontal={false} />
                  <XAxis type="number" tick={axisFontStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={axisFontStyle} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Count" radius={[0, 6, 6, 0]}>
                    {catChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Risk score breakdown */}
          <div style={{
            background: `linear-gradient(145deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
            border: `1px solid ${colors.border}`, borderRadius: "18px",
            padding: "20px", boxShadow: `0 4px 24px ${colors.glow}`,
          }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: colors.textPrimary, marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
              <DollarSign size={16} /> Risk Score per Type <span style={{ color: colors.textSecondary, fontWeight: 500 }}>(estimated breach value protected)</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {topTypes.map((t) => {
                const pct = totalRiskScore > 0 ? (t.score / totalRiskScore) * 100 : 0;
                return (
                  <div key={t.type}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, color: colors.textPrimary }}>{t.type} <span style={{ color: colors.textSecondary }}>×{t.count}</span></span>
                      <span style={{ fontWeight: 700, color: t.color }}>${t.score.toLocaleString()}</span>
                    </div>
                    <div style={{ height: "6px", borderRadius: "6px", background: colors.border, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: t.color, borderRadius: "6px", transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privacy transparency */}
          <div style={{
            padding: "16px 20px", borderRadius: "16px",
            background: `linear-gradient(90deg, ${colors.accent}10 0%, ${colors.accent}05 100%)`,
            border: `1px solid ${colors.accent}22`,
            display: "flex", gap: "28px", flexWrap: "wrap",
          }}>
            <div style={{ flex: 1, minWidth: "180px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#10B981", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                <Check size={14} strokeWidth={3} /> What We Store
              </div>
              {["Secret type (e.g. EMAIL, API_KEY)", "Placeholder token", "Risk score value"].map((x) => (
                <div key={x} style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: "3px" }}>• {x}</div>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: "180px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#EF4444", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                <Ban size={14} strokeWidth={2.5}/> Never Sent to LLM
              </div>
              {["Actual secret value", "Email address", "API key string", "Any personal data"].map((x) => (
                <div key={x} style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: "3px" }}>• {x}</div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
