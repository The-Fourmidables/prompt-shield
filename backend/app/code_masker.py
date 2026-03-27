"""
code_masker.py  -  Sensitive Data Masking Inside Code

Detects and masks secrets inside code snippets across all languages:

Python, JavaScript, TypeScript, Java, Go, Rust, PHP, Ruby,
C/C++, C#, Shell/Bash, YAML, JSON, .env files, Docker, etc.

Masks:
  - API Keys (OpenAI, AWS, Google, GitHub, Stripe, Twilio, etc.)
  - Passwords / secrets in code
  - Database connection strings (MySQL, PostgreSQL, MongoDB, Redis)
  - Private IPs and internal URLs
  - JWT tokens
  - Private keys / certificates
  - Hardcoded credentials in any language

CHANGES:
  - POSTGRES_CONNECTION: greedy regex so full URI is caught before
    PIIMasker can split it on the @ symbol
  - MYSQL_CONNECTION / MONGODB_CONNECTION: same greedy fix applied
  - INTERNAL_HOSTNAME: new pattern catches bare internal hostnames
    like prod.internal.company.com that have no http:// prefix
  - DB_PASSWORD_IN_URL: moved ABOVE the per-DB patterns so it acts
    as a fallback for any scheme not explicitly listed
"""

import re
import uuid
from typing import Dict, Tuple, Optional

# ── Session Store ─────────────────────────────────────────────────────────────
_session_store: Dict[str, Dict[str, dict]] = {}
_session_counters: Dict[str, Dict[str, int]] = {}


