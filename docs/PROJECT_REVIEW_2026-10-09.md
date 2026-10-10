# NoryX project review — 9 October 2026

## Scope and conclusion

Reviewed the frontend routes and API adapters, authentication/session handling, backend routes, extraction and AI processing, database schema and migrations, tests, CI, configuration, scripts, and project documentation. Shared UI primitives were inspected selectively; this is a repository review, not a claim that every visual state or dependency has been audited.

The core product is implemented, but the checked-in setup cannot reliably reproduce a working installation. Fix database and configuration issues first, followed by extraction safety and processing reliability. Existing deployments may contain manually created database objects that conceal the setup gaps.

No application code, credentials, or remote data was changed during this review. This report is the only intentional repository addition. Authenticated browser flows, live Supabase RLS policies, deployed gateway configuration, and real Gemini calls were not exercised. Existing security reports are historical evidence, not a fresh vulnerability scan.

## Architecture and feature map

| Area | Implementation | Assessment |
| --- | --- | --- |
| Frontend | Next.js App Router, React, TypeScript, Tailwind, Radix components | Core pages use real backend data; some controls remain local or static |
| Authentication | Supabase Google OAuth, SSR cookies, Next proxy, bearer token verification in FastAPI | Server verifies tokens; authorization is explicitly implemented in routes |
| Capture | Public page fetch → HTML extraction/reader fallback → Gemini metadata → database writes → background embedding | Synchronous metadata generation; embedding is an in-process task |
| Search | Library vocabulary correction, Gemini query embedding, database RPC, Python reranking | Missing checked-in RPC; fallback only considers latest 1,000 items |
| Collections | Owner-managed items and accepted-connection membership | API access checks are present; frontend exposes some unavailable member actions |
| Connections | Profile discovery, requests, accept/decline, removal | Uses public profiles separate from auth metadata |
| Insights | Client-side aggregation of loaded memories | Real data, but completeness depends on unpaginated library retrieval |
| Storage | Supabase Postgres, pgvector, RLS, service-role backend | Schema does not match API contract |
| Verification | Ruff, pytest, ESLint, Next build, audit commands in CI | Useful baseline; no database integration or frontend behavior tests |

## Findings, ordered by priority

### 1. High — Fresh database setup omits required columns and RPCs

`backend/src/memora/routes/knowledge.py:23` and `routes/collections.py:19` select `canonical_url` and `thumbnail_url`. Neither is defined in `backend/database.sql` or the migrations. Library listing, capture's initial duplicate query, search, and collection detail can therefore fail against a database created from this repository.

`knowledge.py:546` calls `update_memory_embedding`; search calls `hybrid_search_knowledge_items`. Neither function is supplied in the SQL files. Even after adding the columns, background embedding fails and semantic search silently falls back. The codebase handbook already acknowledges these gaps, while the root README describes the schema as complete.

**Action:** Supply versioned migrations for every required column and RPC, including explicit execution grants and authorization boundaries. Apply them to an empty disposable database in CI and test capture, listing, embedding updates, and search.

### 2. High — HNSW index uses an unsupported vector dimension

`backend/database.sql:15` declares `vector(3072)` and line 35 indexes it directly using HNSW with `vector_cosine_ops`. pgvector documents a 2,000-dimension HNSW limit for `vector`, versus 4,000 for `halfvec`. Consequently, the index statement is incompatible with the documented limit and can stop bootstrap SQL before subsequent tables are created. This was checked against documentation, not executed on the user's database.

**Action:** Align model output, column type, index expression, and search RPC. Options include lower-dimensional embeddings or a compatible half-precision index and matching query expression. Existing embeddings need a deliberate migration plan.

