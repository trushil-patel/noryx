# noryX Codebase Handbook

This is a beginner-first explanation of the noryX repository as it exists on 15 August 2026. It is written for someone who assembled the app with AI-assisted or “vibe” coding and now wants a reliable mental model of what every important part does.

The most important sentence in this document is:

> The frontend displays and collects data, the backend enforces the application rules, Supabase authenticates users and stores data, and Gemini turns extracted web content into summaries and search vectors.

---

## 1. What noryX is

noryX is a personal knowledge application. A signed-in user can paste a public web URL. The app extracts text and metadata from that URL, sends the extracted information to Google Gemini, stores the generated memory in Supabase, and later lets the user browse or search it.

The current code also supports:

- Google sign-in
- AI-generated titles, summaries, takeaways, explanations, and tags
- semantic and text-based search
- user-defined custom tags
- collections
- connections between users
- sharing a collection with accepted connections
- activity and library insights calculated from saved items
- light, dark, and system themes

The repository still uses the old internal name `Memora` in Python package names, environment keys, cache keys, database functions, and older documentation. The visible product is called `noryX`. Renaming those internal identifiers is optional; they do not stop the app from working.

---

## 2. The four systems in one picture

```text
┌─────────────────────────────────────────────────────────────┐
│ Browser                                                     │
│ Next.js + React + TypeScript                                │
│ http://localhost:3000                                       │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
               │ Supabase Auth SDK        │ HTTP + Bearer token
               │                          │
               ▼                          ▼
┌──────────────────────────┐   ┌──────────────────────────────┐
│ Supabase Auth            │   │ FastAPI backend              │
│ Google OAuth + sessions  │   │ http://localhost:5000        │
└──────────────┬───────────┘   └──────┬───────────┬───────────┘
               │                      │           │
               │ user identity        │           │ extracted text
               ▼                      ▼           ▼
┌──────────────────────────┐   ┌──────────────┐  ┌─────────────┐
│ Supabase Postgres        │   │ Public web  │  │ Gemini API  │
│ tables + RLS + pgvector  │   │ pages/Jina  │  │ AI + vector │
└──────────────────────────┘   └──────────────┘  └─────────────┘
```

These systems have different jobs:

| System | Job | Does not do |
|---|---|---|
| Next.js frontend | Pages, buttons, forms, browser state, showing responses | Directly generate AI summaries |
| FastAPI backend | Validate users, implement business rules, extract URLs, call Gemini, read/write data | Render the React interface |
| Supabase | Google authentication, session storage, PostgreSQL, row-level security, vector storage | Extract arbitrary webpages |
| Gemini | Generate metadata and 3,072-number embeddings | Store accounts or render pages |

---

## 3. Vocabulary you need first

- **Frontend:** code that runs in or renders for the browser.
- **Backend/API:** server code that accepts HTTP requests and returns JSON.
- **Database:** persistent tables. Data remains after the browser and servers restart.
- **Route:** a URL handled by frontend or backend code, such as `/app/search` or `/api/knowledge`.
- **Component:** a reusable React UI function.
- **State:** a value React remembers while a component is mounted, usually created with `useState`.
- **Effect:** code React runs after rendering, usually for loading data or subscribing to events.
- **Environment variable:** configuration outside source code, especially URLs and secret keys.
- **OAuth:** login delegated to Google and Supabase.
- **Access token:** temporary proof that a request belongs to a signed-in user.
- **RLS:** Supabase/Postgres Row Level Security; database rules limiting which rows a user can access.
- **Service-role key:** a powerful backend-only Supabase key that bypasses RLS.
- **Pydantic model:** a Python class that validates incoming or generated data.
- **TypeScript type:** a development-time description of a JavaScript value.
- **Embedding:** an array of numbers representing meaning. Similar meanings produce nearby vectors.
- **RPC:** a PostgreSQL function called through Supabase as if it were an API operation.
- **Async/await:** a way to wait for network/database work without blocking the whole server or browser.
- **Background task:** work started after the main response can be returned.
- **SSR/client component:** Next.js code rendered on the server versus interactive code run in the browser. Files with `"use client"` use browser features and React hooks.

---

## 4. Repository map

```text
noryX/
├── .github/workflows/ci.yml       automated checks on pushes and pull requests
├── assets/                        design/reference assets
├── backend/                       Python API
│   ├── src/memora/                installable Python package
│   │   ├── main.py                creates and configures FastAPI
│   │   ├── config.py              reads backend environment variables
│   │   ├── auth.py                validates bearer tokens
│   │   ├── supabase.py            creates Supabase clients
│   │   ├── models.py              validates request and AI data
│   │   ├── routes/                API endpoint implementations
│   │   └── services/              AI and webpage extraction logic
│   ├── database.sql               intended new-database schema
│   ├── migrations/                changes for existing databases
│   ├── scripts/                   one-off maintenance programs
│   ├── tests/                     backend automated tests
│   ├── pyproject.toml             Python package/dependency/tool config
│   ├── requirements.txt           exact installed Python dependency snapshot
│   └── run.py                     local backend launcher
├── docs/                          project documentation
├── frontend/                      Next.js web app
│   ├── app/                       URL routes and route layouts
│   ├── components/                reusable React UI
│   ├── lib/                       API, auth, Supabase, types, utilities
│   ├── public/                    browser-served images/icons/robots.txt
│   ├── package.json               JavaScript dependencies and commands
│   ├── proxy.ts                   login protection and session refresh
│   └── next.config.ts             security headers and Next.js config
└── security-reports/              saved scanner output and checklist
```

