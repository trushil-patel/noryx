"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    if (isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      const supabase = createSupabaseClient();

      const { error: loginError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
              access_type: "offline",
              prompt: "select_account",
            },
          },
        });

      if (loginError) {
        throw loginError;
      }
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to continue with Google.",
      );

      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-30 radial-fade" />

      <motion.div
        aria-hidden
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 25, 0],
          rotate: [0, 5, -3, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute left-[12%] top-[16%] h-44 w-44 rounded-[40px] bg-violet-500/10 blur-2xl"
      />

      <motion.div
        aria-hidden
        animate={{
          x: [0, -25, 18, 0],
          y: [0, 28, -15, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute bottom-[12%] right-[12%] h-52 w-52 rounded-full bg-orange-400/10 blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-md flex-col justify-center px-6 py-12">
        <motion.div
          initial={{
            opacity: 0,
            y: -8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mb-10 flex justify-center"
        >
          <Logo />
        </motion.div>

        <motion.div
          initial={{
            opacity: 0,
            y: 16,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative overflow-hidden rounded-[32px] border border-border bg-surface p-8 shadow-elegant"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent">
              <Sparkles className="h-5 w-5" />
            </div>

            <div className="mt-5 text-center">
              <h1 className="text-2xl font-semibold tracking-[-0.03em]">
                Welcome to noryX
              </h1>

              <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-muted-foreground">
                Sign in with Google to access your private AI
                memory.
              </p>
            </div>

            {error ? (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-[12px] text-destructive"
              >
                {error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleGoogleLogin()}
              disabled={isLoading}
              className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-[13.5px] font-medium transition hover:border-foreground/20 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}

              {isLoading
                ? "Connecting to Google..."
                : "Continue with Google"}
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure authentication powered by Google
            </div>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-[11.5px] leading-relaxed text-muted-foreground">
          By continuing, you agree to noryX&apos;s{" "}
          <Link
            href="/terms"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2c-.3 1.4-1.1 2.5-2.4 3.3v2.7h3.9c2.3-2.1 3.3-5.1 3.3-8.2z"
      />

      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.3 21.4 7.3 24 12 24z"
      />

      <path
        fill="#FBBC05"
        d="M5.4 14.4c-.2-.7-.4-1.4-.4-2.4s.1-1.7.4-2.4V6.5H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.5l4-3.1z"
      />

      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.5-3.5C17.9 1.2 15.2 0 12 0 7.3 0 3.3 2.6 1.4 6.5l4 3.1C6.3 6.8 8.9 4.8 12 4.8z"
      />
    </svg>
  );
}
