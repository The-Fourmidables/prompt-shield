"""
masker.py  -  Comprehensive PII / PHI / PCI Detection & Contextual Masking
"""

import re
import uuid
from typing import Dict, Tuple, Optional

try:
    from presidio_analyzer import AnalyzerEngine
    PRESIDIO_AVAILABLE = True
    _analyzer = AnalyzerEngine()
except ImportError:
    PRESIDIO_AVAILABLE = False


PATTERNS = [

    # EMAIL MUST BE FIRST (before URL and UPI)
    {
        "name": "EMAIL",
        "regex": r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b",
        "prefix": "Email",
        "type": "PII",
    },


    # NAME DETECTION - Context-aware (single + full names)
    {
        "name": "FULL_NAME",
        "regex": r"(?i)(name\s*(is|:|\s))\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
        "prefix": "Name",
        "type": "PII",
        "group": 3,
        "flags": re.IGNORECASE,
    },
    {
        "name": "SALUTATION_NAME",
        "regex": r"\b(Mr\.?|Mrs\.?|Ms\.?|Miss\.?|Dr\.?|Prof\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
        "prefix": "Name",
        "type": "PII",
        "group": 2,
    },
    {
        "name": "PATIENT_NAME",
        "regex": r"(?i)(patient\s*(name)?\s*(is|:|\s))\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
        "prefix": "Name",
        "type": "PHI",
        "group": 4,
        "flags": re.IGNORECASE,
    },
    {
        "name": "DEAR_NAME",
        "regex": r"(?i)\b(dear|hi|hello|hey)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b",
        "prefix": "Name",
        "type": "PII",
        "group": 2,
        "flags": re.IGNORECASE,
    },
    {
        "name": "SIGNED_BY",
        "regex": r"(?i)(signed|submitted|approved|reviewed|assigned)\s+(by\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
        "prefix": "Name",
        "type": "PII",
        "group": 3,
        "flags": re.IGNORECASE,
    },

    # PII - Indian Government IDs
    {
        "name": "AADHAAR",
        "regex": r"\b[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}\b",
        "prefix": "Aadhaar",
        "type": "PII",
    },
    {
        "name": "PAN",
        "regex": r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b",
        "prefix": "PAN",
        "type": "PII",
    },
    {
        "name": "INDIAN_PASSPORT",
        "regex": r"\b[A-PR-WY][1-9]\d\s?\d{4}[1-9]\b",
        "prefix": "Passport",
        "type": "PII",
    },
    {
        "name": "VOTER_ID",
        "regex": r"\b[A-Z]{3}[0-9]{7}\b",
        "prefix": "VoterID",
        "type": "PII",
    },
    {
        "name": "DRIVING_LICENSE_IN",
        "regex": r"\b[A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{4}[-\s]?[0-9]{7}\b",
        "prefix": "DrivingLicense",
        "type": "PII",
    },
    {
        "name": "VEHICLE_REGISTRATION_IN",
        "regex": r"\b[A-Z]{2}[\s-]?[0-9]{1,2}[\s-]?[A-Z]{1,3}[\s-]?[0-9]{4}\b",
        "prefix": "VehicleReg",
        "type": "PII",
    },

    # PII - Contact Information
    {
        "name": "INDIAN_PHONE",
        "regex": r"(?<!\d)(\+91[\-\s]?)?[6-9]\d{9}(?!\d)",
        "prefix": "Phone",
        "type": "PII",
    },
    {
        "name": "PHONE_INTL",
        "regex": r"\+?[1-9]\d{1,3}[\s\-.]?\(?\d{1,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{4}",
        "prefix": "Phone",
        "type": "PII",
    },
    {
        "name": "INDIAN_PINCODE",
        "regex": r"\b[1-9][0-9]{5}\b",
        "prefix": "Pincode",
        "type": "PII",
    },

    # PII - Personal Details
    {
        "name": "DATE_OF_BIRTH",
        "regex": r"\b(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-](19|20)\d{2}\b",
        "prefix": "DOB",
        "type": "PII",
    },
    {
        "name": "AGE",
        "regex": r"(?i)\bage[d]?[\s:]+([0-9]{1,3})\s*(years?|yrs?)?\b",
        "prefix": "Age",
        "type": "PII",
        "flags": re.IGNORECASE,
        "group": 1,
    },
    {
        "name": "GENDER",
        "regex": r"(?i)(gender|sex)[\s:]+\b(male|female|transgender|other)\b",
        "prefix": "Gender",
        "type": "PII",
        "flags": re.IGNORECASE,
        "group": 2,
    },

    # PII - Network
    {
        "name": "IPV4_ADDRESS",
        "regex": r"\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b",
        "prefix": "IPAddress",
        "type": "PII",
    },
    {
        "name": "MAC_ADDRESS",
        "regex": r"\b([0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}\b",
        "prefix": "MACAddress",
        "type": "PII",
    },
    {
        "name": "URL",
        "regex": r"https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/=]*)",
        "prefix": "URL",
        "type": "PII",
    },
    {
        "name": "SSN_US",
        "regex": r"\b\d{3}-\d{2}-\d{4}\b",
        "prefix": "SSN",
        "type": "PII",
    },

    # PHI - Medical
    {
        "name": "MEDICAL_RECORD_NUMBER",
        "regex": r"(?i)(mrn|medical[\s_]?record[\s_]?(no|number|id)?)[\s:\"'#=]+([A-Za-z0-9\-]{4,20})",
        "prefix": "MRN",
        "type": "PHI",
        "group": 3,
        "flags": re.IGNORECASE,
    },
    {
        "name": "PATIENT_ID",
        "regex": r"(?i)(patient[\s_]?(id|no|number))[\s:\"'#=]+([A-Za-z0-9\-]{4,20})",
        "prefix": "PatientID",
        "type": "PHI",
        "group": 3,
        "flags": re.IGNORECASE,
    },
    {
        "name": "HEALTH_INSURANCE_ID",
        "regex": r"(?i)(health[\s_]?insurance[\s_]?(id|no|number|policy))[\s:\"'#=]+([A-Za-z0-9\-]{6,20})",
        "prefix": "HealthInsuranceID",
        "type": "PHI",
        "group": 3,
        "flags": re.IGNORECASE,
    },
    {
        "name": "ABHA_NUMBER",
        "regex": r"\b[0-9]{2}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}\b",
        "prefix": "ABHA",
        "type": "PHI",
    },
    {
        "name": "BLOOD_TYPE",
        "regex": r"\b(blood[\s_]?(type|group)[\s:]+)?(A|B|AB|O)[\s]?[\+\-](ve|positive|negative)?\b",
        "prefix": "BloodType",
        "type": "PHI",
        "flags": re.IGNORECASE,
    },
    {
        "name": "DIAGNOSIS",
        "regex": r"(?i)(diagnosis|diagnosed[\s_]?with|condition)[\s:\"']+([A-Za-z\s\-]{3,50}?)(?=[,.\n;]|$)",
        "prefix": "Diagnosis",
        "type": "PHI",
        "group": 2,
        "flags": re.IGNORECASE,
    },
    {
        "name": "MEDICATION",
        "regex": r"(?i)(medication|medicine|prescribed|taking)[\s:\"']+([A-Za-z\s\-]{3,40}?\s?[0-9]*\s?mg?)(?=[,.\n;]|$)",
        "prefix": "Medication",
        "type": "PHI",
        "group": 2,
        "flags": re.IGNORECASE,
    },
    {
        "name": "DOSAGE",
        "regex": r"\b[0-9]+\.?[0-9]*\s?(mg|mcg|ml|g|IU|units?)\b",
        "prefix": "Dosage",
        "type": "PHI",
        "flags": re.IGNORECASE,
    },
    {
        "name": "ALLERGY",
        "regex": r"(?i)(allergic[\s_]?to|allergy[\s:]+)([A-Za-z\s,]{3,50}?)(?=[,.\n;]|$)",
        "prefix": "Allergy",
        "type": "PHI",
        "group": 2,
        "flags": re.IGNORECASE,
    },
    {
        "name": "WEIGHT",
        "regex": r"(?i)(weight[\s:]+)([0-9]{2,3}\.?[0-9]?\s?(kg|lbs|pounds|kilograms))",
        "prefix": "Weight",
        "type": "PHI",
        "group": 2,
        "flags": re.IGNORECASE,
    },
    {
        "name": "HEIGHT",
        "regex": r"(?i)(height[\s:]+)([0-9]{1,3}\.?[0-9]?\s?(cm|ft|feet|inches|m)\b[\s0-9inchcmft\'\"]*)",
        "prefix": "Height",
        "type": "PHI",
        "group": 2,
        "flags": re.IGNORECASE,
    },
    {
        "name": "BMI",
        "regex": r"(?i)(bmi[\s:]+)([0-9]{2}\.?[0-9]{0,2})",
        "prefix": "BMI",
        "type": "PHI",
        "group": 2,
        "flags": re.IGNORECASE,
    },
    {
        "name": "DOCTOR_NAME",
        "regex": r"\b(Dr\.?|Doctor)\s+[A-Z][a-z]+(\s+[A-Z][a-z]+){0,2}\b",
        "prefix": "DoctorName",
        "type": "PHI",
    },
    {
        "name": "HOSPITAL_NAME",
        "regex": r"(?i)(hospital|clinic|medical[\s_]?center)[\s:\"']+([A-Za-z\s]{3,50}?)(?=[,.\n;]|$)",
        "prefix": "HospitalName",
        "type": "PHI",
        "group": 2,
        "flags": re.IGNORECASE,
    },

    # PCI - Cards
    {
        "name": "CREDIT_CARD_VISA",
        "regex": r"\b4[0-9]{12}(?:[0-9]{3})?\b",
        "prefix": "CreditCard",
        "type": "PCI",
    },
    {
        "name": "CREDIT_CARD_MASTERCARD",
        "regex": r"\b5[1-5][0-9]{14}\b",
        "prefix": "CreditCard",
        "type": "PCI",
    },
    {
        "name": "CREDIT_CARD_AMEX",
        "regex": r"\b3[47][0-9]{13}\b",
        "prefix": "CreditCard",
        "type": "PCI",
    },
    {
        "name": "CREDIT_CARD_RUPAY",
        "regex": r"\b6[0-9]{15}\b",
        "prefix": "RuPayCard",
        "type": "PCI",
    },
    {
        "name": "CARD_EXPIRY",
        "regex": r"\b(0[1-9]|1[0-2])\s?[\/\-]\s?([0-9]{2}|20[2-9][0-9])\b",
        "prefix": "CardExpiry",
        "type": "PCI",
    },
    {
        "name": "CVV",
        "regex": r"(?i)\b(cvv|cvc|security[\s_]?code)[\s:\"'=]+([0-9]{3,4})\b",
        "prefix": "CVV",
        "type": "PCI",
        "group": 2,
        "flags": re.IGNORECASE,
    },
    {
        "name": "CARD_PIN",
        "regex": r"(?i)(card[\s_]?pin|atm[\s_]?pin)[\s:\"'=]+([0-9]{4,6})\b",
        "prefix": "CardPIN",
        "type": "PCI",
        "group": 2,
        "flags": re.IGNORECASE,
    },

    # PCI - Banking
    {
        "name": "IFSC",
        "regex": r"\b[A-Z]{4}0[A-Z0-9]{6}\b",
        "prefix": "IFSC",
        "type": "PCI",
    },
    {
        "name": "INDIAN_BANK_ACCOUNT",
        "regex": r"(?i)(account[\s_]?(no|number|num)[\s:\"'#=]+)([0-9]{9,18})\b",
        "prefix": "BankAccount",
        "type": "PCI",
        "group": 3,
        "flags": re.IGNORECASE,
    },
    {
        "name": "UPI_ID",
        "regex": r"\b[A-Za-z0-9.\-_]+@[a-zA-Z]{3,}\b",
        "prefix": "UPI",
        "type": "PCI",
    },
    {
        "name": "UPI_TRANSACTION_ID",
        "regex": r"(?i)(upi[\s_]?(txn|transaction)[\s_]?(id|ref|no)?)[\s:\"'#=]+([A-Za-z0-9]{12,22})\b",
        "prefix": "UPITxnID",
        "type": "PCI",
        "group": 4,
        "flags": re.IGNORECASE,
    },
    {
        "name": "IBAN",
        "regex": r"\b[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]{0,16})?\b",
        "prefix": "IBAN",
        "type": "PCI",
    },

    # Secrets
    {
        "name": "OPENAI_API_KEY",
        "regex": r"sk-[A-Za-z0-9]{20,}",
        "prefix": "APIKey",
        "type": "SECRET",
    },
    {
        "name": "AWS_ACCESS_KEY",
        "regex": r"\bAKIA[0-9A-Z]{16}\b",
        "prefix": "AWSAccessKey",
        "type": "SECRET",
    },
    {
        "name": "GITHUB_TOKEN",
        "regex": r"\bghp_[A-Za-z0-9]{36}\b",
        "prefix": "GitHubToken",
        "type": "SECRET",
    },
    {
        "name": "JWT_TOKEN",
        "regex": r"eyJ[A-Za-z0-9_\-]+\.eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+",
        "prefix": "JWTToken",
        "type": "SECRET",
    },
    {
        "name": "GENERIC_API_KEY",
        "regex": r"(?i)(api[_\-]?key|access[_\-]?token|secret[_\-]?key)[\s:\"'=]+([A-Za-z0-9_\-\.]{16,})",
        "prefix": "APIKey",
        "type": "SECRET",
        "group": 2,
        "flags": re.IGNORECASE,
    },
    {
        "name": "PASSWORD_IN_TEXT",
        "regex": r"(?i)(password|passwd|pwd)[\s:\"'=]+([^\s\"',;]{6,})",
        "prefix": "Password",
        "type": "SECRET",
        "group": 2,
        "flags": re.IGNORECASE,
    },
]


