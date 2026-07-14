# Memora Project Documentation

Last updated: July 15, 2026

## 1. Project Overview

Memora is an AI-powered personal knowledge memory app. Users can save links from the web, and Memora turns those links into searchable memories using AI.

The product solves a common problem: people save useful links, videos, posts, articles, and references, but later cannot remember where they saved them or what they contained. Memora captures the link, extracts readable content, generates a useful AI summary, creates tags, stores metadata, and makes the memory searchable through natural language.

In simple terms:

```text
Paste a link -> AI reads it -> summary/tags are created -> memory is saved -> user can search later
```

## 2. Core Product Idea

Memora acts like a second brain for online content.

Users can save:

- YouTube videos
- Articles
- Blogs
- Reddit posts
- LinkedIn posts
- X/Twitter links
- Instagram links
- Documentation pages
- Government/admission pages
- General websites

Memora stores:

- Original URL
- Canonical URL for duplicate prevention
- Platform/source
- AI title
- AI summary
- Key takeaways
- Why it matters
- Tags
- Thumbnail
- Embedding for semantic search
- Created/updated timestamps

## 3. Main Features

### Authentication

- Google login through Supabase Auth
- Frontend receives a Supabase access token
- Backend validates token for protected routes

### Link Capture

- User pastes a URL
- Backend canonicalizes URL
- Duplicate links are blocked
- Web content is extracted
- AI summary and tags are generated
- Memory is saved
- Embedding is generated in the background

### Library

- Displays saved memories
- Masonry-style card layout
- Cards show platform icons, thumbnails, titles, summaries, and tags
- Users can filter by article/video/social/tagged
- Users can delete memories

### Search

- Natural-language search
- Backend hybrid search using embeddings and exact reranking
- Frontend source/platform filters
- Works even if semantic search fails by falling back to exact title/tag/summary matching

### Insights

- Uses real saved memory data
- Shows platform breakdown, saved counts, tags, and activity-style metrics

### Settings

- Profile section with real user details
- Appearance controls for light/dark/system theme
- Notification placeholders
- Logout logic

### Mobile UI

- Website includes mobile sidebar/drawer navigation
- Sidebar includes library, search, capture, insights, settings, collections/topics, and sources

## 4. Tech Stack

### Frontend

- Next.js `16.2.10`
- React `19.2.4`
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Lucide React icons
- React Icons
- Radix UI components
- Supabase JS client
- Recharts for insights charts

### Backend

- Python `>=3.13`
- FastAPI
- Uvicorn
- Pydantic / Pydantic Settings
- Supabase Python client
- Google GenAI SDK
- Gemini for metadata generation
- Gemini embeddings for semantic search
- HTTPX for fetching pages
- BeautifulSoup for HTML parsing
- Trafilatura for article extraction

### Database / Auth

- Supabase Auth
- Supabase Postgres
- pgvector extension
- Row Level Security policies
- Service role key used only by backend

### Deployment

- Frontend: Vercel
- Backend: Render or similar Python web service host
- Database/Auth: Supabase

## 5. Repository Structure

```text
memora/
├── assets/
├── backend/
├── docs/
├── frontend/
├── .gitignore
└── README.md
```

## 6. Frontend Structure

Important frontend folders/files:

```text
frontend/
├── app/
│   ├── app/
│   │   ├── capture/page.tsx
│   │   ├── insights/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── processing/page.tsx
│   │   ├── search/page.tsx
│   │   └── settings/page.tsx
│   ├── auth/callback/route.ts
│   ├── login/page.tsx
│   ├── logout/route.ts
│   ├── onboarding/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   ├── brand/
│   ├── common/
│   ├── dashboard/
│   ├── layout/
│   ├── search/
│   └── ui/
├── lib/
│   ├── api/
│   ├── auth/
│   ├── supabase/
│   ├── mock-data.ts
│   └── utils.ts
├── package.json
├── proxy.ts
└── next.config.ts
```

### Key Frontend Files

#### `frontend/app/app/page.tsx`

Main library page.

Responsibilities:

- Fetch saved memories
- Cache library data in `sessionStorage`
- Display stats
- Display memory cards
- Filter memories by type/tag/source
- Delete memories
- Show thumbnails and platform icons

