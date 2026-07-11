"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  Search,
  PlusCircle,
  Sparkles,
  BarChart3,
  Settings,
  Bookmark,
  Hash,
  Video,
  MessageCircle,
  Briefcase,
} from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const main = [
  { to: "/app", label: "Library", icon: LayoutGrid, exact: true },
  { to: "/app/search", label: "Search", icon: Search, shortcut: "⌘K" },
  { to: "/app/capture", label: "Capture", icon: PlusCircle },
  { to: "/app/processing", label: "AI Workflow", icon: Sparkles },
  { to: "/app/insights", label: "Insights", icon: BarChart3 },
];

const collections = [
  { label: "Bookmarked", icon: Bookmark, count: 24 },
  { label: "#ai", icon: Hash, count: 42 },
  { label: "#startups", icon: Hash, count: 31 },
  { label: "#design", icon: Hash, count: 18 },
];

const platforms = [
  { label: "YouTube", icon: Video },
  { label: "X", icon: MessageCircle },
  { label: "LinkedIn", icon: Briefcase },
];
type SidebarProfile = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

function metadataString(value: unknown): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function getInitials(name: string, email: string): string {
  const source = name.trim() || email.split("@")[0] || "M";

  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
export function AppSidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<SidebarProfile | null>(
  null,
);

useEffect(() => {
  const supabase = createSupabaseClient();
  let mounted = true;

  function updateProfile(
    user:
      | {
          email?: string | null;
          user_metadata?: Record<string, unknown>;
        }
      | null,
  ) {
    if (!mounted) return;

    if (!user) {
      setProfile(null);
      return;
    }

    const metadata = user.user_metadata ?? {};

    const email = user.email ?? "";

    const name =
      metadataString(metadata.full_name) ??
      metadataString(metadata.name) ??
      metadataString(metadata.display_name) ??
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

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    updateProfile(user);
  }

  void loadUser();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    updateProfile(session?.user ?? null);
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);
  const isActive = (to: string, exact = false) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 lg:flex">
      <div className="px-2 pb-4">
        <Logo />
      </div>

      <nav className="flex flex-col gap-0.5">
        {main.map((item) => {
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              href={item.to}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-sidebar-accent"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <item.icon className="relative h-4 w-4" />
              <span className="relative flex-1">{item.label}</span>
              {item.shortcut && (
                <kbd className="relative hidden rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground group-hover:inline-block xl:inline-block">
                  {item.shortcut}
                </kbd>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 px-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Collections
        </p>
      </div>
      <div className="mt-2 flex flex-col gap-0.5">
        {collections.map((c) => (
          <button
            key={c.label}
            className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <c.icon className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">{c.label}</span>
            <span className="text-[11px] text-muted-foreground/70">{c.count}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 px-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Sources
        </p>
      </div>
      <div className="mt-2 flex flex-col gap-0.5">
        {platforms.map((p) => (
          <button
            key={p.label}
            className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <p.icon className="h-3.5 w-3.5" />
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto rounded-xl border border-border bg-surface p-3">
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
          ? getInitials(profile.name, profile.email)
          : "M"}
      </div>
    )}

    <div className="min-w-0 flex-1">
      <div className="truncate text-[12.5px] font-medium">
        {profile?.name ?? "Loading..."}
      </div>

      <div className="truncate text-[11px] text-muted-foreground">
        {profile?.email || "Free plan"}
      </div>
    </div>

    <Link
      href="/app/settings"
      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label="Settings"
    >
      <Settings className="h-4 w-4" />
    </Link>
  </div>
</div>
    </aside>
  );
}