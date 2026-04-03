"""
ocr_processor.py  -  OCR Pre-Processing Layer (PRODUCTION SAFE)

FIXED:
  - Safe OCR wrapper (prevents crashes)
  - Image parsing protected
  - OCR failures return empty text instead of killing API
"""

import os
import io
from typing import Tuple

# ── Tesseract OCR ─────────────────────────────────────────────────────────────
try:
    import pytesseract
    from PIL import Image

    # Windows: set Tesseract path explicitly (ignored in Linux/Render)
    tesseract_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(tesseract_path):
        pytesseract.pytesseract.tesseract_cmd = tesseract_path

    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

# ── PDF libraries ─────────────────────────────────────────────────────────────
try:
    from pypdf import PdfReader
    PYPDF_AVAILABLE = True
except ImportError:
    PYPDF_AVAILABLE = False

try:
    from pdf2image import convert_from_bytes
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    PDF2IMAGE_AVAILABLE = False


SUPPORTED_IMAGE_TYPES = {
    "image/png", "image/jpeg", "image/jpg",
    "image/bmp", "image/tiff", "image/webp",
}

SUPPORTED_PDF_TYPES = {"application/pdf"}


# 🔴 SAFE OCR WRAPPER (CRITICAL)
def safe_ocr(image):
    try:
        config = "--oem 3 --psm 6"
        text = pytesseract.image_to_string(image, config=config, lang="eng")
        return text.strip() if text and text.strip() else ""
    except Exception as e:
        print(f"OCR failed: {e}")
        return ""


class OCRProcessor:

    def extract_text_from_image(self, file_bytes: bytes, filename: str = "") -> Tuple[str, str]:
        if not TESSERACT_AVAILABLE:
            raise RuntimeError(
                "pytesseract or Pillow not installed.\n"
                "Run: pip install pytesseract Pillow"
            )

        # 🔴 Protect image loading
        try:
            image = Image.open(io.BytesIO(file_bytes))
        except Exception as e:
            raise RuntimeError(f"Invalid image file: {str(e)}")

        # Normalize format
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")

        text = safe_ocr(image)

        return text, "tesseract_ocr"

    def extract_text_from_pdf(self, file_bytes: bytes) -> Tuple[str, str]:
        # ── Method 1: Digital PDF ────────────────────────────────────────────
        if PYPDF_AVAILABLE:
            try:
                reader = PdfReader(io.BytesIO(file_bytes))
                text = ""
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n\n"

                if len(text.strip()) > 50:
                    return text.strip(), "digital_pdf"
            except Exception:
                pass

        # ── Method 2: OCR scanned PDF ───────────────────────────────────────
        if PDF2IMAGE_AVAILABLE and TESSERACT_AVAILABLE:
            try:
                images = convert_from_bytes(file_bytes, dpi=300)
                text = ""

                for i, image in enumerate(images):
                    page_text = safe_ocr(image)
                    text += f"[Page {i+1}]\n{page_text}\n\n"

                return text.strip(), "ocr_scanned_pdf"

            except Exception as e:
                raise RuntimeError(f"OCR failed on scanned PDF: {str(e)}")

        raise RuntimeError(
            "Cannot extract text from PDF.\n"
            "Install: pip install pypdf pdf2image pytesseract"
        )

    def is_supported(self, content_type: str) -> bool:
        return content_type in SUPPORTED_IMAGE_TYPES | SUPPORTED_PDF_TYPES

    def get_file_type(self, content_type: str) -> str:
        if content_type in SUPPORTED_IMAGE_TYPES:
            return "image"
        if content_type in SUPPORTED_PDF_TYPES:
            return "pdf"
        return "unknown"