import { queryClient, apiRequest } from "./queryClient";
import type { Case, InsertCase, CaseFile } from "@shared/schema";
import type { UploadResponse, SimulationResponse, TranscriptEntry, SimulationConfig } from "../types/api";

export const api = {
  // Cases
  async createCase(caseData: InsertCase): Promise<Case> {
    const response = await apiRequest("POST", "/api/cases", caseData);
    return response.json();
  },

  async getCases(): Promise<Case[]> {
    const response = await apiRequest("GET", "/api/cases");
    return response.json();
  },

  async getCase(id: string): Promise<Case> {
    const response = await apiRequest("GET", `/api/cases/${id}`);
    return response.json();
  },

  async deleteCase(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/cases/${id}`);
  },

  // File upload
  async uploadFile(caseId: string, file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`/api/cases/${caseId}/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || response.statusText);
    }

    return response.json();
  },

  // Simulation
  async startSimulation(caseId: string, config: Partial<SimulationConfig>): Promise<SimulationResponse> {
    const response = await apiRequest("POST", `/api/cases/${caseId}/simulate`, config);
    return response.json();
  },

  async getTranscript(caseId: string): Promise<TranscriptEntry[]> {
    const response = await apiRequest("GET", `/api/cases/${caseId}/transcript`);
    return response.json();
  },

  async exportTranscript(caseId: string): Promise<void> {
    const response = await fetch(`/api/cases/${caseId}/export`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to export transcript");
    }

    // Trigger download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${caseId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  // Files
  async getCaseFiles(caseId: string): Promise<CaseFile[]> {
    const response = await apiRequest("GET", `/api/cases/${caseId}/files`);
    return response.json();
  },

  // AI Analysis
  async getAnalysis(caseId: string): Promise<any> {
    const response = await apiRequest("GET", `/api/cases/${caseId}/analysis`);
    return response.json();
  },

  async regenerateAnalysis(caseId: string): Promise<any> {
    const response = await apiRequest("POST", `/api/cases/${caseId}/analyze`);
    return response.json();
  },
};

// Helper function to invalidate queries
export const invalidateQueries = {
  cases: () => queryClient.invalidateQueries({ queryKey: ["/api/cases"] }),
  case: (id: string) => queryClient.invalidateQueries({ queryKey: ["/api/cases", id] }),
  transcript: (id: string) => queryClient.invalidateQueries({ queryKey: ["/api/cases", id, "transcript"] }),
  files: (id: string) => queryClient.invalidateQueries({ queryKey: ["/api/cases", id, "files"] }),
  analysis: (id: string) => queryClient.invalidateQueries({ queryKey: ["/api/cases", id, "analysis"] }),
};
