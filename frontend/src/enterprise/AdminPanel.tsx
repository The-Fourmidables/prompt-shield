// enterprise/AdminPanel.tsx
import { useState } from "react";
import { getTheme } from "../theme/theme";
import { Shield, Lock, Bell, Database, Settings, Bot, Cpu, Sparkles, Zap, Search } from "lucide-react";

type Props = { theme: "dark" | "light" };

type ShieldEnforcement = "voluntary" | "mandatory" | "sensitive_only";

type AdminState = {
  shieldEnforcement: ShieldEnforcement;
  blockedChatGPT: boolean;
  blockedClaude: boolean;
  blockedGemini: boolean;
  blockedCopilot: boolean;
  blockedPerplexity: boolean;
  alertOnUnshielded: boolean;
  alertOnAadhaar: boolean;
  dataRetention: string;
  promptStorage: string;
};

const INITIAL: AdminState = {
  shieldEnforcement: "mandatory",
  blockedChatGPT: false,
  blockedClaude: false,
  blockedGemini: false,
  blockedCopilot: false,
  blockedPerplexity: true,
  alertOnUnshielded: true,
  alertOnAadhaar: true,
  dataRetention: "30",
  promptStorage: "never",
};

const getInitialState = (): AdminState => {
  const saved = localStorage.getItem("ps_admin_policy");
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  return INITIAL;
};

function Toggle({
  checked,
  onChange,
  colors,
}: { checked: boolean; onChange: (v: boolean) => void; colors: ReturnType<typeof getTheme> }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer",
        background: checked ? colors.accent : colors.border,
        position: "relative", transition: "background 0.25s ease", flexShrink: 0,
        padding: 0,
      }}
    >
      <div style={{
        width: "18px", height: "18px", borderRadius: "50%",
        background: "#fff",
        position: "absolute", top: "3px",
        left: checked ? "23px" : "3px",
        transition: "left 0.2s ease",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }} />
    </button>
  );
}