#### `frontend/app/app/capture/page.tsx`

Capture page.

Responsibilities:

- Accept pasted URL
- Show AI workflow animation
- Call backend `POST /api/knowledge`
- Show success/failure
- Clear library cache after successful capture

#### `frontend/app/app/search/page.tsx`

Search page.

Responsibilities:

- Natural-language search input
- Call `GET /api/knowledge/search`
- Display `KnowledgeCard` results
- Filter results by platform/source

#### `frontend/app/app/insights/page.tsx`

Insights dashboard.

Responsibilities:

- Fetch real knowledge items
- Build charts and stats from saved data
- Show platform and tag breakdowns

#### `frontend/app/app/settings/page.tsx`

Settings page.

Responsibilities:

- Display user profile
- Theme controls: light/dark/system
- Notification/app preference sections
- Logout

#### `frontend/components/dashboard/knowledge-card.tsx`

Reusable search result memory card.

Responsibilities:

- Display platform badge
- Display thumbnail when available
- Show title, summary, takeaway, tags
- Link to original source

#### `frontend/components/layout/app-sidebar.tsx`

Desktop sidebar.

Responsibilities:

- Main navigation
- Real user profile
- Topics/tags from saved data
- Sources/platforms from saved data

#### `frontend/components/layout/mobile-sidebar.tsx`

Mobile drawer sidebar.

Responsibilities:

- Mobile navigation
- Profile/logout
- Topics/tags
- Sources/platforms

#### `frontend/lib/api/backend.ts`

Backend request helper.

Responsibilities:

- Attach Supabase access token
- Send API requests to backend
- Handle JSON body and errors

#### `frontend/lib/api/knowledge.ts`

Knowledge API adapter.

Responsibilities:

- Normalize backend knowledge items into frontend `KnowledgeItem`
- Fetch library items
- Search memories
- Capture new memory
- Delete memory
- Normalize platform from backend/platform URL

#### `frontend/lib/mock-data.ts`

Shared frontend types and older mock data.

Important types:

- `Platform`
- `KnowledgeItem`

## 7. Backend Structure

Important backend folders/files:

```text
backend/
├── src/memora/
│   ├── auth.py
│   ├── config.py
│   ├── main.py
│   ├── models.py
│   ├── supabase.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── knowledge.py
│   │   └── system.py
│   └── services/
│       ├── ai.py
│       └── extraction/
│           ├── fetcher.py
│           └── service.py
├── scripts/
│   └── backfill_thumbnails.py
├── tests/
├── database.sql
├── pyproject.toml
├── run.py
└── .env.example
```

### Key Backend Files

#### `backend/src/memora/main.py`

FastAPI application entry.

Responsibilities:

- Create app
- Configure CORS
- Include routers
- Global exception handler
- Root route

#### `backend/src/memora/config.py`

Environment configuration.

Important settings:

- `PORT`
- `FRONTEND_ORIGINS`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `EMBEDDING_MODEL`
- `FETCH_TIMEOUT_SECONDS`
- `MAX_PAGE_BYTES`

#### `backend/src/memora/auth.py`

Backend auth dependency.

Responsibilities:

- Read bearer token from request
- Validate Supabase user token
- Return current user object

#### `backend/src/memora/models.py`

Pydantic models.

Important models:

- `User`
- `CaptureRequest`
- `KnowledgeDocument`
- `GeneratedMetadata`
- `HomepageData`

#### `backend/src/memora/supabase.py`

Supabase clients.

Responsibilities:

- `auth_client()` with publishable key
- `admin_client()` with service role key

#### `backend/src/memora/routes/system.py`

System/test routes.

Routes:

- `GET /api/health`
- `GET /api/test-db`
- `GET /api/ai-test`

#### `backend/src/memora/routes/auth.py`

Auth routes.

Routes:

- `GET /api/auth/me`

#### `backend/src/memora/routes/knowledge.py`

Core memory API.

Routes:

- `GET /api/knowledge`
- `POST /api/knowledge`
- `GET /api/knowledge/search`
- `DELETE /api/knowledge/{memory_id}`

Responsibilities:

- Canonical URL duplicate protection
- Capture memory
- Save tags
- Start background embedding
- Search reranking
- Delete memory