Generated folders such as `frontend/node_modules`, `frontend/.next`, backend `.venv`, caches, and compiled files are not application source. Do not learn by reading those first.

---

## 5. How to run the project locally

### 5.1 Software required

- Node.js 22 or newer
- Python 3.13
- a Supabase project
- a Google Gemini API key

### 5.2 Frontend configuration

Copy `frontend/.env.example` to `frontend/.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

`NEXT_PUBLIC_` means the value is bundled into browser code. Never put the service-role key or Gemini key in one of these variables.

### 5.3 Backend configuration

Copy `backend/.env.example` to `backend/.env` and set:

```env
PORT=5000
FRONTEND_ORIGINS=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-secret-service-role-key
GEMINI_API_KEY=your-secret-gemini-key
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=gemini-embedding-001
FETCH_TIMEOUT_SECONDS=10
MAX_PAGE_BYTES=5000000
MAX_REDIRECTS=5
ENABLE_DIAGNOSTIC_ENDPOINTS=false
```

What each backend value controls:

| Variable | Meaning |
|---|---|
| `PORT` | Uvicorn/FastAPI listening port |
| `FRONTEND_ORIGINS` | comma-separated browser origins allowed by CORS |
| `SUPABASE_URL` | address of the Supabase project |
| `SUPABASE_PUBLISHABLE_KEY` | low-privilege client key used to ask Supabase who owns a token |
| `SUPABASE_SERVICE_ROLE_KEY` | backend-only database super-key; bypasses RLS |
| `GEMINI_API_KEY` | authenticates calls to Google Gemini |
| `GEMINI_MODEL` | model that writes memory metadata |
| `EMBEDDING_MODEL` | model that creates search vectors |
| `FETCH_TIMEOUT_SECONDS` | maximum normal webpage fetch time |
| `MAX_PAGE_BYTES` | maximum HTML download size, currently 5 MB |
| `MAX_REDIRECTS` | maximum manually followed redirects |
| `ENABLE_DIAGNOSTIC_ENDPOINTS` | exposes authenticated DB/AI test routes when true |

`config.py` uses Pydantic Settings to read and validate these values. `get_settings()` is cached, so configuration is constructed once per process.

### 5.4 Start both servers

Terminal one:

```powershell
cd backend
.venv\Scripts\python.exe run.py
```

Terminal two:

```powershell
cd frontend
npm.cmd run dev
```

Then open `http://localhost:3000`. FastAPI’s generated development documentation is at `http://localhost:5000/docs`.

### 5.5 Why two servers are needed

Next.js owns port 3000 and serves the interface. FastAPI owns port 5000 and performs privileged work. `NEXT_PUBLIC_BACKEND_URL` tells the frontend where FastAPI lives. `FRONTEND_ORIGINS` tells FastAPI which browser origin may call it.

---

## 6. How frontend, backend, and database connect

Every protected application request follows this pattern:

```text
React page
  → function in frontend/lib/api/*.ts
  → backendRequest()
  → ask browser Supabase client for current session
  → add Authorization: Bearer <access_token>
  → fetch http://localhost:5000/api/...
  → FastAPI CurrentUser dependency
  → Supabase auth.get_user(token)
  → verified user ID
  → backend business logic
  → admin_client() database call scoped with that user ID
  → JSON response
  → frontend normalizes snake_case to camelCase
  → React updates state and rerenders
```

The central frontend bridge is `frontend/lib/api/backend.ts`. It:

1. Creates/reuses the browser Supabase client.
2. Calls `supabase.auth.getSession()`.
3. rejects the request if no access token exists.
4. sends JSON to `${NEXT_PUBLIC_BACKEND_URL}${path}`.
5. attaches `Authorization: Bearer ...`.
6. parses the JSON response.
7. converts non-2xx responses into JavaScript `Error` objects.

The central backend bridge is `backend/src/memora/auth.py`. `CurrentUser` is a FastAPI dependency. Putting `user: CurrentUser` in an endpoint parameter automatically requires and validates a token before the endpoint continues.

After validation, route code uses `admin_client()` from `supabase.py`. Because the service-role client can bypass RLS, endpoint code must always include ownership checks such as `.eq("user_id", user.id)`. That repeated check is a security boundary, not unnecessary code.

---

## 7. Authentication from beginning to end

### 7.1 Google login

