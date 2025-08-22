# Overview

This is an AI-powered courtroom simulator application designed for educational purposes. The system allows users to upload legal case documents, configure simulation parameters, and run automated courtroom proceedings with AI-generated participants (prosecution, defense, jury, and judge). The application processes uploaded documents to extract relevant legal information and conducts simulated trials through multiple phases including opening statements, evidence presentation, cross-examination, closing arguments, jury deliberation, and judicial opinion.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client uses a modern React-based architecture with TypeScript:

- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing  
- **State Management**: TanStack Query for server state management and caching
- **UI Components**: Radix UI primitives with custom shadcn/ui styling
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite for fast development and optimized builds

The frontend follows a component-based architecture with clearly separated concerns:
- Pages handle routing and high-level state
- Components provide reusable UI elements
- Hooks manage shared logic and state
- API layer abstracts server communication

## Backend Architecture

The server implements a REST API using Express.js:

- **Framework**: Express.js with TypeScript
- **File Handling**: Multer for document upload processing
- **Development**: Hot reload with Vite integration for full-stack development
- **Storage**: In-memory storage implementation with interface for future database integration
- **Session Management**: Express sessions with PostgreSQL session store support

The backend uses a layered architecture:
- Routes handle HTTP requests and responses
- Storage layer abstracts data persistence
- Business logic separated into service layers

## Data Storage Solutions

**Database**: PostgreSQL with Drizzle ORM for type-safe database operations:
- **Schema Definition**: Centralized schema in shared directory using Drizzle
- **Migration Management**: Drizzle Kit for database migrations
- **Connection**: Neon Database serverless PostgreSQL
- **Session Store**: PostgreSQL-backed session storage

**Current Implementation**: In-memory storage for development with interface-based design allowing easy migration to database persistence.

**Data Models**:
- Users with authentication
- Cases with metadata and processing status
- Case files for document management
- Simulation configurations for AI parameters
- Transcript storage for courtroom proceedings

## Authentication and Authorization

The application includes user authentication infrastructure:
- User registration and login system
- Session-based authentication with PostgreSQL session store
- Password hashing and validation
- User-specific case access control

Currently implemented as foundational structure ready for activation.

## External Dependencies

**AI/ML Services**: 
- Ollama integration for local LLM processing
- Support for multiple AI models (default: llama3.1:8b)
- Custom prompt engineering for legal domain expertise

**Document Processing**:
- PDF text extraction using PyPDF
- Text chunking and preprocessing for AI consumption
- File upload handling with type validation

**UI Framework**:
- Radix UI for accessible component primitives
- Lucide React for consistent iconography
- shadcn/ui component system for cohesive design

**Development Tools**:
- TypeScript for type safety across full stack
- ESBuild for production bundling
- Replit integration for cloud development

**Key Features**:
- Real-time simulation progress tracking with phase-by-phase progression
- Citation system linking AI responses to source documents and legal knowledge base
- Multi-phase courtroom simulation workflow (opening, evidence, cross-examination, closing, verdict, opinion)
- Responsive design for various screen sizes with judicial theming
- Advanced file upload with drag-and-drop support for PDF and TXT files
- PDF text extraction using pdf-parse library with error handling
- Configurable AI model parameters (model selection, strictness, temperature)
- Comprehensive legal knowledge base integration
- Enhanced text chunking algorithm with sentence-aware splitting
- Educational simulation engine with realistic legal content generation
- Document format validation and user guidance
- Export functionality for transcripts and case data

**Recent Updates (August 2025)**:
- **AI Integration Complete**: Fully integrated OpenAI GPT-4o for intelligent case analysis and courtroom simulation
- **Smart Document Analysis**: AI automatically analyzes uploaded case documents to extract key facts, legal issues, and potential arguments
- **AI-Powered Simulations**: Real AI-generated courtroom proceedings with prosecution, defense, jury deliberation, and judicial opinions
- **Enhanced PDF Processing**: Improved PDF text extraction with fallback methods for better document compatibility  
- **Intelligent UI**: Added AI analysis dashboard showing case summaries, key facts, legal issues, and argument strategies
- **Real-time AI Features**: Live AI analysis generation and regeneration capabilities for case documents
- **Educational AI Content**: AI generates realistic legal content tailored to uploaded case materials
- **Comprehensive Error Handling**: Robust fallback systems when AI services are unavailable
- **Professional Interface**: Enhanced UI with brain icons and AI-powered messaging throughout the application