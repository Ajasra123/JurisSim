import json, yaml
from typing import Dict, Any, List
from .llm import chat_text, chat_json
from .retriever import top_k
from .prompts import *
from .models import Case, RunConfig

def load_kb():
    import importlib.resources as pkg
    from . import legal_kb
    path = str(pkg.files('app') / 'legal_kb.yaml')
    return yaml.safe_load(open(path, 'r', encoding='utf-8'))['principles']

KB = load_kb()

def kb_context() -> str:
    return "\n".join([f"[{p['id']}] {p['title']}: {p['text']}" for p in KB])

def make_context(query: str, chunks: List[str], k=5) -> str:
    pairs = top_k(query, chunks, k)
    lines = [f"[doc:{i}] {chunk}" for i,chunk in pairs]
    return "\n".join(lines) + "\n" + kb_context()

def add_log(case: Case, phase: str, role: str, text: str):
    cites = [c for c in set([p for p in __import__('re').findall(r"\[(doc:\d+|kb:[^\]]+)\]", text)])]
    case.transcript.append({"phase": phase, "role": role, "text": text, "citations": cites})

def run_sim(case: Case, cfg: RunConfig) -> Case:
    model = cfg.model
    temp = cfg.temperature

    # Opening statements
    ctx = make_context("facts issues elements burden doubt", case.chunks, k=6)
    p_open = chat_text(model, PROS_SYS, OPENING_USER.format(context=ctx), temp)
    add_log(case, "opening", "Prosecution", p_open)
    d_open = chat_text(model, DEF_SYS, OPENING_USER.format(context=ctx), temp)
    add_log(case, "opening", "Defense", d_open)

    # Evidence
    ctx = make_context("evidence cctv witness marketplace phone number hoodie fingerprints", case.chunks, k=6)
    p_evid = chat_text(model, PROS_SYS, EVIDENCE_USER.format(context=ctx), temp)
    add_log(case, "evidence", "Prosecution", p_evid)
    d_evid = chat_text(model, DEF_SYS, EVIDENCE_USER.format(context=ctx), temp)
    add_log(case, "evidence", "Defense", d_evid)

    # Cross
    ctx = make_context("credibility reliability inconsistencies doubt", case.chunks, k=6)
    p_cross = chat_text(model, PROS_SYS, CROSS_USER.format(context=ctx), temp)
    add_log(case, "cross", "Prosecution", p_cross)
    d_cross = chat_text(model, DEF_SYS, CROSS_USER.format(context=ctx), temp)
    add_log(case, "cross", "Defense", d_cross)

    # Closing
    ctx = make_context("summary closing reasonable doubt burden", case.chunks, k=6)
    p_close = chat_text(model, PROS_SYS, CLOSING_USER.format(context=ctx), temp)
    add_log(case, "closing", "Prosecution", p_close)
    d_close = chat_text(model, DEF_SYS, CLOSING_USER.format(context=ctx), temp)
    add_log(case, "closing", "Defense", d_close)

    # Jury verdict
    ctx = make_context("weigh evidence verdict", case.chunks, k=6)
    jury = chat_json(model, JURY_SYS, JURY_USER.format(context=ctx), temp)
    case.verdict = jury
    add_log(case, "verdict", "Jury", json.dumps(jury, ensure_ascii=False))

    # Judge opinion
    ctx = make_context("opinion reasoning law facts", case.chunks, k=6)
    judge = chat_text(model, JUDGE_SYS, OPINION_USER.format(context=ctx), temp)
    add_log(case, "opinion", "Judge", judge)

    return case
