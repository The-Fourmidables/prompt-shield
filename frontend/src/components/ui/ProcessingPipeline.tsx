// import { theme } from "../../theme/theme";

const steps = [
  "Detecting Sensitive Entities",
  "Masking & Vault Construction",
  "Secure Transmission to Model",
  "Local Response Rehydration",
  "Processing Complete",
];
const stageToStep: Record<string, number> = {
  IDLE: -1,
  DETECTING: 0,
  MASKING_COMPLETE: 1,
  TRANSMITTING: 2,
  REHYDRATING: 3,
  COMPLETE: 4,
};

interface Props {
  stage: string;
  hasVault: boolean;
  compact?: boolean;
  colors: any;
}

export default function ProcessingPipeline({
  stage,
  hasVault,
  compact = false,
  colors,
}: Props) {
  const activeStep = stageToStep[stage] ?? -1;

  const STEP_DURATION = 500;

  const progressHeight =
    activeStep === steps.length - 1
      ? 100
      : activeStep >= 0
        ? (activeStep / (steps.length - 1)) * 100
        : 0;
  return (
    <div
      style={{
        flex: 1,
        borderRadius: "12px",
        border: `1px solid ${colors.border}`,
        padding: compact ? "12px" : "20px",
        backgroundColor: colors.surfaceAlt,
        display: "flex",
        flexDirection: "column",
        gap: compact ? "12px" : "20px",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      <h3 style={{ fontSize: "14px", letterSpacing: "1px" }}>
        Processing Pipeline
      </h3>

      {/* Scroll Container */}
      <div
        className={hasVault ? "invisible-scroll" : ""}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: hasVault ? "scroll" : "hidden",
        }}
      >
        {/* Content Wrapper (this controls spine height) */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: compact ? "8px" : "14px",
          }}
        >
          {/* Spine */}
          <div
            style={{
              position: "absolute",
              left: "6px",
              top: 0,
              bottom: 0,
              width: "2px",
              backgroundColor: colors.border,
            }}
          />

          {/* Liquid Flow */}
          <div
            style={{
              position: "absolute",
              left: "6px",
              top: 0,
              width: "2px",
              height: `${progressHeight}%`,
              background: colors.accent,
              boxShadow: `0 0 15px ${colors.glow}`,
              transition: `height ${STEP_DURATION}ms linear`,
              borderRadius: "2px",
            }}
          />

          {steps.map((step, i) => {
            const isActive = i === activeStep;
            const isDone = i < activeStep;

            return (
              <div
                key={i}
                style={{
                  marginLeft: "18px",
                  padding: compact ? "8px 12px" : "12px 16px",
                  borderRadius: "10px",
                  border: `1px solid ${isDone || isActive
                    ? colors.accent
                    : colors.border
                    }`,
                  backgroundColor: colors.surface,
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  opacity: isDone || isActive ? 1 : 0.4,
                  transition: "all 0.3s ease",
                  boxShadow: isActive
                    ? `0 0 12px ${colors.glow}`
                    : "none",
                }}
              >
                <span
                  style={{
                    fontSize: compact ? "11px" : "12px",
                    color: colors.textPrimary,
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {step}
                </span>

                {isActive && activeStep !== steps.length - 1 && (
                  <span
                    style={{
                      fontSize: "9px",
                      color: colors.accent,
                      letterSpacing: "1px",
                    }}
                  >
                    EXECUTING...
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}