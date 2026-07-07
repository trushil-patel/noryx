import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { Link2, Sparkles, ClipboardCheck, ArrowRight, Youtube, Twitter, Linkedin, FileText, Rss, MessageCircle, Instagram } from "lucide-react";

export const Route = createFileRoute("/app/capture")({
  component: CapturePage,
});

const supported = [
  { icon: Youtube, label: "YouTube" },
  { icon: Twitter, label: "X" },
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Instagram, label: "Instagram" },
  { icon: MessageCircle, label: "Reddit" },
  { icon: FileText, label: "Articles" },
  { icon: Rss, label: "Blogs" },
];

function CapturePage() {
  const [url, setUrl] = useState("");
  const navigate = useNavigate();

  const analyze = () => {
    if (!url.trim()) return;
    navigate({ to: "/app/processing" });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-14 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Sparkles className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-center text-3xl font-semibold tracking-tight text-balance">
          Capture a new idea.
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-center text-[14px] text-muted-foreground">
          Paste a link from anywhere. Memora AI will read it, summarize it, tag it and file it
          away — usually in under 8 seconds.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-10 rounded-3xl border border-border bg-surface p-6 shadow-elegant"
      >
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Paste URL
        </label>
        <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 focus-within:border-foreground/20">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=…"
            className="flex-1 bg-transparent text-[14px] focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && analyze()}
          />
          <button
            onClick={() => navigator.clipboard?.readText().then(setUrl).catch(() => {})}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[11.5px] text-muted-foreground hover:text-foreground"
          >
            <ClipboardCheck className="h-3 w-3" /> Paste
          </button>
        </div>

        <button
          onClick={analyze}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-[14px] font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          disabled={!url.trim()}
        >
          <Sparkles className="h-4 w-4" /> Analyze with AI <ArrowRight className="h-4 w-4" />
        </button>

        <div className="mt-6 border-t border-border pt-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Works with
          </p>
          <div className="flex flex-wrap gap-2">
            {supported.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[12px] text-muted-foreground"
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-6 text-center text-[12px] text-muted-foreground"
      >
        Tip: install the Memora extension to capture with <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px]">⌘⇧S</kbd> from any tab.
      </motion.div>
    </div>
  );
}
