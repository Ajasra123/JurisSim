import { type User, type InsertUser, type Case, type InsertCase, type CaseFile, type InsertCaseFile, type SimulationConfig, type InsertSimulationConfig } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Case methods
  getCase(id: string): Promise<Case | undefined>;
  getCases(): Promise<Case[]>;
  createCase(caseData: InsertCase): Promise<Case>;
  updateCase(id: string, updates: Partial<Case>): Promise<Case | undefined>;
  deleteCase(id: string): Promise<boolean>;

  // Case file methods
  getCaseFiles(caseId: string): Promise<CaseFile[]>;
  createCaseFile(fileData: InsertCaseFile): Promise<CaseFile>;
  deleteCaseFile(id: string): Promise<boolean>;

  // Simulation config methods
  getSimulationConfig(caseId: string): Promise<SimulationConfig | undefined>;
  createOrUpdateSimulationConfig(config: InsertSimulationConfig): Promise<SimulationConfig>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private cases: Map<string, Case>;
  private caseFiles: Map<string, CaseFile>;
  private simulationConfigs: Map<string, SimulationConfig>;

  constructor() {
    this.users = new Map();
    this.cases = new Map();
    this.caseFiles = new Map();
    this.simulationConfigs = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getCase(id: string): Promise<Case | undefined> {
    return this.cases.get(id);
  }

  async getCases(): Promise<Case[]> {
    return Array.from(this.cases.values()).sort((a, b) => 
      new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime()
    );
  }

  async createCase(caseData: InsertCase): Promise<Case> {
    const id = Math.random().toString(36).substring(2, 10);
    const now = new Date();
    const newCase: Case = {
      ...caseData,
      id,
      description: caseData.description || "",
      rawText: "",
      chunks: [],
      analysis: null,
      transcript: [],
      verdict: null,
      status: "created",
      createdAt: now,
      updatedAt: now,
    };
    this.cases.set(id, newCase);
    return newCase;
  }

  async updateCase(id: string, updates: Partial<Case>): Promise<Case | undefined> {
    const existingCase = this.cases.get(id);
    if (!existingCase) return undefined;

    const updatedCase: Case = {
      ...existingCase,
      ...updates,
      updatedAt: new Date(),
    };
    this.cases.set(id, updatedCase);
    return updatedCase;
  }

  async deleteCase(id: string): Promise<boolean> {
    // Also delete associated files and configs
    Array.from(this.caseFiles.values())
      .filter(file => file.caseId === id)
      .forEach(file => this.caseFiles.delete(file.id));
    
    Array.from(this.simulationConfigs.values())
      .filter(config => config.caseId === id)
      .forEach(config => this.simulationConfigs.delete(config.id));

    return this.cases.delete(id);
  }

  async getCaseFiles(caseId: string): Promise<CaseFile[]> {
    return Array.from(this.caseFiles.values()).filter(file => file.caseId === caseId);
  }

  async createCaseFile(fileData: InsertCaseFile): Promise<CaseFile> {
    const id = randomUUID();
    const file: CaseFile = {
      ...fileData,
      id,
      uploadedAt: new Date(),
    };
    this.caseFiles.set(id, file);
    return file;
  }

  async deleteCaseFile(id: string): Promise<boolean> {
    return this.caseFiles.delete(id);
  }

  async getSimulationConfig(caseId: string): Promise<SimulationConfig | undefined> {
    return Array.from(this.simulationConfigs.values()).find(config => config.caseId === caseId);
  }

  async createOrUpdateSimulationConfig(config: InsertSimulationConfig): Promise<SimulationConfig> {
    const existingConfig = await this.getSimulationConfig(config.caseId);
    
    if (existingConfig) {
      const updated: SimulationConfig = { 
        ...existingConfig, 
        ...config,
        model: config.model || existingConfig.model,
        strictness: config.strictness !== undefined ? config.strictness : existingConfig.strictness,
        maxTurns: config.maxTurns !== undefined ? config.maxTurns : existingConfig.maxTurns,
        temperature: config.temperature !== undefined ? config.temperature : existingConfig.temperature,
        seed: config.seed !== undefined ? config.seed : existingConfig.seed,
      };
      this.simulationConfigs.set(existingConfig.id, updated);
      return updated;
    } else {
      const id = randomUUID();
      const newConfig: SimulationConfig = { 
        ...config,
        id,
        model: config.model || "llama3.1:8b",
        strictness: config.strictness !== undefined ? config.strictness : 0.5,
        maxTurns: config.maxTurns !== undefined ? config.maxTurns : 8,
        temperature: config.temperature !== undefined ? config.temperature : 0.3,
        seed: config.seed !== undefined ? config.seed : 7,
      };
      this.simulationConfigs.set(id, newConfig);
      return newConfig;
    }
  }
}

export const storage = new MemStorage();
