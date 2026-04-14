/**
 * useVaultData.ts
 * Single source of truth for all enterprise dashboard data.
 * Everything is derived from ps_vault in localStorage — exactly
 * like the existing ImpactDashboard does.
 *
 * ps_vault shape:  { "<Email1>": "john@acme.com", "<APIKey1>": "sk-..." }
 */

export const SCORE_MAP: Record<string, number> = {
  Aadhaar: 500,
  PAN: 500,
  CreditCard: 800,
  RuPayCard: 800,
  BankAccount: 600,
  IFSC: 150,
  UPI: 150,
  UPITxnID: 150,
  SSN: 1000,
  MRN: 800,
  PatientID: 800,
  Email: 50,
  Phone: 75,
  URL: 50,
  IPAddress: 100,
  MACAddress: 100,
  JWTToken: 500,
  APIKey: 1000,
  AWSAccessKey: 1200,
  AWSSecretKey: 2000,
  GitHubToken: 1000,
  Password: 1000,
  OpenAIKey: 1500,
  AnthropicKey: 1500,
  OpenRouterKey: 1500,
  GoogleAPIKey: 1200,
  StripeKey: 1500,
  TwilioToken: 1200,
  SendGridKey: 1200,
  SlackToken: 900,
  HuggingFaceToken: 900,
  PrivateKeyBlock: 3000,
  Certificate: 1200,
  PostgresConn: 2500,
  MySQLConn: 2500,
  MongoDBConn: 2500,
  RedisConn: 2500,
  MSSQLConn: 2500,
  Name: 30,
  DOB: 200,
  Gender: 20,
  Age: 20,
  Diagnosis: 300,
  Medication: 200,
  Dosage: 100,
  BloodType: 100,
  DoctorName: 80,
  HospitalName: 80,
  Pincode: 40,
  VehicleReg: 60,
  DrivingLicense: 150,
  CardExpiry: 200,
  CVV: 500,
  CardPIN: 800,
  IBAN: 500,
};

export type SecretCategory = "Financial" | "Identity" | "Secrets" | "Contact" | "Medical";

export type VaultEntry = {
  placeholder: string;  // e.g. <Email1>
  original: string;     // e.g. john@acme.com
  prefix: string;       // e.g. Email
  riskScore: number;
  category: SecretCategory;
};

export type VaultStats = {
  vault: Record<string, string>;
  entries: VaultEntry[];
  totalSecrets: number;
  totalRiskScore: number;
  typeCounts: Record<string, number>;    // { Email: 3, APIKey: 1 }
  typeScores: Record<string, number>;    // { Email: 150, APIKey: 1000 }
  categoryCounts: Record<SecretCategory, number>;
  topTypes: { type: string; count: number; score: number; color: string }[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  shieldActive: boolean;
  hasData: boolean;
};

const TYPE_COLORS: Record<string, string> = {
  Email: "#3B82F6",
  Phone: "#A78BFA",
  Name: "#10B981",
  APIKey: "#EF4444",
  AWSAccessKey: "#EF4444",
  AWSSecretKey: "#DC2626",
  Password: "#DC2626",
  Aadhaar: "#F59E0B",
  PAN: "#F59E0B",
  CreditCard: "#EC4899",
  RuPayCard: "#EC4899",
  PostgresConn: "#06B6D4",
  MySQLConn: "#06B6D4",
  MongoDBConn: "#06B6D4",
  RedisConn: "#06B6D4",
  MSSQLConn: "#06B6D4",
  JWTToken: "#8B5CF6",
  IPAddress: "#84CC16",
  URL: "#84CC16",
  GitHubToken: "#F97316",
  SlackToken: "#F97316",
  BankAccount: "#14B8A6",
  SSN: "#F43F5E",
  MRN: "#E879F9",
  Diagnosis: "#E879F9",
  Medication: "#C084FC",
};

function getPrefix(placeholder: string): string {
  const m = placeholder.match(/^<([A-Za-z]+)\d*>$/);
  return m ? m[1] : "Unknown";
}

function getCategory(prefix: string): SecretCategory {
  if (
    ["CreditCard", "RuPayCard", "BankAccount", "UPI", "UPITxnID", "PAN", "IFSC", "IBAN", "CardExpiry", "CVV", "CardPIN"].includes(prefix)
  )
    return "Financial";
  if (["Aadhaar", "SSN", "DOB", "Gender", "MRN", "PatientID", "DrivingLicense", "VehicleReg"].includes(prefix))
    return "Identity";
  if (["Diagnosis", "Medication", "Dosage", "BloodType", "DoctorName", "HospitalName", "Allergy", "Weight", "Height", "BMI"].includes(prefix))
    return "Medical";
  if (/(Key|Secret|Token|Conn|Password|Block|Certificate)/.test(prefix))
    return "Secrets";
  return "Contact";
}

export function computeVaultStats(): VaultStats {
  const shieldActive = localStorage.getItem("ps_shield") !== "false";

  let vault: Record<string, string> = {};
  try {
    const raw = localStorage.getItem("ps_vault");
    if (raw) vault = JSON.parse(raw);
  } catch {
    vault = {};
  }

  const placeholders = Object.keys(vault);
  const entries: VaultEntry[] = placeholders.map((ph) => {
    const prefix = getPrefix(ph);
    const riskScore = SCORE_MAP[prefix] ?? 50;
    return {
      placeholder: ph,
      original: vault[ph],
      prefix,
      riskScore,
      category: getCategory(prefix),
    };
  });

  const totalSecrets = entries.length;
  const totalRiskScore = entries.reduce((s, e) => s + e.riskScore, 0);

  // Count per type
  const typeCounts: Record<string, number> = {};
  const typeScores: Record<string, number> = {};
  const categoryCounts: Record<SecretCategory, number> = {
    Financial: 0, Identity: 0, Secrets: 0, Contact: 0, Medical: 0,
  };

  for (const e of entries) {
    typeCounts[e.prefix] = (typeCounts[e.prefix] ?? 0) + 1;
    typeScores[e.prefix] = (typeScores[e.prefix] ?? 0) + e.riskScore;
    categoryCounts[e.category] += 1;
  }

  const topTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      type,
      count,
      score: typeScores[type] ?? 0,
      color: TYPE_COLORS[type] ?? "#94A3B8",
    }));

  // Risk level based on total score
  const riskLevel: "LOW" | "MEDIUM" | "HIGH" =
    totalRiskScore >= 2000 ? "HIGH" : totalRiskScore >= 500 ? "MEDIUM" : "LOW";

  return {
    vault,
    entries,
    totalSecrets,
    totalRiskScore,
    typeCounts,
    typeScores,
    categoryCounts,
    topTypes,
    riskLevel,
    shieldActive,
    hasData: totalSecrets > 0,
  };
}
