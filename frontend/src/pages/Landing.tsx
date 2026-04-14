import { useEffect, useRef, useState } from "react";
import NetworkBackground from "../components/ui/NetworkBackground";
import { getPalette, getTheme, PALETTES, type PaletteName } from "../theme/theme";
import { Shield } from "lucide-react";

type AppMode = "solo" | "enterprise";

interface LandingProps {
  startApp: (mode: AppMode) => void;
}

export default function Landing({ startApp }: LandingProps) {
  const currentTheme = getTheme("dark");
  const currentPalette = getPalette();
  const startRef = useRef<HTMLButtonElement>(null);
  const [mode, setMode] = useState<AppMode>(() => {
    const saved = localStorage.getItem("ps_mode");
    return saved === "enterprise" ? "enterprise" : "solo";
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      startRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        position: "relative",
        backgroundColor: currentTheme.background,
        color: currentTheme.textPrimary,
        overflow: "hidden",
      }}
    >
      <style>
        {`
        @keyframes psAuroraMove {
          0% { transform: translate3d(-6%, -4%, 0) scale(1.05); opacity: 0.50; }
          50% { transform: translate3d(4%, 3%, 0) scale(1.12); opacity: 0.72; }
          100% { transform: translate3d(-6%, -4%, 0) scale(1.05); opacity: 0.50; }
        }

        @keyframes psLogoFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
          100% { transform: translateY(0px); }
        }

        @keyframes psRingSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes psShimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        button:focus {
          outline: 2px solid ${currentTheme.glow};
          outline-offset: 4px;
        }
        `}
      </style>

      <div style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
        <NetworkBackground theme="dark" />
      </div>

      <div
        style={{
          position: "absolute",
          inset: "-20%",
          pointerEvents: "none",
          zIndex: 1,
          filter: "blur(40px)",
          animation: "psAuroraMove 12s ease-in-out infinite",
          background: `
            radial-gradient(60% 60% at 20% 20%, ${currentTheme.glow}, transparent 60%),
            radial-gradient(45% 45% at 80% 35%, rgba(59,130,246,0.25), transparent 60%),
            radial-gradient(55% 55% at 55% 85%, rgba(29,78,216,0.20), transparent 60%)
          `,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            height: "76px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            borderBottom: `1px solid ${currentTheme.border}`,
            background: `linear-gradient(180deg, ${currentTheme.background} 0%, ${currentTheme.background}CC 100%)`,
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: `linear-gradient(180deg, ${currentTheme.surfaceAlt} 0%, ${currentTheme.surface} 100%)`,
                border: `1px solid ${currentTheme.accent}66`,
                boxShadow: `0 18px 56px ${currentTheme.glow}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                animation: "psLogoFloat 2.6s ease-in-out infinite",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: "-2px",
                  borderRadius: "14px",
                  background: `conic-gradient(from 180deg, transparent 0deg, ${currentTheme.accent}66 80deg, transparent 160deg, ${currentTheme.accent}44 240deg, transparent 360deg)`,
                  filter: "blur(0px)",
                  animation: "psRingSpin 4.8s linear infinite",
                  opacity: 0.9,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "1px",
                  borderRadius: "11px",
                  background: `linear-gradient(180deg, ${currentTheme.surfaceAlt} 0%, ${currentTheme.surface} 100%)`,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              />
              <div style={{ position: "relative", zIndex: 1 }}>
                <Shield size={19} strokeWidth={2.4} color={currentTheme.accent} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "0.4px" }}>
                Prompt Shield
              </div>
              <div style={{ fontSize: "12px", color: currentTheme.textSecondary }}>
                Enterprise prompt redaction
              </div>
            </div>
          </div>
          <div style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.6px", color: currentTheme.textSecondary }}>
            v3.4.2
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "28px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "940px",
              borderRadius: "24px",
              border: `1px solid ${currentTheme.border}`,
              background: `linear-gradient(180deg, ${currentTheme.surface} 0%, ${currentTheme.surfaceAlt} 180%)`,
              boxShadow: `0 30px 120px rgba(0,0,0,0.45)`,
              padding: "28px",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "-1px",
                borderRadius: "24px",
                pointerEvents: "none",
                opacity: 0.65,
                background: `
                  radial-gradient(60% 60% at 10% 0%, ${currentTheme.glow}, transparent 55%),
                  radial-gradient(55% 55% at 90% 20%, rgba(59,130,246,0.18), transparent 60%),
                  radial-gradient(65% 65% at 40% 110%, rgba(29,78,216,0.14), transparent 60%)
                `,
                filter: "blur(18px)",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center", marginTop: "18px" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "fit-content",
                    padding: "5px 10px",
                    borderRadius: "999px",
                    border: `1px solid ${currentTheme.accent}66`,
                    background: `${currentTheme.accent}12`,
                    color: currentTheme.textPrimary,
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.3px",
                  }}
                >
                  Secure-by-design masking
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%) translateY(10px)",
                    fontSize: "26px",
                    fontWeight: 950,
                    letterSpacing: "3.4px",
                    backgroundImage: `linear-gradient(90deg, ${currentTheme.accentHover}, ${currentTheme.accent}, rgba(226,232,240,0.85))`,
                    backgroundSize: "200% 200%",
                    animation: "psShimmer 5s ease-in-out infinite",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  PROMPT SHIELD
                </div>
              </div>

              <div
                style={{
                  fontSize: "18px",
                  lineHeight: "1.08",
                  fontWeight: 800,
                  letterSpacing: "-0.2px",
                  marginTop: "18px",
                }}
              >
                <span
                  style={{
                    backgroundImage: `linear-gradient(90deg, ${currentTheme.textPrimary}, rgba(226,232,240,0.82), ${currentTheme.textPrimary})`,
                    backgroundSize: "200% 200%",
                    animation: "psShimmer 7s ease-in-out infinite",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Protect secrets before they reach the model.
                </span>
              </div>

              <div
                style={{
                  fontSize: "16px",
                  lineHeight: "1.7",
                  color: currentTheme.textSecondary,
                  maxWidth: "680px",
                }}
              >
                Prompt Shield detects and masks API keys, credentials, PII/PHI, internal URLs, and connection strings —
                then safely rehydrates responses for a clean user experience.
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "14px",
                  marginTop: "12px",
                }}
              >
                {/* ── Mode Toggle ── */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: "999px",
                    border: `1px solid ${currentTheme.border}`,
                    background: `linear-gradient(180deg, ${currentTheme.surface} 0%, ${currentTheme.surfaceAlt} 160%)`,
                    padding: "4px",
                    gap: "2px",
                    boxShadow: `0 4px 20px rgba(0,0,0,0.25)`,
                  }}
                >
                  {(["solo", "enterprise"] as AppMode[]).map((m) => {
                    const isActive = mode === m;
                    return (
                      <button
                        key={m}
                        onClick={() => {
                          setMode(m);
                          localStorage.setItem("ps_mode", m);
                        }}
                        style={{
                          height: "36px",
                          padding: "0 20px",
                          borderRadius: "999px",
                          border: "none",
                          background: isActive
                            ? `linear-gradient(135deg, ${currentTheme.accent}, ${currentTheme.accentHover})`
                            : "transparent",
                          color: isActive ? currentTheme.accentText : currentTheme.textSecondary,
                          cursor: "pointer",
                          fontWeight: 700,
                          fontSize: "13px",
                          letterSpacing: "0.3px",
                          transition: "all 0.25s ease",
                          boxShadow: isActive ? `0 4px 16px ${currentTheme.glow}` : "none",
                          display: "flex", alignItems: "center", gap: "6px",
                        }}
                      >
                        {m === "solo" ? "👤 Solo" : "🏢 Enterprise"}
                      </button>
                    );
                  })}
                </div>

                <div style={{ fontSize: "11px", color: currentTheme.textSecondary, textAlign: "center", lineHeight: "1.5" }}>
                  {mode === "solo"
                    ? "Personal privacy mode — mask your own prompts"
                    : "AI Governance Console — org-wide monitoring & compliance"}
                </div>

                <button
                  ref={startRef}
                  onClick={() => startApp(mode)}
                  style={{
                    height: "46px",
                    padding: "0 32px",
                    borderRadius: "14px",
                    border: `1px solid ${currentTheme.accent}88`,
                    background: `linear-gradient(180deg, ${currentTheme.accent} 0%, ${currentTheme.accentHover} 100%)`,
                    color: currentTheme.accentText,
                    cursor: "pointer",
                    fontWeight: 700,
                    letterSpacing: "0.2px",
                    fontSize: "15px",
                    boxShadow: `0 16px 44px ${currentTheme.glow}`,
                  }}
                >
                  {mode === "solo" ? "Launch Solo →" : "Launch Enterprise →"}
                </button>

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "7px 12px",
                    borderRadius: "999px",
                    border: `1px solid ${currentTheme.border}`,
                    background: `linear-gradient(180deg, ${currentTheme.surface} 0%, ${currentTheme.surfaceAlt} 160%)`,
                    color: currentTheme.textSecondary,
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  No data stored by default
                </div>

                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "1.2px", color: currentTheme.textSecondary }}>
                    THEME PRESETS
                  </div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                    {(Object.entries(PALETTES) as [PaletteName, (typeof PALETTES)[PaletteName]][]).map(([id, p]) => {
                      const isActive = id === currentPalette;
                      return (
                        <button
                          key={id}
                          onClick={() => {
                            try {
                              window.localStorage.setItem("ps_palette", id);
                            } catch {
                              window.location.reload();
                              return;
                            }
                            window.location.reload();
                          }}
                          style={{
                            height: "34px",
                            padding: "0 12px 0 10px",
                            borderRadius: "999px",
                            border: `1px solid ${isActive ? `${currentTheme.accent}AA` : currentTheme.border}`,
                            background: `linear-gradient(180deg, ${currentTheme.surface} 0%, ${currentTheme.surfaceAlt} 160%)`,
                            color: currentTheme.textPrimary,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "12px",
                            fontWeight: 700,
                            letterSpacing: "0.2px",
                            boxShadow: isActive ? `0 18px 50px ${currentTheme.glow}` : "none",
                          }}
                        >
                          <span
                            style={{
                              width: "10px",
                              height: "10px",
                              borderRadius: "999px",
                              background: p.dark.accent,
                              boxShadow: `0 0 0 3px ${p.dark.glow}`,
                            }}
                          />
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ height: "22px" }} />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "14px" }}>
              {[
                { title: "Masking Pipeline", desc: "Deterministic masking for secrets + PII/PHI before transmission." },
                { title: "AI View", desc: "Inspect exactly what the model receives, with placeholders highlighted." },
                { title: "Vault Rehydration", desc: "Restore outputs safely using local mappings — clean, readable replies." },
              ].map((card) => (
                <div
                  key={card.title}
                  style={{
                    borderRadius: "18px",
                    border: `1px solid ${currentTheme.border}`,
                    background: `linear-gradient(180deg, ${currentTheme.surface} 0%, ${currentTheme.surfaceAlt} 160%)`,
                    padding: "16px",
                    boxShadow: `0 16px 50px rgba(0,0,0,0.25)`,
                  }}
                >
                  <div style={{ fontSize: "13px", fontWeight: 800, letterSpacing: "0.2px" }}>
                    {card.title}
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "13px", lineHeight: "1.65", color: currentTheme.textSecondary }}>
                    {card.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
