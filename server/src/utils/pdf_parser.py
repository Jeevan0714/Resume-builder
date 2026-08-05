#!/usr/bin/env python3
import sys
import json
import re

def extract_pdf_layout(pdf_path):
    text = ""
    bullets = []
    
    # Try PyMuPDF (fitz) for advanced multi-column layout extraction
    try:
        import fitz
        doc = fitz.open(pdf_path)
        blocks_text = []
        for page in doc:
            # Extract text blocks preserving reading order (multi-column aware)
            blocks = page.get_text("blocks")
            for b in blocks:
                block_content = b[4].strip()
                if block_content:
                    blocks_text.append(block_content)
        text = "\n\n".join(blocks_text)
    except Exception as e:
        # Fallback to pypdf if PyMuPDF not available
        try:
            from pypdf import PdfReader
            reader = PdfReader(pdf_path)
            pages_text = [page.extract_text() for page in reader.pages if page.extract_text()]
            text = "\n\n".join(pages_text)
        except Exception as e2:
            # Standard basic extraction fallback
            text = ""

    text = text.strip()
    if not text:
        return {"error": "Could not extract text from PDF."}

    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    # Filter project and technical achievement bullets
    for l in lines:
        is_bullet = bool(re.match(r'^[•\-\*\d+\.]\s*', l)) or bool(re.match(r'^(designed|built|developed|engineered|implemented|analyzed|integrated|managed|created|executed)', l, re.I))
        is_valid_len = len(l) > 25
        is_not_contact = ('@' not in l) and ('linkedin' not in l.lower()) and ('don bosco' not in l.lower())
        if (is_bullet or is_valid_len) and is_not_contact:
            bullets.append(l)

    word_count = len(text.split())

    return {
        "fullText": text,
        "bullets": bullets[:12],
        "wordCount": word_count,
        "extractor": "Python PyMuPDF Layout Engine"
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "PDF file path required."}))
        sys.exit(1)
        
    pdf_file = sys.argv[1]
    result = extract_pdf_layout(pdf_file)
    print(json.dumps(result))
