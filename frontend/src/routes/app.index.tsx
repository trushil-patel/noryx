import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  BookmarkCheck,
  Sparkles,
  TrendingUp,
  Zap,
  ArrowUpRight,
  Bookmark,
  Tag,
  Link as LinkIcon,
  Search,
} from "lucide-react";
import { KnowledgeCard } from "@/components/dashboard/knowledge-card";
import { knowledgeItems, activityFeed } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/")({
  component: LibraryPage,
});

const stats = [
  { label: "Saved this week", value: "48", trend: "+22%", icon: BookmarkCheck },
  { label: "AI summaries", value: "312", trend: "+18%", icon: Sparkles },
  { label: "Insights extracted", value: "1,204", trend: "+9%", icon: TrendingUp },
  { label: "Learning streak", value: "14d", trend: "New PR", icon: Zap },
];

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  bookmark: Bookmark,
  tag: Tag,
  link: LinkIcon,
  search: Search,
};

function LibraryPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <p className="text-[13px] text-muted-foreground">Welcome back, Sam</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance">
            Your knowledge, organized.
          </h1>
        </div>
        <Link to="/app/capture">
          <Button className="rounded-full">
            <Sparkles className="h-4 w-4" /> Capture new link
          </Button>
        </Link>
      </motion.div>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.3 }}
            className="rounded-2xl border border-border bg-surface p-4"
          >
            <div className="flex items-center justify-between">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-accent">
                <s.icon className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-medium text-emerald-600">{s.trend}</span>
            </div>
            <div className="mt-4 text-2xl font-semibold tracking-tight">{s.value}</div>
            <div className="text-[12px] text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Recent knowledge</h2>
              <p className="text-[13px] text-muted-foreground">
                Automatically summarized by Memora AI
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1 text-[12px]">
              {["All", "YouTube", "X", "Articles"].map((f, i) => (
                <button
                  key={f}
                  className={`rounded-full px-3 py-1 transition ${i === 0 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {knowledgeItems.map((item, i) => (
              <KnowledgeCard key={item.id} item={item} index={i} />
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold tracking-tight">Quick actions</h3>
            <div className="mt-3 flex flex-col gap-1.5">
              {[
                { label: "Capture from clipboard", icon: LinkIcon, to: "/app/capture" },
                { label: "Ask your library", icon: Sparkles, to: "/app/search" },
                { label: "Weekly digest", icon: TrendingUp, to: "/app/insights" },
              ].map((a) => (
                <Link
                  key={a.label}
                  to={a.to}
                  className="group flex items-center gap-3 rounded-lg p-2.5 text-[13px] hover:bg-muted"
                >
                  <a.icon className="h-4 w-4 text-muted-foreground group-hover:text-accent" />
                  <span className="flex-1">{a.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold tracking-tight">Recent activity</h3>
            <ol className="mt-4 space-y-4">
              {activityFeed.map((a, i) => {
                const Icon = activityIcons[a.icon];
                return (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug">{a.text}</p>
                      <p className="text-[11px] text-muted-foreground">{a.time}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="rounded-2xl border border-border bg-gradient-to-br from-accent-soft to-surface p-5">
            <Sparkles className="h-5 w-5 text-accent" />
            <h3 className="mt-3 text-sm font-semibold tracking-tight">Memora Pro</h3>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Unlimited captures, deep insights, and priority AI. Free for 14 days.
            </p>
            <Button size="sm" className="mt-4 w-full rounded-full">
              Upgrade
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
