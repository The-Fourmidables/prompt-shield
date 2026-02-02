# app/mask_pipeline.py
import spacy
from app.masking import mask_text
from collections import defaultdict

# =========================================================
# 1. ROBUST MODEL LOADING
# =========================================================
nlp = None
print("⏳ Initializing AI Security Engine...")

try:
    nlp = spacy.load("./my_custom_model")
    print("✅ ACADEMIC/CUSTOM Model Loaded!")
except OSError:
    try:
        nlp = spacy.load("en_core_web_lg")
        print("✅ Standard Large Model Loaded.")
    except OSError:
        try:
            import en_core_web_lg
            nlp = en_core_web_lg.load()
            print("✅ Large Model Loaded via Direct Import.")
        except ImportError:
            try:
                nlp = spacy.load("en_core_web_sm")
                print("⚠️ Warning: Running on Small Model.")
            except:
                print("❌ CRITICAL: No AI model found.")

# =========================================================
# 2. THE MASTER IGNORE & PROTECT LISTS
# =========================================================

# Words that stay visible even inside an Organization name
PROTECTED_ORG_WORDS = {
    "UNIVERSITY", "INSTITUTE", "COLLEGE", "SCHOOL", "ACADEMY", 
    "BANK", "LIMITED", "LTD", "PVT", "BOARD"
}

IGNORE_LIST = {
    # --- 1. GOVERNMENT IDS & KYC ---
    "AADHAAR", "UID", "UIDAI", "E-AADHAAR",
    "PAN", "PERMANENT", "ACCOUNT", "NUMBER", "TAX",
    "PASSPORT", "VISA", "IMMIGRATION",
    "VOTER", "EPIC", "ELECTION",
    "DRIVING", "LICENSE", "DL", "RTO",
    "LANG FASTTRACK", "RATION", "CARD",
    "GST", "GSTIN", "VAT", "TIN", "TAN",
    "DIN", "CIN", "LLPIN", 
    # Corporate IDs
    "KYC", "CKYC", "OKYC", "VERIFICATION",

    # --- 2. BANKING & PAYMENTS ---
    "NBFC", "RBI",
    "IFSC", "MICR", "SWIFT", "IBAN", "ROUTING",
    "UPI", "VPA", "BHIM", "GPAY", "PHONEPE", "PAYTM",
    "NEFT", "RTGS", "IMPS", "ACH", "ECS", "NACH",
    "CHEQUE", "DD", "DEMAND", "DRAFT",
    "SAVINGS", "CURRENT", "OD", "OVERDRAFT", "LOAN",
    "CREDIT", "DEBIT", "VISA", "MASTERCARD", "RUPAY", "AMEX",
    "CVV", "CVC", "PIN", "EXPIRY", "VALID", "THRU",
    "WALLET", "CASH", "CURRENCY", "INR", "USD", "FOREX",
    "TRANSFER", "ATM", "HOUSE", "ACCOUNT"

    # --- 3. TRANSACTION TERMINOLOGY ---
    "TRANSACTION", "REF", "REFERENCE", "UTR", "ID",
    "BALANCE", "AVAILABLE", "LEDGER", "LIEN",
    "DEPOSIT", "WITHDRAWAL", "TRANSFER", "PAYMENT",
    "AMOUNT", "TOTAL", "SUBTOTAL", "GRAND", "NET",
    "DEBITED", "CREDITED", "PAID", "RECEIVED",
    "BILL", "INVOICE", "RECEIPT", "ORDER", "PO",
    "STATEMENT", "SUMMARY", "NARRATION", "REMARKS",
    "BENEFICIARY", "REMITTER", "PAYEE", "PAYER",
    "MERCHANT", "VENDOR", "BILLER",
    "DATE", "TIME", "PERIOD", "FROM", "TO",

    # --- 4. GENERIC LABELS (To stop "Phone" -> <ORG>) ---
    "PHONE", "MOBILE", "CELL", "CONTACT", "TEL", "FAX",
    "EMAIL", "GMAIL", "WEBSITE", "URL", "HTTP", "HTTPS",
    "ADDRESS", "RESIDENCE", "OFFICE", "PERMANENT",
    "NAME", "FATHER", "MOTHER", "SPOUSE", "NOMINEE",
    "RELATION", "GUARDIAN", "DOB", "BIRTH", "GENDER",
    "AGE", "NATIONALITY", "CITIZENSHIP", "MARITAL",
    "STATUS", "PROFESSION", "OCCUPATION",
    
    # --- 5. COMMON SUBJECTS (Engineering & Science) ---
    "PHYSICS", "CHEMISTRY", "MATH", "MATHEMATICS", "ENGLISH",
    "BIOLOGY", "ZOOLOGY", "BOTANY", "BIOTECHNOLOGY",
    "SCIENCE", "SOCIAL", "HISTORY", "GEOGRAPHY", "CIVICS",
    "ECONOMICS", "COMMERCE", "ACCOUNTANCY", "BUSINESS",
    "HINDI", "SANSKRIT", "FRENCH", "GERMAN", "LANGUAGE",
    
    # --- 6. ENGINEERING SPECIALIZATIONS (User Specific) ---
    "ENGINEERING", "TECH", "BTECH", "MTECH", "BCA", "MCA",
    "COMPUTER", "CSE", "IT", "INFORMATION", "SOFTWARE", "HARDWARE",
    "ELECTRONICS", "ELECTRICAL", "ECE", "EEE", "MECHANICAL", "CIVIL",
    "MICROELECTRONICS", "VLSI", "EMBEDDED", "SYSTEMS",
    "CONTROL", "SIGNAL", "PROCESSING", "DSP", "ANALOG", "DIGITAL",
    "COMMUNICATION", "NETWORKING", "NETWORK", "WIRELESS",
    "TRANSMISSION", "LINES", "ANTENNA", "WAVEGUIDES",
    "ROBOTICS", "AI", "ARTIFICIAL", "INTELLIGENCE", "ML", "DATA",
    "ALGORITHMS", "STRUCTURES", "DBMS", "SQL", "CLOUD", "CYBER",
    "SECURITY", "IOT", "BLOCKCHAIN", "PYTHON", "JAVA", "CPP", "PROGRAMMING",
    # --- 7. ACADEMIC DOCUMENT TERMS ---
    "CAMPUS", "SUPPLEMENTARY", "REGULAR", "PRIVATE",
    "DEPARTMENT", "FACULTY", "STUDENT", "SCHOLAR",
    "ROLL", "ENROLLMENT", "REGISTRATION", "ADMISSION",
    "CERTIFICATE", "DEGREE", "DIPLOMA", "TRANSCRIPT", "MARKSHEET",
    "SEMESTER", "SEM", "YEAR", "ANNUAL", "SESSION", "BATCH",
    "EXAMINATION", "EXAM", "TEST", "MID", "END", "FINAL",
    "REAPPEAR", "BACKLOG",
    
    # --- 8. GRADING & EVALUATION ---
    "MARKS", "GRADE", "SCORE", "POINT", "PERCENTAGE", "PERCENTILE",
    "CGPA", "SGPA", "GPA", "CREDIT", "CREDITS",
    "INTERNAL", "EXTERNAL", "THEORY", "PRACTICAL", "LAB", "LABORATORY",
    "VIVA", "VOCE", "PROJECT", "ASSIGNMENT", "SEMINAR", "WORKSHOP",
    "RESULT", "PASS", "FAIL", "ABSENT", "DETAINED",
    "DIVISION", "DISTINCTION", "MERIT", "RANK",
    "TOTAL", "OBTAINED", "MAXIMUM", "MINIMUM", "AGGREGATE",
    
    # --- 9. MISC ACADEMIC WORDS ---
    "PAPER", "CODE", "SUBJECT", "TOPIC", "UNIT", "MODULE",
    "SYLLABUS", "CURRICULUM", "COURSE", "BRANCH", "STREAM",
    "LECTURE", "TUTORIAL", "TEACHER", "PROFESSOR", "HOD", "DEAN",
    "PRINCIPAL", "CHANCELLOR", "REGISTRAR", "CONTROLLER"
}