1. `/login` renders `frontend/app/login/page.tsx`.
2. Clicking the Google button calls `supabase.auth.signInWithOAuth({ provider: "google" })`.
3. The requested callback is `/auth/callback` on the frontend origin.
4. Google authenticates the person and returns an authorization code.
5. `frontend/app/auth/callback/route.ts` receives that code.
6. `exchangeCodeForSession(code)` exchanges it for a Supabase session.
7. Supabase’s server client writes auth cookies.
8. The callback redirects to `/app`.

### 7.2 Route protection

`frontend/proxy.ts` runs for `/app/:path*` and `/login`. It creates a server-side Supabase client using request/response cookies and calls `auth.getUser()`.

- unauthenticated request to `/app/...` → redirect to `/login`
- authenticated request to `/login` → redirect to `/app`
- otherwise → continue and refresh session cookies when Supabase asks

This protects navigation, but the backend independently validates every API token. Backend validation is essential because a user can call port 5000 without using the frontend.

### 7.3 Logout and profile data

- `/logout` is a frontend route handler that signs out and redirects.
- The mobile sidebar and Settings page can also call `supabase.auth.signOut()` directly.
- Settings updates `auth.users.raw_user_meta_data` through `supabase.auth.updateUser()`.
- The social `profiles` table is separate. The current Settings page does **not** update that table, so a changed Settings name may not change the display name shown in Connections.

### 7.4 Profile creation

`database.sql` defines `create_memora_profile()`, triggered after an `auth.users` insert. It derives a safe username, display name, and avatar from Google metadata. `connections.py` also has `ensure_profile()` as a fallback for accounts that lack a profile row.

---

## 8. Capture flow, step by step

### 8.1 Browser side

`frontend/app/app/capture/page.tsx` holds the URL, optional selected collection, progress step, result ID, and error in React state.

When the user submits:

1. The page trims and validates the URL.
2. It starts an animated workflow.
3. It calls `createKnowledgeItem(url, collectionId)` in `frontend/lib/api/knowledge.ts`.
4. That sends `POST /api/knowledge` with:

```json
{
  "url": "https://example.com/article",
  "collection_id": null
}
```

5. On success, it clears `sessionStorage` keys beginning with `memora-library:` so the Library will reload fresh data.
6. It shows completion and can navigate to `/app?captured=<id>`.

`frontend/app/app/processing/page.tsx` contains a second, older-looking capture workflow driven by URL query parameters. It also calls `createKnowledgeItem`. The main Capture page currently performs processing itself, so these are two overlapping UI paths, not two necessary backend stages.

### 8.2 Request validation

FastAPI passes the JSON through `CaptureRequest` in `models.py`:

- `url` must be a valid `HttpUrl`.
- `collection_id`, when present, must be a UUID.

`CurrentUser` validates the bearer token. If a collection was selected, the backend verifies that the current user owns it.

### 8.3 URL normalization and duplicate detection

`canonical_url()`:

- lowercases scheme and host
- removes leading `www.`
- removes a trailing slash except for `/`
- removes fragments such as `#section`
- removes `utm_*`, `fbclid`, `gclid`, `igshid`, `mc_cid`, `mc_eid`, `ref`, and `si`
- preserves other query parameters

The backend loads up to 500 recent items for that user and compares canonicalized `original_url` values. If it finds a duplicate, it returns the existing item instead of extracting or calling Gemini again. If a collection was selected, it can still add that existing memory to the collection.

### 8.4 Safe webpage fetching

`services/extraction/fetcher.py` is the low-level downloader.

1. Only `http` and `https` are accepted.
2. DNS is resolved before every request and redirect.
3. Non-global/private/local IP addresses are rejected. This reduces SSRF attacks against addresses such as `127.0.0.1` or private cloud services.
4. Redirects are followed manually so every destination is checked.
5. Only HTML content is accepted.
6. Content is streamed and stopped if it exceeds `MAX_PAGE_BYTES`.

### 8.5 Content extraction

`services/extraction/service.py` builds a `KnowledgeDocument`.

For YouTube it uses the public oEmbed endpoint to obtain title, author, and thumbnail. It does not fetch a transcript in the current code, so YouTube summaries are based mainly on metadata.

For normal HTML it combines:

- `<title>` and description metadata
- Open Graph/Twitter metadata and thumbnail
- Trafilatura article text
- useful JSON-LD fields
- visible headings, paragraphs, list items, and blockquotes
- homepage navigation/headings for homepage or blog classifications

It classifies content as article, homepage, documentation, government, news, blog, product, video, repository, forum, or unknown. If normal extraction is weak or fails, it tries `r.jina.ai`. If that also fails, it saves URL/host/path context with low confidence. Content is capped at 30,000 characters.

### 8.6 Gemini metadata generation

`services/ai.py` sends up to 24,000 normalized content characters plus URL, type, title, description, extraction method, and confidence to Gemini.

Gemini must return JSON matching `GeneratedMetadata`:

```text
title
summary
key_takeaways[]
why_it_matters
tags[]
```

The backend cleans the values, limits title to 80 characters, limits takeaways to six, removes generic tags, limits tags to ten, and requires a useful summary, at least three takeaways, a reason, and at least three tags. It retries up to three times with increasing waits.

