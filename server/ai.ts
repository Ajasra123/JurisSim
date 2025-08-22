import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AIAnalysisResult {
  summary: string;
  keyFacts: string[];
  legalIssues: string[];
  potentialArguments: {
    prosecution: string[];
    defense: string[];
  };
}

export interface CourtRoomParticipant {
  role: 'judge' | 'prosecution' | 'defense' | 'jury';
  statement: string;
  reasoning?: string;
}

export async function analyzeCase(caseText: string, caseTitle: string): Promise<AIAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a legal expert analyzing a case for educational courtroom simulation. Analyze the provided case text and provide a structured analysis in JSON format with the following structure:
          {
            "summary": "Brief case summary",
            "keyFacts": ["fact1", "fact2", "fact3"],
            "legalIssues": ["issue1", "issue2"],
            "potentialArguments": {
              "prosecution": ["arg1", "arg2"],
              "defense": ["arg1", "arg2"]
            }
          }`
        },
        {
          role: "user",
          content: `Case Title: ${caseTitle}\n\nCase Details:\n${caseText}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    return analysis as AIAnalysisResult;
  } catch (error) {
    console.error("AI analysis error:", error);
    throw new Error("Failed to analyze case with AI");
  }
}

export async function generateCourtRoomStatement(
  role: 'judge' | 'prosecution' | 'defense' | 'jury',
  phase: 'opening' | 'evidence' | 'cross' | 'closing' | 'deliberation' | 'verdict',
  context: {
    caseTitle: string;
    caseAnalysis: AIAnalysisResult;
    previousStatements?: string[];
    evidence?: string[];
  }
): Promise<CourtRoomParticipant> {
  try {
    const systemPrompts = {
      judge: "You are an experienced judge presiding over a courtroom. Provide fair, measured responses that maintain order and ensure proper legal procedure.",
      prosecution: "You are a skilled prosecutor presenting the case for the state. Build compelling arguments based on evidence while following legal standards.",
      defense: "You are a defense attorney protecting your client's rights. Challenge evidence, create reasonable doubt, and present alternative explanations.",
      jury: "You are representing the collective voice of a jury deliberating on the case. Consider all evidence presented and legal instructions."
    };

    const phaseInstructions = {
      opening: "Present your opening statement for this case.",
      evidence: "Present or examine evidence relevant to this case.",
      cross: "Conduct cross-examination or respond to opposing counsel.",
      closing: "Deliver your closing argument summarizing your position.",
      deliberation: "Discuss the evidence and reach a conclusion.",
      verdict: "Announce the jury's verdict with reasoning."
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `${systemPrompts[role]} ${phaseInstructions[phase]} Keep responses realistic and educational. Respond in JSON format: {"statement": "your statement", "reasoning": "brief explanation of your approach"}`
        },
        {
          role: "user",
          content: `Case: ${context.caseTitle}
          
Key Facts: ${context.caseAnalysis.keyFacts.join(', ')}
Legal Issues: ${context.caseAnalysis.legalIssues.join(', ')}
Summary: ${context.caseAnalysis.summary}

${role === 'prosecution' ? `Prosecution Arguments: ${context.caseAnalysis.potentialArguments.prosecution.join(', ')}` : ''}
${role === 'defense' ? `Defense Arguments: ${context.caseAnalysis.potentialArguments.defense.join(', ')}` : ''}
${context.previousStatements ? `Previous Statements: ${context.previousStatements.join('\n')}` : ''}
${context.evidence ? `Evidence: ${context.evidence.join(', ')}` : ''}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      role,
      statement: result.statement || "No statement generated",
      reasoning: result.reasoning
    };
  } catch (error) {
    console.error(`AI ${role} statement error:`, error);
    throw new Error(`Failed to generate ${role} statement`);
  }
}

export async function generateVerdict(
  caseAnalysis: AIAnalysisResult,
  allStatements: CourtRoomParticipant[]
): Promise<{ verdict: string; reasoning: string; confidence: number }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a jury reaching a verdict. Based on all evidence and arguments presented, determine the outcome. Consider the burden of proof and reasonable doubt. Respond in JSON format: {"verdict": "Guilty" or "Not Guilty", "reasoning": "detailed explanation", "confidence": 0.0-1.0}`
        },
        {
          role: "user",
          content: `Case Analysis:
Summary: ${caseAnalysis.summary}
Key Facts: ${caseAnalysis.keyFacts.join(', ')}
Legal Issues: ${caseAnalysis.legalIssues.join(', ')}

All Court Statements:
${allStatements.map(s => `${s.role.toUpperCase()}: ${s.statement}`).join('\n\n')}

Based on the evidence and arguments, what is your verdict?`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      verdict: result.verdict || "Not Guilty",
      reasoning: result.reasoning || "Insufficient evidence to prove guilt beyond reasonable doubt.",
      confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1)
    };
  } catch (error) {
    console.error("AI verdict error:", error);
    throw new Error("Failed to generate verdict");
  }
}

export async function summarizeText(text: string, maxLength: number = 500): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Summarize the following text concisely while maintaining key legal points. Keep it under ${maxLength} characters.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: Math.floor(maxLength / 3)
    });

    return response.choices[0].message.content || text.substring(0, maxLength);
  } catch (error) {
    console.error("AI summarization error:", error);
    return text.substring(0, maxLength);
  }
}