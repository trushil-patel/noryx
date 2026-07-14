# Memora API Documentation

Version: `2.0.0`

Base URL:

- Local: `http://localhost:5000`
- Production: your Render backend URL, for example `https://your-service.onrender.com`

Memora Backend is a FastAPI service used by the Memora frontend to authenticate users, capture links, summarize knowledge, search saved memories, and delete memories.

## Authentication

Protected endpoints require a Supabase access token in the `Authorization` header.

```http
Authorization: Bearer <supabase_access_token>
```

The frontend gets this token from Supabase Auth after Google login.

Example frontend request:

```ts
await fetch(`${BACKEND_URL}/api/knowledge`, {
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
});
```

If the token is missing, invalid, or expired, the API returns `401`.

## Common Response Shape

Most endpoints return:

```json
{
  "success": true
}
```

Errors usually return:

```json
{
  "detail": "Error message"
}
```

Unexpected server errors may return:

```json
{
  "success": false,
  "message": "Unexpected server error",
  "error": "Internal error details"
}
```

## System Endpoints

### GET `/`

Public welcome endpoint.

Response:

```json
{
  "success": true,
  "message": "Welcome to Memora Backend 🚀"
}
```

### GET `/api/health`

Public health check.

Response:

```json
{
  "success": true,
  "service": "Memora Backend",
  "status": "Healthy"
}
```

### GET `/api/test-db`

Public database connection test.

Response:

```json
{
  "success": true,
  "message": "Supabase database connected successfully 🚀",
  "rows": 1
}
```

### GET `/api/ai-test`

Public Gemini connection test.

Response:

```json
{
  "success": true,
  "result": "Gemini connected"
}
```

## Auth Endpoints

### GET `/api/auth/me`

Returns the authenticated user from the Supabase access token.

Authentication: required

Headers:

```http
Authorization: Bearer <supabase_access_token>
```

Response:

```json
{
  "success": true,
  "user": {
    "id": "9540741c-1239-4fb3-b620-ac86e88ab1ee",
    "email": "user@example.com"
  }
}
```

Errors:

- `401`: authorization header missing
- `401`: invalid or expired token

## Knowledge Endpoints

### GET `/api/knowledge`

Lists the authenticated user's saved memories, newest first.

Authentication: required

Response:

```json
{
  "success": true,
  "items": [
    {
      "id": "8b6462d8-4ac1-4a24-8fd5-5a53d9d38c7e",
      "user_id": "9540741c-1239-4fb3-b620-ac86e88ab1ee",
      "original_url": "https://example.com/post",
      "canonical_url": "https://example.com/post",
      "platform": "article",
      "title": "Example Memory Title",
      "summary": "AI generated summary.",
      "key_takeaways": [
        "First takeaway",
        "Second takeaway"
      ],
      "why_it_matters": "Why this content may be useful later.",
      "thumbnail_url": "https://example.com/image.jpg",
      "status": "completed",
      "source_type": "article",
      "created_at": "2026-07-15T10:30:00Z",
      "updated_at": "2026-07-15T10:31:00Z",
      "knowledge_tags": [
        {
          "id": 1,
          "tag": "ai"
        }
      ]
    }
  ]
}
```

Status values:

- `processing`: memory saved, embedding is still being created
- `completed`: embedding completed and search-ready
- `embedding_failed`: memory saved, but embedding failed

### POST `/api/knowledge`

Captures a link, extracts readable content, generates AI metadata, saves the memory, inserts tags, and starts embedding generation in the background.

Authentication: required

Request body:

```json
{
  "url": "https://example.com/article"
}
```

Success response:

```json
{
  "success": true,
  "item": {
    "id": "8b6462d8-4ac1-4a24-8fd5-5a53d9d38c7e",
    "user_id": "9540741c-1239-4fb3-b620-ac86e88ab1ee",
    "original_url": "https://example.com/article",
    "canonical_url": "https://example.com/article",
    "platform": "article",
    "title": "Generated title",
    "summary": "Generated summary",
    "key_takeaways": [
      "Generated takeaway"
    ],
    "why_it_matters": "Generated explanation",
    "thumbnail_url": "https://example.com/thumbnail.jpg",
    "status": "processing",
    "source_type": "article",
    "knowledge_tags": [
      {
        "tag": "example"
      }
    ]
  }
}
```

Duplicate response:

```json
{
  "success": true,
  "duplicate": true,
  "warning": "This link is already saved in your library.",
  "item": {
    "id": "existing-memory-id",
    "original_url": "https://example.com/article",
    "canonical_url": "https://example.com/article"
  }
}
```

Capture pipeline:

1. Canonicalize URL.
2. Check duplicate for the current user.
3. Extract page/video/site content.
4. Generate AI title, summary, takeaways, explanation, and tags.
5. Save memory and tags.
6. Return success immediately.
7. Generate embedding in background.
8. Update memory status to `completed` or `embedding_failed`.

Errors:

- `401`: user is not authenticated
- `422`: URL/content/AI validation failed
- `500`: memory could not be completed

### GET `/api/knowledge/search`

Searches the authenticated user's saved memories using hybrid semantic search plus strict backend reranking.

Authentication: required

Query params:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `q` | string | yes | Search query. Minimum length: 1. Maximum length: 500. |
| `limit` | integer | no | Number of results. Default: `20`. Min: `1`. Max: `50`. |

Example:

```http
GET /api/knowledge/search?q=top%205%20ai%20tools&limit=20
```

Response:

