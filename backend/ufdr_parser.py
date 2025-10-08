import os

def parse_ufdr(file_path: str) -> str:
    """
    Parse UFDR file and extract text content.
    Assumes binary file; decodes with UTF-8 ignoring errors for readable text.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"UFDR file not found: {file_path}")
    
    with open(file_path, 'rb') as f:
        content = f.read()
    
    # Decode binary to text, ignoring non-UTF-8 parts
    text = content.decode('utf-8', errors='ignore')
    
    # Clean up whitespace
    text = ' '.join(text.split())
    
    return text

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    """
    Split text into overlapping chunks for better context in embeddings.
    """
    if not text:
        return []
    
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap
    
    return chunks