Source: [pgvector supported HNSW types](https://github.com/pgvector/pgvector#hnsw).

### 3. High — Supplied origin configuration prevents startup

`backend/.env.example:2` sets `FRONTEND_ORIGINS=http://localhost:3000`, while `config.py:10` declares a list field. Pydantic Settings attempts JSON decoding before the custom field validator can split the string.

**Reproduced:** Instantiating Settings with that environment value and dummy required credentials raises `SettingsError` for `frontend_origins`. No external calls were made.

**Action:** Use a JSON list in the example, or explicitly disable automatic decoding for this field and retain comma-separated parsing. Add tests using environment variables rather than constructor-only values.

### 4. High — URL validation is separate from the actual connection

`backend/src/memora/services/extraction/fetcher.py:13` resolves and checks addresses, but line 37 lets HTTPX independently resolve the hostname when connecting. A hostname whose answer changes between these resolutions can defeat the intended public-address restriction. Redirect checks and streamed size limits are useful, but do not close this DNS rebinding gap.

**Action:** Connect through a transport that pins the validated address while preserving hostname/TLS verification, or enforce public-only egress through a controlled proxy/network policy. Test changing DNS answers. This is a code-path security finding; no live exploit was attempted.

### 5. Medium — Extraction fallback converts rejection into a successful-looking capture

`services/extraction/service.py:482` catches every fetch exception, including private-address rejection and size/type failures, and then calls the third-party reader. If that fails, it produces nonempty URL-only content. Capture's empty-content check consequently does not distinguish a readable page from a blocked or failed fetch, and Gemini may generate a memory from just a URL and error text.

The first reader URL at line 174 also prepends `http://` to an already absolute URL. Reader responses are downloaded in full before later slicing, so the main fetcher's byte limit does not cover this path.

**Action:** Separate policy rejections from recoverable extraction failures; never send rejected URLs through fallback. Build reader URLs correctly, stream and cap responses, and preserve extraction confidence/failure status in the saved item and UI. Document the reader provider's role in the data flow.

### 6. Medium — Embedding work is not durable and success is shown prematurely

`knowledge.py:1005` schedules embedding with FastAPI `BackgroundTasks` after writing a `processing` item. A process restart can lose that task. Failures set `embedding_failed`, but there is no retry endpoint, persistent queue, or recovery scan in the repository.

Both capture screens treat any successful response other than literal `failed` as completed. `frontend/lib/api/knowledge.ts` also maps `embedding_failed` to the ordinary saved presentation and drops the raw status from the normalized item. The UI can claim semantic indexing finished when it has not.

**Action:** Persist job state, support retry/recovery, expose processing status to the frontend, and distinguish “saved” from “search index ready.”

### 7. Medium — Duplicate prevention misses old items and concurrent requests

`knowledge.py:849` checks only the latest 500 memories before inserting. There is no checked-in unique constraint on `(user_id, canonical_url)`, and the payload does not populate `canonical_url`. Older duplicate links and simultaneous submissions can create multiple copies and duplicate AI costs.

**Action:** Store a canonical key and enforce uniqueness in Postgres. Handle conflicts idempotently, including adding an existing item to a selected collection. Keep the submitted original URL separately; normalization currently changes the URL used for fetching, including removing `www`, trailing slashes, and selected query parameters.

### 8. Medium — Async API handlers execute blocking database/auth calls

`auth.py:20` and the route modules use the synchronous Supabase client from `async def` handlers. Network calls to Supabase block the event loop, so a slow database/auth response can delay unrelated requests in the same worker. CPU-heavy fuzzy reranking also runs on that loop.

**Action:** Use an async client or explicitly offload blocking work. Load-test concurrent capture/search and health requests before deciding worker counts or caching strategy.

### 9. Medium — Ctrl/Cmd+K searches sample memories

`frontend/components/search/command-palette.tsx:7` imports sample `knowledgeItems` and filters them locally. Result buttons have no navigation handler; the displayed Enter/arrow-key affordances are not implemented. This palette is mounted in the authenticated app layout, so users encounter it as a real search feature.

**Action:** Connect it to the real search API or send the query to the search page; implement selection, keyboard navigation, focus management, and loading/error states.

### 10. Medium — Processing route can become stuck during effect replay

`frontend/app/app/processing/page.tsx:106` prevents a second effect setup with `startedRef`. The first setup's cleanup sets its closure's `mounted` flag to false. Under development Strict Mode's extra setup/cleanup cycle, the second setup returns early, while the original request ignores its result. The route can remain processing indefinitely. Changing URL/collection parameters on a retained component has a related problem.

**Action:** Make request subscription and cleanup replay-safe, preferably with an idempotent capture operation. Verify the `/app/processing?url=...` route in development and production. The separate `/app/capture` screen does not use this specific ref guard.

Source: [React Strict Mode effect replay](https://react.dev/reference/react/StrictMode#fixing-bugs-found-by-re-running-effects-in-development).

### 11. Medium — Profile edits do not update the social profile

`frontend/app/app/settings/page.tsx:271` updates auth user metadata only. Network discovery and shared collections read `public.profiles.display_name`; the SQL trigger populates that table only after user insertion. `ensure_profile` returns existing records without synchronizing metadata.

**Action:** Update the profile table through a validated API or synchronize relevant auth metadata changes with a database trigger. Test that changing a name changes what another connected user sees.

### 12. Medium — Large libraries have incomplete retrieval

`knowledge.py:684` performs an unpaginated library query; frontend counts and insights treat the response as the entire library. Results are subject to the configured PostgREST row limit. Search explicitly limits lexical candidates to the newest 1,000 items, so older lexical matches disappear when semantic retrieval is unavailable or misses them.

**Action:** Add cursor pagination, server-side totals/insights, and database-backed lexical candidate retrieval. Test beyond both the API row cap and the 1,000-item search window.

### 13. Medium — No repository-enforced AI usage limits

Capture and search authenticate callers but do not enforce per-user quotas or request/concurrency limits. A valid account can repeatedly trigger paid metadata generation, retries, and embeddings. The README delegates rate limits to a gateway, but no gateway configuration is checked in.

**Action:** Confirm actual deployment limits, enforce per-user budgets/concurrency where appropriate, and bound AI request duration. This does not establish that the deployed service lacks external protection.

## Smaller functional gaps

- CollectionPicker loads all accessible collections, even though adding items requires ownership. Filter to owner-access collections.
- Shared collection cards always render the custom-tag editor, although the API permits only the memory owner to modify tags. Hide or disable it for read-only members; backend enforcement is present.
- KnowledgeCard bookmark changes are component state only and disappear on remount.
- Onboarding name/interests are not persisted; completion simply navigates to `/app`.
- Notification controls are placeholders; export and deletion buttons are explicitly disabled.
- The dashboard's learning streak resumes from the most recent historical saved day even after a long gap, so it can present an expired streak as current.
- Collection update accepts an explicit null name in the request model, then sends it to a NOT NULL database column, yielding a server error rather than a validation response.
- The API wrapper assumes all error responses are JSON and has no cancellation/deadline handling. Gateway HTML errors can obscure the useful failure message.
- Capture writes multiple database records with compensating deletes instead of one transaction; cleanup failure can leave data despite the “Nothing was saved” error.
- `run.py` always uses development reload. Production should use a separate explicit server command/configuration.

## Verification and coverage

- Backend pytest: **24 passed**, one Starlette TestClient deprecation warning.
- Backend Ruff: **passed**.
- Frontend ESLint: **passed**.
- Frontend production build: **passed**, including TypeScript checking and generation of all 17 static pages.
- Origin configuration: failure reproduced using dummy values and the example origin format.
- Tracked environment files: only the two `.env.example` files appeared in `git ls-files '*env*'`. This is not a Git-history secret audit.

The tests cover models, platform classification, search ranking helpers, two fetcher behaviors, health headers, and disabled diagnostics. They do not currently test capture/database integration, user-to-user isolation, collection membership revocation, profile synchronization, schema bootstrap, background recovery, or browser behavior. Passing the suite therefore does not validate the main end-to-end workflows.

## Suggested implementation sequence

1. Make fresh setup reproducible: origin parsing, complete schema/RPC migrations, compatible vector index, disposable database smoke test.
2. Harden extraction boundaries and add complete request-path tests for rejected URLs and bounded fallbacks.
3. Make capture idempotent and embedding recoverable; expose accurate status and failure/retry UI.
4. Add authorization integration tests with two users and a shared collection, including access revocation.
5. Connect command search, synchronize profiles, remove misleading controls, and fix the processing effect.
6. Add pagination, real aggregate counts, usage limits, and concurrency measurements.
