import { backendRequest } from "@/lib/api/backend";
import {
  normalizeKnowledgeItem,
  type BackendKnowledgeItem,
} from "@/lib/api/knowledge";
import type { KnowledgeItem } from "@/lib/mock-data";
import type { PublicProfile } from "@/lib/api/connections";

export type CollectionMember = {
  userId: string;
  addedAt: string;
  profile: PublicProfile;
};

export type Collection = {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  visibility: "private" | "friends";
  itemCount: number;
  memberCount: number;
  access: "owner" | "member";
  createdAt: string;
  updatedAt: string;
};

export type CollectionDetail = Collection & {
  items: KnowledgeItem[];
  members: CollectionMember[];
};

type BackendMemberProfile = {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
};

type BackendCollectionMember = {
  user_id: string;
  created_at: string;
  profile: BackendMemberProfile;
};

type BackendCollection = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  visibility: "private" | "friends";
  item_count?: number;
  member_count?: number;
  access?: "owner" | "member";
  created_at: string;
  updated_at: string;
  items?: BackendKnowledgeItem[];
  members?: BackendCollectionMember[];
};

function normalizeMember(value: BackendCollectionMember): CollectionMember {
  return {
    userId: value.user_id,
    addedAt: value.created_at,
    profile: {
      userId: value.profile.user_id,
      username: value.profile.username,
      displayName: value.profile.display_name,
      avatarUrl: value.profile.avatar_url,
      bio: value.profile.bio,
    },
  };
}

function normalizeCollection(value: BackendCollection): Collection {
  return {
    id: value.id,
    ownerId: value.owner_id,
    name: value.name,
    description: value.description,
    visibility: value.visibility,
    itemCount: value.item_count ?? 0,
    memberCount: value.member_count ?? 0,
    access: value.access ?? "owner",
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
    members: (data.collection.members ?? []).map(normalizeMember),
  };
}

export async function createCollection(
  name: string,
  description?: string,
  connectionIds: string[] = [],
): Promise<Collection> {
  const data = await backendRequest<{
    success: boolean;
    collection: BackendCollection;
  }>("/api/collections", {
    method: "POST",
    body: {
      name,
      description: description || null,
      connection_ids: connectionIds,
    },
  });
  return normalizeCollection(data.collection);
}

export async function addMemberToCollection(
  collectionId: string,
  connectionId: string,
): Promise<{ duplicate: boolean; member: CollectionMember | null }> {
  const data = await backendRequest<{
    duplicate: boolean;
    member: BackendCollectionMember | null;
  }>(`/api/collections/${encodeURIComponent(collectionId)}/members`, {
    method: "POST",
    body: { connection_id: connectionId },
  });
  return {
    duplicate: data.duplicate,
    member: data.member ? normalizeMember(data.member) : null,
  };
}

export async function removeMemberFromCollection(
  collectionId: string,
  memberId: string,
): Promise<void> {
  await backendRequest(
    `/api/collections/${encodeURIComponent(collectionId)}/members/${encodeURIComponent(memberId)}`,
    { method: "DELETE" },
  );
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
