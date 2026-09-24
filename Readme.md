# Personalized AI Journal (Full-Stack RAG MVP)

> A secure, multi-tenant journal application where users write private entries and query an AI assistant that answers strictly using their personal journal context with date-aware citations.

---

## 💡 System Overview

The **Personalized AI Journal** is built to demonstrate modern full-stack engineering standards: clean multi-tenant isolation, atomic vector ingestion, production-grade LLM provider abstraction, and responsive UX with token-by-token streaming.

### Core Features
- **Multi-Tenant Journal CRUD**: Create, edit, and delete private entries. Notes are instantly indexed for semantic search.
- **Atomic Vector Sync**: Text and vector embeddings are stored together inside a single Postgres transaction (`save_note_with_chunks`). Editing or deleting a note updates or cascades-deletes all vectors, preventing stale AI hallucinations.
- **Provider-Agnostic RAG Architecture**: Switch LLM and Embedding providers (Gemini, OpenRouter, Ollama, Groq) via environment variables with zero code changes.
- **Real-Time Token Streaming**: Server-Sent Events (SSE) stream responses token-by-token with real-time cancellation (`AbortController` Stop button).
- **Date-Aware Citations**: Every AI response cites the source entry dates used to generate the answer. Clicking a source chip opens the full entry modal.
- **Accessible Design System**: Built with Material UI (MUI), self-hosted Inter Variable typography, 7:1 contrast-compliant design tokens, and semantic HTML live regions.

---

## 🏛️ Architecture & Component Design

```
               ┌─────────────────────────────────────────────────────────┐
               │              React 19 Frontend (Vite + MUI)             │
               │  - Auth Context (Supabase Auth)                         │
               │  - Custom Hooks (useNotes, useChat)                     │
               │  - SSE Reader (fetch + ReadableStream)                  │
               └──────────────────────────┬──────────────────────────────┘
                                          │
                                          │ Authorization: Bearer <JWT>
                                          ▼
               ┌─────────────────────────────────────────────────────────┐
               │              Express.js Backend API Node 20+            │
               │  - JWT Verification Middleware (req.user.id)            │
               │  - Zod Input & Rate Limiter (key by user_id)            │
               │  - Service Layer (notes.js, rag.js, chunker.js)          │
               │  - LLM Factory (OpenAI-compatible SDK abstraction)      │
               └──────────────┬───────────────────────────┬──────────────┘
                              │                           │
          Embeddings & Chat   │                           │ Admin RPC & Queries
                              ▼                           ▼
               ┌──────────────────────────┐    ┌──────────────────────────┐
               │ Google Gemini / Ollama / │    │  Supabase Postgres       │
               │ OpenRouter / Groq API    │    │  - pgvector (768-dim)    │
               └──────────────────────────┘    │  - Row Level Security    │
                                               │  - save_note_with_chunks │
                                               │  - match_chunks RPC      │
                                               └──────────────────────────┘
```

### 1. Data Ingestion & Retrieval Flow

#### Ingestion Pipeline (`POST /api/notes`)
1. **Authentication**: JWT verified via `requireAuth` middleware; `req.user.id` extracted.
2. **Chunking (`chunker.js`)**: Short entries (≤ 1200 chars) remain 1 whole chunk to preserve context. Long entries split on paragraph/sentence boundaries with ~150 char overlap.
3. **Date Header Injection**: Prepends date context (`Date: YYYY-MM-DD (Weekday)`) to the chunk before vector calculation.
4. **Pre-Write Embedding (`embeddings.js`)**: Computes vector embeddings *before* touching the database. If embedding fails, no database row is written.
5. **Atomic Write (`save_note_with_chunks` RPC)**: Executes a single Postgres PL/pgSQL function that inserts/updates the note and replaces chunk vectors atomically.

#### Retrieval & Generation Flow (`POST /api/chat`)
1. **Query Embedding**: Converts the user's question into a 768-dimensional query vector.
2. **User-Scoped Search (`match_chunks` RPC)**: Performs exact cosine similarity search filtered strictly by `match_user_id = req.user.id`.
3. **Empty Guard**: If top-K similarity scores fall below `RAG_MIN_SIMILARITY`, the LLM is skipped entirely and a clear *"I couldn't find anything..."* response is returned, saving API costs and avoiding hallucination.
4. **Context Prompting & Generation**: Context chunks wrapped in `<journal>` tags with strict system instructions prohibiting ungrounded answers.
5. **SSE Stream**: Server streams `sources` array first, followed by incremental `token` events, ending with `done`.

---

## 🔒 Multi-Tenancy & Security Model

Guaranteeing strict tenant isolation is a core design requirement:

1. **Identity Source**: Identity comes **exclusively** from the verified Supabase JWT (`Authorization: Bearer <token>`). The frontend never passes `user_id` in request bodies or query params.
2. **Application-Level Scoping**: Every database query explicitly includes `.eq('user_id', userId)`.
3. **Database RLS Backstop**: Row Level Security enabled on `public.notes` and `public.note_chunks`.
4. **RPC Protection**: The database functions `save_note_with_chunks` and `match_chunks` take `user_id` as a parameter. To prevent unauthorized execution via public client keys, execute permissions are **revoked from `anon` and `authenticated` roles** and granted **only to `service_role`**.
5. **404 Over 403**: Requests for non-existent notes or notes belonging to another user return `404 Not Found`, preventing unauthorized resource probing.

---

## 🛠️ Tech Stack & Directory Structure

