"""
impact_logic.py - Logic for calculating the "Compliance Value" of masked data.
Based on average GDPR/HIPAA/DPDP fines for PII leaks.
"""

# Average estimated "cost" of a single leak in USD (based on compliance risk)
RISK_VALUATION = {
    # High Risk (Identity/Financial)
    "AADHAAR": 500,
    "PAN": 500,
    "CREDIT_CARD": 800,
    "INDIAN_BANK_ACCOUNT": 600,
    "SSN": 1000,
    "PRIVATE_KEY": 2500,
    "DB_CREDENTIAL": 3000,
    "API_KEY": 1500,
    
    # Medium Risk (Contact/PII)
    "EMAIL": 50,
    "PHONE": 75,
    "UPI_ID": 150,
    "IPV4_ADDRESS": 100,
    "JWT_TOKEN": 500,
    
    # General
    "PII": 25,
    "PHI": 500,
    "SECRET": 1000,
}

def calculate_impact(entity_map: dict) -> dict:
    """
    Analyzes the entity map and returns a summary of the 'Impact'.
    """
    total_value = 0
    categories = {
        "Financial": 0,
        "Identity": 0,
        "Secrets": 0,
        "Contact": 0
    }
    
    for info in entity_map.values():
        name = info.get("name", "PII")
        type_ = info.get("type", "PII")
        
        # Get base value
        value = RISK_VALUATION.get(name, RISK_VALUATION.get(type_, 10))
        total_value += value
        
        # Categorize
        if name in ["CREDIT_CARD", "INDIAN_BANK_ACCOUNT", "UPI_ID", "PAN"]:
            categories["Financial"] += 1
        elif name in ["AADHAAR", "SSN", "DOB", "GENDER"]:
            categories["Identity"] += 1
        elif type_ in ["API_KEY", "SECRET", "DB_CREDENTIAL"]:
            categories["Secrets"] += 1
        else:
            categories["Contact"] += 1
            
    return {
        "total_risk_mitigated": total_value,
        "entities_blocked": len(entity_map),
        "breakdown": categories
    }
