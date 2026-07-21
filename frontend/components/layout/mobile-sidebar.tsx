"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  BarChart3,
  LayoutGrid,
  Folder,
  LogOut,
  PlusCircle,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { createSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type MobileSidebarProps = {
  open: boolean;
  onClose: () => void;
};

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
  {
    href: "/app/settings",
    label: "Settings",
    icon: Settings,
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

export function MobileSidebar({
  open,
  onClose,
}: MobileSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [profile, setProfile] =
    useState<SidebarProfile | null>(null);

  const [loggingOut, setLoggingOut] =
    useState(false);

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

  useEffect(() => {
    if (!open) return;

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.body.style.overflow =
        originalOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [onClose, open]);

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

  async function logout() {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      const supabase =
        createSupabaseClient();

      const { error } =
        await supabase.auth.signOut();

      if (error) throw error;

      onClose();
      router.replace("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close navigation"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
          />

          <motion.aside
            initial={{
              x: "-100%",
            }}
            animate={{
              x: 0,
            }}
            exit={{
              x: "-100%",
            }}
            transition={{
              type: "spring",
              stiffness: 340,
              damping: 34,
            }}
            className="fixed inset-y-0 left-0 z-[60] flex w-[86vw] max-w-[330px] flex-col border-r border-sidebar-border bg-sidebar shadow-2xl lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
              <Logo />

              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5">
              <nav className="mt-5 flex flex-col gap-1">
                {navigation.map((item) => {
                  const active = isActive(
                    item.href,
                    item.exact,
                  );

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-[14px] font-medium transition-colors",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="mobile-sidebar-active"
                          className="absolute inset-0 rounded-xl bg-sidebar-accent"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 32,
                          }}
                        />
                      ) : null}

                      <item.icon className="relative h-5 w-5" />

                      <span className="relative">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-7 rounded-2xl border border-border bg-surface p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Quick capture
                </div>

                <p className="mt-1 text-[12px] text-muted-foreground">
                  Turn a useful link into
                  searchable knowledge.
                </p>

                <Link
                  href="/app/capture"
                  onClick={onClose}
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground"
                >
                  <PlusCircle className="h-4 w-4" />
                  Capture a link
                </Link>
              </div>
            </div>

            <div className="border-t border-sidebar-border p-4">
              <div className="rounded-2xl border border-border bg-surface p-3">
                <div className="flex items-center gap-3">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 shrink-0 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">
                      {profile
                        ? getInitials(
                            profile.name,
                            profile.email,
                          )
                        : "M"}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">
                      {profile?.name ??
                        "Loading..."}
                    </div>

                    <div className="truncate text-[11px] text-muted-foreground">
                      {profile?.email ?? ""}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void logout()
                  }
                  disabled={loggingOut}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-[12px] text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />

                  {loggingOut
                    ? "Logging out..."
                    : "Log out"}
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
