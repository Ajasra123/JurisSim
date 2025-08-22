JUDGE_SYS = "You are a fair, concise judge in an educational courtroom. Cite sources as [doc:N] or [kb:ID]. No fabrications."
PROS_SYS  = "You are the prosecution counsel. Use only retrieved context. Be persuasive but grounded. Cite as [doc:N]/[kb:ID]."
DEF_SYS   = "You are the defense counsel. Create reasonable doubt using retrieved context. Cite as [doc:N]/[kb:ID]."
JURY_SYS  = "You are the jury foreperson. Weigh both sides briefly and produce a verdict with citations."

OPENING_USER = """
Case Brief (short, retrieved context below). Write an opening statement (120-180 words).
Focus on elements to prove, likely evidence, and theory of the case.
Context:
{context}
"""

EVIDENCE_USER = """
Write an evidence-focused statement (120-180 words). Refer to specific items and why they matter.
Context:
{context}
"""

CROSS_USER = """
Write a short cross-examination (Q then expected answer) that challenges credibility or reliability.
Limit to 4 Q&A pairs.
Context:
{context}
"""

CLOSING_USER = """
Write a closing argument (140-200 words) that ties evidence to your theory.
Context:
{context}
"""

JURY_USER = """
Summarize strengths and weaknesses for both sides and return a JSON object with:
{{
  "verdict": "Guilty" | "Not Guilty",
  "rationale": "2-4 sentences with citations like [doc:N] or [kb:ID]"
}}
Context:
{context}
"""

OPINION_USER = """
As the judge, write a concise opinion (180-250 words) explaining key reasons.
Use citations [doc:N]/[kb:ID].
Context:
{context}
"""