SKILLS_AND_TECH = {
    # Programming & Tools
    "PYTHON", "GOLANG", "JAVA", "JAVASCRIPT", "CPP", "CSS", "HTML", "SQL",
    "ARDUINO", "MATLAB", "VIVADO", "XILINX", "FPGA", "VERILOG", "VHDL",
    "AUTODESK", "MAYA", "CANVA", "BLENDER", "SOLIDWORKS",
    
    # Domains & Departments
    "ECE", "CSE", "IT", "EEE", "DEPARTMENT", "DEPT", "ENGINEERING",
    "COMMUNICATION", "PROGRAMMING", "LANGUAGES", "EDUCATION", "TRAINED",
    
    # Generic junk words found in your logs
    "TEAM", "LEAD", "FEST", "SEC", "MORSE", "LOGICX", "TRAINING"
}

# Merge with your existing IGNORE_LIST
IGNORE_LIST.update(SKILLS_AND_TECH)


# =========================================================
# 3. THE MASKING LOGIC
# =========================================================
def full_mask(text: str):
    # Pass 1: Regex (Strict Rules for IDs like UPI/Phone)
    masked_text, vault_map = mask_text(text)

    counters = defaultdict(int)
    for key in vault_map.keys():
        label = key.split('_')[0].strip('<')
        counters[label] += 1

    # Pass 2: AI / NLP (Smart Context)
    if nlp:
        doc = nlp(masked_text)
        # Sort entities by length (Longest first) to prevent partial overlapping
        entities = sorted(doc.ents, key=lambda x: len(x.text), reverse=True)

        for ent in entities:
            original = ent.text.strip()
            
            # Skip if it's a simple label in our Ignore List
            if original.upper() in IGNORE_LIST:
                continue

            # Skip garbage/short matches or already masked tags
            if len(original) < 3 or "<" in original: 
                continue

            # --- SPECIAL HANDLING FOR ORGANIZATIONS (Redaction Style) ---
            if ent.label_ == "ORG":
                if original in vault_map.values(): continue

                words = original.split()
                new_parts = []
                
                for word in words:
                    # Clean punctuation like commas or dots for checking
                    clean_word = "".join(filter(str.isalnum, word.upper()))
                    if clean_word in PROTECTED_ORG_WORDS:
                        new_parts.append(word) 
                    else:
                        new_parts.append("****") 

                placeholder_text = " ".join(new_parts)
                
                # If everything became ****, fallback to standard tag
                if all(p == "****" for p in new_parts):
                    counters["ORG"] += 1
                    placeholder_text = f"<ORG_{counters['ORG']}>"

                # Store in vault
                counters["ORG"] += 1
                key = f"<ORG_{counters['ORG']}>"
                vault_map[key] = original
                
                masked_text = masked_text.replace(original, placeholder_text)

            # --- STANDARD HANDLING FOR PERSON/LOCATION ---
            elif ent.label_ in ["PERSON", "GPE", "LOC"]:
                if original in vault_map.values(): continue
                
                label_map = {"PERSON": "NAME", "GPE": "LOCATION", "LOC": "LOCATION"}
                my_label = label_map.get(ent.label_, "ENTITY")
                
                counters[my_label] += 1
                placeholder = f"<{my_label}_{counters[my_label]}>"
                
                vault_map[placeholder] = original
                masked_text = masked_text.replace(original, placeholder)

    return masked_text, vault_map