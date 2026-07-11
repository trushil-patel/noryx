"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  Bookmark,
  Briefcase,
  Hash,
  LayoutGrid,
  MessageCircle,
  PlusCircle,
  Search,
  Settings,
  Video,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { createSupabaseClient } from "@/lib/supabase/client";
import { getKnowledgeItems } from "@/lib/api/knowledge";
import type { KnowledgeItem } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type SidebarProfile = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

type SidebarFilter = {
  id: string;
  label: string;
  count: number;
};

const navigation = [
  {
    href: "/app",
    label: "Library",
    icon: LayoutGrid,
    exact: true,
  },
  {
    href: "/app/search",
    label: "Search",
    icon: Search,
  },
  {
    href: "/app/capture",
    label: "Capture",
    icon: PlusCircle,
  },
  {
    href: "/app/insights",
    label: "Insights",
    icon: BarChart3,
  },
];

function metadataString(
  value: unknown,
): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function getInitials(
  name: string,
  email: string,
): string {
  const source =
    name.trim() || email.split("@")[0] || "M";

  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase(),
    )
    .join("");
}

function getPlatformLabel(
  platform: string,
): string {
  switch (platform) {
    case "youtube":
      return "YouTube";

    case "twitter":
      return "X";

    case "linkedin":
      return "LinkedIn";

    case "instagram":
      return "Instagram";

    case "reddit":
      return "Reddit";

    case "blog":
      return "Blogs";

    case "article":
      return "Articles";

    default:
      return platform;
  }
}

function SourceIcon({
  platform,
}: {
  platform: string;
}) {
  if (platform === "youtube") {
    return <Video className="h-3.5 w-3.5" />;
  }

  if (
    [
      "twitter",
      "reddit",
      "instagram",
    ].includes(platform)
  ) {
    return (
      <MessageCircle className="h-3.5 w-3.5" />
    );
  }

  if (platform === "linkedin") {
    return (
      <Briefcase className="h-3.5 w-3.5" />
    );
  }

  return <Bookmark className="h-3.5 w-3.5" />;
}