### 8.7 Database insert

The backend inserts `knowledge_items` first, then `knowledge_tags`. If tag insertion fails, it deletes the partially created memory. If adding the new memory to a selected collection fails, it also deletes the memory. This is manual cleanup approximating a database transaction.

### 8.8 Background embedding

The response does not wait for vector generation. FastAPI schedules `complete_embedding_later()`:

1. `embedding_text()` combines generated metadata and part of original extracted content.
2. Gemini creates a 3,072-dimensional `RETRIEVAL_DOCUMENT` vector.
3. The backend calls the `update_memory_embedding` database RPC.
4. The RPC should store the vector and set status to `completed`.
5. On failure, the backend sets status to `embedding_failed`.

The initial row status is `processing`. The item can appear in the library before its semantic vector is ready.

---

## 9. Library and frontend data normalization

`GET /api/knowledge` selects the signed-in user’s rows ordered newest first, including nested `knowledge_tags`.

The database/backend uses Python/Postgres-style snake_case, while React uses camelCase. `normalizeKnowledgeItem()` in `frontend/lib/api/knowledge.ts` is the adapter:

| Backend field | Frontend field |
|---|---|
| `original_url` | `url` |
| `thumbnail_url` | `thumbnailUrl` |
| `key_takeaways` | `takeaways` |
| `why_it_matters` | `whyItMatters` |
| `created_at` | `createdAt` and calculated `savedAt` |
| `custom_tags` | `customTags` |
| `knowledge_tags[].tag` | merged into `tags` |

It also normalizes platform names, derives a hostname source, creates friendly relative time, clamps similarity between 0 and 1, and supplies placeholder text for missing AI fields.

`frontend/app/app/page.tsx` is the Library. It:

- reads the Supabase session to build a per-user cache key
- shows cached items immediately from `sessionStorage`
- fetches fresh items in the background
- calculates counts and filters with `useMemo`
- renders responsive memory tiles
- performs optimistic delete: removes the item immediately, calls the API, and restores it if deletion fails
- updates every `memora-library:` cache after deletion

The `captured` URL query value forces a fresh load after capture.

Custom tags are edited through `CustomTagEditor`, which calls `PATCH /api/knowledge/{id}/tags`. The backend normalizes lowercase spacing, removes `#`, deduplicates, allows at most 20 tags, and limits each to 40 characters.

The bookmark icon in `KnowledgeCard` is only local React state. There is no bookmark database column or bookmark API, so it does not persist across reloads.

---

## 10. Search flow

### 10.1 Browser side

`frontend/app/app/search/page.tsx` accepts at least two characters, calls `searchKnowledgeItems()`, displays `KnowledgeCard` results, and optionally filters the returned results by platform in the browser.

Suggested and recent searches shown here come from static arrays in `lib/mock-data.ts`; actual search results come from the backend.

### 10.2 Backend preparation

`GET /api/knowledge/search?q=...&limit=20`:

1. loads up to 1,000 of the user’s memories
2. removes common stop words
3. derives simple word roots (`coding`/`coder`/`code`)
4. uses edit distance for minor typos
5. uses the user’s titles/tags/platforms as a correction vocabulary
6. expands a few hard-coded concepts such as AI, ML, UX, JS, TS, and vibe coding

### 10.3 Hybrid retrieval

The backend asks Gemini for a 3,072-dimensional `RETRIEVAL_QUERY` embedding and calls `hybrid_search_knowledge_items`. If vector generation or the RPC fails, search continues with exact/local ranking.

It merges semantic candidates with all fetched exact candidates by item ID and scores:

- title phrase matches: strongest lexical boost
- tag phrase matches
- summary phrase matches
- platform/URL matches
- individual term coverage and fuzzy matches
- semantic similarity

Weak semantic-only results are discarded. The final list is sorted by score and limited to 1–50 items.

This design is more robust than vector-only search because exact search still works when embeddings fail.

---

## 11. Collections and sharing

A collection is an organizational container. `collection_items` is a join table because one collection can contain many memories and one memory can appear in many collections.

Frontend API functions live in `frontend/lib/api/collections.ts`; backend endpoints live in `backend/src/memora/routes/collections.py`.

Key behavior:

- Users see collections they own plus collections shared with them.
- Only an owner can rename/delete a collection, add/remove items, or manage members.
- A shared member receives read access, not editing ownership.
- Only the owner’s own memories can be added.
- Adding the same memory twice returns `duplicate: true`.
- Deleting a collection does not delete its memories because only join rows cascade.
- A collection changes to `friends` visibility when it has members and back to `private` when the last member is removed.

`/app/collections` lists and creates collections. A new collection can immediately include accepted connections. `/app/collections/[id]` loads items/members, removes items, and lets owners add/remove members.

`CollectionPicker` is reusable UI for adding a memory to an existing or newly created collection.

---

## 12. Connections/network flow

The social feature has three main tables: `profiles`, `connections`, and `collection_members`.

`/app/network` can:

