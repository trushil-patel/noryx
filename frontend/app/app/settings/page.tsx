"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  Check,
  Loader2,
  LogOut,
  Palette,
  Shield,
  Sparkles,
  User,
} from "lucide-react";

import { createSupabaseClient } from "@/lib/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark" | "system";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  provider: string;
  createdAt: string | null;
  lastSignInAt: string | null;
};

const sections = [
  {
    id: "profile",
    label: "Profile",
    icon: User,
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
  },
  {
    id: "danger",
    label: "Danger zone",
    icon: AlertTriangle,
  },
];

function getMetadataString(value: unknown): string | null {
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

function formatDate(value: string | null): string {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;

  const shouldUseDark =
    theme === "dark" || (theme === "system" && prefersDark);

  document.documentElement.classList.toggle(
    "dark",
    shouldUseDark,
  );

  document.documentElement.style.colorScheme = shouldUseDark
    ? "dark"
    : "light";
}

export default function SettingsPage() {
  const router = useRouter();

  const [active, setActive] = useState("profile");
  const [theme, setTheme] = useState<Theme>("system");
  const [themeReady, setThemeReady] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(
    null,
  );
  const [fullName, setFullName] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileError, setProfileError] = useState<
    string | null
  >(null);
  const [profileMessage, setProfileMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("memora-theme");

    const initialTheme: Theme =
      savedTheme === "light" ||
      savedTheme === "dark" ||
      savedTheme === "system"
        ? savedTheme
        : "system";

    applyTheme(initialTheme);
    const frameId = requestAnimationFrame(() => {
      setTheme(initialTheme);
      setThemeReady(true);
    });

    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!themeReady) return;

    localStorage.setItem("memora-theme", theme);
    applyTheme(theme);

    if (theme !== "system") return;

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)",
    );

    function handleSystemThemeChange() {
      applyTheme("system");
    }

    mediaQuery.addEventListener(
      "change",
      handleSystemThemeChange,
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleSystemThemeChange,
      );
    };
  }, [theme, themeReady]);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setProfileLoading(true);
        setProfileError(null);

        const supabase = createSupabaseClient();

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;

        if (!user) {
          router.replace("/login");
          return;
        }

        const metadata = user.user_metadata ?? {};
        const appMetadata = user.app_metadata ?? {};

        const name =
          getMetadataString(metadata.full_name) ??
          getMetadataString(metadata.name) ??
          getMetadataString(metadata.display_name) ??
          "";

        const nextProfile: UserProfile = {
          id: user.id,
          name,
          email: user.email ?? "",
          avatarUrl:
            getMetadataString(metadata.avatar_url) ??
            getMetadataString(metadata.picture),
          provider:
            getMetadataString(appMetadata.provider) ??
            "email",
          createdAt: user.created_at ?? null,
          lastSignInAt: user.last_sign_in_at ?? null,
        };

        if (mounted) {
          setProfile(nextProfile);
          setFullName(name);
        }
      } catch (error) {
        if (mounted) {
          setProfileError(
            error instanceof Error
              ? error.message
              : "Unable to load your profile.",
          );
        }
      } finally {
        if (mounted) {
          setProfileLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [router]);

  function changeTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  async function saveProfile() {
    const name = fullName.trim();

    if (!name) {
      setProfileError("Full name is required.");
      return;
    }

    try {
      setProfileSaving(true);
      setProfileError(null);
      setProfileMessage(null);

      const supabase = createSupabaseClient();

      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          name,
        },
      });

      if (error) throw error;

      setProfile((current) =>
        current
          ? {
              ...current,
              name,
            }
          : current,
      );

      setProfileMessage("Profile updated successfully.");
      router.refresh();
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "Unable to update your profile.",
      );
    } finally {
      setProfileSaving(false);
    }
  }

  async function logout() {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      setProfileError(null);

      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      router.replace("/login");
      router.refresh();
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "Unable to log out.",
      );
      setLoggingOut(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-semibold tracking-tight">
          Settings
        </h1>

        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Manage your account and preferences.
        </p>
      </motion.div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-col gap-0.5">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActive(section.id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-[13.5px] transition ${
                active === section.id
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <section.icon className="h-4 w-4" />
              {section.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {active === "profile" && (
            <SectionCard
              title="Profile"
              description="Your real Supabase account information."
            >
              {profileLoading ? (
                <div className="flex items-center gap-2 py-8 text-[13px] text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading your profile...
                </div>
              ) : profile ? (
                <>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {profile.avatarUrl ? (
                      <Image
                        src={profile.avatarUrl}
                        alt={profile.name || "Profile"}
                        width={64}
                        height={64}
                        unoptimized
                        referrerPolicy="no-referrer"
                        className="h-16 w-16 rounded-full border border-border object-cover"
                      />
                    ) : (
                      <div className="grid h-16 w-16 place-items-center rounded-full bg-accent-soft text-lg font-semibold text-accent">
                        {getInitials(
                          profile.name,
                          profile.email,
                        )}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-semibold">
                        {profile.name || "noryX user"}
                      </div>

                      <div className="truncate text-[13px] text-muted-foreground">
                        {profile.email}
                      </div>

                      <div className="mt-1 text-[11px] capitalize text-muted-foreground">
                        Signed in with {profile.provider}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void logout()}
                      disabled={loggingOut}
                      className="rounded-full text-destructive hover:text-destructive"
                    >
                      {loggingOut ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="mr-2 h-4 w-4" />
                      )}

                      {loggingOut
                        ? "Logging out..."
                        : "Log out"}
                    </Button>
                  </div>

                  {profileError ? (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                      {profileError}
                    </div>
                  ) : null}

                  {profileMessage ? (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-700 dark:text-emerald-300">
                      <Check className="h-4 w-4" />
                      {profileMessage}
                    </div>
                  ) : null}

                  <Field
                    label="Full name"
                    value={fullName}
                    autoComplete="name"
                    onChange={(event) => {
                      setFullName(event.target.value);
                      setProfileMessage(null);
                    }}
                  />

                  <Field
                    label="Email"
                    value={profile.email}
                    disabled
                  />

                  <div className="grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-2">
                    <AccountDetail
                      label="Member since"
                      value={formatDate(profile.createdAt)}
                    />

                    <AccountDetail
                      label="Last sign in"
                      value={formatDate(
                        profile.lastSignInAt,
                      )}
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={() => void saveProfile()}
                      disabled={
                        profileSaving ||
                        !fullName.trim() ||
                        fullName.trim() === profile.name
                      }
                      className="rounded-full"
                    >
                      {profileSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}

                      {profileSaving
                        ? "Saving..."
                        : "Save changes"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-3 text-[12px] text-destructive">
                  {profileError ??
                    "Unable to load your profile."}
                </div>
              )}
            </SectionCard>
          )}

          {active === "appearance" && (
            <SectionCard
              title="Appearance"
              description="Choose how noryX looks on this device."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                {(["light", "dark", "system"] as const).map(
                  (option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => changeTheme(option)}
                      aria-pressed={theme === option}
                      className={`rounded-2xl border p-4 text-left transition ${
                        theme === option
                          ? "border-accent ring-2 ring-accent/20"
                          : "border-border hover:border-foreground/20"
                      }`}
                    >
                      <div
                        className={`mb-3 h-20 overflow-hidden rounded-lg border ${
                          option === "dark"
                            ? "border-neutral-700 bg-neutral-950"
                            : option === "light"
                              ? "border-neutral-200 bg-white"
                              : "border-neutral-400 bg-gradient-to-r from-white via-white to-neutral-950"
                        }`}
                      >
                        <div
                          className={`mx-2 mt-2 h-2 w-1/2 rounded ${
                            option === "dark"
                              ? "bg-neutral-700"
                              : "bg-neutral-200"
                          }`}
                        />

                        <div
                          className={`mx-2 mt-2 h-8 rounded ${
                            option === "dark"
                              ? "bg-neutral-800"
                              : option === "light"
                                ? "bg-neutral-100"
                                : "bg-white/60"
                          }`}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium capitalize">
                          {option}
                        </span>

                        {theme === option ? (
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {option === "light"
                          ? "Always use light mode"
                          : option === "dark"
                            ? "Always use dark mode"
                            : "Match your device settings"}
                      </p>
                    </button>
                  ),
                )}
              </div>

              <p className="text-[12px] text-muted-foreground">
                Your selection is saved only on this device.
              </p>
            </SectionCard>
          )}

          {active === "notifications" && (
            <SectionCard
              title="Notifications"
              description="Choose when noryX reaches out."
            >
              {[
                {
                  label: "Weekly digest",
                  description: "Every Sunday at 9am",
                },
                {
                  label: "New AI insights",
                  description:
                    "When your library reveals something new",
                },
                {
                  label: "Product updates",
                  description:
                    "Occasional emails about new features",
                },
              ].map((notification) => (
                <div
                  key={notification.label}
                  className="flex items-center justify-between gap-4 border-t border-border pt-4 first:border-t-0 first:pt-0"
                >
                  <div>
                    <div className="text-[13.5px] font-medium">
                      {notification.label}
                    </div>

                    <div className="text-[12px] text-muted-foreground">
                      {notification.description}
                    </div>
                  </div>

                  <Switch defaultChecked />
                </div>
              ))}
            </SectionCard>
          )}

          {active === "security" && (
            <SectionCard
              title="Security"
              description="Protect your account and library."
            >
              <div className="rounded-xl border border-border bg-background p-4">
                <div className="text-[13.5px] font-medium">
                  Authentication provider
                </div>

                <div className="mt-1 text-[12px] capitalize text-muted-foreground">
                  {profile
                    ? `Signed in with ${profile.provider}`
                    : "Loading..."}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                <div>
                  <div className="text-[13.5px] font-medium">
                    Two-factor authentication
                  </div>

                  <div className="text-[12px] text-muted-foreground">
                    Require a code on every sign-in.
                  </div>
                </div>

                <Switch />
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                <div>
                  <div className="text-[13.5px] font-medium">
                    Current session
                  </div>

                  <div className="text-[12px] text-muted-foreground">
                    Log out from this browser.
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void logout()}
                  disabled={loggingOut}
                  className="rounded-full"
                >
                  {loggingOut
                    ? "Logging out..."
                    : "Log out"}
                </Button>
              </div>
            </SectionCard>
          )}

          {active === "danger" && (
            <SectionCard
              title="Danger zone"
              description="Sensitive and irreversible actions."
            >
              <div className="flex flex-col gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[13.5px] font-medium text-destructive">
                    Delete account
                  </div>

                  <div className="text-[12px] text-muted-foreground">
                    Erase your library and personal data.
                  </div>
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  disabled
                  className="rounded-full"
                  title="Account deletion is not implemented yet"
                >
                  Delete
                </Button>
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[13.5px] font-medium">
                    Export data
                  </div>

                  <div className="text-[12px] text-muted-foreground">
                    Download a JSON of your entire library.
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  disabled
                  className="rounded-full"
                  title="Data export is not implemented yet"
                >
                  Export
                </Button>
              </div>
            </SectionCard>
          )}

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-gradient-to-br from-accent-soft to-surface p-5">
            <Sparkles className="h-5 w-5 text-accent" />

            <div className="flex-1">
              <div className="text-[13.5px] font-semibold">
                You&apos;re on Free
              </div>

              <div className="text-[12px] text-muted-foreground">
                Upgrade for unlimited captures and deeper AI.
              </div>
            </div>

            <Button type="button" className="rounded-full">
              Upgrade
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-surface p-6"
    >
      <h2 className="text-base font-semibold tracking-tight">
        {title}
      </h2>

      <p className="mt-0.5 text-[13px] text-muted-foreground">
        {description}
      </p>

      <div className="mt-5 flex flex-col gap-4">
        {children}
      </div>
    </motion.section>
  );
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">
        {label}
      </div>

      <input
        {...props}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[13.5px] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground focus:border-foreground/20 focus:outline-none"
      />
    </label>
  );
}

function AccountDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>

      <div className="mt-1 text-[13px] font-medium">
        {value}
      </div>
    </div>
  );
}
