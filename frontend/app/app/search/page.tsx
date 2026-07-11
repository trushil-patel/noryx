"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Filter,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";

import { searchKnowledgeItems } from "@/lib/api/knowledge";
import type { KnowledgeItem } from "@/lib/mock-data";
import {
  recentSearches,
  searchSuggestions,
} from "@/lib/mock-data";
import { KnowledgeCard } from "@/components/dashboard/knowledge-card";
import { PlatformBadge } from "@/components/common/platform-badge";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [results, setResults] = useState<KnowledgeItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(value?: string) {
    const query = (value ?? q).trim();

    if (query.length < 2 || isSearching) {
      return;
    }

    try {
      setQ(query);
      setIsSearching(true);
      setError(null);

      const items = await searchKnowledgeItems(query);

      setResults(items);
      setSearchedQuery(query);
      setHasSearched(true);
    } catch (err) {
      setResults([]);
      setHasSearched(true);
      setSearchedQuery(query);

      setError(
        err instanceof Error
          ? err.message
          : "Search failed. Please try again.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-medium text-muted-foreground">
          <Sparkles className="h-3 w-3 text-accent" />
          Natural language search
        </div>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Ask your second brain anything.
        </h1>

        <p className="mt-3 text-[14px] text-muted-foreground">
          Try:{" "}
          <span className="text-foreground">
            &quot;Show me the YouTube video about startup
            marketing.&quot;
          </span>
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-auto mt-8 flex max-w-3xl items-center gap-3 rounded-2xl border border-border bg-surface p-2 shadow-elegant focus-within:border-foreground/20"
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted">
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>

        <input
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void runSearch();
            }
          }}
          placeholder="What are you looking for?"
          aria-label="Search your memories"
          className="min-w-0 flex-1 bg-transparent text-[15px] focus:outline-none"
        />

        <button
          type="button"
          onClick={() => void runSearch()}
          disabled={q.trim().length < 2 || isSearching}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSearching ? "Searching..." : "Search"}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </motion.div>

      {error ? (
        <div
          role="alert"
          className="mx-auto mt-3 max-w-3xl rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] text-destructive"
        >
          {error}
        </div>
      ) : null}

      {!hasSearched && (
        <div className="mx-auto mt-8 max-w-3xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Suggested
          </p>

          <div className="flex flex-wrap gap-2">
            {searchSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void runSearch(suggestion)}
                className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-[12.5px] hover:border-foreground/20"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <p className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recent
          </p>

          <div className="flex flex-col gap-1">
            {recentSearches.map((recentSearch) => (
              <button
                key={recentSearch}
                type="button"
                onClick={() => void runSearch(recentSearch)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-[13.5px] hover:bg-muted"
              >
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                {recentSearch}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasSearched && (
        <>
          <div className="mt-10 flex items-center justify-between">
            <p className="text-[13px] text-muted-foreground">
              {isSearching
                ? `Searching for "${searchedQuery || q}"...`
                : `${results.length} ${
                    results.length === 1 ? "result" : "results"
                  } for "${searchedQuery}"`}
            </p>

            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[12px]"
            >
              <Filter className="h-3 w-3" />
              Filters
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                "youtube",
                "twitter",
                "linkedin",
                "article",
                "reddit",
              ] as const
            ).map((platform) => (
              <PlatformBadge
                key={platform}
                platform={platform}
              />
            ))}
          </div>

          {!isSearching && results.length === 0 && !error ? (
            <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
              <Search className="mx-auto h-6 w-6 text-muted-foreground" />

              <h2 className="mt-3 text-[15px] font-medium">
                No related memories found
              </h2>

              <p className="mt-1 text-[13px] text-muted-foreground">
                Try a broader topic or capture more knowledge
                first.
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {results.map((item, index) => (
              <KnowledgeCard
                key={item.id}
                item={item}
                index={index}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}