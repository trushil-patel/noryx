"use client";

import Link from "next/link";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
} from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Globe2,
  Hash,
  Loader2,
  MessagesSquare,
  Newspaper,
  RefreshCw,
  Rss,
  Search,
  Shuffle,
  Sparkles,
  Tag,
  Trash2,
  Video,
  Flame,
} from "lucide-react";
import { FaLinkedin } from "react-icons/fa";
import {
  SiInstagram,
  SiReddit,
  SiX,
  SiYoutube,
} from "react-icons/si";

import { Button } from "@/components/ui/button";
import { CollectionPicker } from "@/components/collections/collection-picker";
import { createSupabaseClient } from "@/lib/supabase/client";
import {
  deleteKnowledgeItem,
  getKnowledgeItems,
} from "@/lib/api/knowledge";
import type { KnowledgeItem } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const memoryColors = [
  {
    background:
      "from-violet-500/18 via-fuchsia-500/8 to-transparent",
    accent: "text-violet-500",
  },
  {
    background:
      "from-orange-400/18 via-amber-400/8 to-transparent",
    accent: "text-orange-500",
  },
  {
    background:
      "from-emerald-400/16 via-teal-400/8 to-transparent",
    accent: "text-emerald-500",
  },
  {
    background:
      "from-sky-400/18 via-cyan-400/8 to-transparent",
    accent: "text-sky-500",
  },
  {
    background:
      "from-rose-400/16 via-pink-400/8 to-transparent",
    accent: "text-rose-500",
  },
];

