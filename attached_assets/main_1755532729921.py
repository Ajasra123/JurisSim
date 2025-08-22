import os, uuid, io, json
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, PlainTextResponse
from .models import Case, RunConfig
from .ingest import load_text_from_path, split_chunks
from .orchestrator import run_sim

app = FastAPI(title="AI Courtroom Simulator (Local + Free)",
              description="Educational only – not legal advice.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

CASES = {}  # in-memory store for hackathon demo

@app.post("/api/cases")
def create_case(title: str = "New Case") -> dict:
    case_id = str(uuid.uuid4())[:8]
    CASES[case_id] = Case(id=case_id, title=title)
    return {"case_id": case_id}

@app.post("/api/cases/{case_id}/upload")
async def upload(case_id: str, file: UploadFile = File(...)):
    if case_id not in CASES: raise HTTPException(404, "case not found")
    path = f"/tmp/{case_id}_{file.filename}"
    with open(path, "wb") as f: f.write(await file.read())
    text = load_text_from_path(path)
    if not text.strip(): raise HTTPException(400, "No extractable text in file")
    CASES[case_id].raw_text = text
    CASES[case_id].chunks = split_chunks(text, 900, 120)
    return {"ok": True, "chars": len(text), "chunks": len(CASES[case_id].chunks)}

@app.post("/api/cases/{case_id}/run")
def run(case_id: str, cfg: RunConfig = RunConfig()):
    if case_id not in CASES: raise HTTPException(404, "case not found")
    case = CASES[case_id]
    if not case.chunks: raise HTTPException(400, "Upload and index case first")
    case.transcript.clear(); case.verdict=None
    run_sim(case, cfg)
    return {"ok": True, "verdict": case.verdict}

@app.get("/api/cases/{case_id}/transcript")
def transcript(case_id: str):
    if case_id not in CASES: raise HTTPException(404, "case not found")
    return JSONResponse([t for t in CASES[case_id].transcript])

@app.get("/api/cases/{case_id}/export.txt")
def export_txt(case_id: str):
    if case_id not in CASES: raise HTTPException(404, "case not found")
    case = CASES[case_id]
    buf = io.StringIO()
    buf.write(f"Case: {case.title}\n\n")
    for t in case.transcript:
        buf.write(f"[{t['phase'].upper()}] {t['role']}:\n{t['text']}\n\n")
    if case.verdict:
        buf.write("VERDICT:\n" + json.dumps(case.verdict, ensure_ascii=False, indent=2))
    buf.seek(0)
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/plain",
        headers={"Content-Disposition":"attachment; filename=transcript.txt"})