CODE_PATTERNS = [

    # ══════════════════════════════════════════════════════
    # API KEYS — Provider Specific
    # ══════════════════════════════════════════════════════
    {
        "name": "OPENAI_API_KEY",
        "regex": r"sk-[A-Za-z0-9]{20,}",
        "prefix": "OpenAIKey",
        "type": "API_KEY",
    },
    {
        "name": "OPENAI_ORG_ID",
        "regex": r"org-[A-Za-z0-9]{20,}",
        "prefix": "OpenAIOrgID",
        "type": "API_KEY",
    },
    {
        "name": "ANTHROPIC_API_KEY",
        "regex": r"sk-ant-[A-Za-z0-9\-]{20,}",
        "prefix": "AnthropicKey",
        "type": "API_KEY",
    },
    {
        "name": "AWS_ACCESS_KEY",
        "regex": r"\bAKIA[0-9A-Z]{16}\b",
        "prefix": "AWSAccessKey",
        "type": "API_KEY",
    },
    {
        "name": "AWS_SECRET_KEY",
        "regex": r"(?i)(aws_secret_access_key|aws_secret_key)\s*[=:]\s*[\"']?([A-Za-z0-9/+]{40})[\"']?",
        "prefix": "AWSSecretKey",
        "type": "API_KEY",
        "group": 2,
        "flags": re.IGNORECASE,
    },
    {
        "name": "GOOGLE_API_KEY",
        "regex": r"\bAIza[0-9A-Za-z\-_]{35}\b",
        "prefix": "GoogleAPIKey",
        "type": "API_KEY",
    },
    {
        "name": "GITHUB_TOKEN",
        "regex": r"\bghp_[A-Za-z0-9]{36}\b|\bgh[ousr]_[A-Za-z0-9]{36}\b",
        "prefix": "GitHubToken",
        "type": "API_KEY",
    },
    {
        "name": "STRIPE_SECRET_KEY",
        "regex": r"\bsk_live_[A-Za-z0-9]{24,}\b|\bsk_test_[A-Za-z0-9]{24,}\b",
        "prefix": "StripeKey",
        "type": "API_KEY",
    },
    {
        "name": "STRIPE_PUBLISHABLE_KEY",
        "regex": r"\bpk_live_[A-Za-z0-9]{24,}\b|\bpk_test_[A-Za-z0-9]{24,}\b",
        "prefix": "StripePublicKey",
        "type": "API_KEY",
    },
    {
        "name": "TWILIO_ACCOUNT_SID",
        "regex": r"\bAC[a-f0-9]{32}\b",
        "prefix": "TwilioSID",
        "type": "API_KEY",
    },
    {
        "name": "TWILIO_AUTH_TOKEN",
        "regex": r"(?i)(twilio_auth_token|TWILIO_TOKEN)\s*[=:]\s*[\"']?([a-f0-9]{32})[\"']?",
        "prefix": "TwilioToken",
        "type": "API_KEY",
        "group": 2,
        "flags": re.IGNORECASE,
    },
    {
        "name": "FIREBASE_API_KEY",
        "regex": r"(?i)(firebase[_\-]?api[_\-]?key)\s*[=:]\s*[\"']?([A-Za-z0-9\-_]{30,})[\"']?",
        "prefix": "FirebaseKey",
        "type": "API_KEY",
        "group": 2,
        "flags": re.IGNORECASE,
    },
    {
        "name": "SENDGRID_API_KEY",
        "regex": r"\bSG\.[A-Za-z0-9\-_]{22}\.[A-Za-z0-9\-_]{43}\b",
        "prefix": "SendGridKey",
        "type": "API_KEY",
    },
    {
        "name": "SLACK_TOKEN",
        "regex": r"\bxox[baprs]-[A-Za-z0-9\-]{10,}\b",
        "prefix": "SlackToken",
        "type": "API_KEY",
    },
    {
        "name": "OPENROUTER_API_KEY",
        "regex": r"sk-or-[A-Za-z0-9\-]{20,}",
        "prefix": "OpenRouterKey",
        "type": "API_KEY",
    },
    {
        "name": "HUGGINGFACE_TOKEN",
        "regex": r"\bhf_[A-Za-z0-9]{30,}\b",
        "prefix": "HuggingFaceToken",
        "type": "API_KEY",
    },
    {
        "name": "AZURE_API_KEY",
        "regex": r"(?i)(azure[_\-]?api[_\-]?key|AZURE_KEY)\s*[=:]\s*[\"']?([A-Za-z0-9]{32,})[\"']?",
        "prefix": "AzureKey",
        "type": "API_KEY",
        "group": 2,
        "flags": re.IGNORECASE,
    },

    # ══════════════════════════════════════════════════════
    # TOKENS & CERTIFICATES
    # Run these BEFORE generic secrets so JWT is caught
    # by its specific pattern, not a generic token rule.
    # ══════════════════════════════════════════════════════
    {
        "name": "JWT_TOKEN",
        "regex": r"eyJ[A-Za-z0-9_\-]+\.eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+",
        "prefix": "JWTToken",
        "type": "SECRET",
    },
    {
        "name": "PRIVATE_KEY_BLOCK",
        "regex": r"-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----[\s\S]*?-----END (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----",
        "prefix": "PrivateKeyBlock",
        "type": "SECRET",
        "flags": re.DOTALL,
    },
    {
        "name": "CERTIFICATE_BLOCK",
        "regex": r"-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----",
        "prefix": "Certificate",
        "type": "SECRET",
        "flags": re.DOTALL,
    },

    # ══════════════════════════════════════════════════════
    # DATABASE CONNECTION STRINGS
    # IMPORTANT: Use greedy [^\s\"']+ so the ENTIRE URI is
    # captured as one token before PIIMasker can split it.
    # ══════════════════════════════════════════════════════
    {
        "name": "MYSQL_CONNECTION",
        # FIX: greedy match — swallows full URI including user:pass@host
        "regex": r"mysql(\+\w+)?://[^\s\"'<>]+",
        "prefix": "MySQLConn",
        "type": "DB_CREDENTIAL",
    },
    {
        "name": "POSTGRES_CONNECTION",
        # FIX: greedy match — was r"postgres(ql)?://([^:]+):([^@]+)@([^/\s]+)/(\S+)"
        # which required exact structure; now catches any postgres:// URI whole
        "regex": r"postgres(ql)?://[^\s\"'<>]+",
        "prefix": "PostgresConn",
        "type": "DB_CREDENTIAL",
    },
    {
        "name": "MONGODB_CONNECTION",
        # FIX: greedy match — same reason as above
        "regex": r"mongodb(\+srv)?://[^\s\"'<>]+",
        "prefix": "MongoConn",
        "type": "DB_CREDENTIAL",
    },
    {
        "name": "REDIS_CONNECTION",
        "regex": r"redis://[^\s\"'<>]+",
        "prefix": "RedisConn",
        "type": "DB_CREDENTIAL",
    },
    {
        "name": "MSSQL_CONNECTION",
        "regex": r"(?i)(Server|Data Source)=[^;]+;(Database|Initial Catalog)=[^;]+;(User Id|UID)=[^;]+;Password=[^;]+;?",
        "prefix": "MSSQLConn",
        "type": "DB_CREDENTIAL",
    },
    {
        "name": "DB_PASSWORD_IN_URL",
        # Fallback: catches password in any scheme://user:PASS@host not listed above
        "regex": r"://([^:]+):([^@\s]{4,})@",
        "prefix": "DBPassword",
        "type": "DB_CREDENTIAL",
        "group": 2,
    },

    # ══════════════════════════════════════════════════════
    # GENERIC SECRETS IN CODE (all languages)
    # ══════════════════════════════════════════════════════
    {
        "name": "GENERIC_API_KEY_ASSIGNMENT",
        # Matches: api_key = "abc123", API_KEY: "abc123", apiKey: 'abc123'
        "regex": r"(?i)(api[_\-]?key|apikey|access[_\-]?key)\s*[=:]\s*[\"']([A-Za-z0-9_\-\.]{16,})[\"']",
        "prefix": "APIKey",
        "type": "SECRET",
        "group": 2,
        "flags": re.IGNORECASE,
    },
    {
        "name": "SECRET_KEY_ASSIGNMENT",
        "regex": r"(?i)(secret[_\-]?key|secret_access_key|client[_\-]?secret)\s*[=:]\s*[\"']([A-Za-z0-9_\-\.@#$%]{8,})[\"']",
        "prefix": "SecretKey",
        "type": "SECRET",
        "group": 2,
        "flags": re.IGNORECASE,
    },
    {
        "name": "TOKEN_ASSIGNMENT",
        "regex": r"(?i)(access[_\-]?token|auth[_\-]?token|bearer[_\-]?token|refresh[_\-]?token)\s*[=:]\s*[\"']([A-Za-z0-9_\-\.]{16,})[\"']",
        "prefix": "Token",
        "type": "SECRET",
        "group": 2,
        "flags": re.IGNORECASE,
    },
    {
        "name": "PASSWORD_ASSIGNMENT",
        # Matches: password = "abc", PASSWORD: "abc", passwd="abc"
        "regex": r"(?i)(password|passwd|pwd|pass)\s*[=:]\s*[\"']([^\"']{4,})[\"']",
        "prefix": "Password",
        "type": "SECRET",
        "group": 2,
        "flags": re.IGNORECASE,
    },
    {
        "name": "PRIVATE_KEY_ASSIGNMENT",
        "regex": r"(?i)(private[_\-]?key|priv[_\-]?key)\s*[=:]\s*[\"']([A-Za-z0-9+/=\-_]{16,})[\"']",
        "prefix": "PrivateKey",
        "type": "SECRET",
        "group": 2,
        "flags": re.IGNORECASE,
    },

    # ══════════════════════════════════════════════════════
    # INTERNAL / PRIVATE NETWORK INFO
    # ══════════════════════════════════════════════════════
    {
        "name": "PRIVATE_IP",
        # 10.x.x.x, 172.16-31.x.x, 192.168.x.x
        "regex": r"\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b",
        "prefix": "PrivateIP",
        "type": "NETWORK",
    },
    {
        "name": "INTERNAL_URL",
        # Internal hostnames with http:// prefix
        "regex": r"https?://(internal|intranet|private|corp|local|dev|staging|preprod)[\.\-][A-Za-z0-9\.\-]+",
        "prefix": "InternalURL",
        "type": "NETWORK",
        "flags": re.IGNORECASE,
    },
    {
        # NEW: catches bare internal hostnames WITHOUT http:// prefix
        # e.g. prod.internal.company.com:5432 or fraud-api.internal:8080
        "name": "INTERNAL_HOSTNAME",
        "regex": r"\b[\w\-]+\.(internal|corp|intranet|private|local)(:\d+)?(/[\w/.\-]*)?\b",
        "prefix": "InternalHost",
        "type": "NETWORK",
        "flags": re.IGNORECASE,
    },
    {
        "name": "LOCALHOST_WITH_PORT",
        "regex": r"(https?://)?(localhost|127\.0\.0\.1):\d{2,5}[^\s\"']*",
        "prefix": "LocalhostURL",
        "type": "NETWORK",
        "flags": re.IGNORECASE,
    },

    # ══════════════════════════════════════════════════════
    # CLOUD SPECIFIC
    # ══════════════════════════════════════════════════════
    {
        "name": "AWS_S3_BUCKET_URL",
        "regex": r"s3://[A-Za-z0-9\-\.]+(/[^\s\"']*)?",
        "prefix": "S3BucketURL",
        "type": "CLOUD",
    },
    {
        "name": "AWS_REGION",
        "regex": r"(?i)(aws[_\-]?region|AWS_DEFAULT_REGION)\s*[=:]\s*[\"']?([a-z]{2}-[a-z]+-\d)[\"']?",
        "prefix": "AWSRegion",
        "type": "CLOUD",
        "group": 2,
        "flags": re.IGNORECASE,
    },
    {
        "name": "GCP_PROJECT_ID",
        "regex": r"(?i)(gcp[_\-]?project|google[_\-]?project[_\-]?id|GCP_PROJECT)\s*[=:]\s*[\"']?([a-z][a-z0-9\-]{4,28}[a-z0-9])[\"']?",
        "prefix": "GCPProject",
        "type": "CLOUD",
        "group": 2,
        "flags": re.IGNORECASE,
    },

    # ══════════════════════════════════════════════════════
    # ENVIRONMENT VARIABLES (.env files)
    # Run LAST — broad pattern, catches anything with
    # secret/key/token/password in the variable name.
    # ══════════════════════════════════════════════════════
    {
        "name": "ENV_SECRET",
        "regex": r"(?i)^(.*?(key|secret|token|password|passwd|pwd|credential|auth|private)[^=\n]*)\s*=\s*(.+)$",
        "prefix": "EnvSecret",
        "type": "SECRET",
        "group": 3,
        "flags": re.IGNORECASE | re.MULTILINE,
    },
]


