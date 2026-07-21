"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, ArrowLeft } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { interests } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const totalSteps = 3;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const router = useRouter();

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const next = () => {
    if (step < totalSteps - 1) setStep((s) => s + 1);
    else router.push("/app");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <Logo />
        <Link href="/app" className="text-[12.5px] text-muted-foreground hover:text-foreground">
          Skip
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-12">
        {/* Progress */}
        <div className="mb-10 flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 1, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Let&apos;s get you set up.
              </h1>
              <p className="mt-3 text-[14.5px] text-muted-foreground">
                A few quick questions so noryX feels like it was made for you.
              </p>
              <label className="mt-8 block">
                <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">
                  What should we call you?
                </div>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your first name"
                  className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[14px] focus:border-foreground/20 focus:outline-none"
                />
              </label>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="interests"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                What are you into{name ? `, ${name}` : ""}?
              </h1>
              <p className="mt-3 text-[14.5px] text-muted-foreground">
                Pick a few interests. noryX will personalize your summaries and search.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {interests.map((it, i) => {
                  const active = selected.includes(it.id);
                  return (
                    <motion.button
                      key={it.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => toggle(it.id)}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-2xl border p-3.5 text-left text-[13.5px] transition",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-surface hover:border-foreground/20",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-lg text-base",
                          active ? "bg-white/10" : "bg-muted",
                        )}
                      >
                        {it.emoji}
                      </span>
                      <span className="flex-1 font-medium">{it.label}</span>
                      {active && <Check className="h-3.5 w-3.5" />}
                    </motion.button>
                  );
                })}
              </div>
              <p className="mt-4 text-[12px] text-muted-foreground">
                {selected.length} selected · pick at least 3
              </p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="done"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
              >
                <Check className="h-7 w-7" />
              </motion.div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">You&apos;re ready.</h1>
              <p className="mt-3 text-[14.5px] text-muted-foreground">
                We&apos;ve set up your library. Start by capturing your first link — noryX will do
                the rest.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "AI-summarized", value: "Every link" },
                  { label: "Search by asking", value: "Natural language" },
                  { label: "Captures / mo", value: "100 free" },
                ].map((c) => (
                  <div key={c.label} className="rounded-xl border border-border bg-surface p-3.5">
                    <div className="text-[11px] text-muted-foreground">{c.label}</div>
                    <div className="mt-1 text-[13.5px] font-medium">{c.value}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] text-muted-foreground transition hover:text-foreground disabled:opacity-40"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <button
            onClick={next}
            disabled={step === 1 && selected.length < 3}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            {step === totalSteps - 1 ? "Enter noryX" : "Continue"}{" "}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}