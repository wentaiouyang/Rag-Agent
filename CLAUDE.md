# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RAG AI Agent — a full-stack app that answers questions by retrieving context from a Pinecone vector database and synthesizing answers with Google Gemini. Express backend + Next.js frontend.

## Commands

### Backend (root directory)
- `npm run dev` — start backend with nodemon (http://localhost:3001)
- `npm start` — start backend without auto-reload
- `npm run ingest` — ingest docs from `docs/` into Pinecone
- `npm run lint` / `npm run lint:fix` — ESLint
- `npm run format` / `npm run format:check` — Prettier

### Frontend (`frontend/` directory)
- `cd frontend && npm run dev` — start Next.js dev server (http://localhost:3000)
- `cd frontend && npm run build` — production build
- `cd frontend && npm run lint` — ESLint

No test suite is configured for either backend or frontend.

## Architecture

### Backend (Express 5, CommonJS)
- **Entry point:** `src/server.js` — Express app with CORS, health check (`GET /health`), and chat route (`POST /api/chat`)
- **Agent controller:** `src/controllers/agentController.js` — uses Vercel AI SDK `generateText` with `gemini-2.5-flash`, defines a `searchCompanyDocs` tool that the LLM can invoke autonomously. Includes an in-memory response cache (10min TTL). Falls back to extracting raw tool outputs if the LLM produces no direct text.
- **Title controller:** `src/controllers/titleController.js` — generates short conversation titles via Gemini (not yet wired into routes in server.js)
- **RAG service:** `src/services/ragService.js` — embeds queries with `gemini-embedding-001`, queries Pinecone (`my-company-docs` namespace, topK=2), returns matched chunks with source metadata
- **Ingestion script:** `src/scripts/ingest.js` — reads `.md`/`.txt` files from `docs/`, chunks text (500 chars, 100 overlap), batch-embeds with Gemini, upserts to Pinecone

### Frontend (Next.js 16, TypeScript, Tailwind CSS v4)
- **Chat page:** `frontend/src/app/page.tsx` — single-page chat interface with message history, loading states, suggested questions
- **Conversation storage:** `frontend/src/lib/conversationStorage.ts` — client-side conversation persistence
- **Components:** `frontend/src/components/` — ChatSidebar, MoodAvatar, ThemeProvider, ThemeToggle
- **UI primitives:** `frontend/src/components/ui/` — shadcn/ui components (button, card, input, scroll-area, avatar, sheet)

### Data Flow
1. User submits question via frontend → `POST /api/chat` with `{ prompt }` body
2. Backend calls Gemini with `searchCompanyDocs` tool available (maxSteps: 3)
3. Gemini decides whether to call the tool; if so, backend embeds the query, searches Pinecone, returns context
4. Gemini synthesizes final answer from context + general knowledge
5. Response returned as `{ question, answer }`

## Environment Variables

### Backend (`.env` in root)
- `PORT` — server port (default 3001)
- `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini API key
- `PINECONE_API_KEY` — Pinecone API key
- `PINECONE_INDEX_NAME` — Pinecone index name

### Frontend (`.env.local` in `frontend/`)
- `NEXT_PUBLIC_API_URL` — backend API base URL

## Code Style
- Backend: CommonJS (`require`/`module.exports`), ESLint flat config with Prettier integration
- Frontend: TypeScript, ESLint with next config
- Formatting: Prettier with 2-space indent, single quotes, trailing commas, 100-char print width
- ESLint rules: `no-var` error, `prefer-const` error, `eqeqeq` always, `curly` always, unused vars warn (underscore-prefixed args ignored)

## gstack

**Browsing:** Always use the `/browse` skill from gstack for all web browsing and QA testing. Never use `mcp__claude-in-chrome__*` tools.

**Available skills:**
- `/office-hours` — brainstorm and validate ideas
- `/plan-ceo-review` — CEO/founder-mode plan review
- `/plan-eng-review` — engineering architecture review
- `/plan-design-review` — designer's eye plan review
- `/design-consultation` — create a design system / DESIGN.md
- `/autoplan` — run all plan reviews automatically
- `/review` — pre-landing PR code review
- `/ship` — ship workflow (tests, review, PR creation)
- `/land-and-deploy` — merge PR, wait for CI, verify production
- `/setup-deploy` — configure deployment settings
- `/canary` — post-deploy canary monitoring
- `/benchmark` — performance regression detection
- `/browse` — headless browser for QA and site testing
- `/qa` — systematically QA test and fix bugs
- `/qa-only` — QA report without fixes
- `/design-review` — visual QA audit and fixes
- `/setup-browser-cookies` — import browser cookies for authenticated testing
- `/investigate` — systematic debugging with root cause analysis
- `/document-release` — post-ship documentation updates
- `/codex` — second opinion code review via OpenAI Codex
- `/cso` — security audit (OWASP, STRIDE, threat modeling)
- `/retro` — weekly engineering retrospective
- `/careful` — safety warnings for destructive commands
- `/freeze` — restrict edits to a specific directory
- `/unfreeze` — remove edit restrictions
- `/guard` — full safety mode (careful + freeze)
- `/gstack-upgrade` — upgrade gstack to latest version

## Deployment
- Frontend deploys to Vercel (root directory set to `frontend`)
- Backend deploys to any Node.js host (Railway, Render, etc.)
