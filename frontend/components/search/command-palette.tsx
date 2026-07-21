"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, ArrowRight, Clock } from "lucide-react";

import { recentSearches, searchSuggestions, knowledgeItems } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const results = query
    ? knowledgeItems.filter((k) => k.title.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : [];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-start justify-center bg-foreground/10 px-4 pt-[12vh] backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-float"
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
              <Sparkles className="h-4 w-4 text-accent" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything — 'show me the YouTube video about startup marketing'"
                className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                ESC
              </kbd>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-2">
              {!query && (
                <>
                  <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Suggested
                  </div>
                  {searchSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13.5px] hover:bg-muted"
                    >
                      <Search className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1">{s}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  ))}
                  <div className="mt-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Recent
                  </div>
                  {recentSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13.5px] hover:bg-muted"
                    >
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1">{s}</span>
                    </button>
                  ))}
                </>
              )}

              {query && (
                <>
                  <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {results.length ? "Matches" : "No matches — try rephrasing"}
                  </div>
                  {results.map((r) => (
                    <button
                      key={r.id}
                      className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted"
                    >
                      <div className={cn("mt-1 h-2 w-2 rounded-full bg-accent")} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-medium">{r.title}</div>
                        <div className="truncate text-[12px] text-muted-foreground">
                          {r.author} · {r.source}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
              <span>Powered by noryX AI</span>
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-surface px-1 font-mono">↵</kbd> open
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-surface px-1 font-mono">↑↓</kbd> navigate
                </span>
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}