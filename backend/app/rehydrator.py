"""
rehydrator.py  –  Local Re-hydration Layer

Scans the LLM's response for placeholders like <Email1>, <Aadhaar2> etc.
and replaces them with the original real values stored in entity_map.

This step happens entirely locally — no real data ever leaves the device.
"""

import re
from typing import Dict


class Rehydrator:

    def rehydrate(self, llm_response: str, entity_map: Dict[str, dict]) -> str:
        """
        entity_map structure (keyed by ORIGINAL value):
          {
            "john@example.com": {"placeholder": "<Email1>", "type": "PII", "name": "EMAIL"},
            "9876543210":       {"placeholder": "<Phone1>", "type": "PII", "name": "INDIAN_PHONE"},
          }

        We invert this to:  {placeholder -> original_value}
        then do a global string replace on the LLM response.
        """
        if not entity_map:
            return llm_response

        # Build reverse map: placeholder → original
        reverse_map: Dict[str, str] = {
            info["placeholder"]: original
            for original, info in entity_map.items()
        }

        result = llm_response

        # Replace all placeholders (angle-bracket style: <Email1>)
        # Sort by length descending to avoid partial replacement issues
        for placeholder in sorted(reverse_map, key=len, reverse=True):
            original = reverse_map[placeholder]
            # Escape for regex in case placeholder has special chars
            escaped = re.escape(placeholder)
            result = re.sub(escaped, original, result, flags=re.IGNORECASE)

        return result

    def get_placeholder_summary(self, entity_map: Dict[str, dict]) -> list:
        """
        Returns a human-readable list of what was masked.
        Useful for audit logs. Does NOT include original values.
        """
        return [
            {
                "placeholder": info["placeholder"],
                "entity_type": info["type"],
                "pattern_name": info["name"],
            }
            for info in entity_map.values()
        ]
