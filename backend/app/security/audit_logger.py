import logging
import json
from datetime import datetime, timezone

# Configure logging to write to a file named 'audit.log'
logging.basicConfig(
    filename='audit.log',
    level=logging.INFO,
    format='%(message)s' # We will log as JSON strings
)

logger = logging.getLogger("PromptShieldAudit")

def log_event(event_type: str, masked_prompt: str):
    """
    Logs security events in a structured JSON format.
    Ensures that ONLY masked data is recorded.
    """
    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": event_type,
        "masked_prompt": masked_prompt,
        "version": "1.0"
    }
    
    # Log to file in JSON format for easy ingestion by SIEM tools
    logger.info(json.dumps(log_entry))
    
    # Optional: still print to console for your debugging
    print(f"DEBUG [Audit]: {event_type} - {masked_prompt[:50]}...")