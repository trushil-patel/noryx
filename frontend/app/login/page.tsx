"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, } from "lucide-react";

import { Logo } from "@/components/brand/logo";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen">
      <div className="absolute inset-0 grid-pattern opacity-30 radial-fade pointer-events-none" />
      <div className="relative mx-auto flex w-full max-w-md flex-col justify-center px-6 py-12">
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>

        <motion.div
          initial={{ opacity: 1, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl border border-border bg-surface p-8 shadow-elegant"
        >
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">Sign in to your knowledge OS.</p>

          <div className="mt-6 flex flex-col gap-2">
            <button className="group flex items-center justify-center gap-2.5 rounded-xl border border-border bg-background px-4 py-2.5 text-[13.5px] font-medium transition hover:border-foreground/20">
              <GoogleIcon />
              Continue with Google
            </button>
            <button className="group flex items-center justify-center gap-2.5 rounded-xl border border-border bg-background px-4 py-2.5 text-[13.5px] font-medium transition hover:border-foreground/20">
              {/* <GitHub className="h-4 w-4" /> */}
              Continue with GitHub
            </button>
          </div>

          <div className="my-6 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            OR
            <span className="h-px flex-1 bg-border" />
          </div>

          <label className="block">
            <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">Email</div>
            <input
              type="email"
              placeholder="you@memora.app"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13.5px] focus:border-foreground/20 focus:outline-none"
            />
          </label>

          <Link
            href="/onboarding"
            className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-[13.5px] font-medium text-primary-foreground hover:opacity-90"
          >
            Continue with email <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <p className="mt-6 text-center text-[12px] text-muted-foreground">
            No account?{" "}
            <Link href="/onboarding" className="font-medium text-foreground hover:text-accent">
              Create one
            </Link>
          </p>
        </motion.div>

        <p className="mt-6 text-center text-[11.5px] text-muted-foreground">
          By continuing you agree to our{" "}
          <a href="#" className="underline underline-offset-2">Terms</a> and{" "}
          <a href="#" className="underline underline-offset-2">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2c-.3 1.4-1.1 2.5-2.4 3.3v2.7h3.9c2.3-2.1 3.3-5.1 3.3-8.2z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.3 21.4 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.4-.4-2.4s.1-1.7.4-2.4V6.5H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.5l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.5-3.5C17.9 1.2 15.2 0 12 0 7.3 0 3.3 2.6 1.4 6.5l4 3.1C6.3 6.8 8.9 4.8 12 4.8z" />
    </svg>
  );
}