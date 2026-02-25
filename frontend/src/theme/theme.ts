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
  inspectionGradient: string;
  inspectionInsetGlow: string;
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