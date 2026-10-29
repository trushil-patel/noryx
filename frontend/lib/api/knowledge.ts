import { backendRequest } from "@/lib/api/backend";
import { libraryCache } from "@/lib/api/library-cache";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { KnowledgeItem, Platform } from "@/lib/mock-data";

export type BackendKnowledgeItem = {
  id: string;
  original_url: string;
  platform: string;
  title: string | null;
  summary: string | null;
  thumbnail_url?: string | null;
  key_takeaways?: string[] | null;
  why_it_matters: string | null;
  similarity?: number;
  status: string;
  source_type: string | null;
  custom_tags?: string[] | null;
  created_at: string;
  updated_at: string;
  knowledge_tags?: {
    id: string;
    tag: string;
  }[];
};

export type KnowledgeResponse = {
  success: boolean;
  items: BackendKnowledgeItem[];
};

type CreateKnowledgeResponse = {
  success: boolean;
  item: BackendKnowledgeItem;
  warning?: string;
  collection_id?: string | null;
  added_to_collection?: boolean;
};

function normalizePlatform(
  platform: string,
  url = "",
  sourceType = "",
): Platform {
  const normalizedPlatform = platform.toLowerCase();
  const normalizedSourceType = sourceType.toLowerCase();
  let host = "";

  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    host = "";
  }

  const hostMatches = (domain: string) =>
    host === domain || host.endsWith(`.${domain}`);

  if (normalizedPlatform === "youtube" || hostMatches("youtube.com") || hostMatches("youtu.be")) {
    return "youtube";
  }
  if (normalizedPlatform === "reddit" || hostMatches("reddit.com")) return "reddit";
  if (normalizedPlatform === "instagram" || hostMatches("instagram.com")) return "instagram";
  if (normalizedPlatform === "linkedin" || hostMatches("linkedin.com")) return "linkedin";
  if (
    normalizedPlatform === "repository" ||
    normalizedSourceType === "repository" ||
    hostMatches("github.com") ||
    hostMatches("gitlab.com") ||
    hostMatches("bitbucket.org")
  ) {
    return "repository";
  }
  if (
    normalizedPlatform === "documentation" ||
    normalizedSourceType === "documentation"
  ) {
    return "documentation";
  }
  if (
    normalizedPlatform === "forum" ||
    normalizedSourceType === "forum" ||
    hostMatches("stackoverflow.com") ||
    hostMatches("quora.com")
  ) {
    return "forum";
  }
  if (
    normalizedPlatform === "video" ||
    normalizedSourceType === "video" ||
    hostMatches("vimeo.com") ||
    hostMatches("dailymotion.com")
  ) {
    return "video";
  }
  if (normalizedPlatform === "news" || normalizedSourceType === "news") return "news";

  if (
    normalizedPlatform === "twitter" ||
    normalizedPlatform === "x" ||
    hostMatches("twitter.com") ||
    hostMatches("x.com")
  ) {
    return "twitter";
  }

  if (
    normalizedPlatform === "blog" ||
    normalizedSourceType === "blog" ||
    hostMatches("medium.com") ||
    hostMatches("substack.com") ||
    hostMatches("dev.to") ||
    hostMatches("hashnode.com")
  ) {
    return "blog";
  }
  if (normalizedSourceType === "article") return "article";
  if (normalizedPlatform === "article" && !normalizedSourceType) return "article";

  return "website";
}

function getSourceFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Unknown source";
  }
}

function getRelativeTime(date: string): string {
  const created = new Date(date).getTime();

  if (Number.isNaN(created)) {
    return "Recently";
  }

  const now = Date.now();
  const difference = Math.max(0, now - created);

  const minutes = Math.floor(difference / (1000 * 60));
  const hours = Math.floor(difference / (1000 * 60 * 60));
  const days = Math.floor(
    difference / (1000 * 60 * 60 * 24),
  );

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";

  return `${days} days ago`;
}

export function normalizeKnowledgeItem(
  item: BackendKnowledgeItem,
): KnowledgeItem {
  const source = getSourceFromUrl(item.original_url);

  const tags =
    item.knowledge_tags?.map((tag) => tag.tag) ?? [];
  const customTags = item.custom_tags ?? [];

  const similarity =
    typeof item.similarity === "number"
      ? Math.max(0, Math.min(1, item.similarity))
      : undefined;

  return {
    id: item.id,
    platform: normalizePlatform(
      item.platform,
      item.original_url,
      item.source_type ?? "",
    ),
    title: item.title ?? "Untitled knowledge item",
    source,
    url: item.original_url,
    author: source,
    savedAt: getRelativeTime(item.created_at),
    thumbnailUrl: item.thumbnail_url ?? null,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    readTime:
      item.status === "processing"
        ? "Processing"
        : similarity !== undefined
          ? `${Math.round(similarity * 100)}% match`
          : "Saved",
    summary:
      item.summary ??
      "AI summary will appear here after processing.",
    takeaways:
      item.key_takeaways &&
      item.key_takeaways.length > 0
        ? item.key_takeaways
        : [
            "Key takeaways will appear here after AI processing.",
          ],
    whyItMatters:
      item.why_it_matters ??
      "Why this matters will appear here after AI processing.",
    tags: Array.from(new Set([...tags, ...customTags])),
    customTags,
    thumbnailHue: 275,
  };
}

