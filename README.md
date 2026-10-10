# NoryX

A personal knowledge workspace for saving links, generating AI summaries, and finding useful ideas again. Organize memories into collections and share selected collections with your connections.

## Features

- **Link capture:** extract web content and generate titles, summaries, key takeaways, and tags with Gemini.
- **Fast library loading:** show an account-specific browser snapshot while fresh data loads from Supabase.
- **Search:** combine semantic retrieval with keyword matching and reranking.
- **Collections:** organize saved memories and give accepted connections read-only access.
- **Custom tags:** add your own labels alongside AI-generated tags.
- **Insights:** view activity and topic breakdowns from your library.
- **Authentication:** sign in with Google through Supabase Auth.

Extraction quality depends on the source. Some social links and videos provide only metadata rather than their full content or transcripts.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16.3.8, React 19, TypeScript, Tailwind CSS |
| UI | Radix UI components, Framer Motion, Recharts |
| Backend | Python 3.13, FastAPI |
| Authentication and database | Supabase Auth, PostgreSQL, pgvector |
| AI | Google Gemini for metadata and embeddings |

The frontend uses the signed-in user's session and row-level security for direct library reads. Capture, search, mutations, collections, and connections use the FastAPI backend. Service-role credentials remain on the backend.

## Repository layout

```text
frontend/
  app/                 Pages, layouts, and authentication routes
  components/          Shared UI and feature components
  lib/                 API clients, library cache, and Supabase helpers
  public/              Website images and static assets
  tests/               Library cache tests
backend/
  src/memora/          FastAPI routes, authentication, extraction, and AI services
  tests/               Backend tests
  migrations/          Incremental database changes
  database.sql         Database schema definitions; see setup limitations below
  pyproject.toml       Python package and development dependencies
.github/workflows/     Build, test, lint, and security checks
```

Local documentation, security reports, scratch files, dependencies, and generated build output are excluded by `.gitignore`. Application assets belong in `frontend/public/`; the root `assets/` directory is ignored. Commit `frontend/package-lock.json` with dependency changes.

## Local setup

### Prerequisites

- Node.js 22.6+ and npm; CI uses Node.js 22.
- Python 3.13.
- A Supabase project with Google sign-in configured and the vector extension available.
- A Gemini API key.

The commands below use PowerShell and start from the repository root.

### Install dependencies

```powershell
Copy-Item frontend/.env.example frontend/.env.local
Copy-Item backend/.env.example backend/.env

cd backend
py -3.13 -m venv .venv
.venv\Scripts\python.exe -m pip install -e ".[dev]"

cd ../frontend
npm.cmd ci
cd ..
```

### Configure the environment

Set these values in `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

Set these values in `backend/.env`:

```dotenv
PORT=5000
FRONTEND_ORIGINS='["http://localhost:3000"]'
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=gemini-embedding-001
ENABLE_DIAGNOSTIC_ENDPOINTS=false
```

**Use a JSON array for `FRONTEND_ORIGINS`.** Replace the plain URL in the current backend example file with the value shown above; the settings loader otherwise fails while parsing the list.

Both services must point to the same Supabase project. Never put the service-role key or Gemini key in a `NEXT_PUBLIC_*` variable. Add `http://localhost:3000/auth/callback` to Supabase's allowed redirect URLs, and configure the Google provider's callback as shown in your Supabase dashboard. Add your production frontend callback when deploying.

### Prepare the database

Review `backend/database.sql` and the SQL files in `backend/migrations/` before applying them. Back up an existing database and apply the relevant incremental migrations in filename order rather than recreating its tables.

**Fresh database setup has known gaps:** the checked-in SQL does not yet define the `knowledge_items.canonical_url` and `knowledge_items.thumbnail_url` columns or the `update_memory_embedding` and `hybrid_search_knowledge_items` functions expected by the backend. Its 3,072-dimensional vector column also needs a compatible HNSW index definition. Reconcile these objects with a working schema before expecting capture and semantic search to work in a new environment.

Keep row-level security enabled, including the policies allowing users to read their own memories and tags. Do not use the service-role key in the browser to work around missing policies.

### Start development servers

Backend, in one terminal from the repository root:

```powershell
cd backend
.venv\Scripts\python.exe run.py
```

Frontend, in a separate terminal from the repository root:

```powershell
cd frontend
npm.cmd run dev
```

- Website: http://localhost:3000
- Backend API documentation: http://localhost:5000/docs
- Backend health check: http://localhost:5000/api/health

`run.py` enables development reload. Use the production server command below for deployment.

## How library loading works

After a successful read, NoryX stores a per-user snapshot in browser storage. Returning users can see those cards before the database refresh completes. Snapshots expire after 24 hours and are cleared on sign-out. Saves, deletions, and tag edits update the current user's cache; failed refreshes retain available cached content.

A first visit, an expired cache, or a new browser still requires a database request. Direct Supabase reads remove the extra backend hop, but actual latency depends on connectivity and the database. Embedding generation runs separately after capture; saving a memory does not guarantee its semantic index is already ready.

## Verification

Run frontend checks from `frontend/`:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
npm.cmd audit --omit=dev --audit-level=high
```

Run backend checks from `backend/`:

```powershell
.venv\Scripts\python.exe -m pytest -q
.venv\Scripts\python.exe -m ruff check .
.venv\Scripts\python.exe -m pip_audit .
```

GitHub Actions runs these checks on pull requests and pushes to `main`, installing frontend dependencies with `npm ci`.

The dependency verification on **10 October 2026** passed the production build, 10 frontend tests, 24 backend tests, lint checks, and the production npm audit with zero vulnerabilities. These are dated results; rerun the checks for subsequent changes. A full npm audit including development dependencies still reported five high entries from one unpatched `braces` advisory in the Next.js ESLint dependency chain. The production audit gate remains enabled.

## Production configuration

Build and run the frontend from `frontend/`:

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd start
```

Run the backend from `backend/`, after installing dependencies and configuring its environment:

```powershell
.venv\Scripts\python.exe -m uvicorn memora.main:app --host 0.0.0.0 --port 5000
```

Set frontend `NEXT_PUBLIC_*` variables before building. Use HTTPS for both services, set the production frontend origin in the backend's JSON origin list, and register the production authentication callback in Supabase. Keep diagnostics disabled, configure gateway rate limits for capture and search, and verify database backups and access policies before launch.

## Current limitations

- Ctrl/Cmd+K currently searches sample memories; use the Search page for your saved content.
- Some onboarding, bookmark, and notification controls are local or placeholders.
- Account deletion and data export are not implemented in the settings UI.
- Background embedding jobs have no durable queue or automatic recovery after a process restart.
- Database bootstrap and live authenticated flows are not covered by the current unit tests.
