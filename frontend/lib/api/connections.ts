import { backendRequest } from "@/lib/api/backend";

export type PublicProfile = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
};

export type Connection = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: "pending" | "accepted" | "declined";
  requester: PublicProfile;
  addressee: PublicProfile;
};

type BackendProfile = {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  connection?: BackendConnection | null;
};

type BackendConnection = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  requester: BackendProfile;
  addressee: BackendProfile;
};

export type ProfileSearchResult = PublicProfile & {
  connection: Pick<Connection, "id" | "requesterId" | "addresseeId" | "status"> | null;
};

const normalizeProfile = (profile: BackendProfile): PublicProfile => ({
  userId: profile.user_id,
  username: profile.username,
  displayName: profile.display_name,
  avatarUrl: profile.avatar_url,
  bio: profile.bio,
});

const normalizeConnection = (connection: BackendConnection): Connection => ({
  id: connection.id,
  requesterId: connection.requester_id,
  addresseeId: connection.addressee_id,
  status: connection.status,
  requester: normalizeProfile(connection.requester),
  addressee: normalizeProfile(connection.addressee),
});

export async function getConnections(): Promise<{
  currentUserId: string;
  currentProfile: PublicProfile;
  incoming: Connection[];
  outgoing: Connection[];
  friends: Connection[];
}> {
  const data = await backendRequest<{
    current_user_id: string;
    profile: BackendProfile;
    incoming: BackendConnection[];
    outgoing: BackendConnection[];
    friends: BackendConnection[];
  }>("/api/connections");
  return {
    currentUserId: data.current_user_id,
    currentProfile: normalizeProfile(data.profile),
    incoming: data.incoming.map(normalizeConnection),
    outgoing: data.outgoing.map(normalizeConnection),
    friends: data.friends.map(normalizeConnection),
  };
}

export async function searchProfiles(query: string): Promise<ProfileSearchResult[]> {
  const data = await backendRequest<{ profiles: BackendProfile[] }>(
    `/api/connections/search?q=${encodeURIComponent(query.trim())}`,
  );
  return data.profiles.map((profile) => ({
    ...normalizeProfile(profile),
    connection: profile.connection
      ? {
          id: profile.connection.id,
          requesterId: profile.connection.requester_id,
          addresseeId: profile.connection.addressee_id,
          status: profile.connection.status,
        }
      : null,
  }));
}

export async function sendConnectionRequest(userId: string): Promise<void> {
  await backendRequest("/api/connections", { method: "POST", body: { user_id: userId } });
}

export async function answerConnectionRequest(
  connectionId: string,
  action: "accept" | "decline",
): Promise<void> {
  await backendRequest(`/api/connections/${encodeURIComponent(connectionId)}`, {
    method: "PATCH",
    body: { action },
  });
}

export async function removeConnection(connectionId: string): Promise<void> {
  await backendRequest(`/api/connections/${encodeURIComponent(connectionId)}`, {
    method: "DELETE",
  });
}
