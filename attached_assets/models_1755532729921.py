from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class RunConfig(BaseModel):
    strictness: float = 0.5
    max_turns: int = 8
    temperature: float = 0.3
    model: str = "llama3.1:8b"
    seed: int = 7

class Case(BaseModel):
    id: str
    title: str = "Untitled Case"
    raw_text: str = ""
    chunks: List[str] = []
    transcript: List[Dict[str, Any]] = []
    verdict: Optional[Dict[str, Any]] = None
