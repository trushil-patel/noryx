"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  LayoutGrid,
  Folder,
  PlusCircle,
  Search,
  Settings,
  Users,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { createSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SidebarProfile = {
  name: string;
  email: string;
  avatarUrl: string | null;
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
    href: "/app/collections",
    label: "Collections",
    icon: Folder,
  },
  {
    href: "/app/network",
    label: "Connections",
    icon: Users,
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

export function AppSidebar() {
  const pathname = usePathname();

  const [profile, setProfile] =
    useState<SidebarProfile | null>(null);

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
        "noryX user";

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

      <div className="flex-1" />

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
