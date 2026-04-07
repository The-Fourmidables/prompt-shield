import { useEffect, useRef } from "react";
import { getTheme } from "../../theme/theme";

const PII_DATA = [
  { raw: "john.doe@gmail.com", placeholder: "<EMAIL_1>" },
  { raw: "sarah.connor@skynet.ai", placeholder: "<EMAIL_2>" },
  { raw: "admin@internal.local", placeholder: "<EMAIL_3>" },
  { raw: "api_key=sk-239skd92ks", placeholder: "<API_KEY_1>" },
  { raw: "token=ghp_82ksl29dksl", placeholder: "<TOKEN_1>" },
  { raw: "access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", placeholder: "<JWT_1>" },
  { raw: "4111 1111 1111 1111", placeholder: "<CARD_1>" },
  { raw: "5500 0000 0000 0004", placeholder: "<CARD_2>" },
  { raw: "+1-202-555-0148", placeholder: "<PHONE_1>" },
  { raw: "+44 7700 900123", placeholder: "<PHONE_2>" },
  { raw: "192.168.0.24", placeholder: "<IP_1>" },
  { raw: "10.0.0.45", placeholder: "<IP_2>" },
  { raw: 'password="hunter2"', placeholder: "<PASSWORD_1>" },
  { raw: 'db_pass="prod@2024!"', placeholder: "<PASSWORD_2>" },
  { raw: "AWS_SECRET=AKIAIOSFODNN7EXAMPLE", placeholder: "<AWS_SECRET_1>" },
  { raw: "stripe_sk_live_4eC39HqLyjWDarjtT1zdp7dc", placeholder: "<STRIPE_KEY_1>" },
];

export default function NetworkBackground({
  theme,
}: {
  theme: "dark" | "light";
}) {
  const colors = getTheme(theme);

  const containerRef = useRef<HTMLDivElement>(null);
  const shieldRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);

  const SHIELD_RADIUS = 180;
  const ENTITY_RADIUS = 70;

  // Balanced speed
  const SPEED = 0.45;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const items = PII_DATA.map((data) => {
      const el = document.createElement("div");
      el.innerText = data.raw;
      el.style.position = "absolute";
      el.style.left = `${Math.random() * width}px`;
      el.style.top = `${Math.random() * height}px`;
      el.style.transform = "translate(-50%, -50%)";
      el.style.fontFamily = "monospace";
      el.style.fontSize = "14px";
      el.style.letterSpacing = "0.5px";
      el.style.color = colors.textSecondary;
      el.style.opacity = "0.25";
      el.style.transition =
        "opacity 0.2s ease, color 0.2s ease, transform 0.2s ease";
      el.dataset.raw = data.raw;
      el.dataset.placeholder = data.placeholder;

      container.appendChild(el);
      itemsRef.current.push(el);

      const angle = Math.random() * Math.PI * 2;

      return {
        el,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * SPEED,
        vy: Math.sin(angle) * SPEED,
      };
    });

    let cursorX = -1000;
    let cursorY = -1000;
    let shieldX = -1000;
    let shieldY = -1000;

    const handleMove = (e: MouseEvent) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
    };

    window.addEventListener("mousemove", handleMove);

    const animate = () => {
      shieldX += (cursorX - shieldX) * 0.15;
      shieldY += (cursorY - shieldY) * 0.15;

      if (shieldRef.current) {
        shieldRef.current.style.left = `${shieldX - SHIELD_RADIUS}px`;
        shieldRef.current.style.top = `${shieldY - SHIELD_RADIUS}px`;
      }

      // Move entities
      items.forEach((item) => {
        item.x += item.vx;
        item.y += item.vy;

        // Wall bounce
        if (item.x <= 0 || item.x >= width) item.vx *= -1;
        if (item.y <= 0 || item.y >= height) item.vy *= -1;

        item.el.style.left = `${item.x}px`;
        item.el.style.top = `${item.y}px`;
      });

      // Proper elastic collision (velocity swap)
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i];
          const b = items[j];

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < ENTITY_RADIUS) {
            // swap velocities
            const tempVx = a.vx;
            const tempVy = a.vy;

            a.vx = b.vx;
            a.vy = b.vy;

            b.vx = tempVx;
            b.vy = tempVy;
          }
        }
      }

      // Shield masking logic (unchanged)
      items.forEach((item) => {
        const dx = shieldX - item.x;
        const dy = shieldY - item.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < SHIELD_RADIUS) {
          item.el.innerText = item.el.dataset.placeholder || "";
          item.el.style.color = colors.accent;
          item.el.style.opacity = "1";
          item.el.style.transform =
            "translate(-50%, -50%) scale(1.05)";
        } else {
          item.el.innerText = item.el.dataset.raw || "";
          item.el.style.color = colors.textSecondary;
          item.el.style.opacity = "0.25";
          item.el.style.transform =
            "translate(-50%, -50%) scale(1)";
        }
      });

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      itemsRef.current.forEach((el) => el.remove());
      itemsRef.current = [];
    };
  }, [colors]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: colors.background,
        zIndex: 1,
      }}
    >
      <div
        ref={shieldRef}
        style={{
          position: "fixed",
          width: SHIELD_RADIUS * 2,
          height: SHIELD_RADIUS * 2,
          borderRadius: "50%",
          pointerEvents: "none",
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          zIndex: 2,
        }}
      />
    </div>
  );
}

// import { useCallback } from "react";
// import Particles from "react-tsparticles";
// import { loadSlim } from "tsparticles-slim";
// import type { Engine } from "tsparticles-engine";
// import { theme as themeConfig } from "../../theme/theme";

// export default function NetworkBackground({
//   theme,
// }: {
//   theme: "dark" | "light";
// }) {
//   const particlesInit = useCallback(async (engine: Engine) => {
//     await loadSlim(engine);
//   }, []);

//   const colors = themeConfig[theme];

//   return (
//     <Particles
//       id="tsparticles"
//       init={particlesInit}
//       options={{
//         fullScreen: { enable: false },
//         background: { color: colors.background },

//         particles: {
//           number: { value: 55 },

//           color: { value: colors.accent },

//           links: {
//             enable: true,
//             color: colors.accent,
//             opacity: 0.56,
//             distance: 160,
//             width: 1,
//           },

//           move: {
//             enable: true,
//             speed: 0.4,
//             outModes: { default: "out" },

//             attract: {
//               enable: true,
//               rotateX: 600,
//               rotateY: 1200,
//             },
//           },

//           opacity: {
//             value: 0.22,
//           },

//           size: {
//             value: { min: 1, max: 2.5 },
//           },
//         },

//         detectRetina: true,
//       }}
//       style={{
//         position: "absolute",
//         top: 0,
//         left: 0,
//         width: "100%",
//         height: "100%",
//         zIndex: 0,
//       }}
//     />
//   );
// }
