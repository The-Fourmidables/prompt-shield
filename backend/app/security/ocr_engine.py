# app/security/ocr_engine.py
import easyocr
import fitz  # PyMuPDF
import io

# Initialize EasyOCR once
ocr_reader = easyocr.Reader(['en'], gpu=False) 

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """
    Router: Sends PDFs to PyMuPDF and Images to EasyOCR
    """
    filename = filename.lower()
    
    if filename.endswith(".pdf"):
        return _extract_from_pdf(file_bytes)
    elif filename.endswith((".jpg", ".jpeg", ".png", ".bmp", ".webp")):
        return _extract_from_image(file_bytes)
    else:
        return "" 

def _extract_from_image(file_bytes: bytes) -> str:
    """
    Extracts text from Images using EasyOCR.
    """
    try:
        # detail=0 returns list of strings, paragraph=True merges them
        result = ocr_reader.readtext(file_bytes, detail=0, paragraph=True)
        return " ".join(result)
    except Exception as e:
        print(f"OCR Error: {e}")
        return ""

def _extract_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts text from PDF.
    Includes Fallback: If a page has no text (it's scanned), 
    it renders the page as an image and uses EasyOCR.
    """
    try:
        text_content = []
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            for page in doc:
                # 1. Try generic text extraction (fast)
                text = page.get_text()
                
                # 2. Check if the page is empty (scanned image?)
                if not text.strip():  
                    # Render page as an image (PNG)
                    pix = page.get_pixmap()
                    img_bytes = pix.tobytes("png")
                    
                    # 3. Use our existing OCR helper on this page image
                    text = _extract_from_image(img_bytes)
                
                text_content.append(text)
                
        return "\n".join(text_content)
    except Exception as e:
        print(f"PDF Error: {e}")
        return ""