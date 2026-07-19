"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Search, UserMinus, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";

import {
  answerConnectionRequest,
  getConnections,
  removeConnection,
  searchProfiles,
  sendConnectionRequest,
  type Connection,
  type ProfileSearchResult,
  type PublicProfile,
} from "@/lib/api/connections";

function ProfileAvatar({ profile }: { profile: PublicProfile }) {
  if (profile.avatarUrl) {
    return <img src={profile.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />;
  }
  return (
    <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">
      {profile.displayName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "M"}
    </span>
  );
}

function ProfileIdentity({ profile }: { profile: PublicProfile }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-[13px] font-medium">{profile.displayName}</p>
      <p className="truncate text-[11px] text-muted-foreground">@{profile.username}</p>
    </div>
  );
}

export default function NetworkPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileSearchResult[]>([]);
  const [incoming, setIncoming] = useState<Connection[]>([]);
  const [outgoing, setOutgoing] = useState<Connection[]>([]);
  const [friends, setFriends] = useState<Connection[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentProfile, setCurrentProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    const data = await getConnections();
    setCurrentUserId(data.currentUserId);
    setCurrentProfile(data.currentProfile);
    setIncoming(data.incoming);
    setOutgoing(data.outgoing);
    setFriends(data.friends);
  }, []);

  useEffect(() => {
    getConnections()
      .then((data) => {
        setCurrentUserId(data.currentUserId);
        setCurrentProfile(data.currentProfile);
        setIncoming(data.incoming);
        setOutgoing(data.outgoing);
        setFriends(data.friends);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Unable to load connections."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    try {
      setSearching(true);
      setResults(await searchProfiles(query));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to search users.");
    } finally {
      setSearching(false);
    }
  }

  async function runAction(id: string, action: () => Promise<void>, message: string) {
    try {
      setBusyId(id);
      await action();
      await loadConnections();
      setResults((current) => current.map((profile) =>
        profile.userId === id && message === "Request sent"
          ? { ...profile, connection: { id: "pending", requesterId: currentUserId, addresseeId: id, status: "pending" } }
          : profile,
      ));
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update connection.");
    } finally {
      setBusyId(null);
    }
  }

  const otherProfile = (connection: Connection) =>
    connection.requesterId === currentUserId ? connection.addressee : connection.requester;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-8 lg:px-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your people</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Connections</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Find friends by their Memora username and connect with them.
          {currentProfile ? ` Your username is @${currentProfile.username}.` : ""}
        </p>
      </header>

      <form onSubmit={handleSearch} className="mt-8 flex gap-2 rounded-2xl border border-border bg-surface p-2">
        <Search className="ml-2 mt-2.5 h-4 w-4 text-muted-foreground" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search username or name" className="min-w-0 flex-1 bg-transparent px-1 text-[13px] outline-none" />
        <button type="submit" disabled={query.trim().length < 2 || searching} className="rounded-xl bg-primary px-4 py-2 text-[12px] font-medium text-primary-foreground disabled:opacity-50">
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </button>
      </form>

      {results.length > 0 ? (
        <section className="mt-5 rounded-3xl border border-border bg-surface p-4">
          <h2 className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Search results</h2>
          <div className="mt-2 divide-y divide-border">
            {results.map((profile) => (
              <div key={profile.userId} className="flex items-center gap-3 py-3">
                <ProfileAvatar profile={profile} /><ProfileIdentity profile={profile} />
                {profile.connection ? (
                  <span className="rounded-full bg-muted px-3 py-1.5 text-[11px] capitalize text-muted-foreground">{profile.connection.status === "accepted" ? "Connected" : "Pending"}</span>
                ) : (
                  <button type="button" disabled={busyId === profile.userId} onClick={() => void runAction(profile.userId, () => sendConnectionRequest(profile.userId), "Request sent")} className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-[11px] font-medium text-background disabled:opacity-50">
                    {busyId === profile.userId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />} Connect
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {loading ? (
        <div className="grid place-items-center py-24 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold"><UserPlus className="h-4 w-4 text-accent" /> Requests <span className="text-[11px] font-normal text-muted-foreground">{incoming.length}</span></h2>
            <div className="mt-4 space-y-3">
              {incoming.length ? incoming.map((connection) => (
                <div key={connection.id} className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
                  <ProfileAvatar profile={connection.requester} /><ProfileIdentity profile={connection.requester} />
                  <button type="button" title="Accept" disabled={busyId === connection.id} onClick={() => void runAction(connection.id, () => answerConnectionRequest(connection.id, "accept"), "Connection accepted")} className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-4 w-4" /></button>
                  <button type="button" title="Decline" disabled={busyId === connection.id} onClick={() => void runAction(connection.id, () => answerConnectionRequest(connection.id, "decline"), "Request declined")} className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground"><X className="h-4 w-4" /></button>
                </div>
              )) : <p className="py-8 text-center text-[12px] text-muted-foreground">No incoming requests.</p>}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold"><Users className="h-4 w-4 text-accent" /> Friends <span className="text-[11px] font-normal text-muted-foreground">{friends.length}</span></h2>
            <div className="mt-4 space-y-3">
              {friends.length ? friends.map((connection) => {
                const profile = otherProfile(connection);
                return (
                  <div key={connection.id} className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
                    <ProfileAvatar profile={profile} /><ProfileIdentity profile={profile} />
                    <button type="button" title="Remove connection" disabled={busyId === connection.id} onClick={() => void runAction(connection.id, () => removeConnection(connection.id), "Connection removed")} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><UserMinus className="h-4 w-4" /></button>
                  </div>
                );
              }) : <p className="py-8 text-center text-[12px] text-muted-foreground">Your accepted connections will appear here.</p>}
            </div>
          </section>
        </div>
      )}

      {outgoing.length > 0 ? <p className="mt-5 text-[11px] text-muted-foreground">{outgoing.length} outgoing {outgoing.length === 1 ? "request" : "requests"} pending.</p> : null}
    </div>
  );
}
