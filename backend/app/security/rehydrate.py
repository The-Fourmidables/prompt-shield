import re

def rehydrate(masked_text: str, vault_map: dict) -> str:
    if not vault_map:
        return masked_text

    rehydrated = masked_text

    # 1. Prepare Category Lists
    # We create a map like: {'ORG': ['Amazon', 'UPI ID'], 'NAME': ['Riya Sharma']}
    categories = {}
    for placeholder, value in vault_map.items():
        # Get just the letters (e.g., "<NAME_1>" -> "NAME")
        tag_type = re.sub(r'[^A-Z]', '', placeholder.upper())
        if tag_type not in categories:
            categories[tag_type] = []
        categories[tag_type].append(value)

    # 2. Aggressive Replacement Function
    def aggressive_replace(match):
        raw_tag = match.group(0)
        
        # A. Try exact match first (case-insensitive)
        for p_key, p_val in vault_map.items():
            if raw_tag.strip().upper() == p_key.strip().upper():
                return p_val

        # B. Smart Category Fallback
        # Extract just the type (e.g., "< org_1 >" -> "ORG")
        tag_type = re.sub(r'[^A-Z]', '', raw_tag.upper())
        
        if tag_type in categories and categories[tag_type]:
            # Pull the next available real value for this type
            return categories[tag_type].pop(0)
        
        return raw_tag

    # 3. LOOSE REGEX
    # This pattern catches: <ORG_1>, <org_1>, < ORG_1 >, <ORG_1 Customer Service>
    # It looks for anything starting with < and ending with > containing typical tag words
    loose_pattern = r'<\s*[A-Za-z_]+(?:\s*[^>]*)\d*\s*>'
    
    rehydrated = re.sub(loose_pattern, aggressive_replace, rehydrated)

    return rehydrated
# # app/security/rehydrate.py
# import re

# def rehydrate(masked_text: str, vault_map: dict) -> str:
#     """
#     Replace placeholders in LLM response using vault_map.
#     Now handles both <TAG_1> and the '**** Category' redaction style.
#     """
#     if not vault_map:
#         return masked_text

#     rehydrated = masked_text

#     # --- 1. HANDLE REDACTED STRINGS (e.g., "**** Bank" or "**** Institute") ---
#     # We look through the vault to see if any original value was turned into a redacted string
#     # and try to map the AI's version back to the real one.
    
#     # We create a mapping of what the masked text LOOKS like in the document
#     # to what it SHOULD be.
#     for placeholder, original in vault_map.items():
#         if placeholder.startswith("<ORG_"):
#             # Check if the AI used the "redacted" format instead of the tag
#             # We recreate the redacted pattern used in mask_pipeline
#             protected_words = ["UNIVERSITY", "INSTITUTE", "COLLEGE", "SCHOOL", "BANK", "LTD", "LIMITED"]
#             words = original.split()
#             redacted_version = " ".join(["****" if w.upper() not in protected_words else w for w in words])
            
#             # If the AI used the redacted version, swap it back to original
#             if redacted_version in rehydrated:
#                 rehydrated = rehydrated.replace(redacted_version, original)

#     # --- 2. HANDLE STANDARD PLACEHOLDERS (e.g., <NAME_1>, <PHONE_1>) ---
#     # Sort keys by length (longest first) to prevent partial replacement 
#     # (e.g., replacing <NAME_1> inside <NAME_10>)
#     sorted_placeholders = sorted(vault_map.keys(), key=len, reverse=True)

#     for placeholder in sorted_placeholders:
#         original_value = vault_map[placeholder]
        
#         # Escape the placeholder for regex safety
#         pattern_str = re.escape(placeholder).replace(r'\ ', r'\s*')
#         # Allow optional spaces after the opening bracket and before the closing bracket
#         # This handles LLMs that might output < NAME_1 > or <name_1>
#         flexible_pattern = pattern_str.replace('<', r'<\s*').replace('>', r'\s*>')
        
#         rehydrated = re.sub(flexible_pattern, original_value, rehydrated, flags=re.IGNORECASE)

#     return rehydrated