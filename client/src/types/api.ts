export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface UploadResponse {
  success: boolean;
  chars: number;
  chunks: number;
}

export interface SimulationResponse {
  success: boolean;
  message: string;
}

export interface TranscriptEntry {
  phase: string;
  role: string;
  text: string;
  citations: string[];
}

export interface Verdict {
  verdict: "Guilty" | "Not Guilty";
  rationale: string;
}

export interface SimulationConfig {
  model: string;
  strictness: number;
  maxTurns: number;
  temperature: number;
  seed: number;
}
