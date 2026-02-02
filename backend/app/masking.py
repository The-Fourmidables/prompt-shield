# app/masking.py
import re
from collections import defaultdict

# ----------------------------
# IMPROVED PII REGEX PATTERNS
# ----------------------------
# The order here is CRITICAL. Specific patterns must be at the top.
MASK_PATTERNS = {
    # 1. Fixed-format IDs
    "EMAIL": r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+',
    "PAN": r'\b[A-Z]{5}[0-9]{4}[A-Z]\b',
    "AADHAAR": r'\b\d{4}\s\d{4}\s\d{4}\b',
    "IFSC": r'\b[A-Z]{4}0[A-Z0-9]{6}\b',
    "UPI": r'\b[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}\b',
    
    # 2. Financial (Captures currency so OTP/Address doesn't eat it)
    "AMOUNT": r'(₹|Rs\.?)\s?\d+(?:,\d+)*(?:\.\d+)?',
    "CREDIT_CARD": r'\b(?:\d[ -]*?){13,16}\b',
    
    # 3. Phone (Captures +91, 0, or space-separated 10 digits as ONE block)
    "PHONE": r'(?:\+91|0)?\s?[6-9]\d{4}[\s-]?\d{5}\b', 

    # 4. Bank Account (Must be checked before generic OTP)
    "BANK_ACCOUNT": r'\b\d{9,18}\b',
    
    # 5. Address (Context-aware: looks for house/flat numbers + keywords)
    "ADDRESS": r'\b\d{1,4}[,\s]+[A-Za-z0-9\s,]{5,60}?(?:Delhi|Mumbai|Bangalore|Street|Road|Lane|Avenue|Sector|Apartment|Dwarka|Baker)\b(?:\s\d{6})?',
    
    # 6. NEW: Catch Dates specifically so they don't become OTPs
    "DATE": r'\b\d{1,2}[-/\s](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-/\s]\d{2,4}\b|\b\d{4}[-/\s]\d{1,2}[-/\s]\d{1,2}\b',
    
    # 7. OTP & Generic Numbers (The "Cleanup" regex)
    # This ignores: numbers followed by months (dates), +91 prefixes, or currency symbols.
    "OTP": r'\b(?<!₹)(?<!\+)(?<!\d)\d{4,6}(?!\d)(?!\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|20))\b',
}

# ----------------------------
# NAME MASKING (Context-Aware)
# ----------------------------
NAME_CONTEXT_PATTERNS = [
    r"(?:my name is|i am|this is|client name|employee name)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)"
]

def mask_text(text: str):
    """
    Masks PII using deterministic placeholders.
    Logic: Uses re.sub with a callback to ensure no double-masking.
    """
    counters = defaultdict(int)
    vault = {}

    # --- Pass 1: Name Extraction ---
    for pattern in NAME_CONTEXT_PATTERNS:
        matches = re.finditer(pattern, text, flags=re.IGNORECASE)
        for match in matches:
            original = match.group(1).strip()
            # Avoid masking small common words
            if original and len(original) > 2 and original not in vault.values():
                counters["NAME"] += 1
                placeholder = f"<NAME_{counters['NAME']}>"
                vault[placeholder] = original
                text = text.replace(original, placeholder)

    # --- Pass 2: Regex-based Pattern Masking ---
    for label, pattern in MASK_PATTERNS.items():
        def replace_logic(match):
            val = match.group()
            
            # If the value is already a placeholder, don't touch it
            if val.startswith("<") and val.endswith(">"):
                return val
            
            # If the value is already in the vault, reuse its placeholder
            for p, v in vault.items():
                if v == val:
                    return p
            
            # New PII found
            counters[label] += 1
            placeholder = f"<{label}_{counters[label]}>"
            vault[placeholder] = val
            return placeholder

        # re.sub ensures that we respect the word boundaries found by the regex
        text = re.sub(pattern, replace_logic, text)

    return text, vault