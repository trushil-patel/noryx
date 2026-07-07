import { motion } from "motion/react";
import { Bookmark, ExternalLink, MoreHorizontal, Sparkles } from "lucide-react";
import { useState } from "react";
import { PlatformBadge } from "@/components/common/platform-badge";
import { Button } from "@/components/ui/button";
import type { KnowledgeItem } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function KnowledgeCard({ item, index = 0 }: { item: KnowledgeItem; index?: number }) {
  const [saved, setSaved] = useState(!!item.bookmarked);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:shadow-elegant"
    >
      <div
        className="relative h-24 w-full overflow-hidden"
        style={{
          background: `linear-gradient(135deg, oklch(0.95 0.04 ${item.thumbnailHue ?? 275}), oklch(0.88 0.09 ${item.thumbnailHue ?? 275}))`,
        }}
      >
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute left-4 top-4">
          <PlatformBadge platform={item.platform} />
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            setSaved((s) => !s);
          }}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-surface/90 backdrop-blur transition hover:scale-105"
          aria-label="Bookmark"
        >
          <motion.span
            key={String(saved)}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
          >
            <Bookmark
              className={cn(
                "h-4 w-4 transition",
                saved ? "fill-accent text-accent" : "text-muted-foreground",
              )}
            />
          </motion.span>
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{item.author}</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>{item.savedAt}</span>
          {item.readTime && (
            <>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>{item.readTime}</span>
            </>
          )}
        </div>

        <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-foreground">
          {item.title}
        </h3>

        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {item.summary}
        </p>

        <div className="mt-1 rounded-xl border border-border/70 bg-muted/50 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-foreground">
            <Sparkles className="h-3 w-3 text-accent" />
            Key takeaway
          </div>
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            {item.takeaways[0]}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground/80"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground hover:text-accent"
          >
            Open original <ExternalLink className="h-3 w-3" />
          </a>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
