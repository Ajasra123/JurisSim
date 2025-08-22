import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const cases = pgTable("cases", {
  id: varchar("id", { length: 8 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description").default(""),
  rawText: text("raw_text").default(""),
  chunks: text("chunks").array().default([]),
  analysis: jsonb("analysis"), // AI analysis results
  transcript: jsonb("transcript").default([]),
  verdict: jsonb("verdict"),
  status: text("status").default("created"), // created, ready, simulating, completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const caseFiles = pgTable("case_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id", { length: 8 }).notNull().references(() => cases.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  size: integer("size").notNull(),
  mimeType: text("mime_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const simulationConfigs = pgTable("simulation_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id", { length: 8 }).notNull().references(() => cases.id, { onDelete: "cascade" }),
  model: text("model").default("llama3.1:8b"),
  strictness: real("strictness").default(0.5),
  maxTurns: integer("max_turns").default(8),
  temperature: real("temperature").default(0.3),
  seed: integer("seed").default(7),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCaseSchema = createInsertSchema(cases).pick({
  title: true,
  description: true,
});

export const insertCaseFileSchema = createInsertSchema(caseFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertSimulationConfigSchema = createInsertSchema(simulationConfigs).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Case = typeof cases.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;

export type CaseFile = typeof caseFiles.$inferSelect;
export type InsertCaseFile = z.infer<typeof insertCaseFileSchema>;

export type SimulationConfig = typeof simulationConfigs.$inferSelect;
export type InsertSimulationConfig = z.infer<typeof insertSimulationConfigSchema>;

// API response types
export const transcriptEntrySchema = z.object({
  phase: z.string(),
  role: z.string(),
  text: z.string(),
  citations: z.array(z.string()).default([]),
});

export const verdictSchema = z.object({
  verdict: z.enum(["Guilty", "Not Guilty"]),
  rationale: z.string(),
});

export type TranscriptEntry = z.infer<typeof transcriptEntrySchema>;
export type Verdict = z.infer<typeof verdictSchema>;
