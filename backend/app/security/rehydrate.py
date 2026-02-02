# app/security/rehydrate.py
import re

def rehydrate(masked_text: str, vault_map: dict) -> str:
    """
    Replace placeholders in LLM response using vault_map.
    Now handles both <TAG_1> and the '**** Category' redaction style.
    """
    if not vault_map:
        return masked_text

    rehydrated = masked_text

    # --- 1. HANDLE REDACTED STRINGS (e.g., "**** Bank" or "**** Institute") ---
    # We look through the vault to see if any original value was turned into a redacted string
    # and try to map the AI's version back to the real one.
    
    # We create a mapping of what the masked text LOOKS like in the document
    # to what it SHOULD be.
    for placeholder, original in vault_map.items():
        if placeholder.startswith("<ORG_"):
            # Check if the AI used the "redacted" format instead of the tag
            # We recreate the redacted pattern used in mask_pipeline
            protected_words = ["UNIVERSITY", "INSTITUTE", "COLLEGE", "SCHOOL", "BANK", "LTD", "LIMITED"]
            words = original.split()
            redacted_version = " ".join(["****" if w.upper() not in protected_words else w for w in words])
            
            # If the AI used the redacted version, swap it back to original
            if redacted_version in rehydrated:
                rehydrated = rehydrated.replace(redacted_version, original)

    # --- 2. HANDLE STANDARD PLACEHOLDERS (e.g., <NAME_1>, <PHONE_1>) ---
    # Sort keys by length (longest first) to prevent partial replacement 
    # (e.g., replacing <NAME_1> inside <NAME_10>)
    sorted_placeholders = sorted(vault_map.keys(), key=len, reverse=True)

    for placeholder in sorted_placeholders:
        original_value = vault_map[placeholder]
        
        # Escape the placeholder for regex safety
        pattern_str = re.escape(placeholder).replace(r'\ ', r'\s*')
        # Allow optional spaces after the opening bracket and before the closing bracket
        # This handles LLMs that might output < NAME_1 > or <name_1>
        flexible_pattern = pattern_str.replace('<', r'<\s*').replace('>', r'\s*>')
        
        rehydrated = re.sub(flexible_pattern, original_value, rehydrated, flags=re.IGNORECASE)

    return rehydrated