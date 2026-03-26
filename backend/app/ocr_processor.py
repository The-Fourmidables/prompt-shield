"""
ocr_processor.py  -  OCR Pre-Processing Layer

Extracts text from:
  - Images  : PNG, JPG, JPEG, BMP, TIFF, WEBP
  - PDFs    : Digital (text-based) + Scanned (image-based via OCR)

Requirements:
  pip install pytesseract pdf2image pypdf Pillow
  
  Also install Tesseract OCR engine:
  Windows : https://github.com/UB-Mannheim/tesseract/wiki
            Download installer -> install -> add to PATH
            Default path: C:/Program Files/Tesseract-OCR/tesseract.exe

  After installing Tesseract on Windows, set the path below:
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
"""

import os
import io
from typing import Tuple

# ── Tesseract OCR ─────────────────────────────────────────────────────────────
try:
    import pytesseract
    from PIL import Image

    # Windows: set Tesseract path explicitly
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


class OCRProcessor:

    def extract_text_from_image(self, file_bytes: bytes, filename: str = "") -> Tuple[str, str]:
        """
        Extract text from an image file using Tesseract OCR.
        Returns: (extracted_text, method_used)
        """
        if not TESSERACT_AVAILABLE:
            raise RuntimeError(
                "pytesseract or Pillow not installed.\n"
                "Run: pip install pytesseract Pillow\n"
                "Also install Tesseract: https://github.com/UB-Mannheim/tesseract/wiki"
            )

        image = Image.open(io.BytesIO(file_bytes))

        # Convert to RGB if needed (handles PNG with alpha, etc.)
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")

        # OCR config: improve accuracy
        config = "--oem 3 --psm 6"  # psm 6 = assume uniform block of text
        text = pytesseract.image_to_string(image, config=config, lang="eng")

        return text.strip(), "tesseract_ocr"

    def extract_text_from_pdf(self, file_bytes: bytes) -> Tuple[str, str]:
        """
        Extract text from PDF.
        1. Try digital text extraction first (fast, accurate)
        2. Fall back to OCR if PDF is scanned/image-based
        Returns: (extracted_text, method_used)
        """
        # ── Method 1: Digital PDF text extraction ────────────────────────────
        if PYPDF_AVAILABLE:
            try:
                reader = PdfReader(io.BytesIO(file_bytes))
                text = ""
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n\n"

                # If we got meaningful text, return it
                if len(text.strip()) > 50:
                    return text.strip(), "digital_pdf"
            except Exception:
                pass

        # ── Method 2: OCR for scanned PDFs ───────────────────────────────────
        if PDF2IMAGE_AVAILABLE and TESSERACT_AVAILABLE:
            try:
                images = convert_from_bytes(file_bytes, dpi=300)
                text = ""
                for i, image in enumerate(images):
                    config = "--oem 3 --psm 6"
                    page_text = pytesseract.image_to_string(image, config=config, lang="eng")
                    text += f"[Page {i+1}]\n{page_text}\n\n"
                return text.strip(), "ocr_scanned_pdf"
            except Exception as e:
                raise RuntimeError(f"OCR failed on scanned PDF: {str(e)}")

        raise RuntimeError(
            "Cannot extract text from PDF.\n"
            "Install: pip install pypdf pdf2image pytesseract\n"
            "For scanned PDFs also install poppler:\n"
            "  Windows: https://github.com/oschwartz10612/poppler-windows/releases"
        )

    def is_supported(self, content_type: str) -> bool:
        return content_type in SUPPORTED_IMAGE_TYPES | SUPPORTED_PDF_TYPES

    def get_file_type(self, content_type: str) -> str:
        if content_type in SUPPORTED_IMAGE_TYPES:
            return "image"
        if content_type in SUPPORTED_PDF_TYPES:
            return "pdf"
        return "unknown"
