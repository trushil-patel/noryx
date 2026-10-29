# Memora V2 Python Backend

This is the complete Python replacement for the editable `src/` code in the old Node backend. It preserves the existing HTTP paths and response shapes.

## Create the project

Use Python 3.13, then run from this directory:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e ".[dev]"
Copy-Item .env.example .env
```

Fill in `.env` with the same Supabase and Gemini values used by the old backend. Never commit `.env` or expose the service-role key to the frontend.

Diagnostic database and AI endpoints are disabled by default. Only enable them
temporarily in a trusted development environment with
`ENABLE_DIAGNOSTIC_ENDPOINTS=true`; they still require an authenticated user.

Open the Supabase SQL editor and run `database.sql` if the tables do not already exist. If your existing schema is already working, do not recreate it.

## Run

```powershell
$env:PYTHONPATH="src"
python run.py
```

Open `http://localhost:5000/docs` for the generated API documentation. Health check:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

Expected response:

```json
{"success":true,"service":"Memora Backend","status":"Healthy"}
```

## Frontend compatibility

- `GET /api/health`
- `GET /api/test-db`
- `GET /api/ai-test`
- `GET /api/auth/me`
- `GET /api/knowledge`
- `GET /api/knowledge/search?q=...`
- `POST /api/knowledge` with `{ "url": "https://example.com" }`

Protected routes require `Authorization: Bearer <supabase-access-token>`.

## Source layout

```text
src/memora/
  main.py
  config.py
  auth.py
  models.py
  supabase.py
  routes/
    auth.py
    knowledge.py
    system.py
  services/
    ai.py
    extraction/
      fetcher.py
      service.py
```

The fetcher blocks private/local IP addresses to reduce server-side request forgery risk. The admin Supabase client is only used after the JWT user has been verified.

## Search latency

Search reuses up to 32,768 fuzzy token comparisons in a bounded in-process cache.
Authentication and search database reads run off the async request loop so they
can overlap with other requests. Results are still read fresh and scoped to the
signed-in user.

`SEARCH_SEMANTIC_TIMEOUT_SECONDS` defaults to `3` (valid range: greater than zero,
up to 30). This budget covers query embedding and semantic retrieval; on timeout
or provider failure, search returns the existing keyword/typo-ranked matches.
Semantic-only matches may be absent in that fallback. The budget does not cover
authentication, the initial library read, or local ranking. A database request
already running in a worker thread may finish after the response falls back.

A local synthetic 1,000-memory ranking benchmark improved from 3.36 seconds to
0.24 seconds with the comparison cache. This measures ranking only, not deployed
end-to-end latency. Search still reads the latest 1,000 memories for lexical
matching; larger-library database indexing remains separate work.

The search page requests `stream=true` to receive newline-delimited JSON result
sets from the same authenticated request. Keyword/typo matches are sent before
query embedding starts; the final batch includes semantic matches using the
existing timeout and ranking. This removes the AI wait from time to first keyword
results without repeating the library read. Clients omitting `stream` retain the
original JSON response. Interrupted enrichment preserves already displayed results.
Production proxies must pass streaming responses through without buffering
(`X-Accel-Buffering: no` is included). Actual latency still depends on authentication,
database access, library size, and deployment buffering.
