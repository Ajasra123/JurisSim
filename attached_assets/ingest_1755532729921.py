from typing import List
from pypdf import PdfReader

def load_text_from_path(path: str) -> str:
    low = path.lower()
    if low.endswith(".pdf"):
        reader = PdfReader(path)
        buf = []
        for p in reader.pages:
            buf.append(p.extract_text() or "")
        return "\n".join(buf)
    else:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

def split_chunks(text: str, size: int=900, overlap: int=120) -> List[str]:
    text = text.replace("\r","")
    chunks = []
    i = 0
    while i < len(text):
        chunk = text[i:i+size]
        chunks.append(chunk.strip())
        i += size - overlap if size>overlap else size
    return [c for c in chunks if c]
