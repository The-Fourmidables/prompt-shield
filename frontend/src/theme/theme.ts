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
    background: "#070B13",
    surface: "#0B1220",
    surfaceAlt: "#0F1A2E",
    border: "rgba(148,163,184,0.16)",
    textPrimary: "#EAF0FF",
    textSecondary: "rgba(226,232,240,0.72)",
    accent: "#3B82F6",
    accentHover: "#60A5FA",
    accentText: "#07101F",
    glow: "rgba(59,130,246,0.28)",
    danger: "#F04444",
    dangerHover: "#DC2626",
    dangerText: "#1A0505",
    chatUserBg: "#0B1220",
    chatUserBorder: "rgba(148,163,184,0.14)",

    inspectionGradient: `
  conic-gradient(
    from 0deg,
    rgba(59,130,246,0.22),
    rgba(59,130,246,0.06),
    rgba(59,130,246,0.22)
  )
`,

inspectionInsetGlow: `
  inset 0 0 40px rgba(59,130,246,0.18)
`,
  },

  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceAlt: "#F1F5F9",
    border: "rgba(15,23,42,0.10)",
    textPrimary: "#0B1220",
    textSecondary: "rgba(15,23,42,0.72)",
    accent: "#2563EB",
    accentHover: "#1D4ED8",
    accentText: "#FFFFFF",
    glow: "rgba(37,99,235,0.20)",
    danger: "#DC2626",
    dangerHover: "#B91C1C",
    dangerText: "#FFFFFF",
    chatUserBg: "#FFFFFF",
    chatUserBorder: "rgba(15,23,42,0.10)",

 inspectionGradient: `
  conic-gradient(
    from 0deg,
    rgba(37,99,235,0.22),
    rgba(37,99,235,0.08),
    rgba(37,99,235,0.22)
  )
`,

inspectionInsetGlow: `
  inset 0 0 40px rgba(37,99,235,0.16)
`,
  },
};

export type PaletteName = "ocean" | "purple" | "emerald" | "cyan" | "amber" | "rose";

export const PALETTES: Record<
  PaletteName,
  {
    label: string;
    dark: { accent: string; accentHover: string; glow: string };
    light: { accent: string; accentHover: string; glow: string };
  }
> = {
  ocean: {
    label: "Ocean Blue",
    dark: { accent: "#3B82F6", accentHover: "#60A5FA", glow: "rgba(59,130,246,0.28)" },
    light: { accent: "#2563EB", accentHover: "#1D4ED8", glow: "rgba(37,99,235,0.20)" },
  },
  purple: {
    label: "Royal Purple",
    dark: { accent: "#A78BFA", accentHover: "#C4B5FD", glow: "rgba(167,139,250,0.26)" },
    light: { accent: "#7C3AED", accentHover: "#6D28D9", glow: "rgba(124,58,237,0.22)" },
  },
  emerald: {
    label: "Emerald",
    dark: { accent: "#34D399", accentHover: "#6EE7B7", glow: "rgba(52,211,153,0.24)" },
    light: { accent: "#10B981", accentHover: "#059669", glow: "rgba(16,185,129,0.22)" },
  },
  cyan: {
    label: "Cyan",
    dark: { accent: "#22D3EE", accentHover: "#67E8F9", glow: "rgba(34,211,238,0.22)" },
    light: { accent: "#06B6D4", accentHover: "#0891B2", glow: "rgba(6,182,212,0.22)" },
  },
  amber: {
    label: "Amber",
    dark: { accent: "#FBBF24", accentHover: "#FCD34D", glow: "rgba(251,191,36,0.22)" },
    light: { accent: "#F59E0B", accentHover: "#D97706", glow: "rgba(245,158,11,0.22)" },
  },
  rose: {
    label: "Rose",
    dark: { accent: "#FB7185", accentHover: "#FDA4AF", glow: "rgba(251,113,133,0.22)" },
    light: { accent: "#F43F5E", accentHover: "#E11D48", glow: "rgba(244,63,94,0.20)" },
  },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hexToRgb(hex: string) {
  const cleaned = hex.replace("#", "").trim();
  if (cleaned.length !== 6) return null;
  const r = Number.parseInt(cleaned.slice(0, 2), 16);
  const g = Number.parseInt(cleaned.slice(2, 4), 16);
  const b = Number.parseInt(cleaned.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
}

function rgba(hex: string, alpha: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const a = clamp(alpha, 0, 1);
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
}

export function getPalette(): PaletteName {
  if (typeof window === "undefined") return "ocean";
  try {
    const raw = window.localStorage.getItem("ps_palette");
    if (!raw) return "ocean";
    if (raw in PALETTES) return raw as PaletteName;
    return "ocean";
  } catch {
    return "ocean";
  }
}

export function applyPalette(base: ThemeColors, mode: ThemeMode, paletteName: PaletteName): ThemeColors {
  const p = PALETTES[paletteName][mode];
  const accent = p.accent;
  const insetAlpha = mode === "dark" ? 0.18 : 0.16;
  return {
    ...base,
    accent,
    accentHover: p.accentHover,
    glow: p.glow,
    inspectionGradient: `
  conic-gradient(
    from 0deg,
    ${rgba(accent, 0.22)},
    ${rgba(accent, mode === "dark" ? 0.06 : 0.08)},
    ${rgba(accent, 0.22)}
  )
`,
    inspectionInsetGlow: `
  inset 0 0 40px ${rgba(accent, insetAlpha)}
`,
  };
}

export const getTheme = (mode: ThemeMode): ThemeColors =>
  applyPalette(theme[mode], mode, getPalette());

export const getComputedTheme = (
  mode: ThemeMode,
  shieldActive: boolean
): ThemeColors => {
  const base = getTheme(mode);

  if (shieldActive) return base;

  return {
    ...base,
    accent: base.danger!,
    accentHover: base.dangerHover!,
    accentText: base.dangerText!,
    glow: `${base.danger}40`,
  };
};