```json
{
  "success": true,
  "query": "top 5 ai tools",
  "items": [
    {
      "id": "8b6462d8-4ac1-4a24-8fd5-5a53d9d38c7e",
      "original_url": "https://youtube.com/watch?v=abc",
      "canonical_url": "https://youtube.com/watch?v=abc",
      "platform": "youtube",
      "title": "Top 5 AI Tools for Productivity",
      "summary": "AI generated summary.",
      "thumbnail_url": "https://img.youtube.com/vi/abc/hqdefault.jpg",
      "similarity": 0.82,
      "knowledge_tags": [
        {
          "tag": "ai tools"
        }
      ]
    }
  ]
}
```

Search behavior:

- Uses Gemini query embeddings when available.
- Calls Supabase RPC `hybrid_search_knowledge_items`.
- Also fetches recent user memories and reranks results by exact title/tag/summary/platform/URL matches.
- Filters weak semantic-only matches to avoid unrelated cards appearing.
- If semantic search fails, exact text ranking still works.

Errors:

- `400`: empty query
- `401`: user is not authenticated
- `500`: search failed

### DELETE `/api/knowledge/{memory_id}`

Deletes a saved memory owned by the authenticated user.

Authentication: required

Path params:

| Name | Type | Description |
| --- | --- | --- |
| `memory_id` | UUID | Knowledge item ID |

Response:

```json
{
  "success": true,
  "deleted_id": "8b6462d8-4ac1-4a24-8fd5-5a53d9d38c7e"
}
```

Errors:

- `401`: user is not authenticated
- `404`: memory not found
- `500`: delete failed

## Data Models

### CaptureRequest

```json
{
  "url": "https://example.com/article"
}
```

### User

```json
{
  "id": "9540741c-1239-4fb3-b620-ac86e88ab1ee",
  "email": "user@example.com"
}
```

### Knowledge Item

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "original_url": "string",
  "canonical_url": "string",
  "platform": "youtube | reddit | instagram | linkedin | twitter | blog | article",
  "title": "string",
  "summary": "string",
  "key_takeaways": ["string"],
  "why_it_matters": "string",
  "thumbnail_url": "string | null",
  "status": "processing | completed | embedding_failed",
  "source_type": "article | homepage | documentation | government | news | blog | product | video | repository | forum | unknown",
  "created_at": "datetime",
  "updated_at": "datetime",
  "knowledge_tags": [
    {
      "id": 1,
      "tag": "string"
    }
  ]
}
```

## Platform Detection

The backend detects platform from the URL hostname.

| Host | Platform |
| --- | --- |
| `youtube.com`, `youtu.be` | `youtube` |
| `reddit.com` | `reddit` |
| `instagram.com` | `instagram` |
| `linkedin.com` | `linkedin` |
| `twitter.com`, `x.com` | `twitter` |
| `medium.com`, `substack.com` | `blog` |
| everything else | `article` |

## URL Canonicalization

The backend stores:

- `original_url`: exact user-submitted URL
- `canonical_url`: normalized URL for duplicate prevention

Canonicalization:

- lowercases scheme and host
- removes leading `www.`
- removes trailing slash except root `/`
- removes URL fragment
- removes common tracking params:
  - `utm_*`
  - `fbclid`
  - `gclid`
  - `igshid`
  - `mc_cid`
  - `mc_eid`
  - `ref`
  - `si`

## Required Supabase Tables

### `knowledge_items`

Required columns:

```sql
id uuid primary key default gen_random_uuid(),
user_id uuid not null references auth.users(id) on delete cascade,
original_url text not null,
canonical_url text,
platform text not null,
title text not null,
summary text,
key_takeaways jsonb,
why_it_matters text,
thumbnail_url text,
status text not null default 'processing',
source_type text not null default 'link',
embedding vector(3072),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

Recommended unique index:

```sql
create unique index if not exists knowledge_items_user_canonical_url_unique
on public.knowledge_items (user_id, canonical_url)
where canonical_url is not null;
```

### `knowledge_tags`

Required columns:

```sql
id bigint generated by default as identity primary key,
knowledge_item_id uuid not null references public.knowledge_items(id) on delete cascade,
tag text not null,
unique (knowledge_item_id, tag)
```

## Required Supabase RPC Functions

### `update_memory_embedding`

Used by background embedding generation.

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

Used by `/api/knowledge/search`.

Minimum expected behavior:

- accepts query text
- accepts query embedding
- filters by authenticated user ID
- returns knowledge item fields
- includes `thumbnail_url`
- includes `similarity`

Expected signature:

```sql
public.hybrid_search_knowledge_items(
  query_text text,
  query_embedding vector(3072),
  match_user_id uuid,
  match_count integer,
  semantic_threshold double precision
)
```

## Environment Variables

Required backend environment variables:

```env
PORT=5000
FRONTEND_ORIGINS=["http://localhost:3000","https://your-vercel-app.vercel.app"]
SUPABASE_URL=your_supabase_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=gemini-embedding-001
FETCH_TIMEOUT_SECONDS=10
MAX_PAGE_BYTES=5000000
```

## Frontend Integration Notes

### Authorization

Every protected request should include:

```ts
Authorization: `Bearer ${session.access_token}`
```

### Capture

Use:

```ts
POST /api/knowledge
```

If response has `duplicate: true`, do not create a second card. Show a message such as:

```text
This link is already saved.
```

### Library

Use:

```ts
GET /api/knowledge
```

### Search

Use:

```ts
GET /api/knowledge/search?q=<query>&limit=20
```

Search results can be filtered on the frontend by `platform`.

### Delete

Use:

```ts
DELETE /api/knowledge/{id}
```

