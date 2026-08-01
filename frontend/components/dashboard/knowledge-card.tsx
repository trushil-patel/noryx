"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Bookmark,
  ExternalLink,
  Sparkles,
} from "lucide-react";

import { PlatformBadge } from "@/components/common/platform-badge";
import { CustomTagEditor } from "@/components/dashboard/custom-tag-editor";
import type { KnowledgeItem } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function KnowledgeCard({
  item,
  index = 0,
}: {
  item: KnowledgeItem;
  index?: number;
}) {
  const [saved, setSaved] = useState(!!item.bookmarked);
  const [customTags, setCustomTags] = useState(item.customTags ?? []);
  const hasThumbnail = Boolean(item.thumbnailUrl);
  const originalCustomTags = new Set(
    (item.customTags ?? []).map((tag) => tag.toLowerCase()),
  );
  const aiTags = item.tags.filter(
    (tag) => !originalCustomTags.has(tag.toLowerCase()),
  );
  const displayedTags = Array.from(new Set([...aiTags, ...customTags]));

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -3 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:shadow-elegant"
    >
      <div
        className={cn(
          "relative w-full overflow-hidden bg-muted",
          hasThumbnail ? "aspect-video" : "h-24",
        )}
        style={
          hasThumbnail
            ? undefined
            : {
                background: `linear-gradient(135deg, oklch(0.95 0.04 ${
                  item.thumbnailHue ?? 275
                }), oklch(0.88 0.09 ${item.thumbnailHue ?? 275}))`,
              }
        }
      >
        {hasThumbnail ? (
          <Image
            src={item.thumbnailUrl ?? ""}
            alt=""
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
            unoptimized
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 grid-pattern opacity-40" />
        )}

        <div className="absolute left-4 top-4">
          <PlatformBadge
            platform={item.platform}
            className={
              hasThumbnail
                ? "border-white/20 bg-black/55 text-white backdrop-blur"
                : undefined
            }
          />
        </div>

        <button
          onClick={(event) => {
            event.preventDefault();
            setSaved((current) => !current);
          }}
          className={cn(
            "absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full backdrop-blur transition hover:scale-105",
            hasThumbnail
              ? "bg-black/50 text-white"
              : "bg-surface/90",
          )}
          aria-label="Bookmark"
        >
          <motion.span
            key={String(saved)}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 18,
            }}
          >
            <Bookmark
              className={cn(
                "h-4 w-4 transition",
                saved
                  ? "fill-accent text-accent"
                  : hasThumbnail
                    ? "text-white/85"
                    : "text-muted-foreground",
              )}
            />
          </motion.span>
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span>{item.author}</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>{item.savedAt}</span>

          {item.readTime ? (
            <>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>{item.readTime}</span>
            </>
          ) : null}
        </div>

        <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-foreground">
          {item.title}
        </h3>

        <p className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
          {item.summary}
        </p>

        <div className="mt-1 rounded-xl border border-border/70 bg-muted/50 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-foreground">
            <Sparkles className="h-3 w-3 text-accent" />
            Key takeaway
          </div>

          <p className="line-clamp-3 text-[12.5px] leading-relaxed text-muted-foreground">
            {item.takeaways[0]}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {displayedTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground/80"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground hover:text-accent"
          >
            Open original
            <ExternalLink className="h-3 w-3" />
          </a>

          <CustomTagEditor
            itemId={item.id}
            allTags={item.tags}
            customTags={customTags}
            onUpdated={setCustomTags}
            className="h-7 w-7 opacity-100"
          />
        </div>
      </div>
    </motion.article>
  );
}