function calculateLearningStreak(items: KnowledgeItem[]): number {
  const savedDays = new Set(
    items
      .map((item) => getLocalDateKey(item.createdAt))
      .filter((dateKey): dateKey is string => Boolean(dateKey)),
  );

  if (savedDays.size === 0) {
    return 0;
  }

  const today = startOfLocalDay(new Date());
  const yesterday = addDays(today, -1);

  let cursor: Date;

  if (savedDays.has(formatLocalDateKey(today))) {
    cursor = today;
  } else if (savedDays.has(formatLocalDateKey(yesterday))) {
    cursor = yesterday;
  } else {
    const latestSavedDay = Array.from(savedDays).sort().at(-1);

    if (!latestSavedDay) {
      return 0;
    }

    cursor = parseLocalDateKey(latestSavedDay);
  }

  let streak = 0;

  while (savedDays.has(formatLocalDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function getLocalDateKey(date?: string): string | null {
  if (!date) {
    return null;
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return formatLocalDateKey(parsedDate);
}

function getSavedTimestamp(item: KnowledgeItem): number {
  if (!item.createdAt) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = new Date(item.createdAt).getTime();

  return Number.isNaN(timestamp)
    ? Number.NEGATIVE_INFINITY
    : timestamp;
}

function startOfLocalDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

function getInstagramThumbnailFallback(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    const postPath = parsedUrl.pathname.match(
      /^\/(?:p|reel|tv)\/[^/]+/,
    )?.[0];

    if (
      !hostname.endsWith("instagram.com") ||
      !postPath
    ) {
      return null;
    }

    return `${parsedUrl.origin}${postPath}/media/?size=l`;
  } catch {
    return null;
  }
}

function PlatformIcon({ platform }: { platform: KnowledgeItem["platform"] }) {
  const iconClassName = "h-4 w-4";

  switch (platform.toLowerCase()) {
    case "youtube":
      return <SiYoutube className={iconClassName} aria-hidden="true" />;
    case "instagram":
      return <SiInstagram className={iconClassName} aria-hidden="true" />;
    case "reddit":
      return <SiReddit className={iconClassName} aria-hidden="true" />;
    case "linkedin":
      return <FaLinkedin className={iconClassName} aria-hidden="true" />;
    case "twitter":
      return <SiX className={iconClassName} aria-hidden="true" />;
    case "blog":
      return <Rss className={iconClassName} aria-hidden="true" />;
    case "article":
      return <Newspaper className={iconClassName} aria-hidden="true" />;
    default:
      return <Globe2 className={iconClassName} aria-hidden="true" />;
  }
}

function LibraryPageContent() {
  const searchParams = useSearchParams();
  const capturedId = searchParams.get("captured");
  const tagFilter = searchParams
    .get("tag")
    ?.trim()
    .toLowerCase();

  const sourceFilter = searchParams
    .get("source")
    ?.trim()
    .toLowerCase();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] =
    useState("all");

  useEffect(() => {
    let mounted = true;

    async function loadKnowledgeItems() {
      const supabase = createSupabaseClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user.id;

      const cacheKey = userId
        ? `memora-library:${userId}`
        : null;

      let hasCache = false;

      if (cacheKey) {
        try {
          const cachedValue =
            sessionStorage.getItem(cacheKey);

          if (cachedValue) {
            const cachedItems = JSON.parse(
              cachedValue,
            ) as KnowledgeItem[];

            if (
              mounted &&
              Array.isArray(cachedItems)
            ) {
              setItems(cachedItems);
              setIsLoading(false);
              setIsRefreshing(true);
              hasCache = true;
            }
          }
        } catch {
          sessionStorage.removeItem(cacheKey);
        }
      }

      try {
        if (!hasCache) {
          setIsLoading(true);
        }

        setError(null);

        const freshItems = await getKnowledgeItems();

        if (!mounted) return;

        setItems(freshItems);
        setIsLoading(false);

        if (cacheKey) {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify(freshItems),
          );
        }
      } catch (loadError) {
        if (!mounted) return;

        if (!hasCache) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load knowledge items",
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    void loadKnowledgeItems();

    return () => {
      mounted = false;
    };
  }, [capturedId]);

  const stats = useMemo(() => {
    const summaries = items.filter(
      (item) =>
        item.summary &&
        !item.summary.includes(
          "AI summary will appear here",
        ),
    ).length;

    const uniqueTags = new Set(
      items.flatMap((item) => item.tags),
    ).size;

    const learningStreak = calculateLearningStreak(items);

    return [
      {
        label: "Saved items",
        value: items.length,
        suffix: "",
        icon: BookmarkCheck,
      },
      {
        label: "AI summaries",
        value: summaries,
        suffix: "",
        icon: Sparkles,
      },
      {
        label: "Tags created",
        value: uniqueTags,
        suffix: "",
        icon: Hash,
      },
      {
        label: "Save streak",
        value: learningStreak,
        suffix: "d",
        icon: Flame,
      },
    ];
  }, [items]);

  const filters = useMemo(
    () => [
      {
        id: "all",
        label: "Everything",
        icon: Sparkles,
        count: items.length,
      },
      {
        id: "articles",
        label: "Articles",
        icon: BookOpen,
        count: items.filter(
          (item) =>
            item.platform === "article" ||
            item.platform === "blog",
        ).length,
      },
      {
        id: "videos",
        label: "Videos",
        icon: Video,
        count: items.filter(
          (item) => item.platform === "youtube",
        ).length,
      },
      {
        id: "social",
        label: "Social",
        icon: MessagesSquare,
        count: items.filter((item) =>
          [
            "twitter",
            "linkedin",
            "instagram",
            "reddit",
          ].includes(item.platform),
        ).length,
      },
      {
        id: "tagged",
        label: "Tagged",
        icon: Tag,
        count: items.filter(
          (item) => item.tags.length > 0,
        ).length,
      },
    ],
    [items],
  );

  const filteredItems = useMemo(() => {
      let result = items;

      if (tagFilter) {
        result = result.filter((item) =>
          item.tags.some(
            (tag) => tag.trim().toLowerCase() === tagFilter,
          ),
        );
      }

      if (sourceFilter) {
        result = result.filter(
          (item) =>
            item.platform.toLowerCase() === sourceFilter,
        );
      }

      switch (activeFilter) {
        case "articles":
          result = result.filter(
            (item) =>
              item.platform === "article" ||
              item.platform === "blog",
          );
          break;

        case "videos":
          result = result.filter(
            (item) => item.platform === "youtube",
          );
          break;

        case "social":
          result = result.filter((item) =>
            [
              "twitter",
              "linkedin",
              "instagram",
              "reddit",
            ].includes(item.platform),
          );
          break;

        case "tagged":
          result = result.filter(
            (item) => item.tags.length > 0,
          );
          break;

        default:
          break;
      }

      return [...result].sort(
        (first, second) => {
          const firstTimestamp = getSavedTimestamp(first);
          const secondTimestamp = getSavedTimestamp(second);

          return firstTimestamp === secondTimestamp
            ? 0
            : secondTimestamp - firstTimestamp;
        },
      );
    }, [
      activeFilter,
      items,
      sourceFilter,
      tagFilter,
    ]);

  const activeFilterLabel =
    filters.find(
      (filter) => filter.id === activeFilter,
    )?.label ?? "Everything";

  async function handleDelete(item: KnowledgeItem) {
    const confirmed = window.confirm(
      `Delete "${item.title}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed || deletingId) {
      return;
    }

    const previousItems = items;

    try {
      setDeletingId(item.id);
      setError(null);

      const nextItems = items.filter(
        (current) => current.id !== item.id,
      );

      setItems(nextItems);
      updateLibraryCaches(nextItems);

      await deleteKnowledgeItem(item.id);
    } catch (deleteError) {
      setItems(previousItems);
      updateLibraryCaches(previousItems);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete this memory.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-24 pt-8 lg:px-8">
      <motion.header
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.35,
        }}
        className="flex flex-wrap items-end justify-between gap-5"
      >
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[13px] text-muted-foreground">
              Welcome back
            </p>

            {isRefreshing ? (
              <span className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                Syncing
              </span>
            ) : null}
          </div>

          <h1 className="mt-1 text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Your knowledge, organized.
          </h1>
        </div>

        <Link href="/app/capture">
          <Button className="rounded-full">
            <Sparkles className="h-4 w-4" />
            Capture new link
          </Button>
        </Link>
      </motion.header>

      {error ? (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-[13px] text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

          <div className="flex-1">
            {error}
          </div>

          <button
            type="button"
            onClick={() => setError(null)}
            className="text-[11px] font-medium"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{
              opacity: 0,
              y: 8,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              delay: index * 0.04,
              duration: 0.25,
            }}
            whileHover={{
              y: -3,
              transition: {
                duration: 0.18,
              },
            }}
            className="rounded-2xl border border-border bg-surface p-4"
          >
            <div className="flex items-center justify-between">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-accent">
                <stat.icon className="h-4 w-4" />
              </div>

              <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600">
                Live
              </span>
            </div>

            <div className="mt-4 text-2xl font-semibold tracking-tight tabular-nums">
              <AnimatedNumber
                value={stat.value}
                suffix={stat.suffix}
              />
            </div>

            <div className="text-[12px] text-muted-foreground">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      <section className="mt-12 min-w-0">
        <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Your memory canvas
            </div>

            <h2 className="text-2xl font-semibold tracking-[-0.03em]">
              Things worth remembering.
            </h2>
            {tagFilter || sourceFilter ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  Showing:
                </span>

                {tagFilter ? (
                  <span className="rounded-full bg-accent-soft px-3 py-1 text-[11px] font-medium text-accent">
                    #{tagFilter}
                  </span>
                ) : null}

                {sourceFilter ? (
                  <span className="rounded-full bg-accent-soft px-3 py-1 text-[11px] font-medium capitalize text-accent">
                    {sourceFilter}
                  </span>
                ) : null}

                <Link
                  href="/app"
                  className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Clear filter
                </Link>
              </div>
            ) : null}
            <p className="mt-1 text-[13px] text-muted-foreground">
              Discover your saved knowledge by its most useful
              categories.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => {
              const active =
                activeFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() =>
                    setActiveFilter(filter.id)
                  }
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11.5px] font-medium transition-all duration-300 ${
                    active
                      ? "bg-foreground text-background shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                  }`}
                >
                  <filter.icon className="h-3.5 w-3.5" />

                  <span>{filter.label}</span>

                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] tabular-nums ${
                      active
                        ? "bg-background/15 text-background"
                        : "bg-background text-muted-foreground"
                    }`}
                  >
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {isRefreshing ? (
          <div className="mb-4 flex items-center gap-2 text-[11px] text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Quietly refreshing your memories
          </div>
        ) : null}

        {isLoading ? (
          <MemoryCanvasLoading />
        ) : !error && items.length === 0 ? (
          <EmptyMemoryCanvas />
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            className="rounded-[32px] bg-muted/60 px-6 py-16 text-center"
          >
            <Search className="mx-auto h-6 w-6 text-muted-foreground" />

            <h3 className="mt-4 text-base font-semibold">
              Nothing here yet
            </h3>

            <p className="mt-1 text-[13px] text-muted-foreground">
              No memories found in {activeFilterLabel}.
            </p>

            <button
              type="button"
              onClick={() =>
                setActiveFilter("all")
              }
              className="mt-5 rounded-full bg-foreground px-4 py-2 text-[12px] font-medium text-background"
            >
              Show everything
            </button>
          </motion.div>
        ) : (
          <LayoutGroup>
            <motion.div
              layout
              className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredItems.map(
                  (item, index) => (
                    <MemoryTile
                      key={item.id}
                      item={item}
                      index={index}
                      isDeleting={
                        deletingId === item.id
                      }
                      onDelete={() =>
                        void handleDelete(item)
                      }
                    />
                  ),
                )}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        )}
      </section>
    </div>
  );
}

function MemoryTile({
  item,
  index,
  isDeleting,
  onDelete,
}: {
  item: KnowledgeItem;
  index: number;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  const color =
    memoryColors[index % memoryColors.length];

  const size =
    index % 7 === 0
      ? "min-h-[340px]"
      : index % 5 === 0
        ? "min-h-[310px]"
        : index % 3 === 0
          ? "min-h-[280px]"
          : "min-h-[250px]";

  const visibleTags = item.tags.slice(0, 4);
  const [failedThumbnailUrls, setFailedThumbnailUrls] =
    useState<string[]>([]);
  const instagramThumbnailFallback =
    item.platform === "instagram"
      ? getInstagramThumbnailFallback(item.url)
      : null;
  const thumbnailCandidates = Array.from(
    new Set(
      [item.thumbnailUrl, instagramThumbnailFallback].filter(
        (url): url is string => Boolean(url),
      ),
    ),
  );
  const thumbnailSource = thumbnailCandidates.find(
    (url) => !failedThumbnailUrls.includes(url),
  );
  const hasThumbnail = Boolean(thumbnailSource);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{
        opacity: isDeleting ? 0.45 : 1,
        y: 0,
        scale: isDeleting ? 0.97 : 1,
      }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{
        layout: { type: "spring", stiffness: 260, damping: 28 },
        opacity: { duration: 0.2 },
        delay: Math.min(index, 7) * 0.04,
      }}
      whileHover={
        isDeleting
          ? undefined
          : {
              y: -7,
              rotate: index % 2 === 0 ? -0.25 : 0.25,
              transition: { type: "spring", stiffness: 350, damping: 24 },
            }
      }
      className={cn(
        "group",
        isDeleting && "pointer-events-none",
      )}
    >
      <div
        className={`relative flex ${size} flex-col overflow-hidden rounded-[28px] border border-border/70 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-500 group-hover:shadow-[0_24px_70px_-30px_rgba(0,0,0,0.35)]`}
      >
        {hasThumbnail ? (
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            <img
              key={thumbnailSource}
              src={thumbnailSource}
              alt=""
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => {
                if (!thumbnailSource) return;

                setFailedThumbnailUrls((current) =>
                  current.includes(thumbnailSource)
                    ? current
                    : [...current, thumbnailSource],
                );
              }}
            />

            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
              <div
                aria-label={`${item.platform} source`}
                title={item.platform}
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/20 bg-black/45 text-white shadow-sm backdrop-blur-xl"
              >
                <PlatformIcon platform={item.platform} />
              </div>

              <div className="flex items-center gap-1">
                <CollectionPicker
                  memoryId={item.id}
                  memoryTitle={item.title}
                  dark
                />
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={isDeleting}
                  aria-label={`Delete ${item.title}`}
                  title="Delete memory"
                  className="grid h-8 w-8 place-items-center rounded-full bg-black/45 text-white/85 opacity-0 backdrop-blur transition-all duration-300 hover:bg-destructive/90 hover:text-white disabled:cursor-not-allowed group-hover:opacity-100"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${item.title}`}
                  title="Open original source"
                  className="grid h-8 w-8 place-items-center rounded-full bg-black/45 text-white/85 opacity-0 backdrop-blur transition-all duration-300 hover:bg-white/20 hover:text-white group-hover:opacity-100"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative h-20 overflow-hidden">
            <div
              className={`absolute inset-0 bg-gradient-to-br ${color.background} opacity-80 transition duration-700 group-hover:scale-110 group-hover:opacity-100`}
            />

            <div className="relative flex items-start justify-between gap-3 p-4">
              <div
                aria-label={`${item.platform} source`}
                title={item.platform}
                className={`grid h-10 w-10 place-items-center rounded-2xl border border-white/20 bg-background/60 backdrop-blur-xl ${color.accent}`}
              >
                <PlatformIcon platform={item.platform} />
              </div>

              <div className="flex items-center gap-1">
                <CollectionPicker
                  memoryId={item.id}
                  memoryTitle={item.title}
                />
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={isDeleting}
                  aria-label={`Delete ${item.title}`}
                  title="Delete memory"
                  className="grid h-9 w-9 place-items-center rounded-full bg-background/50 text-muted-foreground opacity-0 backdrop-blur transition-all duration-300 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed group-hover:opacity-100"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${item.title}`}
                  title="Open original source"
                  className="grid h-9 w-9 place-items-center rounded-full bg-background/50 text-muted-foreground opacity-0 backdrop-blur transition-all duration-300 hover:bg-background hover:text-foreground group-hover:opacity-100"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium capitalize text-muted-foreground">
              {item.platform}
            </span>

            <span className="text-[10px] text-muted-foreground">
              {item.savedAt}
            </span>
          </div>

          <h3
            className={`font-semibold tracking-[-0.025em] text-foreground ${
              index % 7 === 0
                ? "text-[20px] leading-[1.18]"
                : "text-[17px] leading-[1.25]"
            }`}
          >
            {item.title}
          </h3>

          <p
            className={`mt-3 text-[12.5px] leading-relaxed text-muted-foreground ${
              index % 7 === 0
                ? "line-clamp-5"
                : index % 3 === 0
                  ? "line-clamp-4"
                  : "line-clamp-3"
            }`}
          >
            {item.summary}
          </p>

          {visibleTags.length > 0 ? (
            <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border/60 bg-background/40 px-2.5 py-1 text-[10px] text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

function AnimatedNumber({
  value,
  suffix = "",
  duration = 550,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      setDisplayValue(value);
      return;
    }

    let frameId = 0;
    const startedAt = performance.now();

    function animate(now: number) {
      const progress = Math.min(
        (now - startedAt) / duration,
        1,
      );

      const eased =
        1 - Math.pow(1 - progress, 3);

      setDisplayValue(
        Math.round(value * eased),
      );

      if (progress < 1) {
        frameId =
          requestAnimationFrame(animate);
      }
    }

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [duration, value]);

  return (
    <span>
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

function MemoryCanvasLoading() {
  return (
    <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {[
        300,
        220,
        250,
        330,
        230,
        270,
        360,
        240,
      ].map((height, index) => (
        <div
          key={index}
          style={{
            height,
          }}
          className="animate-pulse rounded-[30px] bg-muted"
        />
      ))}
    </div>
  );
}

function EmptyMemoryCanvas() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.98,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      className="relative overflow-hidden rounded-[36px] bg-foreground px-6 py-20 text-center text-background"
    >
      <motion.div
        aria-hidden
        animate={{
          x: [0, 18, -12, 0],
          y: [0, -14, 10, 0],
          rotate: [0, 4, -3, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-[12%] top-[18%] h-24 w-20 rounded-[24px] bg-violet-400/30 blur-[1px]"
      />

      <motion.div
        aria-hidden
        animate={{
          x: [0, -14, 10, 0],
          y: [0, 12, -8, 0],
          rotate: [0, -5, 2, 0],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[12%] right-[14%] h-28 w-24 rounded-full bg-orange-300/25 blur-[1px]"
      />

      <div className="relative">
        <motion.div
          animate={{
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-background/10 backdrop-blur"
        >
          <Shuffle className="h-7 w-7" />
        </motion.div>

        <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em]">
          Your mind is ready.
        </h3>

        <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-background/65">
          Save anything that sparks your curiosity.
          noryX will understand it and bring it back when
          you need it.
        </p>

        <Link href="/app/capture">
          <Button
            variant="secondary"
            className="mt-7 rounded-full"
          >
            <Sparkles className="h-4 w-4" />
            Save your first memory
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

function updateLibraryCaches(
  nextItems: KnowledgeItem[],
) {
  const cacheKeys: string[] = [];

  for (
    let index = 0;
    index < sessionStorage.length;
    index += 1
  ) {
    const key = sessionStorage.key(index);

    if (key?.startsWith("memora-library:")) {
      cacheKeys.push(key);
    }
  }

  cacheKeys.forEach((key) => {
    sessionStorage.setItem(
      key,
      JSON.stringify(nextItems),
    );
  });
}

function LibraryPageLoading() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-24 pt-8 lg:px-8">
      <div className="animate-pulse">
        <div className="h-4 w-32 rounded bg-muted" />

        <div className="mt-3 h-9 w-72 rounded bg-muted" />

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="h-32 rounded-2xl border border-border bg-surface"
            />
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {[
            300,
            220,
            250,
            330,
            230,
            270,
            360,
            240,
          ].map((height, index) => (
            <div
              key={index}
              style={{
                height,
              }}
              className="rounded-[30px] bg-muted"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<LibraryPageLoading />}>
      <LibraryPageContent />
    </Suspense>
  );
}
