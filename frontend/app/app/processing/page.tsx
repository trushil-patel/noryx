"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Sparkles, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

const steps = [
  { label: "Uploading link", detail: "Securing connection" },
  { label: "Reading webpage", detail: "Fetching content and metadata" },
  { label: "Extracting content", detail: "Parsing text, video transcripts and structure" },
  { label: "Understanding context", detail: "Building semantic understanding" },
  { label: "Generating summary", detail: "Distilling into a 3-sentence overview" },
  { label: "Generating tags", detail: "Auto-categorizing across your library" },
  { label: "Done", detail: "Saved to your library" },
];

export default function ProcessingPage() {
  const [current, setCurrent] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (current >= steps.length - 1) {
      const t = setTimeout(() => router.push("/app"), 1600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCurrent((c) => c + 1), 900);
    return () => clearTimeout(t);
  }, [current, router]);

  const progress = ((current + 1) / steps.length) * 100;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-3xl flex-col items-center px-4 pb-16 pt-14 lg:px-8">
      {/* Ambient glow */}
      <div className="relative mb-8 h-40 w-40">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, oklch(0.7 0.22 275 / 0.35), transparent 70%)",
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-6 rounded-full border border-accent/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-10 rounded-full border border-accent/50"
          animate={{ rotate: -360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 grid place-items-center">
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-float"
          >
            <Sparkles className="h-6 w-6" />
          </motion.div>
        </div>
        {/* Particles */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-accent"
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{
              x: Math.cos((i / 8) * Math.PI * 2) * 70,
              y: Math.sin((i / 8) * Math.PI * 2) * 70,
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.h1
          key={current}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          {steps[current].label}
        </motion.h1>
      </AnimatePresence>
      <p className="mt-2 text-[13.5px] text-muted-foreground">{steps[current].detail}</p>

      <div className="mt-8 h-1 w-full max-w-md overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <ol className="mt-10 w-full max-w-md space-y-3">
        {steps.map((s, i) => {
          const state = i < current ? "done" : i === current ? "active" : "pending";
          return (
            <motion.li
              key={s.label}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[13.5px] transition",
                state === "done" && "border-emerald-100 bg-emerald-50/50",
                state === "active" && "border-accent/20 bg-accent-soft",
                state === "pending" && "border-border bg-surface text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-full",
                  state === "done" && "bg-emerald-500 text-white",
                  state === "active" && "bg-accent text-accent-foreground",
                  state === "pending" && "border border-border bg-background",
                )}
              >
                {state === "done" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : state === "active" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className="text-[10px]">{i + 1}</span>
                )}
              </span>
              <span className={cn(state !== "pending" && "text-foreground font-medium")}>
                {s.label}
              </span>
            </motion.li>
          );
        })}
      </ol>

      {current >= steps.length - 1 && (
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => router.push("/app")}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-medium text-primary-foreground hover:opacity-90"
        >
          Open in library <ArrowRight className="h-4 w-4" />
        </motion.button>
      )}
    </div>
  );
}