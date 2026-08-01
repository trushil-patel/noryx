"use client";

import { KeyboardEvent, useMemo, useState } from "react";
import { Loader2, Plus, Tag, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { updateKnowledgeCustomTags } from "@/lib/api/knowledge";
import { cn } from "@/lib/utils";

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 40;

function normalizeTag(value: string): string {
  return value
    .trim()
    .replace(/^#+/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function CustomTagEditor({
  itemId,
  allTags,
  customTags,
  onUpdated,
  dark = false,
  className,
}: {
  itemId: string;
  allTags: string[];
  customTags: string[];
  onUpdated: (tags: string[]) => void;
  dark?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draftTags, setDraftTags] = useState(customTags);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const customTagKeys = useMemo(
    () => new Set(customTags.map((tag) => tag.toLowerCase())),
    [customTags],
  );
  const aiTags = allTags.filter(
    (tag) => !customTagKeys.has(tag.toLowerCase()),
  );

  function addTag() {
    const tag = normalizeTag(input);

    if (!tag) return;
    if (tag.length > MAX_TAG_LENGTH) {
      setError(`Tags can be at most ${MAX_TAG_LENGTH} characters.`);
      return;
    }
    if (draftTags.some((value) => value.toLowerCase() === tag)) {
      setError("That tag is already added.");
      return;
    }
    if (draftTags.length >= MAX_TAGS) {
      setError(`You can add up to ${MAX_TAGS} custom tags.`);
      return;
    }

    setDraftTags((current) => [...current, tag]);
    setInput("");
    setError(null);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag();
    }
  }

  async function saveTags() {
    setIsSaving(true);
    setError(null);

    try {
      const result = await updateKnowledgeCustomTags(itemId, draftTags);
      onUpdated(result.custom_tags);
      setOpen(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save tags. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    setDraftTags(customTags);
    setInput("");
    setError(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          aria-label="Edit custom tags"
          title="Edit custom tags"
          className={cn(
            "grid h-8 w-8 place-items-center rounded-full opacity-0 backdrop-blur transition-all duration-300 group-hover:opacity-100",
            dark
              ? "bg-black/45 text-white/85 hover:bg-white/20 hover:text-white"
              : "bg-background/50 text-muted-foreground hover:bg-background hover:text-foreground",
            className,
          )}
        >
          <Tag className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>

      <DialogContent onClick={(event) => event.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Edit custom tags</DialogTitle>
          <DialogDescription>
            Add your own tags to make this memory easier to find.
          </DialogDescription>
        </DialogHeader>

        {aiTags.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              AI-generated tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {aiTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-xs font-medium text-foreground">
            Your custom tags
          </p>
          {draftTags.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {draftTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() =>
                      setDraftTags((current) =>
                        current.filter((value) => value !== tag),
                      )
                    }
                    aria-label={`Remove ${tag} tag`}
                    className="rounded-full hover:bg-accent/10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="mb-3 text-xs text-muted-foreground">
              No custom tags yet.
            </p>
          )}

          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setError(null);
              }}
              onKeyDown={handleInputKeyDown}
              maxLength={MAX_TAG_LENGTH + 1}
              placeholder="e.g. read later"
              aria-label="New custom tag"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={addTag}
              disabled={!input.trim() || draftTags.length >= MAX_TAGS}
              aria-label="Add tag"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
            <span>Press Enter or comma to add</span>
            <span>{draftTags.length}/{MAX_TAGS}</span>
          </div>
          {error ? (
            <p className="mt-2 text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void saveTags()} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save tags
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