- search usernames/display names
- send a connection request
- list incoming and outgoing requests
- accept or decline incoming requests
- remove accepted connections

Backend rules in `connections.py`:

- the target must be a valid existing profile
- users cannot connect to themselves
- only one connection row can exist for an unordered pair (`pair_key` enforces this)
- only the addressee can accept/decline a pending request
- either participant can remove a connection
- removing a connection also removes linked collection memberships through foreign-key cascade
- affected collections are changed back to private when they have no remaining members

The route uses `admin_client()`, so it explicitly verifies participant and recipient identity before mutations.

---

## 13. Database schema and relationships

```text
auth.users
  ├── 1:1 profiles
  ├── 1:N knowledge_items ── 1:N knowledge_tags
  │                         └─ custom_tags[] and embedding live on item
  ├── 1:N collections ── N:M knowledge_items through collection_items
  └── profiles ── N:M profiles through connections
                         └─ N:M collections through collection_members
```

### `knowledge_items`

One saved memory. Important expected fields are ID, owner, original/canonical URL, platform, AI metadata, thumbnail, processing status, content type, custom tags, embedding, and timestamps.

### `knowledge_tags`

AI-generated tags. `knowledge_item_id` cascades on delete, so deleting a memory deletes these rows.

### `collections`

Owner, name, optional description, private/friends visibility, timestamps.

### `collection_items`

Links memories to collections and records who added them. Its composite primary key prevents duplicate membership.

### `profiles`

Public social identity: username, display name, avatar, and bio. It references `auth.users` one-to-one.

### `connections`

Requester, addressee, pending/accepted/declined status, and timestamps. The generated unordered `pair_key` prevents two rows for the same pair in opposite directions.

### `collection_members`

Links an accepted connection/user to a shared collection. Foreign keys cascade if the collection, connection, or user disappears.

### RLS and backend service role

`database.sql` enables RLS and defines policies for users reading their own knowledge, managing owned collections, discovering profiles, managing their connection participation, and reading shared collections.

However, most application database traffic currently comes through the backend service-role client, which bypasses RLS. RLS is defense for direct authenticated Supabase access; backend ownership filters are still mandatory.

### Required database functions

The Python code expects:

- `update_memory_embedding(p_memory_id, p_embedding)`
- `hybrid_search_knowledge_items(query_text, query_embedding, match_user_id, match_count, semantic_threshold)`
- `is_collection_owner(uuid)`
- `is_collection_member(uuid)`
- `create_memora_profile()` trigger function

---

## 14. Important database setup gap found during inspection

The repository says `backend/database.sql` is a complete schema, but the checked-in file is not currently complete relative to the application code.

The code selects or uses all of the following, but `database.sql` does not define them:

- `knowledge_items.canonical_url`
- `knowledge_items.thumbnail_url`
- `update_memory_embedding` RPC
- `hybrid_search_knowledge_items` RPC

There are also no checked-in migrations that add those missing definitions. A deployed Supabase project may already contain them from earlier manual SQL, which would explain why an existing environment can work. A completely new environment built only from the repository can fail on the first knowledge query or embedding/search call.

There is a second inconsistency: capture canonicalizes the submitted URL and stores that value in `original_url`, but it does not include a `canonical_url` value in the insert payload. Duplicate prevention is currently performed in Python across the latest 500 items, not by the unique database constraint described in the older docs.

Before treating setup as reproducible, the schema should be reconciled with the deployed database and the missing SQL added to `database.sql` plus a migration. This handbook documents the mismatch but intentionally does not guess the exact deployed RPC implementation.

---

## 15. Frontend routes

| Browser URL | File | Actual purpose |
|---|---|---|
| `/` | `app/page.tsx` | public marketing landing page |
| `/login` | `app/login/page.tsx` | Google OAuth button |
| `/auth/callback` | `app/auth/callback/route.ts` | exchanges OAuth code for session |
| `/logout` | `app/logout/route.ts` | server-side sign-out and redirect |
| `/onboarding` | `app/onboarding/page.tsx` | three-step UI; name/interests are currently not persisted |
| `/app` | `app/app/page.tsx` | authenticated Library |
| `/app/capture` | `app/app/capture/page.tsx` | main URL capture workflow |
| `/app/processing` | `app/app/processing/page.tsx` | overlapping query-driven capture workflow |
| `/app/search` | `app/app/search/page.tsx` | real backend search plus client platform filter |
| `/app/insights` | `app/app/insights/page.tsx` | calculates charts from real loaded knowledge items |
| `/app/settings` | `app/app/settings/page.tsx` | auth metadata, theme, logout; some preference UI is placeholder |
| `/app/collections` | `app/app/collections/page.tsx` | list/create/delete owned or shared collections |
| `/app/collections/[id]` | dynamic route | collection items and member management |
| `/app/network` | `app/app/network/page.tsx` | profiles and connection requests |
| `/privacy` | `app/privacy/page.tsx` | privacy policy |
| `/terms` | `app/terms/page.tsx` | terms of service |