#### `backend/src/memora/services/extraction/fetcher.py`

Low-level HTTP fetcher.

Responsibilities:

- Validate public HTTP/HTTPS URL
- Block local/private network URLs
- Fetch HTML with HTTPX
- Enforce content type and max size

#### `backend/src/memora/services/extraction/service.py`

Universal content extractor.

Responsibilities:

- YouTube metadata extraction
- HTML parsing
- Trafilatura article extraction
- JSON-LD extraction
- Metadata extraction
- Visible page text extraction
- Jina reader fallback
- URL-only fallback
- Thumbnail extraction
- Content type classification

#### `backend/src/memora/services/ai.py`

AI service.

Responsibilities:

- Test Gemini connection
- Generate metadata from extracted document
- Generate document embeddings
- Generate query embeddings
- Build embedding text

#### `backend/scripts/backfill_thumbnails.py`

Utility script.

Responsibilities:

- Finds existing memories without thumbnails
- Re-extracts document metadata
- Updates `thumbnail_url`

## 8. Database Design

### `knowledge_items`

Stores saved memories.

Important columns:

```sql
id uuid primary key
user_id uuid references auth.users(id)
original_url text not null
canonical_url text
platform text not null
title text not null
summary text
key_takeaways jsonb
why_it_matters text
thumbnail_url text
status text not null default 'processing'
source_type text not null default 'link'
embedding vector(3072)
created_at timestamptz
updated_at timestamptz
```

### `knowledge_tags`

Stores tags for each saved memory.

Important columns:

```sql
id bigint primary key
knowledge_item_id uuid references knowledge_items(id) on delete cascade
tag text not null
unique (knowledge_item_id, tag)
```

### Important Indexes

```sql
create index if not exists knowledge_items_user_created_idx
on public.knowledge_items (user_id, created_at desc);
```

```sql
create index if not exists knowledge_items_embedding_idx
on public.knowledge_items using hnsw (embedding vector_cosine_ops);
```

```sql
create unique index if not exists knowledge_items_user_canonical_url_unique
on public.knowledge_items (user_id, canonical_url)
where canonical_url is not null;
```

## 9. Required Supabase Functions

### `update_memory_embedding`

Used after capture to update embedding in the background.

```sql
create or replace function public.update_memory_embedding(
  p_memory_id uuid,
  p_embedding vector(3072)
)
returns void
language plpgsql
security definer
as $$
begin
  update public.knowledge_items
  set
    embedding = p_embedding,
    status = 'completed',
    updated_at = now()
  where id = p_memory_id;
end;
$$;
```

### `hybrid_search_knowledge_items`

Used by search endpoint.

Expected arguments:

```sql
query_text text
query_embedding vector(3072)
match_user_id uuid
match_count int
semantic_threshold double precision
```

Expected returned fields:

- `id`
- `user_id`
- `original_url`
- `canonical_url`
- `platform`
- `title`
- `summary`
- `key_takeaways`
- `why_it_matters`
- `thumbnail_url`
- `status`
- `source_type`
- `created_at`
- `updated_at`
- `similarity`

## 10. Auth Flow

```text
User clicks Google login
        ↓
Supabase handles OAuth
        ↓
Frontend receives Supabase session
        ↓
Frontend sends access token to backend
        ↓
Backend validates token using Supabase auth client
        ↓
Backend receives CurrentUser dependency
```

Protected backend requests include:

```http
Authorization: Bearer <supabase_access_token>
```

## 11. Capture Flow

```text
User pastes URL
        ↓
Frontend calls POST /api/knowledge
        ↓
Backend canonicalizes URL
        ↓
Backend checks duplicate saved memories
        ↓
Extractor reads page/video/site
        ↓
Gemini creates title, summary, takeaways, why_it_matters, tags
        ↓
Backend saves knowledge_items row
        ↓
Backend saves knowledge_tags rows
        ↓
Backend returns memory immediately
        ↓
Background task creates embedding
        ↓
Supabase RPC updates embedding and status
```

## 12. Duplicate Prevention

Memora uses `canonical_url` to prevent users saving the same link more than once.

Canonicalization includes:

