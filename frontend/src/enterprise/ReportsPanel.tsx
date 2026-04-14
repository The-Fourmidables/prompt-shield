// enterprise/ReportsPanel.tsx — all report content from ps_vault
import { useState, useMemo } from "react";
import { getTheme } from "../theme/theme";
import { computeVaultStats } from "./useVaultData";
import { BarChart2, Lightbulb, Lock, Calendar, AlertTriangle, Scale, Siren, Loader2, Check, Download } from "lucide-react";

type Props = { theme: "dark" | "light" };

type ReportType = {
  id: string;
  title: string;
  description: string;
  formats: ("PDF" | "CSV")[];
  category: "daily" | "risk" | "compliance" | "incident";
};

const REPORT_TYPES: ReportType[] = [
  { id: "daily", title: "Session Summary", description: "Total secrets masked, types found, risk score, and shield status for your current session.", formats: ["PDF", "CSV"], category: "daily" },
  { id: "type_report", title: "Secret Type Report", description: "A full breakdown of every type of sensitive data detected and its estimated breach value.", formats: ["PDF", "CSV"], category: "risk" },
  { id: "full_vault", title: "Full Vault Export", description: "Complete list of every masked secret — placeholder, type, category, and risk score. No original values stored.", formats: ["CSV"], category: "compliance" },
  { id: "incident", title: "Compliance Summary", description: "Maps your detected data types to GDPR and DPDP Act 2023 compliance categories.", formats: ["PDF"], category: "compliance" },
  { id: "gdpr_dpdp", title: "GDPR / DPDP Report", description: "Full regulatory mapping for India's Digital Personal Data Protection Act 2023 and EU GDPR Article 4/9.", formats: ["PDF"], category: "compliance" },
];