`app/layout.tsx` wraps every page, loads Inter, adds the toast system, sets metadata, and applies the stored theme before React hydrates. `app/app/layout.tsx` wraps authenticated screens with desktop/mobile navigation, top navigation, the command palette, and mobile capture button.

---

## 16. Frontend component map

### Product-specific components

- `brand/logo.tsx`: reusable noryX logo.
- `common/platform-badge.tsx`: maps normalized platform values to labels/icons/styles.
- `dashboard/knowledge-card.tsx`: shared result card; bookmark state is not persisted.
- `dashboard/custom-tag-editor.tsx`: validates and saves custom tags.
- `collections/collection-picker.tsx`: loads collections and adds/creates memberships.
- `layout/app-sidebar.tsx`: desktop navigation and Supabase-auth profile display.
- `layout/mobile-sidebar.tsx`: mobile drawer, profile, navigation, logout.
- `layout/top-nav.tsx`: small top bar and mobile menu button.
- `search/command-palette.tsx`: Ctrl/Cmd+K modal, but currently searches mock memories and static suggestions rather than the backend.
- `auth/backend-auth-test.tsx`: development component for testing `/api/auth/me`; it is not a core user flow.
- `legal/legal-page.tsx`: common wrapper for Privacy and Terms.

### `components/ui/`

These are generic design-system primitives, mostly Radix/shadcn-style wrappers: buttons, inputs, dialogs, menus, popovers, tabs, cards, tables, charts, sidebars, tooltips, and similar building blocks. They do not own noryX business rules. Read them only when changing shared UI behavior or styling.

`components.json` configures the component generator. `lib/utils.ts` exports `cn()`, which combines conditional Tailwind class names and resolves conflicts.

---

## 17. Styling and browser configuration

- `app/globals.css` contains Tailwind v4 setup, CSS color variables, dark theme tokens, shadows, background patterns, scrollbar behavior, and global element styling.
- Tailwind utility classes are written directly in JSX, for example `rounded-xl bg-surface px-4`.
- Radix provides accessible behavior for many UI primitives.
- Framer Motion/`motion` provides transitions and animated workflow visuals.
- Lucide and React Icons provide icons.
- Recharts renders Insights charts.
- `next.config.ts` builds a Content Security Policy from backend and Supabase origins and adds CSP, referrer, nosniff, frame, permissions, and HSTS headers.
- `proxy.ts` protects authenticated routes and refreshes auth cookies.
- `tsconfig.json` enables strict TypeScript checking and maps `@/*` to the frontend root.

---

## 18. Backend file map

- `run.py`: asks Uvicorn to load `memora.main:app`, bind all interfaces, use configured port, and reload during development.
- `main.py`: creates FastAPI, configures CORS, mounts five routers, adds security headers, and converts unexpected exceptions to safe JSON with a request ID.
- `config.py`: typed environment settings.
- `auth.py`: bearer-token validation and the `CurrentUser` dependency.
- `supabase.py`: cached low-privilege auth client and high-privilege admin client.
- `models.py`: request, user, collection, connection, extracted-document, and generated-AI shapes.
- `routes/system.py`: public health endpoint and disabled-by-default authenticated DB/AI diagnostics.
- `routes/auth.py`: returns the verified backend user.
- `routes/knowledge.py`: URL normalization, capture, list, delete, tag update, embedding, and search ranking.
- `routes/collections.py`: collection ownership/access, items, and shared members.
- `routes/connections.py`: profiles, user discovery, connection lifecycle, and cleanup.
- `services/ai.py`: Gemini prompt, validation/retries, document/query embeddings.
- `services/extraction/fetcher.py`: SSRF-resistant bounded HTML download.
- `services/extraction/service.py`: YouTube and general-web content extraction/classification/fallbacks.
- `scripts/backfill_thumbnails.py`: maintenance script that re-extracts missing thumbnails and updates rows.

Empty `__init__.py` files tell Python that directories are packages. The extraction package’s `__init__.py` re-exports its public functionality.

---

## 19. API reference in plain language

All routes except `/`, `/api/health`, frontend public pages, and auth callback require normal authentication where shown.

| Method and path | Auth | Purpose |
|---|---:|---|
| `GET /` | no | backend welcome response |
| `GET /api/health` | no | confirms backend process is alive |
| `GET /api/test-db` | yes + feature flag | database diagnostic |
| `GET /api/ai-test` | yes + feature flag | Gemini diagnostic |
| `GET /api/auth/me` | yes | returns verified user ID/email |
| `GET /api/knowledge` | yes | list current user’s memories |
| `POST /api/knowledge` | yes | capture URL, optionally into owned collection |
| `GET /api/knowledge/search` | yes | hybrid search current user’s memories |
| `DELETE /api/knowledge/{id}` | yes | delete owned memory |
| `PATCH /api/knowledge/{id}/tags` | yes | replace owned memory’s custom tags |
| `GET /api/collections` | yes | list owned and shared collections |
| `POST /api/collections` | yes | create collection, optionally with connections |
| `GET /api/collections/{id}` | yes | load accessible collection with items/members |
| `PATCH /api/collections/{id}` | owner | update name/description |
| `DELETE /api/collections/{id}` | owner | delete collection, not memories |
| `POST /api/collections/{id}/items` | owner | add owned memory |
| `DELETE /api/collections/{id}/items/{memory}` | owner | remove memory link |
| `POST /api/collections/{id}/members` | owner | add accepted connection |
| `DELETE /api/collections/{id}/members/{user}` | owner | remove shared member |
| `GET /api/connections/profile` | yes | ensure/load current public profile |
| `GET /api/connections/search?q=` | yes | discover other profiles |
| `GET /api/connections` | yes | incoming/outgoing/accepted groups |
| `POST /api/connections` | yes | send request |
| `PATCH /api/connections/{id}` | recipient | accept or decline |
| `DELETE /api/connections/{id}` | participant | remove request/connection |

