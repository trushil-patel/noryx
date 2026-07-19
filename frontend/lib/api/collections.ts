import { backendRequest } from "@/lib/api/backend";
import {
  normalizeKnowledgeItem,
  type BackendKnowledgeItem,
} from "@/lib/api/knowledge";
import type { KnowledgeItem } from "@/lib/mock-data";

export type Collection = {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  visibility: "private" | "friends";
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CollectionDetail = Collection & {
  items: KnowledgeItem[];
};

type BackendCollection = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  visibility: "private" | "friends";
  item_count?: number;
  created_at: string;
  updated_at: string;
  items?: BackendKnowledgeItem[];
};

function normalizeCollection(value: BackendCollection): Collection {
  return {
    id: value.id,
    ownerId: value.owner_id,
    name: value.name,
    description: value.description,
    visibility: value.visibility,
    itemCount: value.item_count ?? 0,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

export async function getCollections(): Promise<Collection[]> {
  const data = await backendRequest<{
    success: boolean;
    collections: BackendCollection[];
  }>("/api/collections");
  return data.collections.map(normalizeCollection);
}

export async function getCollection(id: string): Promise<CollectionDetail> {
  const data = await backendRequest<{
    success: boolean;
    collection: BackendCollection;
  }>(`/api/collections/${encodeURIComponent(id)}`);
  return {
    ...normalizeCollection(data.collection),
    items: (data.collection.items ?? []).map(normalizeKnowledgeItem),
  };
}

export async function createCollection(
  name: string,
  description?: string,
): Promise<Collection> {
  const data = await backendRequest<{
    success: boolean;
    collection: BackendCollection;
  }>("/api/collections", {
    method: "POST",
    body: { name, description: description || null },
  });
  return normalizeCollection(data.collection);
}

export async function deleteCollection(id: string): Promise<void> {
  await backendRequest(`/api/collections/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function addItemToCollection(
  collectionId: string,
  memoryId: string,
): Promise<{ duplicate: boolean }> {
  return backendRequest(
    `/api/collections/${encodeURIComponent(collectionId)}/items`,
    { method: "POST", body: { knowledge_item_id: memoryId } },
  );
}

export async function removeItemFromCollection(
  collectionId: string,
  memoryId: string,
): Promise<void> {
  await backendRequest(
    `/api/collections/${encodeURIComponent(collectionId)}/items/${encodeURIComponent(memoryId)}`,
    { method: "DELETE" },
  );
}