- lowercasing scheme and host
- removing leading `www.`
- removing trailing slash except root `/`
- removing fragments
- removing common tracking params like `utm_*`, `fbclid`, `gclid`, `igshid`, `si`, etc.

Backend behavior:

- If duplicate exists, return existing item
- Do not run AI/extraction again
- Do not create a second card

Response example:

```json
{
  "success": true,
  "duplicate": true,
  "warning": "This link is already saved in your library.",
  "item": {}
}
```

## 13. AI Metadata Flow

Gemini receives a `KnowledgeDocument` with:

- URL
- content type
- extraction method
- page title
- description
- extracted content
- confidence

Gemini returns:

- title
- summary
- key takeaways
- why it matters
- tags

Validation rules:

- title must exist
- summary must be useful
- at least 3 takeaways
- why it matters must exist
- at least 3 tags

## 14. Embedding Flow

Embeddings are generated after memory save.

Reason:

- Embedding can be slow
- User should not wait too long during capture
- Library can show memory immediately

Status transitions:

```text
processing -> completed
processing -> embedding_failed
```

Search quality depends on embeddings, but exact title/tag/summary search works even if embeddings fail.

## 15. Search Flow

```text
User enters query
        ↓
Frontend calls GET /api/knowledge/search?q=...
        ↓
Backend creates query embedding
        ↓
Backend calls hybrid_search_knowledge_items RPC
        ↓
Backend also fetches recent user memories
        ↓
Backend merges semantic + exact candidates
        ↓
Backend reranks by title/tag/summary/platform/url relevance
        ↓
Weak semantic-only matches are removed
        ↓
Frontend displays filtered cards
```

Search prioritizes:

1. Exact title match
2. Exact tag match
3. Summary match
4. Platform/source match
5. Semantic similarity

## 16. Delete Flow

```text
User clicks delete
        ↓
Frontend calls DELETE /api/knowledge/{id}
        ↓
Backend verifies item belongs to user
        ↓
Backend deletes item
        ↓
knowledge_tags are deleted through cascade
```

## 17. Frontend Pages

### Landing Page

File:

```text
frontend/app/page.tsx
```

Purpose:

- Public marketing/home page
- Entry point before login

### Login Page

File:

```text
frontend/app/login/page.tsx
```

Purpose:

- Google-only login through Supabase

### Library Page

File:

```text
frontend/app/app/page.tsx
```

Purpose:

- Main authenticated app page
- Shows memory canvas/cards

### Capture Page

File:

```text
frontend/app/app/capture/page.tsx
```

Purpose:

- Paste link
- Show AI workflow
- Save new memory

### Search Page

File:

```text
frontend/app/app/search/page.tsx
```

Purpose:

- Natural language search
- Platform filters
- Search result cards

### Insights Page

File:

```text
frontend/app/app/insights/page.tsx
```

Purpose:

- Real data insights from saved memories

### Settings Page

File:

```text
frontend/app/app/settings/page.tsx
```

Purpose:

- Profile
- Appearance
- Notifications
- Logout

## 18. Frontend Data Flow

```text
Supabase session
        ↓
backendRequest helper attaches Bearer token
        ↓
lib/api/knowledge.ts calls backend
        ↓
backend response normalized into KnowledgeItem
        ↓
React pages render data
```

Important files:

```text
frontend/lib/api/backend.ts
frontend/lib/api/knowledge.ts
frontend/lib/mock-data.ts
```

## 19. Environment Variables

### Backend

```env
PORT=5000
FRONTEND_ORIGINS=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=gemini-embedding-001
FETCH_TIMEOUT_SECONDS=10
MAX_PAGE_BYTES=5000000
```

### Frontend

Common frontend variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

Production frontend should point to the deployed Render backend URL.

## 20. Local Development

### Backend Setup

```powershell
cd W:\memora\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e .
python run.py
```

Backend local URL:

```text
http://localhost:5000
```

### Frontend Setup

```powershell
cd W:\memora\frontend
npm install
npm run dev
```

Frontend local URL:

```text
http://localhost:3000
```

## 21. Build Commands

### Frontend

```powershell
npm run build
npm run start
```

### Backend

```powershell
python run.py
```

### Backend Tests

```powershell
pytest
```

## 22. Deployment

### Frontend on Vercel

Recommended settings:

