# NoryX

NoryX is a personal knowledge workspace that captures links, extracts their
content, generates AI metadata and embeddings, and organizes memories into
searchable and shareable collections.

## Architecture

- `frontend/`: Next.js application with Supabase authentication
- `backend/`: FastAPI API, Gemini processing, and Supabase persistence
- `backend/database.sql`: complete database schema for new environments
- `backend/migrations/`: incremental SQL changes for existing environments
- `docs/`: product and API documentation

## Local setup

Requirements: Node.js 22+, Python 3.13, and a Supabase project with pgvector.

```powershell
Copy-Item frontend/.env.example frontend/.env.local
Copy-Item backend/.env.example backend/.env

cd backend
py -3.13 -m venv .venv
.venv\Scripts\python.exe -m pip install -e ".[dev]"

cd ../frontend
npm ci
```

Fill in both environment files, apply `backend/database.sql` to a new Supabase
project, then start the backend and frontend in separate terminals:

```powershell
cd backend
.venv\Scripts\python.exe run.py

cd frontend
npm.cmd run dev
```

## Verification

```powershell
cd backend
.venv\Scripts\python.exe -m ruff check .
.venv\Scripts\python.exe -m pytest -q

cd ../frontend
npm.cmd run lint
npm.cmd run build
npm.cmd audit --omit=dev
```

## Production checklist

- Use HTTPS for both services and set the exact frontend origin in
  `FRONTEND_ORIGINS`.
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` backend-only.
- Leave `ENABLE_DIAGNOSTIC_ENDPOINTS=false`.
- Apply every SQL file in `backend/migrations/` to existing databases.
- Configure rate limits for `/api/knowledge` and `/api/knowledge/search` at the
  load balancer or API gateway.
- Set the frontend's three `NEXT_PUBLIC_*` variables and all backend variables
  from the supplied examples.
- Run the complete verification suite before deployment.
- Back up Supabase and test restore procedures before serving real data.

See [project documentation](docs/MEMORA_PROJECT_DOCUMENTATION.md) and
[API documentation](docs/MEMORA_API_DOCS.md) for implementation details.
