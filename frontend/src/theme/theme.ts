export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentHover: string;
  accentText: string;
  danger?: string;
  dangerHover?: string;
  dangerText?: string;
  chatUserBg?: string;
  chatUserBorder?: string;
  glow: string;
  info: string;
  inspectionGradient: string;
  inspectionInsetGlow: string;
  chips: {
    danger:    { bg: string; text: string; dot: string };
    warning:   { bg: string; text: string; dot: string };
    success:   { bg: string; text: string; dot: string };
    purple:    { bg: string; text: string; dot: string };
    blue:      { bg: string; text: string; dot: string };
    teal:      { bg: string; text: string; dot: string };
    neutral:   { bg: string; text: string; dot: string };
  };
};

export type ThemeMode = "dark" | "light";

export const theme: Record<ThemeMode, ThemeColors> = {
  dark: {
    background: "#080808",
    surface: "#121212",
    surfaceAlt: "#1A1A1A",
    border: "rgba(255,255,255,0.06)",
    textPrimary: "#E8E6E3",
    textSecondary: "#8A8A8A",
    accent: "#D6CDBF",
    accentHover: "#E7DFD2",
    accentText: "#000000",
    glow: "rgba(214,205,191,0.18)",
    info: "#4D9FFF",
    danger: "#F04444",
    dangerHover: "#DC2626",
    dangerText: "#1A0505",
    chatUserBg: "#161616",
    chatUserBorder: "rgba(255,255,255,0.05)",

    inspectionGradient: `
  conic-gradient(
    from 0deg,
    rgba(214,205,191,0.18),
    rgba(214,205,191,0.05),
    rgba(214,205,191,0.18)
  )
`,

inspectionInsetGlow: `
  inset 0 0 40px rgba(214,205,191,0.15)
`,
    chips: {
      danger:    { bg: "#2D1B1B", text: "#FCA5A5", dot: "#EF4444" },
      warning:   { bg: "#2D261B", text: "#FCD34D", dot: "#F59E0B" },
      success:   { bg: "#1D2D1B", text: "#86EFAC", dot: "#10B981" },
      purple:    { bg: "#1E1B2D", text: "#C4B5FD", dot: "#8B5CF6" },
      blue:      { bg: "#1B242D", text: "#93C5FD", dot: "#3B82F6" },
      teal:      { bg: "#1B2D25", text: "#5EEAD4", dot: "#14B8A6" },
      neutral:   { bg: "#262626", text: "#A3A3A3", dot: "#737373" },
    },
  },

  light: {
    background: "#F4F6F4",
    surface: "#FFFFFF",
    surfaceAlt: "#EDEFF0",
    border: "rgba(0,150,90,0.15)",
    textPrimary: "#1A1A1A",
    textSecondary: "#5A5A5A",
    accent: "#00B36B",
    accentHover: "#00995C",
    accentText: "#FFFFFF",
    glow: "rgba(0,179,107,0.35)",
    info: "#0066CC",
    danger: "#DC2626",
    dangerHover: "#B91C1C",
    dangerText: "#FFFFFF",
    chatUserBg: "#FFFFFF",
    chatUserBorder: "rgba(0,0,0,0.08)",

 inspectionGradient: `
  conic-gradient(
    from 0deg,
    rgba(0,179,107,0.25),
    rgba(0,179,107,0.08),
    rgba(0,179,107,0.25)
  )
`,

inspectionInsetGlow: `
  inset 0 0 40px rgba(0,179,107,0.20)
`,
    chips: {
      danger:    { bg: "#FCEBEB", text: "#A32D2D", dot: "#E24B4A" },
      warning:   { bg: "#FAEEDA", text: "#854F0B", dot: "#BA7517" },
      success:   { bg: "#EAF3DE", text: "#3B6D11", dot: "#639922" },
      purple:    { bg: "#EEEDFE", text: "#3C3489", dot: "#7F77DD" },
      blue:      { bg: "#E6F1FB", text: "#0C447C", dot: "#378ADD" },
      teal:      { bg: "#E1F5EE", text: "#0F6E56", dot: "#1D9E75" },
      neutral:   { bg: "#F1EFE8", text: "#5F5E5A", dot: "#888780" },
    },
  },
};

export const getTheme = (mode: ThemeMode): ThemeColors => theme[mode];

export const getComputedTheme = (
  mode: ThemeMode,
  shieldActive: boolean
): ThemeColors => {
  const base = theme[mode];

  if (shieldActive) return base;

  return {
    ...base,
    accent: base.danger!,
    accentHover: base.dangerHover!,
    accentText: base.dangerText!,
    glow: `${base.danger}40`,
  };
};