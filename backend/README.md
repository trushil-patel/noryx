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
