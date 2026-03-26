import { useEffect, useRef } from "react";
import NetworkBackground from "../components/ui/NetworkBackground";
import { theme } from "../theme/theme";

interface LandingProps {
  startApp: () => void;
}

export default function Landing({ startApp }: LandingProps) {
  const currentTheme = theme.dark;
  const startRef = useRef<HTMLButtonElement>(null);

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
        @keyframes rotateDisk {
          from { transform: rotate(0deg) scaleY(0.65); }
          to { transform: rotate(360deg) scaleY(0.65); }
        }

        button:focus {
          outline: 2px solid ${currentTheme.glow};
          outline-offset: 4px;
        }
        `}
      </style>

      <NetworkBackground theme="dark" />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "600px",
            height: "600px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Plasma Disk */}
          <div
            style={{
              position: "absolute",
              width: "600px",
              height: "600px",
              borderRadius: "50%",
              background: `
                radial-gradient(circle at 40% 60%, ${currentTheme.glow}, transparent 60%),
                radial-gradient(circle at 65% 40%, ${currentTheme.glow}, transparent 65%),
                conic-gradient(
                  from 0deg,
                  transparent 0deg,
                  ${currentTheme.glow} 80deg,
                  transparent 160deg,
                  ${currentTheme.glow} 240deg,
                  transparent 320deg
                )
              `,
              animation: "rotateDisk 14s linear infinite",
              filter: "blur(60px)",
              opacity: 0.85,
            }}
          />

          {/* Event Horizon Core */}
          <div
            style={{
              width: "300px",
              height: "260px",
              borderRadius: "50%",
              transform: "scaleX(1.08)",
              background: "#000",
              boxShadow: `
                inset 0 0 40px rgba(0,0,0,1),
                inset 0 0 80px rgba(0,0,0,0.9),
                0 0 40px ${currentTheme.glow}
              `,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "20px",
              zIndex: 3,
            }}
          >
            {/* Inner Plasma Rim */}
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: `
                  radial-gradient(circle at center,
                    transparent 55%,
                    ${currentTheme.glow} 65%,
                    ${currentTheme.glow} 75%,
                    transparent 85%
                  )
                `,
                filter: "blur(8px)",
                opacity: 0.8,
              }}
            />

            <h1
              style={{
                margin: 0,
                fontSize: "26px",
                letterSpacing: "3px",
                color: currentTheme.textPrimary,
                textAlign: "center",
                zIndex: 2,
              }}
            >
              PROMPT SHIELD
            </h1>

            <button
              ref={startRef}
              onClick={startApp}
              style={{
                padding: "10px 28px",
                fontSize: "15px",
                backgroundColor: currentTheme.accent,
                color: currentTheme.accentText,
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
                zIndex: 2,
              }}
            >
              START
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}