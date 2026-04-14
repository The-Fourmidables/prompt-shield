// pages/EnterpriseDashboard.tsx
import { useState } from "react";
import { getTheme } from "../theme/theme";
import EnterpriseNav, { type EnterpriseSection } from "../enterprise/EnterpriseNav";
import OverviewPanel from "../enterprise/OverviewPanel";
import EmployeePanel from "../enterprise/EmployeePanel";
import SecretsVaultPanel from "../enterprise/SecretsVaultPanel";
import AIToolPanel from "../enterprise/AIToolPanel";
import ReportsPanel from "../enterprise/ReportsPanel";
import AdminPanel from "../enterprise/AdminPanel";

type Props = {
  theme: "dark" | "light";
  setTheme: React.Dispatch<React.SetStateAction<"dark" | "light">>;
};

const SECTION_TITLES: Record<EnterpriseSection, string> = {
  overview:  "Overview",
  employees: "Employee Monitor",
  secrets:   "Secrets Vault Analytics",
  aitools:   "AI Tool Monitor",
  reports:   "Compliance Reports",
  admin:     "Admin Controls",
};

export default function EnterpriseDashboard({ theme, setTheme }: Props) {
  const [activeSection, setActiveSection] = useState<EnterpriseSection>("overview");
  const colors = getTheme(theme);

  const renderSection = () => {
    switch (activeSection) {
      case "overview":   return <OverviewPanel theme={theme} />;
      case "employees":  return <EmployeePanel theme={theme} />;
      case "secrets":    return <SecretsVaultPanel theme={theme} />;
      case "aitools":    return <AIToolPanel theme={theme} />;
      case "reports":    return <ReportsPanel theme={theme} />;
      case "admin":      return <AdminPanel theme={theme} />;
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        backgroundColor: colors.background,
        color: colors.textPrimary,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        transition: "background-color 0.6s cubic-bezier(0.4,0,0.2,1), color 0.6s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Top bar */}
      <div style={{
        height: "56px",
        background: `linear-gradient(90deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
        borderBottom: `1px solid ${colors.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: "16px",
        flexShrink: 0,
        boxShadow: `0 2px 20px ${colors.glow}`,
      }}>
        <span style={{ fontSize: "13px", fontWeight: 700, color: colors.accent, letterSpacing: "0.6px", textTransform: "uppercase" }}>
          PromptShield
        </span>
        <span style={{ color: colors.border, fontSize: "16px" }}>›</span>
        <span style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary }}>
          Command Center
        </span>
        <span style={{ color: colors.border, fontSize: "16px" }}>›</span>
        <span style={{ fontSize: "13px", color: colors.textSecondary }}>
          {SECTION_TITLES[activeSection]}
        </span>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{
              width: "7px", height: "7px", borderRadius: "50%",
              background: "#10B981",
              boxShadow: "0 0 6px #10B981",
              animation: "pulse 2s infinite",
            }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#10B981" }}>LIVE</span>
          </div>
          {/* Org badge */}
          <div style={{
            padding: "4px 12px",
            borderRadius: "20px",
            background: `${colors.accent}18`,
            border: `1px solid ${colors.accent}33`,
            fontSize: "12px",
            fontWeight: 700,
            color: colors.accent,
          }}>
            Acme Corp
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div style={{
        flex: 1,
        display: "flex",
        padding: "16px",
        gap: "16px",
        overflow: "hidden",
      }}>
        {/* Nav */}
        <EnterpriseNav
          active={activeSection}
          onSelect={setActiveSection}
          theme={theme}
          setTheme={setTheme}
        />

        {/* Content */}
        <div style={{
          flex: 1,
          background: `linear-gradient(145deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
          border: `1px solid ${colors.border}`,
          borderRadius: "20px",
          padding: "24px",
          overflow: "auto",
          boxShadow: `0 8px 40px rgba(0,0,0,0.25)`,
        }}>
          {renderSection()}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
