import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCaseSchema, insertSimulationConfigSchema } from "@shared/schema";
import { analyzeCase, generateCourtRoomStatement, generateVerdict, summarizeText } from "./ai";
import multer from "multer";
import path from "path";
import fs from "fs";
// Dynamic import for pdf-parse to avoid startup issues

// Configure multer for file uploads
const upload = multer({
  dest: '/tmp/uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a new case
  app.post("/api/cases", async (req, res) => {
    try {
      const caseData = insertCaseSchema.parse(req.body);
      const newCase = await storage.createCase(caseData);
      res.json(newCase);
    } catch (error) {
      res.status(400).json({ error: "Invalid case data" });
    }
  });

  // Get all cases
  app.get("/api/cases", async (req, res) => {
    try {
      const cases = await storage.getCases();
      res.json(cases);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cases" });
    }
  });

  // Get a specific case
  app.get("/api/cases/:id", async (req, res) => {
    try {
      const caseData = await storage.getCase(req.params.id);
      if (!caseData) {
        return res.status(404).json({ error: "Case not found" });
      }
      res.json(caseData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch case" });
    }
  });

  // Upload file to case
  app.post("/api/cases/:id/upload", upload.single('file'), async (req, res) => {
    let filePath = "";
    try {
      const caseId = req.params.id;
      const file = req.file;

      console.log("Upload request received for case:", caseId);
      console.log("File details:", file ? { filename: file.filename, originalname: file.originalname, mimetype: file.mimetype, size: file.size } : "No file");

      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      filePath = file.path;
      console.log("File uploaded to:", filePath);

      const caseData = await storage.getCase(caseId);
      if (!caseData) {
        return res.status(404).json({ error: "Case not found" });
      }

      console.log("Processing file type:", file.mimetype);

      // Process file based on type
      let text = "";
      
      if (file.mimetype === "application/pdf") {
        // Extract text from PDF using pdf-parse library
        try {
          console.log("Reading PDF file...");
          const dataBuffer = fs.readFileSync(filePath);
          console.log("PDF file read, size:", dataBuffer.length);
          
          const pdfParse = (await import("pdf-parse")).default;
          console.log("PDF parser imported successfully");
          
          const pdfData = await pdfParse(dataBuffer);
          text = pdfData.text.trim();
          console.log("PDF text extracted, length:", text.length);
            
          // If no readable text found, suggest manual conversion
          if (!text || text.length < 50) {
            return res.status(400).json({ 
              error: "Unable to extract readable text from this PDF. The PDF might be image-based or encrypted. Please convert it to a text file (.txt) and upload that instead." 
            });
          }
        } catch (pdfError) {
          console.error("PDF processing error:", pdfError);
          return res.status(400).json({ 
            error: "Failed to process PDF file. Please ensure it's a valid PDF with extractable text, or convert it to a text file (.txt) and upload that instead." 
          });
        }
      } else if (file.mimetype === "text/plain") {
        try {
          console.log("Reading text file...");
          text = fs.readFileSync(filePath, 'utf-8');
          console.log("Text file read, length:", text.length);
        } catch (textError) {
          console.error("Text file processing error:", textError);
          return res.status(400).json({ 
            error: "Failed to read text file. Please ensure it's a valid text file." 
          });
        }
      } else {
        return res.status(400).json({ error: "Unsupported file type. Please upload PDF or TXT files only." });
      }

      if (!text.trim()) {
        return res.status(400).json({ error: "No extractable text found in the file. Please ensure the document contains readable text." });
      }

      console.log("Splitting text into chunks...");
      // Split into chunks and analyze with AI
      const chunks = splitTextIntoChunks(text, 900, 120);
      console.log("Text split into", chunks.length, "chunks");

      // Analyze case with AI
      let analysis = null;
      try {
        console.log("Starting AI analysis...");
        analysis = await analyzeCase(text, caseData.title);
        console.log("AI analysis completed successfully");
      } catch (error) {
        console.error("AI analysis failed:", error);
        // Continue without analysis if AI fails
      }

      console.log("Updating case in storage...");
      // Update case with text, chunks, and AI analysis
      await storage.updateCase(caseId, {
        rawText: text,
        chunks,
        analysis,
        status: "ready"
      });

      console.log("Creating file record...");
      // Save file record
      await storage.createCaseFile({
        caseId,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      });

      console.log("Upload completed successfully");
      res.json({
        success: true,
        chars: text.length,
        chunks: chunks.length
      });

    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to process file: " + (error instanceof Error ? error.message : String(error)) });
    } finally {
      // Clean up uploaded file
      if (filePath) {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log("File cleaned up:", filePath);
          }
        } catch (cleanupError) {
          console.error("File cleanup error:", cleanupError);
          // Don't fail the request if cleanup fails
        }
      }
    }
  });

  // Start simulation
  app.post("/api/cases/:id/simulate", async (req, res) => {
    try {
      const caseId = req.params.id;
      const config = insertSimulationConfigSchema.parse({ ...req.body, caseId });

      const caseData = await storage.getCase(caseId);
      if (!caseData) {
        return res.status(404).json({ error: "Case not found" });
      }

      if (!caseData.chunks || caseData.chunks.length === 0) {
        return res.status(400).json({ error: "No case documents uploaded" });
      }

      // Update case status
      await storage.updateCase(caseId, {
        status: "simulating",
        transcript: [],
        verdict: null
      });

      // Save simulation config
      await storage.createOrUpdateSimulationConfig(config);

      // AI-powered simulation
      setTimeout(async () => {
        try {
          await runAISimulation(caseId, caseData, config);
        } catch (error) {
          console.error("AI simulation failed:", error);
          // Fallback to basic simulation
          const transcript = generateRealisticTranscript(caseData, config);
          const verdict = generateBasicVerdict(transcript);

          await storage.updateCase(caseId, {
            status: "completed",
            transcript,
            verdict
          });
        }
      }, 2000);

      res.json({ success: true, message: "Simulation started" });

    } catch (error) {
      console.error("Simulation error:", error);
      res.status(500).json({ error: "Failed to start simulation" });
    }
  });

  // Get case transcript
  app.get("/api/cases/:id/transcript", async (req, res) => {
    try {
      const caseData = await storage.getCase(req.params.id);
      if (!caseData) {
        return res.status(404).json({ error: "Case not found" });
      }
      res.json(caseData.transcript || []);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transcript" });
    }
  });

  // Export transcript
  app.get("/api/cases/:id/export", async (req, res) => {
    try {
      const caseData = await storage.getCase(req.params.id);
      if (!caseData) {
        return res.status(404).json({ error: "Case not found" });
      }

      let transcript = `Case: ${caseData.title}\n\n`;
      
      if (caseData.transcript && Array.isArray(caseData.transcript)) {
        for (const entry of caseData.transcript as any[]) {
          transcript += `[${entry.phase?.toUpperCase() || 'UNKNOWN'}] ${entry.role || 'Unknown'}:\n${entry.text || ''}\n\n`;
        }
      }

      if (caseData.verdict) {
        transcript += "VERDICT:\n" + JSON.stringify(caseData.verdict, null, 2);
      }

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="transcript-${caseData.id}.txt"`);
      res.send(transcript);

    } catch (error) {
      res.status(500).json({ error: "Failed to export transcript" });
    }
  });

  // Get case files
  app.get("/api/cases/:id/files", async (req, res) => {
    try {
      const files = await storage.getCaseFiles(req.params.id);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });

  // Get AI analysis for a case
  app.get("/api/cases/:id/analysis", async (req, res) => {
    try {
      const caseData = await storage.getCase(req.params.id);
      if (!caseData) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      if (!caseData.analysis) {
        return res.status(404).json({ error: "No AI analysis available for this case" });
      }
      
      res.json(caseData.analysis);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  // Regenerate AI analysis for a case
  app.post("/api/cases/:id/analyze", async (req, res) => {
    try {
      const caseData = await storage.getCase(req.params.id);
      if (!caseData) {
        return res.status(404).json({ error: "Case not found" });
      }

      if (!caseData.rawText) {
        return res.status(400).json({ error: "No case text available for analysis" });
      }

      const analysis = await analyzeCase(caseData.rawText, caseData.title);
      
      await storage.updateCase(req.params.id, { analysis });
      
      res.json(analysis);
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: "Failed to analyze case" });
    }
  });

  // Delete case
  app.delete("/api/cases/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCase(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Case not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete case" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to split text into chunks with improved logic
function splitTextIntoChunks(text: string, size: number = 900, overlap: number = 120): string[] {
  // Clean the text
  const cleanText = text.replace(/\r/g, "").replace(/\s+/g, " ").trim();
  
  if (cleanText.length <= size) {
    return cleanText ? [cleanText] : [];
  }

  const chunks: string[] = [];
  let i = 0;
  
  while (i < cleanText.length) {
    let endIndex = Math.min(i + size, cleanText.length);
    
    // Try to find a good breaking point (sentence ending)
    if (endIndex < cleanText.length) {
      const sentenceEnd = cleanText.lastIndexOf('.', endIndex);
      const paragraphEnd = cleanText.lastIndexOf('\n', endIndex);
      const goodBreak = Math.max(sentenceEnd, paragraphEnd);
      
      if (goodBreak > i + size * 0.5) { // Only use if it's not too early
        endIndex = goodBreak + 1;
      }
    }
    
    const chunk = cleanText.slice(i, endIndex).trim();
    if (chunk && chunk.length > 10) { // Only add meaningful chunks
      chunks.push(chunk);
    }
    
    i = endIndex - overlap;
    if (i <= 0) i = endIndex; // Prevent infinite loop
  }
  
  return chunks.filter(c => c.length > 0);
}

// Legal knowledge base for educational simulation
const LEGAL_KNOWLEDGE_BASE = [
  {
    id: "kb01",
    title: "Burden of Proof (Criminal)",
    text: "In criminal cases the prosecution must prove the defendant's guilt beyond a reasonable doubt."
  },
  {
    id: "kb02", 
    title: "Reasonable Doubt",
    text: "A real possibility that the defendant is not guilty; if such doubt exists, the jury must acquit."
  },
  {
    id: "kb03",
    title: "Hearsay Rule",
    text: "Out-of-court statements offered to prove the truth of the matter asserted are generally inadmissible unless an exception applies."
  },
  {
    id: "kb04",
    title: "Relevance Standard",
    text: "Evidence is admissible if it has any tendency to make a fact of consequence more or less probable than it would be without the evidence."
  },
  {
    id: "kb05",
    title: "Witness Impeachment",
    text: "A witness may be impeached by showing bias, prior inconsistent statements, or lack of perception."
  }
];

// Generate realistic transcript based on case content
function generateRealisticTranscript(caseData: any, config: any): any[] {
  const transcript = [];
  const caseTitle = caseData.title || "Legal Case";
  const hasEvidence = caseData.chunks && caseData.chunks.length > 0;
  
  // Opening Statements
  transcript.push({
    phase: "opening",
    role: "Prosecution",
    text: `Your Honor, members of the jury, today we present the case of ${caseTitle}. The evidence will clearly demonstrate the facts before us. The prosecution will prove beyond a reasonable doubt that the defendant is responsible for the actions described in the case materials. [doc:1] Through careful examination of the evidence, witness testimony, and expert analysis, we will establish a clear pattern of liability. [kb01]`,
    citations: ["doc:1", "kb01"]
  });
  
  transcript.push({
    phase: "opening",
    role: "Defense",
    text: `Ladies and gentlemen of the jury, today you will hear the prosecution's version of events, but I urge you to listen carefully to all the evidence. The burden of proof rests entirely on the prosecution. [kb01] They must prove their case beyond a reasonable doubt, and we will show that reasonable doubt exists throughout their arguments. [kb02] The defense will demonstrate that the evidence is insufficient and that alternative explanations exist for the events in question.`,
    citations: ["kb01", "kb02"]
  });

  // Evidence Presentation
  if (hasEvidence) {
    transcript.push({
      phase: "evidence",
      role: "Prosecution",
      text: `The prosecution presents key evidence found in the case documents. [doc:1] [doc:2] This evidence clearly supports our position and demonstrates the factual basis of our claims. The documentation provides a detailed timeline of events and establishes the necessary elements of our case. [kb04] Each piece of evidence is relevant and probative to the matters at issue.`,
      citations: ["doc:1", "doc:2", "kb04"]
    });
    
    transcript.push({
      phase: "evidence",
      role: "Defense",
      text: `While the prosecution has presented documents, we must examine the reliability and context of this evidence. [doc:1] The defense questions the completeness of the record and points out significant gaps in the documentation. [kb03] Much of what the prosecution relies upon may constitute inadmissible hearsay or lack proper foundation. We urge the jury to consider what evidence is missing from their presentation.`,
      citations: ["doc:1", "kb03"]
    });
  }

  // Cross-Examination
  transcript.push({
    phase: "cross",
    role: "Prosecution", 
    text: `The prosecution's cross-examination reveals inconsistencies in the defense's position. [kb05] We have identified bias and prior inconsistent statements that undermine the credibility of defense witnesses. The cross-examination demonstrates that the defense's alternative theories lack factual support and are merely speculation designed to create unfounded doubt.`,
    citations: ["kb05"]
  });
  
  transcript.push({
    phase: "cross",
    role: "Defense",
    text: `Our cross-examination of prosecution witnesses reveals significant problems with their testimony. [kb05] We have exposed bias, lack of personal knowledge, and unreliable perception. The prosecution's witnesses have demonstrated uncertainty about key facts and have admitted to assumptions rather than direct observation. This testimony fails to meet the standard required for criminal conviction.`,
    citations: ["kb05"]
  });

  // Closing Arguments
  transcript.push({
    phase: "closing",
    role: "Prosecution",
    text: `In closing, the prosecution has presented overwhelming evidence of the defendant's responsibility. [doc:1] [kb01] We have met our burden of proof beyond a reasonable doubt. The evidence is clear, consistent, and compelling. The defense has offered only speculation and unsupported theories. Justice requires a finding of guilt based on the facts presented to this court.`,
    citations: ["doc:1", "kb01"]
  });
  
  transcript.push({
    phase: "closing",
    role: "Defense",
    text: `Members of the jury, the prosecution has failed to prove their case beyond a reasonable doubt. [kb02] Throughout this trial, we have seen gaps in evidence, unreliable testimony, and speculative arguments. The reasonable doubt standard exists to protect the innocent, and that protection is needed here. We ask that you find the defendant not guilty based on the insufficient evidence presented.`,
    citations: ["kb02"]
  });

  return transcript;
}

// AI-powered simulation runner
async function runAISimulation(caseId: string, caseData: any, config: any): Promise<void> {
  const transcript = [];
  
  // Use AI analysis if available, otherwise use basic case data
  const analysis = caseData.analysis || {
    summary: caseData.rawText?.substring(0, 200) + "...",
    keyFacts: ["Case details from uploaded document"],
    legalIssues: ["Legal matters to be determined"],
    potentialArguments: {
      prosecution: ["Arguments based on evidence"],
      defense: ["Counter-arguments and alternative explanations"]
    }
  };

  const context = {
    caseTitle: caseData.title,
    caseAnalysis: analysis,
    evidence: caseData.chunks || []
  };

  // Phase 1: Opening Statements
  const prosecutionOpening = await generateCourtRoomStatement('prosecution', 'opening', context);
  transcript.push({
    phase: "opening",
    role: prosecutionOpening.role,
    text: prosecutionOpening.statement,
    reasoning: prosecutionOpening.reasoning,
    timestamp: new Date().toISOString()
  });

  const defenseOpening = await generateCourtRoomStatement('defense', 'opening', {
    ...context,
    previousStatements: [prosecutionOpening.statement]
  });
  transcript.push({
    phase: "opening", 
    role: defenseOpening.role,
    text: defenseOpening.statement,
    reasoning: defenseOpening.reasoning,
    timestamp: new Date().toISOString()
  });

  // Update case with opening statements
  await storage.updateCase(caseId, {
    status: "simulating",
    transcript: [...transcript]
  });

  // Phase 2: Evidence Presentation
  const prosecutionEvidence = await generateCourtRoomStatement('prosecution', 'evidence', {
    ...context,
    previousStatements: transcript.map(t => t.text)
  });
  transcript.push({
    phase: "evidence",
    role: prosecutionEvidence.role,
    text: prosecutionEvidence.statement,
    reasoning: prosecutionEvidence.reasoning,
    timestamp: new Date().toISOString()
  });

  const defenseEvidence = await generateCourtRoomStatement('defense', 'evidence', {
    ...context,
    previousStatements: transcript.map(t => t.text)
  });
  transcript.push({
    phase: "evidence",
    role: defenseEvidence.role,
    text: defenseEvidence.statement,
    reasoning: defenseEvidence.reasoning,
    timestamp: new Date().toISOString()
  });

  // Phase 3: Cross-Examination
  const prosecutionCross = await generateCourtRoomStatement('prosecution', 'cross', {
    ...context,
    previousStatements: transcript.map(t => t.text)
  });
  transcript.push({
    phase: "cross",
    role: prosecutionCross.role,
    text: prosecutionCross.statement,
    reasoning: prosecutionCross.reasoning,
    timestamp: new Date().toISOString()
  });

  const defenseCross = await generateCourtRoomStatement('defense', 'cross', {
    ...context,
    previousStatements: transcript.map(t => t.text)
  });
  transcript.push({
    phase: "cross",
    role: defenseCross.role,
    text: defenseCross.statement,
    reasoning: defenseCross.reasoning,
    timestamp: new Date().toISOString()
  });

  // Phase 4: Closing Arguments
  const prosecutionClosing = await generateCourtRoomStatement('prosecution', 'closing', {
    ...context,
    previousStatements: transcript.map(t => t.text)
  });
  transcript.push({
    phase: "closing",
    role: prosecutionClosing.role,
    text: prosecutionClosing.statement,
    reasoning: prosecutionClosing.reasoning,
    timestamp: new Date().toISOString()
  });

  const defenseClosing = await generateCourtRoomStatement('defense', 'closing', {
    ...context,
    previousStatements: transcript.map(t => t.text)
  });
  transcript.push({
    phase: "closing",
    role: defenseClosing.role,
    text: defenseClosing.statement,
    reasoning: defenseClosing.reasoning,
    timestamp: new Date().toISOString()
  });

  // Phase 5: Jury Deliberation and Verdict
  const allStatements = transcript.map(entry => ({
    role: entry.role as any,
    statement: entry.text
  }));

  const verdict = await generateVerdict(analysis, allStatements);
  
  const juryDeliberation = await generateCourtRoomStatement('jury', 'deliberation', {
    ...context,
    previousStatements: transcript.map(t => t.text)
  });
  transcript.push({
    phase: "deliberation",
    role: juryDeliberation.role,
    text: juryDeliberation.statement,
    reasoning: juryDeliberation.reasoning,
    timestamp: new Date().toISOString()
  });

  // Final verdict announcement
  const verdictStatement = await generateCourtRoomStatement('jury', 'verdict', {
    ...context,
    previousStatements: transcript.map(t => t.text)
  });
  transcript.push({
    phase: "verdict",
    role: verdictStatement.role,
    text: `The jury finds the defendant: ${verdict.verdict}. ${verdict.reasoning}`,
    reasoning: `Confidence level: ${Math.round(verdict.confidence * 100)}%`,
    timestamp: new Date().toISOString()
  });

  // Update case with complete simulation
  await storage.updateCase(caseId, {
    status: "completed",
    transcript,
    verdict: {
      verdict: verdict.verdict,
      reasoning: verdict.reasoning,
      confidence: verdict.confidence
    }
  });
}

// Generate verdict based on transcript analysis (fallback function)
function generateBasicVerdict(transcript: any[]): any {
  // Simple algorithm based on evidence strength
  const evidenceCitations = transcript.flatMap(entry => 
    entry.citations?.filter((c: string) => c.startsWith('doc:')) || []
  );
  
  const hasStrongEvidence = evidenceCitations.length >= 3;
  const prosecutionArguments = transcript.filter(entry => entry.role === "Prosecution").length;
  const defenseArguments = transcript.filter(entry => entry.role === "Defense").length;
  
  // Educational simulation logic - balanced outcomes
  const shouldConvict = hasStrongEvidence && prosecutionArguments >= defenseArguments && Math.random() > 0.4;
  
  if (shouldConvict) {
    return {
      verdict: "Guilty",
      rationale: "After careful deliberation, the jury finds the prosecution has proven their case beyond a reasonable doubt. [doc:1] [kb01] The evidence presented was compelling and the prosecution successfully met their burden of proof."
    };
  } else {
    return {
      verdict: "Not Guilty", 
      rationale: "The jury finds that the prosecution has not met their burden of proving guilt beyond a reasonable doubt. [kb02] While evidence was presented, reasonable doubt exists regarding the defendant's culpability."
    };
  }
}
