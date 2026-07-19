"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Folder, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { KnowledgeCard } from "@/components/dashboard/knowledge-card";
import {
  getCollection,
  removeItemFromCollection,
  type CollectionDetail,
} from "@/lib/api/collections";

export default function CollectionDetailPage() {
  const params = useParams<{ id: string }>();
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    getCollection(params.id)
      .then(setCollection)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Unable to load collection."))
      .finally(() => setLoading(false));
  }, [params.id]);

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
        </div>
      </header>

      {collection.items.length === 0 ? (
        <div className="mt-10 rounded-3xl bg-muted/60 px-6 py-16 text-center">
          <Folder className="mx-auto h-7 w-7 text-muted-foreground" />
          <h2 className="mt-4 text-base font-semibold">This collection is empty</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">Open your library and use the folder button on a memory.</p>
          <Link href="/app" className="mt-5 inline-block rounded-full bg-foreground px-4 py-2 text-[12px] font-medium text-background">Browse library</Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {collection.items.map((item, index) => (
            <div key={item.id} className="group/collection relative">
              <KnowledgeCard item={item} index={index} />
              <button type="button" onClick={() => void remove(item.id)} disabled={removingId === item.id} title="Remove from collection" className="absolute right-12 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur transition hover:bg-destructive group-hover/collection:opacity-100">
                {removingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