async function libraryUserId(): Promise<string> {
  const { data: { session }, error } = await createSupabaseClient().auth.getSession();
  if (error) throw error;
  if (!session) {
    libraryCache.clear();
    throw new Error("No active Supabase session found.");
  }
  return session.user.id;
}

export async function getKnowledgeItems(options: {
  onCached?: (items: KnowledgeItem[]) => void;
} = {}): Promise<KnowledgeItem[]> {
  const userId = await libraryUserId();
  const cached = libraryCache.read(userId);
  if (cached !== null) options.onCached?.(cached.map(normalizeKnowledgeItem));

  const rows = await libraryCache.refresh(userId, async () => {
    // The user's JWT and RLS protect this read. The explicit owner filter
    // excludes memories that are merely shared with the current user.
    const { data, error } = await createSupabaseClient()
      .from("knowledge_items")
      .select("id,original_url,platform,title,summary,key_takeaways,why_it_matters,thumbnail_url,status,source_type,custom_tags,created_at,updated_at,knowledge_tags(id,tag)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (await libraryUserId() !== userId) throw new Error("Your account has changed.");
    return (data ?? []) as BackendKnowledgeItem[];
  });
  return rows.map(normalizeKnowledgeItem);
}

export async function searchKnowledgeItems(
  query: string,
  limit = 20,
  onProgress?: (items: KnowledgeItem[]) => void,
): Promise<KnowledgeItem[]> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    q: normalizedQuery,
    limit: String(limit),
  });
  if (onProgress) params.set("stream", "true");

  const data = await backendRequest<KnowledgeResponse>(
    `/api/knowledge/search?${params.toString()}`,
    { onProgress: onProgress ? (data) => onProgress(data.items.map(normalizeKnowledgeItem)) : undefined },
  );

  return data.items.map(normalizeKnowledgeItem);
}

export async function createKnowledgeItem(
  url: string,
  collectionId?: string,
): Promise<CreateKnowledgeResponse> {
  const normalizedUrl = url.trim();

  if (!normalizedUrl) {
    throw new Error("URL is required.");
  }

  const userId = await libraryUserId();
  const response = await backendRequest<CreateKnowledgeResponse>(
    "/api/knowledge",
    {
      method: "POST",
      body: {
        url: normalizedUrl,
        collection_id: collectionId || null,
      },
    },
  );
  if (await libraryUserId() === userId) {
    libraryCache.update(userId, (items) => [
      response.item, ...items.filter((item) => item.id !== response.item.id),
    ].sort((a, b) => b.created_at.localeCompare(a.created_at)));
  }
  return response;
}

type DeleteKnowledgeResponse = {
  success: boolean;
  deleted_id: string;
};

export async function deleteKnowledgeItem(
  memoryId: string,
): Promise<DeleteKnowledgeResponse> {
  const userId = await libraryUserId();
  const response = await backendRequest<DeleteKnowledgeResponse>(
    `/api/knowledge/${encodeURIComponent(memoryId)}`,
    {
      method: "DELETE",
    },
  );
  if (await libraryUserId() === userId) {
    libraryCache.update(userId, (items) => items.filter((item) => item.id !== memoryId));
  }
  return response;
}

type UpdateCustomTagsResponse = {
  success: boolean;
  memory_id: string;
  custom_tags: string[];
  updated_at: string;
};

export async function updateKnowledgeCustomTags(
  memoryId: string,
  tags: string[],
): Promise<UpdateCustomTagsResponse> {
  const userId = await libraryUserId();
  const response = await backendRequest<UpdateCustomTagsResponse>(
    `/api/knowledge/${encodeURIComponent(memoryId)}/tags`,
    {
      method: "PATCH",
      body: { tags },
    },
  );
  if (await libraryUserId() === userId) {
    libraryCache.update(userId, (items) => items.map((item) => item.id === memoryId
      ? { ...item, custom_tags: response.custom_tags, updated_at: response.updated_at }
      : item));
  }
  return response;
}
