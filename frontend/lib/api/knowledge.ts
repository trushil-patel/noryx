import { backendRequest } from "@/lib/api/backend";
import type { KnowledgeItem, Platform } from "@/lib/mock-data";

type BackendKnowledgeItem = {
  id: string;
  original_url: string;
  platform: string;
  title: string | null;
  summary: string | null;
  key_takeaways?: string[] | null;
  why_it_matters: string | null;
  status: string;
  source_type: string | null;
  created_at: string;
  updated_at: string;
  knowledge_tags?: {
    id: string;
    tag: string;
  }[];
};

type KnowledgeResponse = {
  success: boolean;
  items: BackendKnowledgeItem[];
};

function normalizePlatform(platform: string): Platform {
  const value = platform.toLowerCase();

  if (value.includes("youtube")) return "youtube";
  if (value.includes("reddit")) return "reddit";
  if (value.includes("instagram")) return "instagram";
  if (value.includes("linkedin")) return "linkedin";
  if (value.includes("twitter") || value === "x") return "twitter";
  if (value.includes("blog")) return "blog";

  return "article";
}

function getSourceFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "Unknown source";
  }
}

function getRelativeTime(date: string) {
  const created = new Date(date).getTime();
  const now = Date.now();
  const diff = now - created;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";

  return `${days} days ago`;
}

export async function getKnowledgeItems(): Promise<KnowledgeItem[]> {
  const data = await backendRequest<KnowledgeResponse>("/api/knowledge");

  return data.items.map((item) => {
    const source = getSourceFromUrl(item.original_url);
    const tags = item.knowledge_tags?.map((tag) => tag.tag) ?? [];

    return {
      id: item.id,
      platform: normalizePlatform(item.platform),
      title: item.title ?? "Untitled knowledge item",
      source,
      url: item.original_url,
      author: source,
      savedAt: getRelativeTime(item.created_at),
      readTime: item.status === "processing" ? "Processing" : "Saved",
      summary: item.summary ?? "AI summary will appear here after processing.",
      takeaways:
        item.key_takeaways && item.key_takeaways.length > 0
            ? item.key_takeaways
            : ["Key takeaways will appear here after AI processing."],
      whyItMatters:
        item.why_it_matters ??
        "Why this matters will appear here after AI processing.",
      tags,
      thumbnailHue: 275,
    };
  });
}

type CreateKnowledgeResponse = {
  success: boolean;
  item: {
    id: string;
    original_url: string;
    platform: string;
    status: string;
  };
};

export async function createKnowledgeItem(url: string) {
  return backendRequest<CreateKnowledgeResponse>("/api/knowledge", {
    method: "POST",
    body: { url },
  });
}