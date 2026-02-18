# RAG AI Agent

A full-stack AI agent application that answers questions by retrieving context from a private knowledge base. The backend uses Retrieval-Augmented Generation (RAG) to query a Pinecone vector database and synthesize answers with Google Gemini. The frontend provides a chat interface built with Next.js and shadcn/ui.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Ingesting Documents](#ingesting-documents)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Tech Stack](#tech-stack)

---

## Architecture Overview

```
User  --->  Frontend (Next.js)  --->  Backend (Express)  --->  Gemini LLM
                                            |                      |
                                            |                      v
                                            +-------->  Pinecone (Vector DB)
```

1. The user submits a question through the frontend chat interface.
2. The frontend sends a POST request to the backend `/api/chat` endpoint.
3. The backend invokes Google Gemini with the Vercel AI SDK, providing it with a `searchCompanyDocs` tool.
4. Gemini autonomously decides whether to call the tool based on the question.
5. When the tool is called, the backend converts the search query into an embedding using `gemini-embedding-001`, queries Pinecone for the most relevant document chunks, and returns the context to the LLM.
6. Gemini synthesizes a final answer combining the retrieved context with its general knowledge.
7. The answer is returned to the frontend and displayed to the user.

---

## Project Structure

```
express-ai-agent/
|-- docs/                          # Knowledge base documents (.md, .txt)
|   +-- frontend-guidelines.md
|-- src/                           # Backend source code
|   |-- controllers/
|   |   +-- agentController.js     # Chat endpoint handler, LLM orchestration
|   |-- services/
|   |   +-- ragService.js          # Embedding + Pinecone vector search
|   |-- scripts/
|   |   +-- ingest.js              # Document chunking and ingestion pipeline
|   +-- server.js                  # Express server entry point
|-- frontend/                      # Frontend source code (Next.js)
|   +-- src/
|       |-- app/
|       |   |-- layout.tsx         # Root layout with dark mode
|       |   +-- page.tsx           # Chat page UI
|       +-- components/ui/         # shadcn/ui components
|-- .env.example                   # Environment variable template
|-- .gitignore
|-- eslint.config.mjs              # ESLint flat config
|-- .prettierrc                    # Prettier config
+-- package.json
```

---

## How It Works

### Document Ingestion (`src/scripts/ingest.js`)

The ingestion script reads all `.md` and `.txt` files from the `docs/` directory, splits them into overlapping chunks (500 characters with 100-character overlap), generates embeddings via `gemini-embedding-001`, and upserts the vectors into Pinecone. Each record stores the original text and source filename in its metadata.

### RAG Retrieval (`src/services/ragService.js`)

When the agent calls the search tool, the service embeds the query, performs a similarity search against Pinecone (top 2 results), and returns the matching text chunks along with their source document names.

### Agent Controller (`src/controllers/agentController.js`)

The controller uses the Vercel AI SDK `generateText` function with `maxSteps: 5`, allowing the LLM to reason, call tools, and synthesize across multiple steps. If the LLM fails to produce a direct text response, a fallback mechanism extracts raw tool outputs and makes a second LLM call to polish them into a coherent answer.

### Frontend (`frontend/src/app/page.tsx`)

A single-page chat interface with message history, loading indicators, and suggested quick-start questions. Communicates with the backend via a simple `fetch` call to `/api/chat`.

---

## Prerequisites

- Node.js >= 18
- npm
- A [Google AI Studio](https://aistudio.google.com/) account (for Gemini API key)
- A [Pinecone](https://www.pinecone.io/) account with an index created

---

## Environment Variables

### Backend

Create a `.env` file in the project root (see `.env.example`):

| Variable | Description |
|---|---|
| `PORT` | Server port (default: `3001`) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API key |
| `PINECONE_API_KEY` | Pinecone API key |
| `PINECONE_INDEX_NAME` | Name of the Pinecone index |

### Frontend

Set in your hosting platform (e.g. Vercel) or in a local `.env.local` file inside `frontend/`:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `https://your-backend.com`) |

---

## Getting Started

### 1. Install dependencies

```bash
# Backend
npm install

# Frontend
cd frontend && npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env and fill in your API keys
```

### 3. Ingest documents

Place your `.md` or `.txt` files in the `docs/` directory, then run:

```bash
npm run ingest
```

### 4. Start development servers

```bash
# Terminal 1 - Backend (http://localhost:3001)
npm run dev

# Terminal 2 - Frontend (http://localhost:3000)
cd frontend && npm run dev
```

---

## Ingesting Documents

The ingestion pipeline processes documents from the `docs/` directory:

1. Reads all `.md` and `.txt` files.
2. Splits each file into chunks of ~500 characters with 100-character overlap. The splitter tries to break at sentence boundaries (periods, newlines) to preserve context.
3. Generates embeddings for all chunks in a single batch using `gemini-embedding-001`.
4. Upserts vectors to Pinecone under the `my-company-docs` namespace, storing `text` and `source` (filename) in the metadata.

To re-ingest after adding or updating documents:

```bash
npm run ingest
```

---

## API Reference

### `GET /health`

Health check endpoint.

**Response:**
```json
{ "status": "ok", "message": "AI Agent Server is running!" }
```

### `POST /api/chat`

Send a question to the AI agent.

**Request body:**
```json
{ "prompt": "What frontend framework do we use?" }
```

**Response:**
```json
{
  "question": "What frontend framework do we use?",
  "answer": "Based on the internal documentation, we use React 18 with Next.js App Router..."
}
```

**Error responses:**
- `400` -- Missing `prompt` field
- `500` -- Internal server error

---

## Deployment

### Frontend (Vercel)

1. Import the repository on [vercel.com/new](https://vercel.com/new).
2. Set **Root Directory** to `frontend`.
3. Add the environment variable `NEXT_PUBLIC_API_URL` pointing to your backend URL.
4. Deploy. Vercel auto-detects Next.js and handles the build.

### Backend

Deploy the Express server to any Node.js hosting platform (e.g. AWS Elastic Beanstalk, Railway, Render). Configure the four environment variables listed above in the platform's settings.

---

## Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| Express 5 | HTTP server and routing |
| Vercel AI SDK (`ai`) | LLM orchestration and tool calling |
| Google Gemini (`@ai-sdk/google`) | LLM for generation and embeddings |
| Pinecone SDK v7 | Vector database for similarity search |
| Zod | Schema validation for tool parameters |
| dotenv | Environment variable management |

### Frontend

| Technology | Purpose |
|---|---|
| Next.js 16 | React framework with App Router |
| TypeScript | Type-safe development |
| Tailwind CSS v4 | Utility-first styling |
| shadcn/ui | Pre-built accessible UI components |
| Lucide React | Icon library |

### Developer Tooling

| Tool | Purpose |
|---|---|
| ESLint | Code quality and linting |
| Prettier | Code formatting |
| nodemon | Auto-restart during development |