FastAPI automatically exposes exact schemas and interactive calls at `/docs` in a running development backend.

---

## 20. Real features versus placeholders

### Connected to real backend/database

- Google session handling
- Library load and delete
- capture and AI generation
- generated/custom tags
- hybrid search
- Insights calculations from loaded memories
- collections and collection sharing
- profile discovery and connections
- Settings update to Supabase auth user metadata

### Static, local-only, or incomplete

- Onboarding name and interests are never submitted or saved.
- Search’s suggested/recent phrases are hard-coded.
- Command Palette searches hard-coded `knowledgeItems`, not the real library; its result buttons do not open an item.
- `lib/mock-data.ts` retains sample memories and chart/activity data. Most core pages no longer use those sample memories, but Command Palette and onboarding/search suggestions do.
- Bookmark toggling is component-local and not stored.
- Several Settings notification/preference controls have presentation without a persistence API.
- YouTube extraction does not load transcript content.
- The second `/app/processing` capture UI overlaps the main Capture implementation.
- Existing docs mention Vercel/Render as deployment targets, but no complete deployment configuration for the backend is present here.
- The security checklist is a template with unchecked boxes; saved scan reports are evidence files, not proof every item has been resolved.

---

## 21. Dependencies: why they exist

### Core frontend

- `next`, `react`, `react-dom`: application framework and rendering.
- `typescript`, React/Node type packages: static type checking.
- `@supabase/supabase-js`, `@supabase/ssr`: auth/session clients for browser and server.
- `tailwindcss`, `@tailwindcss/postcss`: utility-first CSS build.
- Radix packages: accessible component behavior.
- `framer-motion`/`motion`: animation. Both packages appear installed; this could be simplified later.
- `lucide-react`, `react-icons`: icons.
- `recharts`: charts.
- `react-hook-form`: forms used by generic form primitives.
- `clsx`, `tailwind-merge`, `class-variance-authority`: conditional/component CSS class composition.
- `sonner`: toast notifications.
- Remaining packages mostly support generic UI primitives such as drawers, carousels, OTP, calendars, commands, and resize panels.

### Core backend

- `fastapi`: HTTP API framework.
- `uvicorn`: ASGI development/production server process.
- `pydantic-settings`: typed environment parsing.
- `supabase`: Python database/auth API client.
- `google-genai`: Gemini generation and embedding SDK.
- `httpx`: asynchronous HTTP fetching.
- `beautifulsoup4`: HTML parsing.
- `trafilatura`: article text extraction.
- `pytest`, `pytest-asyncio`: tests.
- `ruff`: Python lint/import/style checks.
- `pip-audit`: dependency vulnerability scanning.

`pyproject.toml` describes supported version ranges and package build settings. `requirements.txt` is a much larger pinned snapshot of the installed environment, including transitive packages.

---

## 22. Tests, CI, and current verification

Backend tests cover:

- SSRF/private redirect protection and size limits
- request/Pydantic model validation
- platform/domain classification
- typo correction, word forms, semantic thresholds, irrelevant-result filtering, and custom-tag search
- security headers and disabled diagnostic endpoints

They do not currently perform full integration tests against real Supabase, Google OAuth, Gemini, collections, connections, or a real browser.

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`:

- backend install, Ruff, Pytest, and pip-audit
- frontend install, lint, production build, and high-severity npm audit

At the time of this handbook update:

- backend: 24 tests passed; one third-party Starlette deprecation warning
- frontend: ESLint passed

Useful local commands:

```powershell
cd backend
.venv\Scripts\python.exe -m ruff check .
.venv\Scripts\python.exe -m pytest -q

