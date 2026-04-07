import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ThemeColors } from "../../theme/theme";

export default function Sidebar({
  theme,
  setTheme,
  rightPanelStack,
  setRightPanelStack,
  inspectionMode,
  setInspectionMode,
  colors,
}: {
  theme: "dark" | "light";
  setTheme: React.Dispatch<React.SetStateAction<"dark" | "light">>;
  rightPanelStack: ("pipeline" | "vault")[];
  setRightPanelStack: React.Dispatch<
    React.SetStateAction<("pipeline" | "vault")[]>
  >;
  inspectionMode: boolean;
  setInspectionMode: React.Dispatch<React.SetStateAction<boolean>>;
  colors: ThemeColors;
}) {
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(true);

  /* ---------------- Tooltip Component ---------------- */

  const Tooltip = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => {
    const [hovered, setHovered] = useState(false);

    return (
      <div
        style={{ position: "relative", display: "flex" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {children}

        {hovered && collapsed && (
          <div
            style={{
              position: "absolute",
              left: "72px",
              top: "50%",
              transform: "translateY(-50%) translateX(4px)",
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
              padding: "10px 16px",
              borderRadius: "12px",
              fontSize: "13px",
              whiteSpace: "nowrap",
              boxShadow: `
        0 10px 30px ${colors.glow},
        inset 0 0 0 1px ${colors.border}
      `,
              transition: "all 0.15s ease",
              opacity: hovered ? 1 : 0,
              zIndex: 1000,
            }}
          >
            {label}
          </div>
        )}

      </div>
    );
  };

  /* ---------------- Button Style ---------------- */

  const buttonStyle = (active?: boolean): React.CSSProperties => ({
    width: "100%",
    height: "60px",
    borderRadius: "16px",
    border: `1px solid ${active ? colors.accent : colors.border}`,
    background: active
      ? `linear-gradient(180deg, ${colors.surfaceAlt} 0%, ${colors.surface} 100%)`
      : `linear-gradient(180deg, ${colors.surface} 0%, ${colors.surface} 100%)`,
    color: active ? colors.accent : colors.textPrimary,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: collapsed ? "center" : "flex-start",
    padding: collapsed ? "0" : "0 16px",
    gap: "12px",
    transition: "all 0.2s ease",
    boxShadow: active ? `0 14px 40px ${colors.glow}` : "none",
  });

  const iconStyle: React.CSSProperties = {
    width: "18px",
    height: "18px",
    stroke: "currentColor",
    strokeWidth: 2,
    fill: "none",
  };

  return (
    <div
      style={{
        width: collapsed ? "80px" : "220px",
        background: `linear-gradient(180deg, ${colors.surface} 0%, ${colors.surfaceAlt} 140%)`,
        border: `1px solid ${colors.border}`,
        borderRadius: "20px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        transition: "width 0.25s ease",
        boxShadow: `0 18px 60px ${colors.glow}`,
      }}
    >
      {/* Collapse */}
      <Tooltip label="Toggle Sidebar">
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            ...buttonStyle(),
            justifyContent: "center",
            padding: "0",
          }}
        >
          <svg viewBox="0 0 24 24" style={iconStyle}>
            {collapsed ? (
              <path d="M8 4l8 8-8 8" />
            ) : (
              <path d="M16 4l-8 8 8 8" />
            )}
          </svg>
        </button>
      </Tooltip>

      {/* Inspection Mode */}
      <Tooltip label="Inspection Mode">
        <button
          onClick={() => setInspectionMode(prev => !prev)}
          style={buttonStyle(inspectionMode)}
        >
          <svg viewBox="0 0 24 24" style={iconStyle}>
            <path d="M1 12s4-6 11-6 11 6 11 6-4 6-11 6S1 12 1 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {!collapsed && <span>Inspection Mode</span>}
        </button>
      </Tooltip>

      {/* Entity Map */}
      <Tooltip label="Active Mappings">
        <button
          onClick={() =>
            setRightPanelStack(prev =>
              prev.includes("vault")
                ? prev.filter(i => i !== "vault")
                : [...prev, "vault"]
            )
          }
          style={buttonStyle(rightPanelStack.includes("vault"))}
        >
          <svg viewBox="0 0 24 24" style={iconStyle}>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          {!collapsed && <span>Active vault Mappings</span>}
        </button>
      </Tooltip>

      <Tooltip label="Processing Pipeline">
        <button
          onClick={() =>
            setRightPanelStack(prev =>
              prev.includes("pipeline")
                ? prev.filter(i => i !== "pipeline")
                : [...prev, "pipeline"]
            )
          }
          style={buttonStyle(rightPanelStack.includes("pipeline"))}
        >
          <svg viewBox="0 0 24 24" style={iconStyle}>
            <path d="M4 6h16M4 12h10M4 18h6" />
          </svg>

          {!collapsed && <span>Pipeline</span>}
        </button>
      </Tooltip>

      <Tooltip label="Impact Dashboard">
        <button
          onClick={() => navigate("/dashboard")}
          style={buttonStyle(false)}
        >
          <svg viewBox="0 0 24 24" style={iconStyle}>
            <path d="M4 19V5" />
            <path d="M8 17V9" />
            <path d="M12 15V7" />
            <path d="M16 17V11" />
            <path d="M20 15V9" />
          </svg>
          {!collapsed && <span>Impact</span>}
        </button>
      </Tooltip>

      {/* Theme */}
      <Tooltip label="Appearance">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          style={buttonStyle()}
        >
          <svg viewBox="0 0 24 24" style={iconStyle}>
            {theme === "dark" ? (
              <path d="M21 12.79A9 9 0 0111.21 3 
                7 7 0 1021 12.79z" />
            ) : (
              <>
                <circle cx="12" cy="12" r="4" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
                <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
                <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
                <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
              </>
            )}
          </svg>
          {!collapsed && <span>Appearance</span>}
        </button>
      </Tooltip>
    </div>
  );
}