export function AppSidebar() {
  const pathname = usePathname();

  const [profile, setProfile] =
    useState<SidebarProfile | null>(null);

  const [knowledgeItems, setKnowledgeItems] =
    useState<KnowledgeItem[]>([]);

  const [filtersLoading, setFiltersLoading] =
    useState(true);

  useEffect(() => {
    const supabase = createSupabaseClient();
    let mounted = true;

    function updateProfile(
      user:
        | {
            email?: string | null;
            user_metadata?: Record<
              string,
              unknown
            >;
          }
        | null,
    ) {
      if (!mounted) return;

      if (!user) {
        setProfile(null);
        return;
      }

      const metadata =
        user.user_metadata ?? {};

      const email = user.email ?? "";

      const name =
        metadataString(metadata.full_name) ??
        metadataString(metadata.name) ??
        metadataString(
          metadata.display_name,
        ) ??
        email.split("@")[0] ??
        "Memora user";

      const avatarUrl =
        metadataString(metadata.avatar_url) ??
        metadataString(metadata.picture);

      setProfile({
        name,
        email,
        avatarUrl,
      });
    }

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      updateProfile(user);
    }

    void loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        updateProfile(
          session?.user ?? null,
        );
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadSidebarFilters() {
      try {
        setFiltersLoading(true);

        const items =
          await getKnowledgeItems();

        if (mounted) {
          setKnowledgeItems(items);
        }
      } catch {
        if (mounted) {
          setKnowledgeItems([]);
        }
      } finally {
        if (mounted) {
          setFiltersLoading(false);
        }
      }
    }

    void loadSidebarFilters();

    return () => {
      mounted = false;
    };
  }, [pathname]);

  const collections = useMemo<
    SidebarFilter[]
  >(() => {
    const counts =
      knowledgeItems.reduce<
        Record<string, number>
      >((result, item) => {
        const uniqueTags = new Set(
          item.tags
            .map((tag) =>
              tag.trim().toLowerCase(),
            )
            .filter(Boolean),
        );

        uniqueTags.forEach((tag) => {
          result[tag] =
            (result[tag] ?? 0) + 1;
        });

        return result;
      }, {});

    return Object.entries(counts)
      .map(([label, count]) => ({
        id: label,
        label,
        count,
      }))
      .sort(
        (first, second) =>
          second.count - first.count,
      )
      .slice(0, 6);
  }, [knowledgeItems]);

  const sources = useMemo<
    SidebarFilter[]
  >(() => {
    const counts =
      knowledgeItems.reduce<
        Record<string, number>
      >((result, item) => {
        result[item.platform] =
          (result[item.platform] ?? 0) +
          1;

        return result;
      }, {});

    return Object.entries(counts)
      .map(([platform, count]) => ({
        id: platform,
        label:
          getPlatformLabel(platform),
        count,
      }))
      .sort(
        (first, second) =>
          second.count - first.count,
      );
  }, [knowledgeItems]);

  function isActive(
    href: string,
    exact = false,
  ) {
    return exact
      ? pathname === href
      : pathname === href ||
          pathname.startsWith(
            `${href}/`,
          );
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 lg:flex">
      <div className="px-2 pb-4">
        <Logo />
      </div>

      <nav className="flex flex-col gap-0.5">
        {navigation.map((item) => {
          const active = isActive(
            item.href,
            item.exact,
          );

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-sidebar-accent"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 32,
                  }}
                />
              ) : null}

              <item.icon className="relative h-4 w-4" />

              <span className="relative flex-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        <div className="px-3 pt-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Top topics
          </p>
        </div>

        <div className="mt-2 flex flex-col gap-0.5">
          {filtersLoading ? (
            <SidebarLoadingRows count={3} />
          ) : collections.length > 0 ? (
            collections.map(
              (collection) => (
                <Link
                  key={collection.id}
                  href={`/app?tag=${encodeURIComponent(
                    collection.id,
                  )}`}
                  title={`Show memories tagged ${collection.label}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                >
                  <Hash className="h-3.5 w-3.5 shrink-0" />

                  <span className="min-w-0 flex-1 truncate text-left">
                    {collection.label}
                  </span>

                  <span className="text-[11px] text-muted-foreground/70">
                    {collection.count}
                  </span>
                </Link>
              ),
            )
          ) : (
            <p className="px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
              Your most-used tags will
              appear here.
            </p>
          )}
        </div>

        <div className="mt-5 px-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sources
          </p>
        </div>

        <div className="mt-2 flex flex-col gap-0.5">
          {filtersLoading ? (
            <SidebarLoadingRows count={3} />
          ) : sources.length > 0 ? (
            sources.map((source) => (
              <Link
                key={source.id}
                href={`/app?source=${encodeURIComponent(
                  source.id,
                )}`}
                title={`Show ${source.label} memories`}
                className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              >
                <SourceIcon
                  platform={source.id}
                />

                <span className="min-w-0 flex-1 truncate">
                  {source.label}
                </span>

                <span className="text-[11px] text-muted-foreground/70">
                  {source.count}
                </span>
              </Link>
            ))
          ) : (
            <p className="px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
              Your knowledge sources will
              appear here.
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-surface p-3">
        <div className="flex items-center gap-2">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="h-8 w-8 shrink-0 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
              {profile
                ? getInitials(
                    profile.name,
                    profile.email,
                  )
                : "M"}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-medium">
              {profile?.name ??
                "Loading..."}
            </div>

            <div className="truncate text-[11px] text-muted-foreground">
              {profile?.email ||
                "Free plan"}
            </div>
          </div>

          <Link
            href="/app/settings"
            className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

function SidebarLoadingRows({
  count,
}: {
  count: number;
}) {
  return (
    <>
      {Array.from({
        length: count,
      }).map((_, index) => (
        <div
          key={index}
          className="mx-3 my-1 h-7 animate-pulse rounded-lg bg-muted"
        />
      ))}
    </>
  );
}