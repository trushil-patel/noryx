"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Flame,
  Loader2,
  Sparkles,
  Tags,
  TrendingUp,
} from "lucide-react";

import { getKnowledgeItems } from "@/lib/api/knowledge";
import type {
  KnowledgeItem,
  Platform,
} from "@/lib/mock-data";

const PLATFORM_COLORS: Record<Platform, string> = {
  youtube: "#ef4444",
  reddit: "#f97316",
  instagram: "#ec4899",
  linkedin: "#0284c7",
  twitter: "#737373",
  blog: "#10b981",
  article: "#6366f1",
};

const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: "YouTube",
  reddit: "Reddit",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  twitter: "X",
  blog: "Blogs",
  article: "Articles",
};

const CHART_GRID = "rgba(128, 128, 128, 0.16)";
const CHART_TEXT = "rgba(128, 128, 128, 0.9)";
const ACCENT = "#7c3aed";

export default function InsightsPage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadInsights() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getKnowledgeItems();

        if (mounted) {
          setItems(data);
        }
      } catch (loadError) {
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load your insights.",
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInsights();

    return () => {
      mounted = false;
    };
  }, []);

  const insights = useMemo(
    () => buildInsights(items),
    [items],
  );

  if (isLoading) {
    return <InsightsLoading />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 lg:px-8">
      <motion.div
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
      >
        <h1 className="text-3xl font-semibold tracking-tight">
          Insights
        </h1>

        <p className="mt-1 text-[13.5px] text-muted-foreground">
          The real shape of your curiosity, generated from
          your Memora library.
        </p>
      </motion.div>

      {error ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-[13px] text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          {
            label: "Total memories",
            value: insights.totalItems,
            suffix: "",
            sub: `${insights.thisMonth} saved this month`,
            icon: Sparkles,
          },
          {
            label: "Learning streak",
            value: insights.streak,
            suffix:
              insights.streak === 1 ? " day" : " days",
            sub:
              insights.streak > 0
                ? "Keep your curiosity alive"
                : "Capture something today",
            icon: Flame,
          },
          {
            label: "Average per week",
            value: insights.averagePerWeek,
            suffix: "",
            sub: "Since your first memory",
            icon: TrendingUp,
          },
          {
            label: "Unique tags",
            value: insights.uniqueTags,
            suffix: "",
            sub: "Concepts in your library",
            icon: Tags,
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: index * 0.05,
            }}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent">
                <stat.icon className="h-4 w-4" />
              </div>

              <span className="text-[13px] text-muted-foreground">
                {stat.label}
              </span>
            </div>

            <div className="mt-4 text-3xl font-semibold tracking-tight tabular-nums">
              <CountUp
                value={stat.value}
                suffix={stat.suffix}
              />
            </div>

            <div className="mt-1 text-[12px] text-emerald-600">
              {stat.sub}
            </div>
          </motion.div>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyInsights />
      ) : (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="Knowledge growth"
              description="Memories saved during the last 12 months"
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart data={insights.monthlyGrowth}>
                  <defs>
                    <linearGradient
                      id="growth"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={ACCENT}
                        stopOpacity={0.36}
                      />

                      <stop
                        offset="100%"
                        stopColor={ACCENT}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke={CHART_GRID}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: 11,
                      fill: CHART_TEXT,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fontSize: 11,
                      fill: CHART_TEXT,
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />

                  <Tooltip content={<ChartTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="items"
                    name="Memories"
                    stroke={ACCENT}
                    strokeWidth={2}
                    fill="url(#growth)"
                    animationDuration={700}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Source breakdown"
              description="Where your knowledge comes from"
            >
              <div className="flex h-full flex-col">
                <div className="min-h-0 flex-1">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={insights.platformBreakdown}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={75}
                        paddingAngle={2}
                        animationDuration={700}
                      >
                        {insights.platformBreakdown.map(
                          (entry) => (
                            <Cell
                              key={entry.platform}
                              fill={entry.color}
                            />
                          ),
                        )}
                      </Pie>

                      <Tooltip
                        content={<ChartTooltip />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <ul className="mt-2 space-y-1.5">
                  {insights.platformBreakdown.map(
                    (platform) => (
                      <li
                        key={platform.platform}
                        className="flex items-center gap-2 text-[12px]"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            background: platform.color,
                          }}
                        />

                        <span className="flex-1">
                          {platform.name}
                        </span>

                        <span className="text-muted-foreground">
                          {platform.value}{" "}
                          {platform.value === 1
                            ? "item"
                            : "items"}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </ChartCard>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="Last seven days"
              description="Your recent capture activity"
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart data={insights.weeklyGrowth}>
                  <CartesianGrid
                    stroke={CHART_GRID}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="day"
                    tick={{
                      fontSize: 11,
                      fill: CHART_TEXT,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fontSize: 11,
                      fill: CHART_TEXT,
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />

                  <Tooltip content={<ChartTooltip />} />

                  <Bar
                    dataKey="saved"
                    name="Memories"
                    fill={ACCENT}
                    radius={[7, 7, 0, 0]}
                    animationDuration={700}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold tracking-tight">
                Top interests
              </h2>

              <p className="text-[12px] text-muted-foreground">
                Based on tags across your real memories
              </p>

              {insights.topCategories.length > 0 ? (
                <ul className="mt-5 space-y-4">
                  {insights.topCategories.map(
                    (category, index) => (
                      <li key={category.name}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-[12.5px]">
                          <span className="min-w-0 truncate font-medium">
                            #{category.name}
                          </span>

                          <span className="shrink-0 text-muted-foreground">
                            {category.count}
                          </span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{
                              width: 0,
                            }}
                            animate={{
                              width: `${category.percentage}%`,
                            }}
                            transition={{
                              duration: 0.7,
                              delay: index * 0.05,
                              ease: [
                                0.22,
                                1,
                                0.36,
                                1,
                              ],
                            }}
                            className="h-full rounded-full bg-accent"
                          />
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              ) : (
                <div className="mt-8 text-center text-[12px] text-muted-foreground">
                  Capture tagged memories to reveal your
                  interests.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function buildInsights(items: KnowledgeItem[]) {
  const validItems = items
    .map((item) => ({
      item,
      createdAt: item.createdAt
        ? new Date(item.createdAt)
        : null,
    }))
    .filter(
      (
        entry,
      ): entry is {
        item: KnowledgeItem;
        createdAt: Date;
      } =>
        entry.createdAt !== null &&
        !Number.isNaN(entry.createdAt.getTime()),
    );

  const now = new Date();

  const thisMonth = validItems.filter(
    ({ createdAt }) =>
      createdAt.getFullYear() === now.getFullYear() &&
      createdAt.getMonth() === now.getMonth(),
  ).length;

  const earliestDate =
    validItems.length > 0
      ? new Date(
          Math.min(
            ...validItems.map(({ createdAt }) =>
              createdAt.getTime(),
            ),
          ),
        )
      : now;

  const activeDays = Math.max(
    1,
    Math.ceil(
      (now.getTime() - earliestDate.getTime()) /
        86_400_000,
    ),
  );

  const activeWeeks = Math.max(
    1,
    Math.ceil(activeDays / 7),
  );

  const averagePerWeek = Math.round(
    items.length / activeWeeks,
  );

  const uniqueTags = new Set(
    items.flatMap((item) =>
      item.tags.map((tag) => tag.toLowerCase()),
    ),
  ).size;

  return {
    totalItems: items.length,
    thisMonth,
    streak: calculateStreak(validItems),
    averagePerWeek,
    uniqueTags,
    monthlyGrowth: buildMonthlyGrowth(validItems),
    weeklyGrowth: buildWeeklyGrowth(validItems),
    platformBreakdown:
      buildPlatformBreakdown(items),
    topCategories: buildTopCategories(items),
  };
}

function buildMonthlyGrowth(
  items: Array<{
    item: KnowledgeItem;
    createdAt: Date;
  }>,
) {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    month: "short",
  });

  return Array.from(
    {
      length: 12,
    },
    (_, index) => {
      const date = new Date();

      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      date.setMonth(date.getMonth() - (11 - index));

      const year = date.getFullYear();
      const month = date.getMonth();

      return {
        month: formatter.format(date),
        items: items.filter(
          ({ createdAt }) =>
            createdAt.getFullYear() === year &&
            createdAt.getMonth() === month,
        ).length,
      };
    },
  );
}

function buildWeeklyGrowth(
  items: Array<{
    item: KnowledgeItem;
    createdAt: Date;
  }>,
) {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
  });

  return Array.from(
    {
      length: 7,
    },
    (_, index) => {
      const date = new Date();

      date.setDate(date.getDate() - (6 - index));
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      return {
        day: formatter.format(date),
        saved: items.filter(
          ({ createdAt }) =>
            createdAt >= date &&
            createdAt < nextDate,
        ).length,
      };
    },
  );
}

function buildPlatformBreakdown(
  items: KnowledgeItem[],
) {
  const counts = new Map<Platform, number>();

  items.forEach((item) => {
    counts.set(
      item.platform,
      (counts.get(item.platform) ?? 0) + 1,
    );
  });

  return Array.from(counts.entries())
    .map(([platform, value]) => ({
      platform,
      name: PLATFORM_LABELS[platform],
      value,
      color: PLATFORM_COLORS[platform],
    }))
    .sort((a, b) => b.value - a.value);
}

function buildTopCategories(
  items: KnowledgeItem[],
) {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const uniqueItemTags = new Set(
      item.tags
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    );

    uniqueItemTags.forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });

  const maximum = Math.max(
    1,
    ...Array.from(counts.values()),
  );

  return Array.from(counts.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round(
        (count / maximum) * 100,
      ),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function calculateStreak(
  items: Array<{
    item: KnowledgeItem;
    createdAt: Date;
  }>,
) {
  const savedDays = new Set(
    items.map(({ createdAt }) =>
      dateKey(createdAt),
    ),
  );

  if (savedDays.size === 0) return 0;

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!savedDays.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);

    if (!savedDays.has(dateKey(cursor))) {
      return 0;
    }
  }

  let streak = 0;

  while (savedDays.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(
    2,
    "0",
  );
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function ChartCard({
  title,
  description,
  className = "",
  children,
}: {
  title: string;
  description: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-5 ${className}`}
    >
      <h2 className="text-sm font-semibold tracking-tight">
        {title}
      </h2>

      <p className="text-[12px] text-muted-foreground">
        {description}
      </p>

      <div className="mt-4 h-64">
        {children}
      </div>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
  }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-[12px] shadow-elegant">
      {label ? (
        <div className="mb-1 font-medium">
          {label}
        </div>
      ) : null}

      {payload.map((entry, index) => (
        <div
          key={`${entry.name}-${index}`}
          className="text-muted-foreground"
        >
          {entry.name ?? "Memories"}:{" "}
          <span className="font-medium text-foreground">
            {entry.value ?? 0}
          </span>
        </div>
      ))}
    </div>
  );
}

function CountUp({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    let frameId = 0;
    const startedAt = performance.now();
    const duration = 550;

    function animate(now: number) {
      const progress = Math.min(
        (now - startedAt) / duration,
        1,
      );

      const eased =
        1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    }

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [value]);

  return (
    <>
      {displayValue.toLocaleString()}
      {suffix}
    </>
  );
}

function EmptyInsights() {
  return (
    <div className="mt-8 rounded-3xl border border-dashed border-border bg-surface px-6 py-16 text-center">
      <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />

      <h2 className="mt-4 text-lg font-semibold">
        Your insights will grow with your memory
      </h2>

      <p className="mx-auto mt-2 max-w-md text-[13px] text-muted-foreground">
        Capture knowledge to reveal your learning patterns,
        top interests, sources and streak.
      </p>
    </div>
  );
}

function InsightsLoading() {
  return (
    <div className="grid min-h-[65vh] place-items-center">
      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Building your real insights...
      </div>
    </div>
  );
}