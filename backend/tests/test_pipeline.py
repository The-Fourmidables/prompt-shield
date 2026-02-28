"""
test_pipeline.py  –  Comprehensive tests for PII / PHI / PCI masking

Run from project root:  python tests/test_pipeline.py
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.masker import PIIMasker
from app.rehydrator import Rehydrator

masker = PIIMasker()
rehydrator = Rehydrator()

TEST_CASES = [

    # ── PII ──────────────────────────────────────────────────────────────────
    {
        "label": "Aadhaar Number",
        "text": "My Aadhaar is 2345 6789 0123",
    },
    {
        "label": "PAN Card",
        "text": "PAN number: ABCDE1234F",
    },
    {
        "label": "Passport",
        "text": "Passport no: A1234567",
    },
    {
        "label": "Voter ID",
        "text": "Voter ID: ABC1234567",
    },
    {
        "label": "Driving License",
        "text": "DL: MH-01-2011-0001234",
    },
    {
        "label": "Vehicle Registration",
        "text": "My car number is MH 01 AB 1234",
    },
    {
        "label": "Email",
        "text": "Contact me at john.doe@gmail.com",
    },
    {
        "label": "Indian Phone",
        "text": "Call me on +91 9876543210",
    },
    {
        "label": "Pincode",
        "text": "I live in area 400001",
    },
    {
        "label": "Date of Birth",
        "text": "DOB: 15/08/1995",
    },
    {
        "label": "Age",
        "text": "Patient aged 34 years",
    },
    {
        "label": "Gender",
        "text": "Gender: Female",
    },
    {
        "label": "IP Address",
        "text": "Server IP is 192.168.1.100",
    },
    {
        "label": "MAC Address",
        "text": "MAC: 00:1A:2B:3C:4D:5E",
    },
    {
        "label": "URL",
        "text": "Visit https://mybank.com/account?id=12345",
    },
    {
        "label": "US SSN",
        "text": "SSN: 123-45-6789",
    },

    # ── PHI ──────────────────────────────────────────────────────────────────
    {
        "label": "Medical Record Number",
        "text": "MRN: MED-2024-00123",
    },
    {
        "label": "Patient ID",
        "text": "Patient ID: PT-9087",
    },
    {
        "label": "ABHA Number",
        "text": "ABHA: 91-1234-5678-9012",
    },
    {
        "label": "Blood Type",
        "text": "Blood group: B+ve",
    },
    {
        "label": "Diagnosis",
        "text": "Diagnosis: Type 2 Diabetes",
    },
    {
        "label": "Medication",
        "text": "Medication: Metformin 500mg",
    },
    {
        "label": "Dosage",
        "text": "Take 250mg twice daily",
    },
    {
        "label": "Allergy",
        "text": "Allergic to Penicillin",
    },
    {
        "label": "Weight",
        "text": "Weight: 72 kg",
    },
    {
        "label": "Height",
        "text": "Height: 175 cm",
    },
    {
        "label": "Doctor Name",
        "text": "Referred by Dr. Rajesh Sharma",
    },
    {
        "label": "Hospital Name",
        "text": "Admitted to hospital: Apollo Hospitals",
    },
    {
        "label": "Health Insurance",
        "text": "Health insurance ID: HI-2023-456789",
    },

    # ── PCI ──────────────────────────────────────────────────────────────────
    {
        "label": "Visa Card",
        "text": "Card: 4111111111111111",
    },
    {
        "label": "Mastercard",
        "text": "Card no: 5500005555555559",
    },
    {
        "label": "Amex",
        "text": "Amex: 371449635398431",
    },
    {
        "label": "Card Expiry",
        "text": "Expiry: 08/27",
    },
    {
        "label": "CVV",
        "text": "CVV: 456",
    },
    {
        "label": "Bank Account",
        "text": "Account number: 123456789012",
    },
    {
        "label": "IFSC Code",
        "text": "IFSC: HDFC0001234",
    },
    {
        "label": "UPI ID",
        "text": "Pay to: rahul.sharma@paytm",
    },
    {
        "label": "IBAN",
        "text": "IBAN: GB29NWBK60161331926819",
    },
    {
        "label": "Net Banking ID",
        "text": "Net banking ID: MYUSER123",
    },

    # ── Secrets ───────────────────────────────────────────────────────────────
    {
        "label": "OpenAI API Key",
        "text": "key = sk-abcdefghijklmnopqrstuvwxyz123456",
    },
    {
        "label": "AWS Access Key",
        "text": "AWS Access Key: AKIAIOSFODNN7EXAMPLE",
    },
    {
        "label": "GitHub Token",
        "text": "Token: ghp_abcdefghijklmnopqrstuvwxyz123456",
    },
    {
        "label": "Password in text",
        "text": "password: MySecret@123",
    },
    {
        "label": "Generic API Key",
        "text": "api_key = abcdef1234567890abcdef",
    },

    # ── Rehydration round-trip ────────────────────────────────────────────────
    {
        "label": "Full round-trip rehydration",
        "text": "Patient Priya Patel, DOB 20/01/1990, blood group O+ve, "
                "diagnosed with Hypertension, takes Amlodipine 5mg. "
                "Contact: priya@gmail.com, +91 9812345678. "
                "Card: 4111111111111111, IFSC: SBIN0001234",
    },
]


def run_tests():
    print("=" * 70)
    print("Prompt Shield – Comprehensive PII / PHI / PCI Tests")
    print("=" * 70)

    passed = 0
    failed = 0

    for tc in TEST_CASES:
        print(f"\n🔍 [{tc['label']}]")
        print(f"   Input     : {tc['text']}")

        masked, entity_map, session_id = masker.mask(tc["text"])
        print(f"   Masked    : {masked}")

        if entity_map:
            for orig, info in entity_map.items():
                print(f"   ✅ {info['type']} | {info['name']} → {info['placeholder']}")
            passed += 1
        else:
            print(f"   ⚠️  No entities detected!")
            failed += 1

        # Rehydration test
        rehydrated = rehydrator.rehydrate(masked, entity_map)
        match = (rehydrated == tc["text"])
        status = "✅" if match else "⚠️ "
        print(f"   Rehydrated: {rehydrated}  {status}")

        masker.clear_session(session_id)

    print("\n" + "=" * 70)
    print(f"Results: {passed} detected, {failed} missed")
    print("=" * 70)


if __name__ == "__main__":
    run_tests()
