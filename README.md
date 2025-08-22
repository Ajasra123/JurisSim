# ⚖️ AI-Powered Courtroom Simulator  

> **An educational simulator that brings legal trials to life with AI-generated prosecution, defense, jury, and judge — all powered by advanced AI models.**  

![React](https://img.shields.io/badge/Frontend-React_18-blue?logo=react)  
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178c6?logo=typescript)  
![Express](https://img.shields.io/badge/Backend-Express.js-000000?logo=express)  
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql)  
![Tailwind](https://img.shields.io/badge/UI-TailwindCSS-06B6D4?logo=tailwindcss)  
![LLM](https://img.shields.io/badge/AI-GPT_4o%20%7C%20LLaMA3.1-orange?logo=openai)  

---

## 📖 Overview  

This application simulates **courtroom proceedings** using AI. Users can upload legal case documents, configure simulation parameters, and watch as AI agents (prosecution, defense, jury, judge) carry out a full trial process:  

- Opening Statements  
- Evidence Presentation  
- Cross-Examination  
- Closing Arguments  
- Jury Deliberation  
- Judicial Opinion  

It’s built for **students, educators, and enthusiasts** who want to learn courtroom workflows in an **interactive, AI-powered environment**.  

---

## 🏗️ System Architecture  

### 🔹 Frontend  
- **Framework**: React 18 + TypeScript  
- **Routing**: Wouter  
- **State Management**: TanStack Query  
- **UI**: Radix UI + shadcn/ui + Tailwind CSS  
- **Build Tool**: Vite  

📌 Structure:  
- Pages → routing & high-level state  
- Components → reusable UI elements  
- Hooks → shared logic  
- API Layer → server communication  

---

### 🔹 Backend  
- **Framework**: Express.js + TypeScript  
- **File Handling**: Multer for uploads  
- **Sessions**: Express-session + PostgreSQL store  
- **Database ORM**: Drizzle ORM  
- **Database**: Neon serverless PostgreSQL  
- **AI Integration**: GPT-4o + LLaMA3.1 with Ollama  

📌 Architecture:  
- Routes → HTTP requests  
- Services → business logic  
- Storage → PostgreSQL / in-memory  

---

### 🔹 Data Models  
- **Users** → authentication & access control  
- **Cases** → metadata & status  
- **Case Files** → uploaded docs  
- **Simulation Configs** → AI parameters  
- **Transcripts** → full trial logs  

---

## 🔑 Key Features  

✅ **AI-powered courtroom simulation** (prosecution, defense, jury, judge)  
✅ **Upload & analyze documents** (PDF/TXT) with AI extraction of facts/issues  
✅ **Real-time phase progression** (opening → verdict)  
✅ **Case analysis dashboard** with summaries, key facts, strategies  
✅ **Citation system** linking AI output to source docs  
✅ **Configurable AI parameters** (model, strictness, temperature)  
✅ **Export transcripts** for study/reference  
✅ **Responsive professional UI** with judicial theming  
✅ **Robust error handling** & fallbacks  

---

## 📦 Tech Stack  

**Frontend**  
- React 18 + TypeScript  
- TailwindCSS + shadcn/ui + Radix UI  
- Wouter (routing)  
- TanStack Query (state & caching)  

**Backend**  
- Express.js + TypeScript  
- Multer (uploads)  
- Drizzle ORM + Neon PostgreSQL  
- Express-session (auth & sessions)  

**AI/ML**  
- OpenAI GPT-4o  
- LLaMA3.1 (via Ollama)  
- Custom legal-domain prompts  

**Utilities**  
- pdf-parse & PyPDF for PDF processing  
- ESBuild + Vite bundling  

---

## 🚀 Getting Started  

### 1️⃣ Clone the Repository  
```bash
git clone https://github.com/your-username/courtroom-simulator.git
cd courtroom-simulator
