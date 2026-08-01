import { backendRequest } from "@/lib/api/backend";
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

let pendingKnowledgeItemsRequest: Promise<KnowledgeItem[]> | null = null;

type CreateKnowledgeResponse = {
  success: boolean;
  item: {
    id: string;
    original_url: string;
    platform: string;
    status: string;
  };
  warning?: string;
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
    tags,
    thumbnailHue: 275,
  };
}

export async function getKnowledgeItems(): Promise<
  KnowledgeItem[]
> {
  if (pendingKnowledgeItemsRequest) {
    return pendingKnowledgeItemsRequest;
  }

  pendingKnowledgeItemsRequest = backendRequest<KnowledgeResponse>(
    "/api/knowledge",
  ).then((data) => data.items.map(normalizeKnowledgeItem));

  try {
    return await pendingKnowledgeItemsRequest;
  } finally {
    pendingKnowledgeItemsRequest = null;
  }
}

export async function searchKnowledgeItems(
  query: string,
  limit = 20,
): Promise<KnowledgeItem[]> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    q: normalizedQuery,
    limit: String(limit),
  });

  const data = await backendRequest<KnowledgeResponse>(
    `/api/knowledge/search?${params.toString()}`,
  );

  return data.items.map(normalizeKnowledgeItem);
}

export async function createKnowledgeItem(
  url: string,
): Promise<CreateKnowledgeResponse> {
  const normalizedUrl = url.trim();

  if (!normalizedUrl) {
    throw new Error("URL is required.");
  }

  return backendRequest<CreateKnowledgeResponse>(
    "/api/knowledge",
    {
      method: "POST",
      body: {
        url: normalizedUrl,
      },
    },
  );
}

type DeleteKnowledgeResponse = {
  success: boolean;
  deleted_id: string;
};

export async function deleteKnowledgeItem(
  memoryId: string,
): Promise<DeleteKnowledgeResponse> {
  return backendRequest<DeleteKnowledgeResponse>(
    `/api/knowledge/${encodeURIComponent(memoryId)}`,
    {
      method: "DELETE",
    },
  );
}
