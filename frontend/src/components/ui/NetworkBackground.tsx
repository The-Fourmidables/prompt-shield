import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Engine } from "tsparticles-engine";
import { theme as themeConfig } from "../../theme/theme";

export default function NetworkBackground({
  theme,
}: {
  theme: "dark" | "light";
}) {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const colors = themeConfig[theme];

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        fullScreen: { enable: false },
        background: { color: colors.background },

        particles: {
          number: { value: 55 },

          color: { value: colors.accent },

          links: {
            enable: true,
            color: colors.accent,
            opacity: 0.56,
            distance: 160,
            width: 1,
          },

          move: {
            enable: true,
            speed: 0.4,
            outModes: { default: "out" },

            attract: {
              enable: true,
              rotateX: 600,
              rotateY: 1200,
            },
          },

          opacity: {
            value: 0.22,
          },

          size: {
            value: { min: 1, max: 2.5 },
          },
        },

        detectRetina: true,
      }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    />
  );
}