class CodeMasker:

    def mask_code(
        self,
        code: str,
        session_id: Optional[str] = None,
    ) -> Tuple[str, Dict[str, dict], str]:
        """
        Mask secrets inside code snippets.
        Returns: (masked_code, entity_map, session_id)
        """
        if session_id is None:
            session_id = str(uuid.uuid4())

        if session_id not in _session_store:
            _session_store[session_id] = {}
            _session_counters[session_id] = {}

        entity_map = _session_store[session_id]
        counters = _session_counters[session_id]

        for pattern in CODE_PATTERNS:
            flags = pattern.get("flags", 0)
            group = pattern.get("group", 0)
            compiled = re.compile(pattern["regex"], flags)

            def replacer(m, prefix=pattern["prefix"], ptype=pattern["type"], g=group):
                original = m.group(g) if g else m.group(0)
                if not original or original.strip() == "":
                    return m.group(0)
                original_stripped = original.strip().strip("'\"")

                # Skip already masked placeholders like <OpenAIKey1>
                if re.match(r"^<[A-Za-z]+\d+>$", original_stripped):
                    return m.group(0)

                # Skip if full match already contains a placeholder
                if re.search(r"<[A-Za-z]+\d+>", m.group(0)):
                    return m.group(0)

                if original_stripped in entity_map:
                    ph = entity_map[original_stripped]["placeholder"]
                else:
                    counters.setdefault(prefix, 0)
                    counters[prefix] += 1
                    ph = f"<{prefix}{counters[prefix]}>"
                    entity_map[original_stripped] = {
                        "placeholder": ph,
                        "type": ptype,
                        "name": pattern["name"],
                    }
                return m.group(0).replace(original, ph)

            code = compiled.sub(replacer, code)

        return code, entity_map, session_id

    def clear_session(self, session_id: str):
        _session_store.pop(session_id, None)
        _session_counters.pop(session_id, None)

    def get_summary(self, entity_map: Dict[str, dict]) -> dict:
        summary = {}
        for original, info in entity_map.items():
            ptype = info.get("type", "SECRET")
            summary.setdefault(ptype, []).append({
                "placeholder": info["placeholder"],
                "pattern": info["name"],
            })
        return summary