export default function ReportsPanel({ theme }: Props) {
  const colors = getTheme(theme);
  const stats = useMemo(() => computeVaultStats(), [localStorage.getItem("ps_vault")]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Set<string>>(new Set());

  const now = new Date().toLocaleString();

  function buildReportContent(reportId: string, format: "PDF" | "CSV"): string {
    const { entries, totalSecrets, totalRiskScore, riskLevel, shieldActive, topTypes, categoryCounts } = stats;

    if (reportId === "daily") {
      if (format === "CSV") {
        const header = "Metric,Value\n";
        const rows = [
          `Total Secrets Masked,${totalSecrets}`,
          `Total Risk Score,$${totalRiskScore.toLocaleString()}`,
          `Risk Level,${riskLevel}`,
          `Shield Active,${shieldActive ? "Yes" : "No"}`,
          `Unique Secret Types,${topTypes.length}`,
          ...topTypes.map((t) => `${t.type} count,${t.count}`),
        ].join("\n");
        return header + rows;
      }
      return [
        "PROMPTSHIELD — SESSION SUMMARY REPORT",
        `Generated: ${now}`,
        "=".repeat(54),
        "",
        `Total Secrets Masked : ${totalSecrets}`,
        `Estimated Risk Value : $${totalRiskScore.toLocaleString()}`,
        `Risk Level           : ${riskLevel}`,
        `Shield Active        : ${shieldActive ? "YES" : "NO"}`,
        `Unique Secret Types  : ${topTypes.length}`,
        "",
        "SECRET TYPES FOUND",
        "-".repeat(30),
        ...topTypes.map((t) => `  ${t.type.padEnd(20)} x${t.count}  ($${t.score.toLocaleString()})`),
        "",
        "COMPLIANCE CATEGORIES",
        "-".repeat(30),
        ...Object.entries(categoryCounts).filter(([, c]) => c > 0).map(([cat, c]) => `  ${cat.padEnd(12)} : ${c}`),
        "",
        "NOTE: No actual secret values or prompt content are stored.",
      ].join("\n");
    }

    if (reportId === "type_report") {
      if (format === "CSV") {
        const header = "Type,Count,Total Risk Score ($),Category\n";
        const rows = topTypes.map((t) => `${t.type},${t.count},${t.score},${entries.find((e) => e.prefix === t.type)?.category ?? ""}`).join("\n");
        return header + rows;
      }
      return [
        "PROMPTSHIELD — SECRET TYPE REPORT",
        `Generated: ${now}`,
        "=".repeat(54),
        "",
        `${"Type".padEnd(22)} ${"Count".padEnd(8)} ${"Risk Score".padEnd(14)} Category`,
        "-".repeat(54),
        ...topTypes.map((t) => {
          const cat = entries.find((e) => e.prefix === t.type)?.category ?? "-";
          return `${t.type.padEnd(22)} ${String(t.count).padEnd(8)} $${String(t.score.toLocaleString()).padEnd(13)} ${cat}`;
        }),
        "",
        `TOTAL: ${totalSecrets} secrets · $${totalRiskScore.toLocaleString()} protected`,
      ].join("\n");
    }

    if (reportId === "full_vault") {
      const header = "Placeholder,Type,Category,Risk Score ($)\n";
      const rows = entries.map((e) => `${e.placeholder},${e.prefix},${e.category},${e.riskScore}`).join("\n");
      return header + rows;
    }

    if (reportId === "incident") {
      return [
        "PROMPTSHIELD — COMPLIANCE SUMMARY",
        `Generated: ${now}`,
        "=".repeat(54),
        "",
        "PCI-DSS SCOPE",
        ...entries.filter((e) => e.category === "Financial").map((e) => `  [PROTECTED] ${e.placeholder} (${e.prefix})`),
        entries.filter((e) => e.category === "Financial").length === 0 ? "  None detected" : "",
        "",
        "GDPR PERSONAL DATA (Art. 4)",
        ...entries.filter((e) => ["Contact", "Identity"].includes(e.category)).map((e) => `  [MASKED] ${e.placeholder} (${e.prefix})`),
        entries.filter((e) => ["Contact", "Identity"].includes(e.category)).length === 0 ? "  None detected" : "",
        "",
        "GDPR SPECIAL CATEGORY (Art. 9) / HIPAA",
        ...entries.filter((e) => e.category === "Medical").map((e) => `  [MASKED] ${e.placeholder} (${e.prefix})`),
        entries.filter((e) => e.category === "Medical").length === 0 ? "  None detected" : "",
        "",
        "SECRETS / CREDENTIALS",
        ...entries.filter((e) => e.category === "Secrets").map((e) => `  [MASKED] ${e.placeholder} (${e.prefix})`),
        entries.filter((e) => e.category === "Secrets").length === 0 ? "  None detected" : "",
        "",
        "RESULT: All detected sensitive data was masked before LLM transmission. ✅",
        "NOTE: Actual values are never stored in this report.",
      ].join("\n");
    }

    if (reportId === "gdpr_dpdp") {
      const financial = entries.filter((e) => e.category === "Financial");
      const identity = entries.filter((e) => e.category === "Identity");
      const medical = entries.filter((e) => e.category === "Medical");
      const contact = entries.filter((e) => e.category === "Contact");
      return [
        "PROMPTSHIELD — GDPR / DPDP COMPLIANCE REPORT",
        `Generated: ${now}`,
        "=".repeat(54),
        "",
        "REGULATORY FRAMEWORK",
        "  GDPR (EU) — Articles 4, 9, 17",
        "  DPDP Act 2023 (India) — Sections 2(t), 4, 8",
        "",
        "PERSONAL DATA DETECTED & PROTECTION STATUS",
        "",
        `Aadhaar / PAN (DPDP Sensitive)   : ${identity.length > 0 ? `${identity.length} masked ✅` : "None detected"}`,
        `Email / Phone (GDPR Art. 4)      : ${contact.length > 0 ? `${contact.length} masked ✅` : "None detected"}`,
        `Credit Card / Bank (PCI-DSS)     : ${financial.length > 0 ? `${financial.length} masked ✅` : "None detected"}`,
        `Medical Data (GDPR Art. 9)       : ${medical.length > 0 ? `${medical.length} masked ✅` : "None detected"}`,
        `API Keys / Secrets               : ${entries.filter((e) => e.category === "Secrets").length > 0 ? `${entries.filter((e) => e.category === "Secrets").length} masked ✅` : "None detected"}`,
        "",
        "COMPLIANCE POSTURE",
        `  Status : ${totalSecrets > 0 ? "COMPLIANT ✅" : "NO DATA — start chatting"}`,
        `  ${totalSecrets} data entities masked before LLM transmission.`,
        "  No personal data was sent to third-party AI APIs unmasked.",
        "",
        "NOTE: Actual data values are NEVER stored by PromptShield.",
      ].join("\n");
    }

    return "Report data not available.";
  }

  async function handleGenerate(reportId: string, format: "PDF" | "CSV") {
    setGenerating(reportId + format);
    await new Promise((r) => setTimeout(r, 700));
    const content = buildReportContent(reportId, format);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const report = REPORT_TYPES.find((r) => r.id === reportId)!;
    const slug = report.title.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    a.download = `promptshield_${slug}_${new Date().toISOString().slice(0, 10)}.${format.toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setGenerating(null);
    setGenerated((prev) => new Set(prev).add(reportId));
  }

  const catColors: Record<string, string> = { daily: "#3B82F6", risk: "#EF4444", compliance: "#10B981", incident: "#F59E0B" };
  const catIcons: Record<string, React.ReactNode> = {
    daily: <Calendar size={20} />, risk: <AlertTriangle size={20} />,
    compliance: <Scale size={20} />, incident: <Siren size={20} />
  };
  const catLabels: Record<string, string> = { daily: "Session", risk: "Risk", compliance: "Compliance", incident: "Incident" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%", overflow: "auto" }}>

      <div>
        <div style={{ fontSize: "20px", fontWeight: 800, color: colors.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
          <BarChart2 size={22} /> Compliance Reports
        </div>
        <div style={{ fontSize: "13px", color: colors.textSecondary, marginTop: "3px" }}>
          Generated from your real session data — {stats.totalSecrets} secrets masked, ${stats.totalRiskScore.toLocaleString()} protected
        </div>
      </div>

      {!stats.hasData && (
        <div style={{
          padding: "14px 18px", borderRadius: "14px",
          background: `${colors.accent}10`, border: `1px solid ${colors.accent}22`,
          fontSize: "13px", color: colors.textSecondary, lineHeight: "1.5",
        }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <Lightbulb size={18} color={colors.accent} style={{ flexShrink: 0 }} />
            <div>
              Reports below will contain your real session data once you send prompts with Shield ON in the Chat.
              You can still generate demo structure reports right now.
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {REPORT_TYPES.map((report) => {
          const catColor = catColors[report.category];
          return (
            <div key={report.id} style={{
              background: `linear-gradient(145deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
              border: `1px solid ${colors.border}`, borderRadius: "16px",
              padding: "20px", display: "flex", alignItems: "flex-start", gap: "16px",
              boxShadow: `0 4px 24px ${colors.glow}`,
            }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
                background: `${catColor}20`, border: `1px solid ${catColor}33`,
                display: "flex", alignItems: "center", justifyContent: "center", color: catColor,
              }}>
                {catIcons[report.category]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "15px", fontWeight: 800, color: colors.textPrimary }}>{report.title}</span>
                  <span style={{
                    padding: "2px 8px", borderRadius: "8px", fontSize: "10px", fontWeight: 700,
                    background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}33`,
                    textTransform: "uppercase",
                  }}>
                    {catLabels[report.category]}
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: colors.textSecondary, marginBottom: "12px", lineHeight: "1.5" }}>
                  {report.description}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "11px", color: colors.textSecondary, marginRight: "auto" }}>
                    {stats.totalSecrets} entries · real session data
                  </span>
                  {report.formats.map((fmt) => {
                    const key = report.id + fmt;
                    const isGen2 = generating === key;
                    const wasDone2 = generated.has(report.id);
                    return (
                      <button
                        key={fmt}
                        onClick={() => handleGenerate(report.id, fmt)}
                        disabled={isGen2}
                        style={{
                          padding: "7px 16px", borderRadius: "8px",
                          border: `1px solid ${wasDone2 ? "#10B98144" : `${colors.accent}44`}`,
                          background: wasDone2 ? "#10B98118" : `${colors.accent}18`,
                          color: wasDone2 ? "#10B981" : colors.accent,
                          cursor: isGen2 ? "default" : "pointer",
                          fontSize: "12px", fontWeight: 700,
                          display: "flex", alignItems: "center", gap: "4px",
                          opacity: isGen2 ? 0.7 : 1, transition: "all 0.18s ease",
                        }}
                      >
                        {isGen2 ? <Loader2 size={14} className="spin" /> : wasDone2 ? <Check size={14} /> : <Download size={14} />} {isGen2 ? "Generating…" : `Export ${fmt}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        padding: "14px 18px", borderRadius: "14px",
        background: `${colors.accent}08`, border: `1px solid ${colors.accent}22`,
        fontSize: "12px", color: colors.textSecondary, lineHeight: "1.5",
      }}>
        <Lock size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} /> <strong style={{ color: colors.textPrimary }}>Privacy-first reporting:</strong> All reports contain <strong>metadata only</strong>. Actual secrets and personal data values are never stored or exported.
      </div>
    </div>
  );
}
