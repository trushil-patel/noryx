"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Search,
  Bookmark,
  Play,
  Hash,
  Users,
  Camera,
  MessageCircle,
  FileText,
  Rss,
  Command,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";

const platforms = [
  { icon: Play, name: "YouTube" },
  { icon: Hash, name: "X" },
  { icon: Users, name: "LinkedIn" },
  { icon: Camera, name: "Instagram" },
  { icon: MessageCircle, name: "Reddit" },
  { icon: FileText, name: "Articles" },
  { icon: Rss, name: "Blogs" },
];

const features = [
  {
    icon: Sparkles,
    title: "AI that actually reads.",
    desc: "Titles, summaries, key takeaways and 'why it matters' — generated the moment you save a link.",
  },
  {
    icon: Search,
    title: "Natural language search.",
    desc: "Ask 'the YouTube video about startup marketing' and get it — no folders, no tags to memorize.",
  },
  {
    icon: Bookmark,
    title: "Everything, in one place.",
    desc: "YouTube. X. LinkedIn. Reddit. Blogs. noryX unifies every source into a single, searchable brain.",
  },
  {
    icon: Command,
    title: "Keyboard-first.",
    desc: "Capture from any tab with ⌘⇧S. Open your library and query it in one keystroke — ⌘K.",
  },
];

const steps = [
  { n: "01", title: "Paste any link", desc: "From YouTube, X, LinkedIn, Reddit, or the open web." },
  { n: "02", title: "AI reads it for you", desc: "Summary, takeaways, tags — in under 8 seconds." },
  { n: "03", title: "Search it later", desc: "Just ask. noryX finds it, even months later." },
];

const faqs = [
  {
    q: "Which sites work with noryX?",
    a: "YouTube, X, LinkedIn, Reddit, Instagram, plus any blog or article on the open web. Native apps are on the way.",
  },
  {
    q: "Is my data private?",
    a: "Your library is tied to your account and protected with access controls. We do not sell your personal information; saved-link content is processed by our AI provider to create the features you request.",
  },
  {
    q: "Do I need to organize anything?",
    a: "No. noryX auto-tags, auto-summarizes, and lets you search naturally. Folders are optional.",
  },
  {
    q: "How is this different from a bookmark manager?",
    a: "Bookmarks store links. noryX understands them — so you can actually find and reuse what you save.",
  },
  {
    q: "Can I use noryX with a team?",
    a: "Team workspaces are on the roadmap. Join the waitlist to get early access.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="hidden items-center gap-7 text-[13px] text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden text-[13px] text-muted-foreground hover:text-foreground sm:inline">
              Sign in
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:opacity-90"
            >
              Get started <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-40 radial-fade pointer-events-none" />
        <div className="relative mx-auto max-w-5xl px-5 pb-16 pt-20 text-center sm:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[11.5px] font-medium text-muted-foreground shadow-elegant"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            New — noryX AI 2.0 is here
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.6 }}
            className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-6xl md:text-7xl"
          >
            Never lose a great <br className="hidden sm:block" />
            <span className="relative">
              idea again.
              <motion.svg
                viewBox="0 0 300 12"
                className="absolute -bottom-2 left-0 h-3 w-full"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.6 }}
              >
                <motion.path
                  d="M2 8 C 80 2, 220 2, 298 8"
                  stroke="oklch(0.52 0.22 275)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </motion.svg>
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="mx-auto mt-6 max-w-2xl text-[15.5px] leading-relaxed text-muted-foreground"
          >
            noryX is your AI-powered personal knowledge OS. Save links from anywhere — YouTube, X,
            LinkedIn, Reddit, blogs — and noryX summarizes, tags and remembers everything for you.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-medium text-primary-foreground hover:opacity-90"
            >
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="#how"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-5 py-2.5 text-[13.5px] font-medium hover:border-foreground/20"
            >
              See how it works
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-5 flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground"
          >
            <div className="flex -space-x-1.5">
              {[275, 200, 145, 30].map((h, i) => (
                <div
                  key={i}
                  className="h-5 w-5 rounded-full border-2 border-background"
                  style={{ background: `oklch(0.7 0.16 ${h})` }}
                />
              ))}
            </div>
            Loved by 12,000+ curious minds
          </motion.div>

          {/* Hero product preview */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto mt-16 max-w-4xl"
          >
            <div className="rounded-3xl border border-border bg-surface p-2 shadow-float">
              <div className="rounded-2xl border border-border bg-background p-6 text-left">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                  <div className="ml-3 flex flex-1 items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[12px] text-muted-foreground">
                    <Search className="h-3 w-3" />
                    Show me the YouTube video about startup marketing
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[0, 1].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="rounded-xl border border-border bg-surface p-4"
                    >
                      <div
                        className="mb-3 h-16 rounded-lg"
                        style={{
                          background: `linear-gradient(135deg, oklch(0.95 0.05 ${275 + i * 50}), oklch(0.85 0.12 ${275 + i * 50}))`,
                        }}
                      />
                      <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                        <Play className="h-3 w-3 text-red-500" />
                        First Round Capital · 2h ago
                      </div>
                      <div className="mt-1.5 text-[13px] font-semibold leading-snug">
                        {i === 0
                          ? "How the best startups nail early distribution"
                          : "The distribution playbook for seed-stage founders"}
                      </div>
                      <div className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">
                        Modern founders earn distribution before product-market fit — the wedge, the channel, and the 90-day rule.
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Platform logos */}
          <div className="mx-auto mt-12 max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Works everywhere you already read
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-muted-foreground">
              {platforms.map((p) => (
                <div key={p.name} className="flex items-center gap-1.5 text-[12.5px]">
                  <p.icon className="h-4 w-4" /> {p.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-accent">Features</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-balance">
            Built for the way you actually learn.
          </h2>
          <p className="mt-3 text-[14.5px] text-muted-foreground">
            noryX replaces bookmarks, read-it-later apps and notes — with something smarter.
          </p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-3xl border border-border bg-surface p-7 transition hover:shadow-elegant"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent transition-transform group-hover:scale-105">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-accent">How it works</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Three steps. Zero busywork.</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-3xl border border-border bg-background p-7"
              >
                <div className="font-mono text-[12px] font-medium text-muted-foreground">{s.n}</div>
                <h3 className="mt-3 text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-24">
        <div className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-accent">FAQ</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">Questions, answered.</h2>
        </div>
        <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-surface">
          {faqs.map((f, i) => (
            <details key={i} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[14px] font-medium">
                {f.q}
                <span className="grid h-6 w-6 place-items-center rounded-full border border-border text-muted-foreground transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-5 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-12 text-center text-primary-foreground">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, oklch(0.65 0.2 275) 0%, transparent 50%), radial-gradient(circle at 80% 80%, oklch(0.65 0.18 200) 0%, transparent 50%)",
            }}
          />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Your ideas deserve a smarter home.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[14.5px] text-primary-foreground/70">
              Save your first link and start building your personal knowledge library.
            </p>
            <Link
              href="/onboarding"
              className="mt-7 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-[13.5px] font-medium text-primary hover:opacity-90"
            >
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-10 sm:flex-row sm:items-center">
          <div>
            <Logo />
            <p className="mt-2 text-[12px] text-muted-foreground">
              © {new Date().getFullYear()} noryX. Made for curious minds.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <a href="#" className="hover:text-foreground">Changelog</a>
            <a href="#" className="hover:text-foreground">Twitter</a>
            <a href="mailto:trushilpatel27123@gmail.com" className="hover:text-foreground">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
