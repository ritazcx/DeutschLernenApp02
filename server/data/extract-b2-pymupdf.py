import fitz  # PyMuPDF
import re

def extract_pdf_with_layout(pdf_path, output_path):
    """Extract text from PDF preserving layout and structure"""
    doc = fitz.open(pdf_path)
    
    all_text = []
    page_count = len(doc)
    
    for page_num in range(page_count):
        page = doc[page_num]
        
        # Extract text with layout preservation
        text = page.get_text("text")
        
        if text.strip():
            all_text.append(f"--- Page {page_num + 1} ---")
            all_text.append(text)
    
    doc.close()
    
    # Join all text
    full_text = "\n".join(all_text)
    
    # Save to file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(full_text)
    
    print(f"✓ Extracted text from {page_count} pages")
    print(f"✓ Saved to {output_path}")
    print(f"✓ Total characters: {len(full_text)}")
    
    # Show first 3000 characters as sample
    print("\n--- Sample (first 3000 chars) ---")
    print(full_text[:3000])

if __name__ == "__main__":
    pdf_path = "Akademie_Deutsch_B2_Wortliste.pdf"
    output_path = "b2-raw-text-pymupdf.txt"
    extract_pdf_with_layout(pdf_path, output_path)
