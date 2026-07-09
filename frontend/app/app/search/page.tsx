"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, ArrowRight, Filter } from "lucide-react";

import { knowledgeItems, recentSearches, searchSuggestions } from "@/lib/mock-data";
import { KnowledgeCard } from "@/components/dashboard/knowledge-card";
import { PlatformBadge } from "@/components/common/platform-badge";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const results = q
    ? knowledgeItems.filter((k) =>
        (k.title + k.summary + k.tags.join(" ")).toLowerCase().includes(q.toLowerCase()),
      )
    : knowledgeItems;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-medium text-muted-foreground">
          <Sparkles className="h-3 w-3 text-accent" /> Natural language search
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Ask your second brain anything.
        </h1>
        <p className="mt-3 text-[14px] text-muted-foreground">
          Try:{" "}
          <span className="text-foreground">
            &quot;Show me the YouTube video about startup marketing.&quot;
          </span>
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-auto mt-8 flex max-w-3xl items-center gap-3 rounded-2xl border border-border bg-surface p-2 shadow-elegant focus-within:border-foreground/20"
      >
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted">
          <Search className="h-4 w-4" />
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What are you looking for?"
          className="flex-1 bg-transparent text-[15px] focus:outline-none"
        />
        <button className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground hover:opacity-90">
          Search <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </motion.div>

      {!q && (
        <div className="mx-auto mt-8 max-w-3xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Suggested
          </p>
          <div className="flex flex-wrap gap-2">
            {searchSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => setQ(s)}
                className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-[12.5px] hover:border-foreground/20"
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recent
          </p>
          <div className="flex flex-col gap-1">
            {recentSearches.map((s) => (
              <button
                key={s}
                onClick={() => setQ(s)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-[13.5px] hover:bg-muted"
              >
                <Search className="h-3.5 w-3.5 text-muted-foreground" /> {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          {q ? `${results.length} results for "${q}"` : `${results.length} items in your library`}
        </p>
        <button className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[12px]">
          <Filter className="h-3 w-3" /> Filters
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["youtube", "twitter", "linkedin", "article", "reddit"] as const).map((p) => (
          <PlatformBadge key={p} platform={p} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {results.map((item, i) => (
          <KnowledgeCard key={item.id} item={item} index={i} />
        ))}
      </div>
    </div>
  );
}