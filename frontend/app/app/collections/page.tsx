"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Folder, Loader2, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import {
  createCollection,
  deleteCollection,
  getCollections,
  type Collection,
} from "@/lib/api/collections";
import {
  getConnections,
  type Connection,
  type PublicProfile,
} from "@/lib/api/connections";

function connectionProfile(
  connection: Connection,
  currentUserId: string,
): PublicProfile {
  return connection.requesterId === currentUserId
    ? connection.addressee
    : connection.requester;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Connection[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<string[]>([]);

  useEffect(() => {
    getCollections()
      .then(setCollections)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Unable to load collections."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getConnections()
      .then((data) => {
        setFriends(data.friends);
        setCurrentUserId(data.currentUserId);
      })
      .catch(() => {
        // Collection creation still works when connections are unavailable.
      });
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || creating) return;
    try {
      setCreating(true);
      const collection = await createCollection(
        name,
        description,
        selectedConnectionIds,
      );
      setCollections((current) => [collection, ...current]);
      setName("");
      setDescription("");
      setSelectedConnectionIds([]);
      toast.success("Collection created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create collection.");
    } finally {
      setCreating(false);
    }
  }

  function toggleConnection(connectionId: string) {
    setSelectedConnectionIds((current) =>
      current.includes(connectionId)
        ? current.filter((id) => id !== connectionId)
        : [...current, connectionId],
    );
  }

  async function handleDelete(collection: Collection) {
    if (!window.confirm(`Delete \"${collection.name}\"? Your saved memories will not be deleted.`)) return;
    try {
      setDeletingId(collection.id);
      await deleteCollection(collection.id);
      setCollections((current) => current.filter((item) => item.id !== collection.id));
      toast.success("Collection deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete collection.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 lg:px-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Organize your memory</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Collections</h1>
        <p className="mt-2 max-w-xl text-[13px] text-muted-foreground">
          Group related memories into spaces you can return to anytime.
        </p>
      </header>

      <form onSubmit={handleCreate} className="mt-8 grid gap-3 rounded-3xl border border-border bg-surface p-5 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-medium text-muted-foreground">Name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="e.g. Product inspiration" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] outline-none focus:border-foreground/30" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-medium text-muted-foreground">Description (optional)</span>
          <input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} placeholder="What belongs in this collection?" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] outline-none focus:border-foreground/30" />
        </label>
        <button type="submit" disabled={!name.trim() || creating} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[12px] font-medium text-primary-foreground disabled:opacity-50">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Create
        </button>
        {friends.length > 0 ? (
          <fieldset className="sm:col-span-3">
            <legend className="mb-2 text-[11px] font-medium text-muted-foreground">
              Add connections (optional)
            </legend>
            <div className="flex flex-wrap gap-2">
              {friends.map((connection) => {
                const profile = connectionProfile(connection, currentUserId);
                const selected = selectedConnectionIds.includes(connection.id);
                return (
                  <button
                    key={connection.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleConnection(connection.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[12px] transition ${
                      selected
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-muted text-[9px] font-semibold">
                      {profile.displayName.slice(0, 1).toUpperCase()}
                    </span>
                    {profile.displayName}
                    {selected ? <Check className="h-3.5 w-3.5" /> : null}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}
      </form>

      {loading ? (
        <div className="grid place-items-center py-24 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : collections.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-muted/60 px-6 py-16 text-center">
          <Folder className="mx-auto h-7 w-7 text-muted-foreground" />
          <h2 className="mt-4 text-base font-semibold">No collections yet</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">Create one above, or add a memory from your library.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection, index) => (
            <motion.article key={collection.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="group relative rounded-3xl border border-border bg-surface p-5 transition hover:-translate-y-1 hover:shadow-elegant">
              <Link href={`/app/collections/${collection.id}`} className="block">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-soft text-accent"><Folder className="h-5 w-5" /></span>
                <h2 className="mt-5 truncate text-lg font-semibold tracking-tight">{collection.name}</h2>
                <p className="mt-1 line-clamp-2 min-h-10 text-[12px] leading-relaxed text-muted-foreground">{collection.description || "A private collection of your saved memories."}</p>
                <div className="mt-5 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{collection.itemCount} {collection.itemCount === 1 ? "memory" : "memories"}</span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> {collection.memberCount}
                  </span>
                  {collection.access === "member" ? (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">Shared with you</span>
                  ) : null}
                </div>
              </Link>
              {collection.access === "owner" ? (
                <button type="button" onClick={() => void handleDelete(collection)} disabled={deletingId === collection.id} aria-label={`Delete ${collection.name}`} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100">
                  {deletingId === collection.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              ) : null}
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