function SectionCard({ title, icon, children, colors }: {
  title: string; icon: React.ReactNode;
  children: React.ReactNode; colors: ReturnType<typeof getTheme>;
}) {
  return (
    <div style={{
      background: `linear-gradient(145deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
      border: `1px solid ${colors.border}`,
      borderRadius: "18px",
      padding: "22px 20px",
      boxShadow: `0 4px 24px ${colors.glow}`,
    }}>
      <div style={{ fontSize: "14px", fontWeight: 800, color: colors.textPrimary, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "18px" }}>{icon}</span> {title}
      </div>
      {children}
    </div>
  );
}

export default function AdminPanel({ theme }: Props) {
  const colors = getTheme(theme);
  const [state, setState] = useState<AdminState>(getInitialState);
  const [saved, setSaved] = useState(false);

  const update = <K extends keyof AdminState>(key: K, value: AdminState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("ps_admin_policy", JSON.stringify(state));
    window.dispatchEvent(new Event("storage")); // Trigger updates across app
    setSaved(true);
    setTimeout(() => setSaved(false), 2800);
  };

  const radioStyle = (active: boolean) => ({
    display: "flex", alignItems: "center", gap: "10px",
    padding: "10px 14px", borderRadius: "10px", cursor: "pointer",
    border: `1px solid ${active ? colors.accent : colors.border}`,
    background: active ? `${colors.accent}14` : "transparent",
    marginBottom: "6px",
    transition: "all 0.18s ease",
  });

  const tools: { key: keyof AdminState; label: string; icon: React.ReactNode }[] = [
    { key: "blockedChatGPT",   label: "ChatGPT",    icon: <Bot size={16} /> },
    { key: "blockedClaude",    label: "Claude",     icon: <Cpu size={16} /> },
    { key: "blockedGemini",    label: "Gemini",     icon: <Sparkles size={16} /> },
    { key: "blockedCopilot",   label: "Copilot",    icon: <Zap size={16} /> },
    { key: "blockedPerplexity",label: "Perplexity", icon: <Search size={16} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%", overflow: "auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: colors.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
            <Settings size={22} /> Admin Controls
          </div>
          <div style={{ fontSize: "13px", color: colors.textSecondary, marginTop: "3px" }}>
            Organisation-wide policy settings — Administrator access only
          </div>
        </div>
        <button
          onClick={handleSave}
          style={{
            padding: "10px 22px", borderRadius: "12px", border: "none", cursor: "pointer",
            background: saved
              ? "linear-gradient(135deg, #10B981, #059669)"
              : `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
            color: saved ? "#fff" : colors.accentText,
            fontWeight: 700, fontSize: "14px",
            boxShadow: `0 4px 20px ${saved ? "#10B98160" : colors.glow}`,
            transition: "all 0.25s ease",
          }}
        >
          {saved ? "✅ Policy Saved" : "Save Policy"}
        </button>
      </div>

      {/* Shield Enforcement */}
      <SectionCard title="Shield Enforcement" icon={<Shield size={18} />} colors={colors}>
        <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: "12px" }}>
          Controls whether employees must use PromptShield before sending to any AI tool.
        </div>
        {(["voluntary", "mandatory", "sensitive_only"] as ShieldEnforcement[]).map((opt) => (
          <div
            key={opt}
            style={radioStyle(state.shieldEnforcement === opt)}
            onClick={() => update("shieldEnforcement", opt)}
          >
            <div style={{
              width: "18px", height: "18px", borderRadius: "50%",
              border: `2px solid ${state.shieldEnforcement === opt ? colors.accent : colors.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {state.shieldEnforcement === opt && (
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: colors.accent }} />
              )}
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary }}>
                {opt === "voluntary" ? "Voluntary" : opt === "mandatory" ? "Mandatory for All" : "Mandatory for Sensitive Roles Only"}
              </div>
              <div style={{ fontSize: "11px", color: colors.textSecondary }}>
                {opt === "voluntary"
                  ? "Employees choose to use Shield — not enforced"
                  : opt === "mandatory"
                  ? "All employees must use Shield for every AI prompt"
                  : "Enforce Shield for HR, Finance, Legal and DevOps departments"}
              </div>
            </div>
          </div>
        ))}
      </SectionCard>

      {/* Blocked AI Tools */}
      <SectionCard title="AI Tool Access Control" icon={<Lock size={18} />} colors={colors}>
        <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: "12px" }}>
          Toggle to allow or block specific AI tools for your organisation.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {tools.map(({ key, label, icon }) => {
            const isBlocked = state[key] as boolean;
            return (
              <div
                key={key}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: "10px",
                  border: `1px solid ${isBlocked ? "#EF444433" : colors.border}`,
                  background: isBlocked ? "#EF444410" : "transparent",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>{icon}</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: isBlocked ? "#EF4444" : colors.textPrimary }}>
                    {label}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "11px", color: isBlocked ? "#EF4444" : "#10B981", fontWeight: 600 }}>
                    {isBlocked ? "Blocked" : "Allowed"}
                  </span>
                  <Toggle
                    checked={!isBlocked}
                    onChange={(v) => update(key, !v as any)}
                    colors={colors}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Auto-Alert Triggers */}
      <SectionCard title="Auto-Alert Triggers" icon={<Bell size={18} />} colors={colors}>
        <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: "12px" }}>
          Automatic notifications sent to admins when these conditions are met.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "10px", border: `1px solid ${colors.border}` }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary }}>
                Alert CTO if employee sends &gt;5 unshielded prompts/day
              </div>
              <div style={{ fontSize: "11px", color: colors.textSecondary, marginTop: "2px" }}>Sends email + dashboard notification</div>
            </div>
            <Toggle checked={state.alertOnUnshielded} onChange={(v) => update("alertOnUnshielded", v)} colors={colors} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "10px", border: `1px solid ${colors.border}` }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary }}>
                Alert HR if Aadhaar or PAN detected in any prompt
              </div>
              <div style={{ fontSize: "11px", color: colors.textSecondary, marginTop: "2px" }}>Triggers DPDP compliance incident log</div>
            </div>
            <Toggle checked={state.alertOnAadhaar} onChange={(v) => update("alertOnAadhaar", v)} colors={colors} />
          </div>
        </div>
      </SectionCard>

      {/* Data Retention */}
      <SectionCard title="Data Retention Policy" icon={<Database size={18} />} colors={colors}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: colors.textSecondary, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.6px" }}>
              Store Vault Logs For
            </div>
            <select
              value={state.dataRetention}
              onChange={(e) => update("dataRetention", e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "10px",
                border: `1px solid ${colors.border}`,
                background: colors.surfaceAlt, color: colors.textPrimary,
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: colors.textSecondary, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.6px" }}>
              Store Employee Prompt Content
            </div>
            <select
              value={state.promptStorage}
              onChange={(e) => update("promptStorage", e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "10px",
                border: `1px solid ${colors.border}`,
                background: colors.surfaceAlt, color: colors.textPrimary,
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="never">Never store</option>
              <option value="masked">Store masked only</option>
              <option value="hash">Store hash only</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: "12px", padding: "10px 14px", borderRadius: "10px", background: "#10B98110", border: "1px solid #10B98133", fontSize: "12px", color: "#10B981" }}>
          ✅ "Never store" protects employee privacy — they are protected from the AI company <em>and</em> from their employer. Recommended for GDPR & DPDP compliance.
        </div>
      </SectionCard>
    </div>
  );
}
