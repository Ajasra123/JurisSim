import json, ollama
from typing import Any

def chat_text(model: str, system: str, user: str, temperature: float = 0.3) -> str:
    resp = ollama.chat(
        model=model,
        options={"temperature": temperature},
        messages=[
            {"role":"system","content":system},
            {"role":"user","content":user},
        ]
    )
    return resp["message"]["content"]

def chat_json(model: str, system: str, user: str, temperature: float = 0.3) -> Any:
    text = chat_text(model, system, user, temperature)
    try:
        return json.loads(text)
    except Exception:
        s = text.find("{"); e = text.rfind("}")
        if s!=-1 and e!=-1:
            return json.loads(text[s:e+1])
        raise