* **Frontend**: Vite, React 19, Material UI (MUI v6), `@fontsource-variable/inter`, `@supabase/supabase-js`, `react-markdown`.
* **Backend**: Node.js 20+, Express.js, Supabase Admin SDK, OpenAI SDK (talking to Gemini/Ollama/OpenRouter), Zod, Express Rate Limit, Pino logger.
* **Database & Vector Store**: Supabase Postgres with `pgvector` extension (768 dimensions).

```
codeacious/
├── Backend/
│   ├── sql/
│   │   └── schema.sql             # SQL schema, RLS, & PL/pgSQL RPC functions
│   ├── scripts/
│   │   ├── seed.mjs               # Auto-seeds 12 realistic sample notes
│   │   └── isolation-test.mjs    # Multi-tenant isolation verification script
│   └── src/
│       ├── config/env.js          # Fail-fast Zod environment validation
│       ├── lib/                   # Supabase admin client & Pino logger
│       ├── middleware/            # JWT Auth, Zod Validator, Rate Limiting, Error Handler
│       ├── services/              # Notes CRUD, Chunker, Embeddings, LLM Chat, RAG Service
│       └── routes/                # Express API router controllers
└── Frontend/
    ├── src/
    │   ├── theme/theme.js         # MUI theme tokens, contrast rules & typography
    │   ├── lib/                   # Supabase client, fetch API wrapper, SSE reader, Date helpers
    │   ├── context/AuthContext.jsx # Session state & Supabase auth wrapper
    │   ├── hooks/                 # useNotes & useChat custom state hooks
    │   └── components/            # AuthPage, AppShell, TopBar, Notes & Chat components
    └── .env.example
```

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js**: v20 or higher (`node -v`)
- **Supabase Account**: Free project with Postgres vector extension
- **Gemini API Key**: From [Google AI Studio](https://aistudio.google.com) (Free tier)

### 1. Database Schema Setup
1. Open your Supabase Dashboard -> **SQL Editor**.
2. Run the SQL script from [`Backend/sql/schema.sql`](file:///d:/reactProject/codeacious/Backend/sql/schema.sql).

### 2. Backend Setup
```bash
cd Backend
npm install

# Copy .env.example and populate variables
cp .env.example .env
```

Configure `Backend/.env`:
```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

LLM_PROVIDER=gemini
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
LLM_API_KEY=<your-gemini-api-key>
LLM_MODEL=gemini-3.6-flash

EMBED_PROVIDER=gemini
EMBED_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
EMBED_API_KEY=<your-gemini-api-key>
EMBED_MODEL=gemini-embedding-001
EMBED_DIMENSIONS=768
```

Run seed data script & start backend dev server:
```bash
# Seed 12 sample notes with vector embeddings
npm run seed

# Start server with hot reload
npm run dev
```

### 3. Frontend Setup
```bash
cd Frontend
npm install

# Copy .env.example
cp .env.example .env
```

Configure `Frontend/.env`:
```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-or-publishable-key>
VITE_API_URL=http://localhost:4000
```

Start frontend dev server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🌐 Deployment Guide

### Backend Deployment (Render Static / Web Service)
1. Create a new **Web Service** on Render connected to the repository.
2. **Root Directory**: `Backend`
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. **Environment Variables**: Add all variables from `Backend/.env` (`CLIENT_URL` = deployed frontend URL).

### Frontend Deployment (Render Static Site / Vercel)
1. Create a new **Static Site** connected to the repository.
2. **Root Directory**: `Frontend`
3. **Build Command**: `npm run build`
4. **Publish Directory**: `dist`
5. **Environment Variables**: Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`.
6. Add Rewrite Rule: `/*` -> `/index.html` (200).

---

## ⚖️ Architectural Trade-Offs & Decisions

| Decision | Choice | Engineering Rationale |
|---|---|---|
| **Vector Index Scale** | Exact Cosine Search (no ANN index) | At MVP scale (< 100k vectors), approximate indexes (HNSW) filter *after* picking top nearest neighbours across all tenants, which can starve small tenants of search hits. Exact filtered scan by `user_id` guarantees 100% correct recall. |
| **Write Consistency** | Embed-first + PL/pgSQL RPC | Embeddings are computed *before* DB writes. The write is encapsulated in one Postgres RPC function (`save_note_with_chunks`), ensuring text and vectors never diverge if an API call fails. |
| **SSE Transport** | `fetch` + `ReadableStream` | The browser's native `EventSource` API cannot send `Authorization` Bearer headers or POST JSON payloads. Custom `fetch` stream parsing gives complete security control. |
| **State Management** | React Context & Custom Hooks | Local state (`useNotes`, `useChat`, `AuthContext`) avoids unnecessary external state boilerplate (Redux/React Query), keeping imports explainable and simple. |
| **Contrast & Palette** | Dark text on Cyan Accent | Cyan `#03b7d3` with white text yields a poor contrast ratio (2.4:1). Using dark text `#171a26` achieves a WCAG AAA compliant **7:1 contrast ratio**. |

---

## 🔮 Future Improvements

1. **Hybrid Keyword + Vector Search**: Combine BM25 full-text search with vector cosine similarity (RRF - Reciprocal Rank Fusion) for exact keyword retrieval (e.g. part numbers, names).
2. **Multi-Turn Query Rewriting**: Expand follow-up questions (e.g. *"What else did I eat then?"*) using conversation history to rewrite queries into standalone search vectors.
3. **Background Batch Re-Embedding**: Queue asynchronous re-embedding jobs when upgrading embedding models without blocking API endpoints.
4. **Automated E2E Test Suite**: Implement Cypress / Playwright browser tests covering full auth, note creation, edit vector updates, and streaming chat assertions.

---

## 📄 License

Distributed under the MIT License. Built for job assignment evaluation.
