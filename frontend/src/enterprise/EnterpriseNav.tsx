// enterprise/EnterpriseNav.tsx
import { useNavigate, useLocation } from "react-router-dom";
import { getTheme } from "../theme/theme";

import { Activity, Users, Search, Bot, FileText, Settings, Shield, Moon, Sun, ArrowLeft } from "lucide-react";

export type EnterpriseSection =
  | "overview"
  | "employees"
  | "secrets"
  | "aitools"
  | "reports"
  | "admin";

const NAV_ITEMS: { id: EnterpriseSection; label: string; icon: React.ReactNode }[] = [
  { id: "overview",   label: "Overview",            icon: <Activity size={18} /> },
  { id: "employees",  label: "Session Profile",      icon: <Users size={18} /> },
  { id: "secrets",    label: "Secrets Analytics",    icon: <Search size={18} /> },
  { id: "aitools",    label: "Exposure Monitor",     icon: <Bot size={18} /> },
  { id: "reports",    label: "Compliance Reports",   icon: <FileText size={18} /> },
  { id: "admin",      label: "Admin Controls",       icon: <Settings size={18} /> },
];

type Props = {
  active: EnterpriseSection;
  onSelect: (s: EnterpriseSection) => void;
  theme: "dark" | "light";
  setTheme: React.Dispatch<React.SetStateAction<"dark" | "light">>;
};

export default function EnterpriseNav({ active, onSelect, theme, setTheme }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const colors = getTheme(theme);

  return (
    <div
      style={{
        width: "240px",
        flexShrink: 0,
        background: `linear-gradient(180deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
        border: `1px solid ${colors.border}`,
        borderRadius: "20px",
        padding: "20px 14px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        boxShadow: `0 8px 40px ${colors.glow}`,
        overflowY: "auto",
      }}
    >
      {/* Brand */}
      <div style={{ padding: "4px 10px 18px", borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", boxShadow: `0 4px 16px ${colors.glow}`,
              color: "#fff"
            }}
          >
            <Shield size={20} />
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 800, letterSpacing: "0.3px", color: colors.textPrimary }}>
              PromptShield
            </div>
            <div style={{ fontSize: "10px", fontWeight: 600, color: colors.accent, letterSpacing: "0.6px", textTransform: "uppercase" }}>
              Command Center
            </div>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", paddingTop: "10px" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "12px",
                border: isActive ? `1px solid ${colors.accent}33` : "1px solid transparent",
                background: isActive
                  ? `linear-gradient(90deg, ${colors.accent}18 0%, ${colors.accent}08 100%)`
                  : "transparent",
                color: isActive ? colors.accent : colors.textSecondary,
                cursor: "pointer",
                fontWeight: isActive ? 700 : 500,
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                textAlign: "left",
                transition: "all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = `${colors.accent}0D`;
                  (e.currentTarget as HTMLButtonElement).style.color = colors.textPrimary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = colors.textSecondary;
                }
              }}
            >
              <span style={{ fontSize: "16px", minWidth: "20px", textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Footer controls */}
      <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          style={{
            width: "100%", padding: "9px 12px", borderRadius: "10px",
            border: `1px solid ${colors.border}`,
            background: "transparent",
            color: colors.textSecondary,
            cursor: "pointer", fontSize: "12px", fontWeight: 600,
            display: "flex", alignItems: "center", gap: "8px",
          }}
        >
          {theme === "dark" ? <Sun size={15}/> : <Moon size={15} />} {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          onClick={() => {
            if (location.state?.fromApp) navigate(-1);
            else navigate("/app");
          }}
          style={{
            width: "100%", padding: "9px 12px", borderRadius: "10px",
            border: `1px solid ${colors.border}`,
            background: "transparent",
            color: colors.textSecondary,
            cursor: "pointer", fontSize: "12px", fontWeight: 600,
            display: "flex", alignItems: "center", gap: "8px",
          }}
        >
          <ArrowLeft size={15} /> Back to Chat
        </button>
      </div>
    </div>
  );
}
