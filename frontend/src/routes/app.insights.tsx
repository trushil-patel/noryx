import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Flame, Sparkles, TrendingUp } from "lucide-react";
import { monthlyGrowth, platformBreakdown, weeklyGrowth } from "@/lib/mock-data";

export const Route = createFileRoute("/app/insights")({
  component: InsightsPage,
});

const categories = [
  { name: "AI & ML", pct: 34 },
  { name: "Startups", pct: 22 },
  { name: "Design", pct: 16 },
  { name: "Engineering", pct: 14 },
  { name: "Leadership", pct: 8 },
  { name: "Other", pct: 6 },
];

function InsightsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-semibold tracking-tight">Insights</h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          The shape of your curiosity, month by month.
        </p>
      </motion.div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { label: "Total items", value: "482", sub: "+64 this month", icon: Sparkles },
          { label: "Learning streak", value: "14 days", sub: "New personal best", icon: Flame },
          { label: "Avg. items/week", value: "34", sub: "+12% vs last month", icon: TrendingUp },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent">
                <s.icon className="h-4 w-4" />
              </div>
              <span className="text-[13px] text-muted-foreground">{s.label}</span>
            </div>
            <div className="mt-4 text-3xl font-semibold tracking-tight">{s.value}</div>
            <div className="mt-1 text-[12px] text-emerald-600">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Knowledge growth</h2>
              <p className="text-[12px] text-muted-foreground">Items saved per month</p>
            </div>
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
              This year
            </span>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyGrowth}>
                <defs>
                  <linearGradient id="growth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.52 0.22 275)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="oklch(0.52 0.22 275)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.92 0.005 260)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "oklch(0.55 0.02 260)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.55 0.02 260)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid oklch(0.92 0.005 260)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="items" stroke="oklch(0.52 0.22 275)" strokeWidth={2} fill="url(#growth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold tracking-tight">Platform breakdown</h2>
          <p className="text-[12px] text-muted-foreground">Where your ideas come from</p>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={platformBreakdown} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={2}>
                  {platformBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5">
            {platformBreakdown.map((p) => (
              <li key={p.name} className="flex items-center gap-2 text-[12px]">
                <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                <span className="flex-1">{p.name}</span>
                <span className="text-muted-foreground">{p.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold tracking-tight">Weekly activity</h2>
          <p className="text-[12px] text-muted-foreground">Items saved this week</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyGrowth}>
                <CartesianGrid stroke="oklch(0.92 0.005 260)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "oklch(0.55 0.02 260)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.55 0.02 260)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="saved" fill="oklch(0.21 0.03 264)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold tracking-tight">Top categories</h2>
          <ul className="mt-4 space-y-3">
            {categories.map((c) => (
              <li key={c.name}>
                <div className="mb-1 flex items-center justify-between text-[12.5px]">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">{c.pct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.pct * 2.5}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full bg-accent"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
