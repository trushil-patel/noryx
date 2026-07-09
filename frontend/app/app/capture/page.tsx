"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import {
  Link2,
  Sparkles,
  ClipboardCheck,
  ArrowRight,
  Globe,
  FileText,
  Rss,
  MessageCircle,
} from "lucide-react";

import { createKnowledgeItem } from "@/lib/api/knowledge";

const supported = [
  { icon: Globe, label: "YouTube" },
  { icon: Globe, label: "X" },
  { icon: Globe, label: "LinkedIn" },
  { icon: Globe, label: "Instagram" },
  { icon: MessageCircle, label: "Reddit" },
  { icon: FileText, label: "Articles" },
  { icon: Rss, label: "Blogs" },
];

export default function CapturePage() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function analyze() {
    if (!url.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await createKnowledgeItem(url.trim());

      if (!response.success) {
        throw new Error("Failed to capture URL");
      }

      router.push(`/app?captured=${response.item.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to capture URL");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-14 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Sparkles className="h-5 w-5" />
        </div>

        <h1 className="mt-4 text-center text-3xl font-semibold tracking-tight text-balance">
          Capture a new idea.
        </h1>

        <p className="mx-auto mt-2 max-w-xl text-center text-[14px] text-muted-foreground">
          Paste a link from anywhere. Memora AI will read it, summarize it, tag it and file it
          away — usually in under 8 seconds.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-10 rounded-3xl border border-border bg-surface p-6 shadow-elegant"
      >
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Paste URL
        </label>

        <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 focus-within:border-foreground/20">
          <Link2 className="h-4 w-4 text-muted-foreground" />

          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=…"
            className="flex-1 bg-transparent text-[14px] focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && analyze()}
          />

          <button
            type="button"
            onClick={() => navigator.clipboard?.readText().then(setUrl).catch(() => {})}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[11.5px] text-muted-foreground hover:text-foreground"
          >
            <ClipboardCheck className="h-3 w-3" /> Paste
          </button>
        </div>

        {error ? (
          <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={analyze}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-[14px] font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          disabled={!url.trim() || isSubmitting}
        >
          <Sparkles className="h-4 w-4" />
          {isSubmitting ? "Saving..." : "Analyze with AI"}
          <ArrowRight className="h-4 w-4" />
        </button>

        <div className="mt-6 border-t border-border pt-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Works with
          </p>

          <div className="flex flex-wrap gap-2">
            {supported.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[12px] text-muted-foreground"
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-6 text-center text-[12px] text-muted-foreground"
      >
        Tip: install the Memora extension to capture with{" "}
        <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px]">
          ⌘⇧S
        </kbd>{" "}
        from any tab.
      </motion.div>
    </div>
  );
}