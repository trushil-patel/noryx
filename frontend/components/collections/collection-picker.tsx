"use client";

import { useState } from "react";
import { Check, FolderPlus, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  addItemToCollection,
  createCollection,
  getCollections,
  type Collection,
} from "@/lib/api/collections";
import { cn } from "@/lib/utils";

export function CollectionPicker({
  memoryId,
  memoryTitle,
  dark = false,
}: {
  memoryId: string;
  memoryTitle: string;
  dark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) return;
    try {
      setLoading(true);
      setCollections(await getCollections());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load collections.");
    } finally {
      setLoading(false);
    }
  }

  async function add(collection: Collection) {
    try {
      setSavingId(collection.id);
      const result = await addItemToCollection(collection.id, memoryId);
      toast.success(
        result.duplicate
          ? `Already saved in ${collection.name}`
          : `Added to ${collection.name}`,
      );
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add this memory.");
    } finally {
      setSavingId(null);
    }
  }

  async function createAndAdd() {
    const name = newName.trim();
    if (!name || creating) return;
    try {
      setCreating(true);
      const collection = await createCollection(name);
      await addItemToCollection(collection.id, memoryId);
      toast.success(`Created ${collection.name} and added this memory`);
      setNewName("");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create collection.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => void handleOpenChange(value)}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Add ${memoryTitle} to a collection`}
          title="Add to collection"
          className={cn(
            "grid place-items-center rounded-full opacity-100 backdrop-blur transition-all duration-300 sm:opacity-0 sm:group-hover:opacity-100",
            dark
              ? "h-8 w-8 bg-black/45 text-white/85 hover:bg-white/20 hover:text-white"
              : "h-9 w-9 bg-background/50 text-muted-foreground hover:bg-background hover:text-foreground",
          )}
        >
          <FolderPlus className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle>Add to collection</DialogTitle>
          <DialogDescription className="line-clamp-1">{memoryTitle}</DialogDescription>
        </DialogHeader>

        <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : collections.length ? (
            collections.map((collection) => (
              <button
                key={collection.id}
                type="button"
                disabled={savingId !== null}
                onClick={() => void add(collection)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border p-3 text-left transition hover:bg-muted disabled:opacity-50"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent">
                  {savingId === collection.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FolderPlus className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{collection.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
                  </span>
                </span>
                <Check className="h-4 w-4 text-muted-foreground/40" />
              </button>
            ))
          ) : (
            <p className="py-5 text-center text-[13px] text-muted-foreground">
              You have no collections yet. Create your first one below.
            </p>
          )}
        </div>

        <form
          className="mt-2 flex gap-2 border-t border-border pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            void createAndAdd();
          }}
        >
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            maxLength={80}
            placeholder="New collection name"
            className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-foreground/30"
          />
          <button
            type="submit"
            disabled={!newName.trim() || creating}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-[12px] font-medium text-primary-foreground disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Create
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
