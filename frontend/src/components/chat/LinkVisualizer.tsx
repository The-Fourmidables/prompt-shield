import React from "react";

interface LinkVisualizerProps {
  text: string;
  color: string;
}

/**
 * LinkVisualizer - Automatically detects and styles URLs, Database URIs,
 * IP addresses, and internal hostnames within a text block.
 */
export default function LinkVisualizer({ text, color }: LinkVisualizerProps) {
  if (!text) return null;

  // Regex to match:
  // 1. URLs (http/https) and Database URIs (e.g. postgres://, mongodb://)
  // 2. IPv4 addresses
  // 3. Internal hostnames (e.g. *.internal, *.corp)
  const regex =
    /(?:[a-z]{3,10}:\/\/[^\s"'<>]+)|(?:\b(?:\d{1,3}\.){3}\d{1,3}\b)|(?:\b[\w.-]+\.(?:internal|corp)\b)/gi;

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
                textDecoration: "underline",
                cursor: "pointer",
                transition: "filter 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.filter = "brightness(1.2)")
              }
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