cd ..\frontend
npm.cmd run lint
npm.cmd run build
```

---

## 23. How to debug common failures

### “No active Supabase session found”

The frontend has no session cookie/token. Check Google OAuth, Supabase redirect URLs, frontend Supabase variables, and whether the user was redirected through `/auth/callback`.

### Browser reports CORS failure

Make sure `FRONTEND_ORIGINS` exactly contains the frontend origin, including correct scheme and port. Restart the backend after changing `.env`.

### Backend will not start

Check that all required backend environment variables exist and the Python command runs from `backend`, where `.env` is found.

### Knowledge list fails with a missing-column error

Compare the real Supabase table to the expected select string in `knowledge.py`. The checked-in schema gap around `canonical_url` and `thumbnail_url` is a likely cause.

### Capture returns 422

The URL may be invalid, private/local, too large, non-HTML, or too poorly extracted/AI-validated. Read the JSON `detail` and backend terminal output.

### Capture succeeds but status stays `processing`

The background embedding or `update_memory_embedding` RPC likely failed. Check backend logs, Gemini embedding configuration, vector dimension, and RPC existence.

### Search finds only exact matches

The query embedding or `hybrid_search_knowledge_items` RPC probably failed. The backend deliberately prints a warning and falls back to exact ranking.

### Collection or connection calls fail while Library works

Verify the later schema objects (`profiles`, `connections`, `collection_members`) and migration SQL were applied. Also check foreign-key relationship names because Supabase nested select syntax depends on them.

### UI shows stale library data

Inspect browser `sessionStorage` keys beginning `memora-library:`. Capture clears them and deletion updates them, but a failed/interrupted flow can leave stale data until the tab storage is cleared.

### Profile name differs between Settings and Connections

Settings writes Supabase auth metadata. Connections reads the public `profiles` table. Those paths are not currently synchronized after signup.

---

## 24. How to safely change a feature

When adding a field—for example `favorite`—follow the value through every layer:

1. Add a database column and a migration.
2. Add the field to backend select/insert/update logic.
3. Add request validation to a Pydantic model if clients can change it.
4. Add or modify an authenticated API endpoint with an ownership filter.
5. Add the backend response field to the TypeScript backend type.
6. Map it in the normalization function.
7. Add it to the frontend `KnowledgeItem` type.
8. Render and update it in the React component.
9. Add tests for validation, ownership, and UI behavior.
10. Run Ruff, Pytest, ESLint, and the production build.

This “follow the data” method prevents the common vibe-coding failure where the button exists but nothing is saved.

---

## 25. Recommended learning order

Do not begin with the 1,000-line Library page. Learn in this order:

1. Read this handbook’s sections 2, 6, 7, and 8 until you can explain one capture request aloud.
2. Read `frontend/lib/api/backend.ts`—the entire frontend/backend bridge is only a few dozen lines.
3. Read `backend/src/memora/auth.py` and `supabase.py`.
4. Read the models in `backend/src/memora/models.py`.
5. Read `frontend/lib/api/knowledge.ts` and compare its types to the models/database.
6. Follow `createKnowledgeItem()` into `capture()` in `knowledge.py`.
7. Read `fetcher.py`, then the bottom-level `build_knowledge_document()` orchestration before its helper functions.
8. Read `generate_metadata()` and embedding functions.
9. Open Supabase Table Editor and compare real columns to section 13.
10. Use FastAPI `/docs` to call `/api/health` and authenticated APIs.
11. Only then study Library rendering, capture animation, Insights charts, and the generic UI library.

A strong first exercise is to add a harmless console/log statement at each boundary of one development capture, observe URL → token → document → metadata → row → response, and then remove the statements.

---

## 26. Architectural strengths and risks

### Strengths

- Frontend API calls are centralized.
- Protected backend routes validate Supabase tokens.
- Service-role secrets remain backend-only.
- URL fetching includes meaningful SSRF and size protections.
- AI responses are schema-validated and retried.
- Search has an exact fallback and a detailed reranker.
- Ownership checks are common in mutating backend routes.
- Partial capture failures attempt cleanup.
- Core lint and unit tests pass.

### Risks and technical debt

- The new-environment SQL is out of sync with application expectations.
- Service-role access makes any missed ownership filter high impact.
- Duplicate detection loads only 500 items and lacks the documented DB uniqueness guarantee.
- Search loads up to 1,000 full memories for every query, which will become expensive as libraries grow.
- Synchronous Supabase client calls are used inside async FastAPI endpoints and can block the event loop under load.
- Background tasks run in the API process; they are not durable across a server crash/redeploy.
- Multi-step inserts use manual cleanup rather than one atomic database transaction.
- Capture/extraction and large page components are long files with several responsibilities.
- Some UI promises are mock/local-only and can be mistaken for finished features.
- There is no visible rate limiting around expensive capture/search operations.
- Full integration and end-to-end tests are missing.

These are not reasons to discard the project. They are the clearest roadmap for making it dependable.

---

## 27. A concise mental checklist

Whenever you are confused, ask these questions in order:

1. Which browser route/page am I on?
2. Is this a client component, server component, or route handler?
3. Which function in `frontend/lib/api` is called?
4. What exact HTTP method/path/body is sent?
5. Where is the bearer token attached?
6. Which FastAPI router receives it?
7. Which Pydantic model validates it?
8. Where is the user ID checked?
9. Which Supabase table or RPC is used?
10. What JSON comes back?
11. Where is snake_case normalized to camelCase?
12. Is the result persistent database state, browser storage, or only React state?

If you can answer those twelve questions for a feature, you understand that feature end to end.

