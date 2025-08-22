# ultra-light keyword retriever (no extra libs)
from typing import List, Tuple
import re
from collections import Counter

def normalize(s: str) -> List[str]:
    s = s.lower()
    tokens = re.findall(r"[a-z0-9']+", s)
    stop = set(['the','a','an','of','to','and','is','in','on','for','at','by','with','be','are','as','it','that','this','from'])
    return [t for t in tokens if t not in stop and len(t)>1]

def score(query: str, chunk: str) -> float:
    q = Counter(normalize(query))
    c = Counter(normalize(chunk))
    return sum(q[w]*c.get(w,0) for w in q)

def top_k(query: str, chunks: List[str], k: int=5) -> List[Tuple[int,str]]:
    ranked = sorted([(i, chunks[i], score(query, chunks[i])) for i in range(len(chunks))], key=lambda x: x[2], reverse=True)
    return [(i,c) for i,c,_ in ranked[:k] if _>0]
