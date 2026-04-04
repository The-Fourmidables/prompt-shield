import React from "react";

interface LinkVisualizerProps {
  text: string;
  color: string;
}

/**
 * LinkVisualizer - Automatically detects and styles URLs, Database URIs,
 * and IP addresses within a text block.
 */
export default function LinkVisualizer({ text, color }: LinkVisualizerProps) {
  if (!text) return null;

  // Regex to match:
  // 1. Database URIs: scheme://user:pass@host:port/db
  // 2. Standard URLs: http/https
  // 3. IPv4 addresses
  // 4. Internal hostnames (e.g. prod.internal.company.com)
  const regex = /(?:[a-z]{3,10}:\/\/[^\s"'<>]+)|(?:\b(?:\d{1,3}\.){3}\d{1,3}\b)|(?:\b[\w-]+\.(?:internal|corp|intranet|private|local)(?::\d+)?(?:[\/\w.-]*)*\b)/gi;

  const parts = text.split(regex);
  const matches = text.match(regex);

  if (!matches) {
    return <>{text}</>;
  }

  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {matches[i] && (
            <span
              style={{
                color: color,
                fontWeight: 600,
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                textDecorationThickness: "1px",
                textDecorationColor: `${color}66`,
                cursor: "pointer",
                transition: "filter 0.2s ease",
              }}
              title="Rehydrated sensitive data"
              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.2)")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
            >
              {matches[i]}
            </span>
          )}
        </React.Fragment>
      ))}
    </>
  );
}
