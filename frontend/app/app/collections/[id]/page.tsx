"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Folder, Loader2, UserMinus, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";

import { KnowledgeCard } from "@/components/dashboard/knowledge-card";
import {
  addMemberToCollection,
  getCollection,
  removeMemberFromCollection,
  removeItemFromCollection,
  type CollectionDetail,
} from "@/lib/api/collections";
import {
  getConnections,
  type Connection,
  type PublicProfile,
} from "@/lib/api/connections";

function otherProfile(connection: Connection, currentUserId: string): PublicProfile {
  return connection.requesterId === currentUserId
    ? connection.addressee
    : connection.requester;
}

function ProfileAvatar({ profile }: { profile: PublicProfile }) {
  if (profile.avatarUrl) {
    return (
      <span
        role="img"
        aria-label={`${profile.displayName} avatar`}
        className="h-9 w-9 rounded-full bg-cover bg-center"
        style={{ backgroundImage: `url(${JSON.stringify(profile.avatarUrl)})` }}
      />
    );
  }
  return (
    <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent">
      {profile.displayName.slice(0, 1).toUpperCase() || "M"}
    </span>
  );
}

export default function CollectionDetailPage() {
  const params = useParams<{ id: string }>();
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Connection[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [memberBusyId, setMemberBusyId] = useState<string | null>(null);

  useEffect(() => {
    getCollection(params.id)
      .then(setCollection)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Unable to load collection."))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    getConnections()
      .then((data) => {
        setFriends(data.friends);
        setCurrentUserId(data.currentUserId);
      })
      .catch(() => {
        // The collection remains usable if the connection list cannot load.
      });
  }, []);

  async function remove(memoryId: string) {
    if (!collection) return;
    try {
      setRemovingId(memoryId);
      await removeItemFromCollection(collection.id, memoryId);
      setCollection({
        ...collection,
        itemCount: Math.max(0, collection.itemCount - 1),
        items: collection.items.filter((item) => item.id !== memoryId),
      });
      toast.success("Removed from collection");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove this memory.");
    } finally {
      setRemovingId(null);
    }
  }

  async function addMember(connection: Connection) {
    if (!collection) return;
    try {
      setMemberBusyId(connection.id);
      const result = await addMemberToCollection(collection.id, connection.id);
      if (result.member && !result.duplicate) {
        setCollection({
          ...collection,
          memberCount: collection.memberCount + 1,
          members: [...collection.members, result.member],
        });
      }
      toast.success(result.duplicate ? "Already in collection" : "Connection added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add this connection.");
    } finally {
      setMemberBusyId(null);
    }
  }

  async function removeMember(memberId: string) {
    if (!collection) return;
    try {
      setMemberBusyId(memberId);
      await removeMemberFromCollection(collection.id, memberId);
      setCollection({
        ...collection,
        memberCount: Math.max(0, collection.memberCount - 1),
        members: collection.members.filter((member) => member.userId !== memberId),
      });
      toast.success("Connection removed from collection");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove this connection.");
    } finally {
      setMemberBusyId(null);
    }
  }

  if (loading) return <div className="grid min-h-[60vh] place-items-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (!collection) return (
    <div className="mx-auto max-w-4xl px-6 py-24 text-center">
      <h1 className="text-xl font-semibold">Collection unavailable</h1>
      <Link href="/app/collections" className="mt-5 inline-block text-[13px] text-accent">Back to collections</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 lg:px-8">
      <Link href="/app/collections" className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Collections</Link>
      <header className="mt-7 flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent"><Folder className="h-5 w-5" /></span>
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.035em]">{collection.name}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{collection.description || `${collection.itemCount} saved memories`}</p>
          {collection.access === "member" ? (
            <span className="mt-2 inline-flex rounded-full bg-accent-soft px-2.5 py-1 text-[11px] text-accent">
              Shared with you
            </span>
          ) : null}
        </div>
      </header>

      <section className="mt-8 rounded-3xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-accent" />
            Connections
            <span className="text-[11px] font-normal text-muted-foreground">
              {collection.memberCount}
            </span>
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {collection.access === "owner" ? "Members can view this collection" : "Read-only access"}
          </p>
        </div>

        {collection.members.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {collection.members.map((member) => (
              <div key={member.userId} className="flex items-center gap-2 rounded-full border border-border bg-background py-1.5 pl-1.5 pr-2">
                <ProfileAvatar profile={member.profile} />
                <span className="min-w-0">
                  <span className="block max-w-40 truncate text-[12px] font-medium">{member.profile.displayName}</span>
                  <span className="block max-w-40 truncate text-[10px] text-muted-foreground">@{member.profile.username}</span>
                </span>
                {collection.access === "owner" ? (
                  <button
                    type="button"
                    title="Remove from collection"
                    disabled={memberBusyId === member.userId}
                    onClick={() => void removeMember(member.userId)}
                    className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    {memberBusyId === member.userId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserMinus className="h-3.5 w-3.5" />}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-[12px] text-muted-foreground">No connections have been added yet.</p>
        )}

        {collection.access === "owner" ? (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            {friends
              .filter((connection) => {
                const profile = otherProfile(connection, currentUserId);
                return !collection.members.some((member) => member.userId === profile.userId);
              })
              .map((connection) => {
                const profile = otherProfile(connection, currentUserId);
                return (
                  <button
                    key={connection.id}
                    type="button"
                    disabled={memberBusyId === connection.id}
                    onClick={() => void addMember(connection)}
                    className="inline-flex items-center gap-2 rounded-full border border-dashed border-border px-3 py-2 text-[11px] text-muted-foreground hover:border-accent hover:text-accent disabled:opacity-50"
                  >
                    {memberBusyId === connection.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                    Add {profile.displayName}
                  </button>
                );
              })}
          </div>
        ) : null}
      </section>

      {collection.items.length === 0 ? (
        <div className="mt-10 rounded-3xl bg-muted/60 px-6 py-16 text-center">
          <Folder className="mx-auto h-7 w-7 text-muted-foreground" />
          <h2 className="mt-4 text-base font-semibold">This collection is empty</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {collection.access === "owner" ? "Open your library and use the folder button on a memory." : "The owner has not added any memories yet."}
          </p>
          {collection.access === "owner" ? <Link href="/app" className="mt-5 inline-block rounded-full bg-foreground px-4 py-2 text-[12px] font-medium text-background">Browse library</Link> : null}
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {collection.items.map((item, index) => (
            <div key={item.id} className="group/collection relative">
              <KnowledgeCard item={item} index={index} />
              {collection.access === "owner" ? (
                <button type="button" onClick={() => void remove(item.id)} disabled={removingId === item.id} title="Remove from collection" className="absolute right-12 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur transition hover:bg-destructive group-hover/collection:opacity-100">
                  {removingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