_session_store: Dict[str, Dict[str, dict]] = {}
_session_counters: Dict[str, Dict[str, int]] = {}


class PIIMasker:

    def mask(
        self,
        text: str,
        session_id: Optional[str] = None,
    ) -> Tuple[str, Dict[str, dict], str]:
        if session_id is None:
            session_id = str(uuid.uuid4())

        if session_id not in _session_store:
            _session_store[session_id] = {}
            _session_counters[session_id] = {}

        entity_map = _session_store[session_id]
        counters = _session_counters[session_id]

        # Step 1: Regex FIRST (handles email, phone, card, etc.)
        text = self._regex_mask(text, entity_map, counters)

        # Step 2: Presidio AFTER regex, only for PERSON and LOCATION
        # (everything else already handled by regex above)
        if PRESIDIO_AVAILABLE:
            text = self._presidio_mask(text, entity_map, counters)

        return text, entity_map, session_id

    # Presidio only handles PERSON and LOCATION/ADDRESS
    # All other entity types (EMAIL, PHONE, URL, etc.) are handled by regex
    PRESIDIO_ALLOWED_ENTITIES = {"PERSON", "LOCATION"}

    def _presidio_mask(self, text, entity_map, counters):
        try:
            results = _analyzer.analyze(
                text=text,
                language="en",
                entities=list(self.PRESIDIO_ALLOWED_ENTITIES),
            )
            results = sorted(results, key=lambda r: r.start, reverse=True)
            for r in results:
                original = text[r.start:r.end]

                # Skip if already masked by regex (placeholder like <Email1>)
                if re.match(r"^<[A-Za-z]+\d+>$", original):
                    continue

                if original in entity_map:
                    placeholder = entity_map[original]["placeholder"]
                else:
                    prefix = r.entity_type.title().replace("_", "")
                    counters.setdefault(prefix, 0)
                    counters[prefix] += 1
                    placeholder = f"<{prefix}{counters[prefix]}>"
                    entity_map[original] = {
                        "placeholder": placeholder,
                        "type": "PII",
                        "name": r.entity_type,
                    }
                text = text[: r.start] + placeholder + text[r.end:]
        except Exception:
            pass
        return text

    def _regex_mask(self, text, entity_map, counters):
        for pattern in PATTERNS:
            flags = pattern.get("flags", 0)
            group = pattern.get("group", 0)
            compiled = re.compile(pattern["regex"], flags)

            def replacer(m, prefix=pattern["prefix"], ptype=pattern["type"], g=group):
                original = m.group(g) if g else m.group(0)
                if not original or original.strip() == "":
                    return m.group(0)
                original = original.strip()

                # Skip already-masked placeholders
                if re.match(r"^<[A-Za-z]+\d+>$", original):
                    return m.group(0)

                if original in entity_map:
                    ph = entity_map[original]["placeholder"]
                else:
                    counters.setdefault(prefix, 0)
                    counters[prefix] += 1
                    ph = f"<{prefix}{counters[prefix]}>"
                    entity_map[original] = {
                        "placeholder": ph,
                        "type": ptype,
                        "name": pattern["name"],
                    }
                return m.group(0).replace(original, ph)

            text = compiled.sub(replacer, text)
        return text

    def clear_session(self, session_id: str):
        _session_store.pop(session_id, None)
        _session_counters.pop(session_id, None)

    def get_entity_map(self, session_id: str) -> Dict[str, dict]:
        return _session_store.get(session_id, {})

    def get_summary(self, entity_map: Dict[str, dict]) -> dict:
        summary = {"PII": [], "PHI": [], "PCI": [], "SECRET": []}
        for original, info in entity_map.items():
            ptype = info.get("type", "PII")
            summary.setdefault(ptype, []).append({
                "placeholder": info["placeholder"],
                "pattern": info["name"],
            })
        return summary