- Framework: Next.js
- Root directory: `frontend`
- Build command: `npm run build`
- Output: Next.js default

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_BACKEND_URL=https://your-render-api.onrender.com
```

### Backend on Render

Recommended settings:

- Runtime: Python
- Root directory: `backend`
- Build command: `pip install -e .`
- Start command: `python run.py`

Required environment variables:

```env
PORT=5000
FRONTEND_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=gemini-embedding-001
```

### Supabase Auth Redirect URLs

Add redirect URLs:

```text
http://localhost:3000/auth/callback
https://your-vercel-app.vercel.app/auth/callback
```

## 23. Known Limitations

### Extraction

No web extractor is perfect.

Some websites:

- block bots
- require login
- render content only with JavaScript
- block cloud/datacenter IPs
- expose only metadata

Memora handles this with:

- normal HTML fetch
- Trafilatura extraction
- metadata extraction
- JSON-LD extraction
- visible text extraction
- Jina reader fallback
- URL-only fallback

For perfect extraction from JavaScript-heavy sites, browser rendering with Playwright would be needed.

### YouTube

Current YouTube handling uses metadata/oEmbed and thumbnail.

For real video understanding, future improvement should add transcript extraction.

### Instagram / LinkedIn / X

These platforms often block full content extraction. Memora may only get title, metadata, or URL context.

### Background Embedding

Embedding runs after capture response. If the server restarts during background embedding, the memory may stay `processing` or become `embedding_failed`.

A future production improvement would use a queue/worker.

## 24. Troubleshooting

### CORS Error

Symptom:

```text
No 'Access-Control-Allow-Origin' header
```

Fix backend env:

```env
FRONTEND_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
```

### Duplicate Index Error

Symptom:

```text
could not create unique index ... is duplicated
```

Fix by deleting duplicate rows before creating unique index.

### Capture 500 Error

Check backend logs for:

- memory insert failed
- tag insert failed
- AI metadata failed
- missing Supabase column
- missing RPC

### Embedding Failed

Check:

- `GEMINI_API_KEY`
- `EMBEDDING_MODEL`
- Supabase `update_memory_embedding` RPC exists
- `embedding` column is `vector(3072)`

### Search Returns Wrong Items

Check:

- tags are accurate
- title/summary contain topic words
- embeddings completed
- `hybrid_search_knowledge_items` returns `similarity`
- frontend is calling backend search endpoint

### Thumbnail Missing

Check:

- `thumbnail_url` column exists
- backend `SELECT` includes `thumbnail_url`
- extraction found `og:image` or YouTube thumbnail
- existing data was backfilled using `scripts/backfill_thumbnails.py`

## 25. Utility Scripts

### Backfill Thumbnails

File:

```text
backend/scripts/backfill_thumbnails.py
```

Purpose:

- Finds old memories without thumbnails
- Re-extracts metadata
- Updates `thumbnail_url`

Run:

```powershell
cd W:\memora\backend
.\.venv\Scripts\python.exe scripts\backfill_thumbnails.py
```

## 26. Recommended Future Improvements

### Backend

- Add job queue for embeddings
- Add YouTube transcript extraction
- Add browser-based extraction for JavaScript-heavy sites
- Add retry endpoint for failed embeddings
- Add canonical URL column to initial schema
- Add richer logging
- Add structured extraction confidence in API response

### Frontend

- Show duplicate warning toast
- Show embedding status on cards
- Add retry button for `embedding_failed`
- Add better search empty states
- Add tag management UI
- Add collection management UI
- Add source-specific filters

### Database

- Add `canonical_url` unique index from initial migration
- Add `raw_content` column for future reprocessing
- Add `embedding_status` separate from memory status
- Add updated search RPC with thumbnail and canonical URL included

## 27. High-Level Mental Model

```text
Frontend is the experience.
Supabase Auth is identity.
FastAPI is the brain and API gateway.
Extraction service reads links.
Gemini turns content into memories.
Supabase stores memories.
pgvector enables semantic search.
Next.js renders library/search/insights.
```

## 28. One-Sentence Summary

Memora is an AI knowledge memory app that converts saved links into summarized, tagged, searchable memories using Next.js, FastAPI, Supabase, Gemini, and pgvector.
