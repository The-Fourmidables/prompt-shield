import React, { useState } from "react";

export default function Sidebar({
  theme,
  setTheme,
  activeMapping,
  setActiveMapping,
  inspectionMode,
  setInspectionMode,
  colors,
}: {
  theme: "dark" | "light";
  setTheme: React.Dispatch<React.SetStateAction<"dark" | "light">>;
  activeMapping: boolean;
  setActiveMapping: React.Dispatch<React.SetStateAction<boolean>>;
  inspectionMode: boolean;
  setInspectionMode: React.Dispatch<React.SetStateAction<boolean>>;
  colors: any;
}) {

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
              left: "70px",
              top: "50%",
              transform: "translateY(-50%)",
              backgroundColor: colors.surfaceAlt,
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
              padding: "8px 14px",
              borderRadius: "10px",
              fontSize: "13px",
              whiteSpace: "nowrap",
              boxShadow: `0 8px 24px rgba(0,0,0,0.4)`,
              animation: "fadeIn 0.15s ease",
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
    borderRadius: "14px",
    border: `1px solid ${active ? colors.accent : colors.border}`,
    backgroundColor: active ? colors.surfaceAlt : colors.surface,
    color: active ? colors.accent : colors.textPrimary,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: collapsed ? "center" : "flex-start",
    padding: collapsed ? "0" : "0 16px",
    gap: "12px",
    transition: "all 0.2s ease",
    boxShadow: active ? `0 0 12px ${colors.accent}40` : "none",
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
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: "18px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        transition: "width 0.25s ease",
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
            onClick={() => setActiveMapping(!activeMapping)}
            style={buttonStyle(activeMapping)}
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