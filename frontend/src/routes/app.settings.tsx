import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { AlertTriangle, User, Palette, Bell, Shield, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "danger", label: "Danger zone", icon: AlertTriangle },
];

function SettingsPage() {
  const [active, setActive] = useState("profile");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">Manage your account and preferences.</p>
      </motion.div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-col gap-0.5">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-[13.5px] transition ${
                active === s.id ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {active === "profile" && (
            <SectionCard title="Profile" description="This information will appear on your account.">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-accent-soft text-lg font-semibold text-accent">
                  SW
                </div>
                <Button variant="outline" className="rounded-full">Change photo</Button>
              </div>
              <Field label="Full name" defaultValue="Sam Weller" />
              <Field label="Email" defaultValue="sam@memora.app" />
              <Field label="Handle" defaultValue="@sam" />
              <div className="pt-2"><Button className="rounded-full">Save changes</Button></div>
            </SectionCard>
          )}

          {active === "appearance" && (
            <SectionCard title="Appearance" description="How Memora looks on this device.">
              <div className="grid gap-3 sm:grid-cols-3">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      theme === t ? "border-accent ring-2 ring-accent/20" : "border-border hover:border-foreground/20"
                    }`}
                  >
                    <div className={`mb-3 h-16 rounded-lg border ${t === "dark" ? "bg-neutral-900" : t === "light" ? "bg-white" : "bg-gradient-to-r from-white to-neutral-900"}`} />
                    <div className="text-[13px] font-medium capitalize">{t}</div>
                  </button>
                ))}
              </div>
            </SectionCard>
          )}

          {active === "notifications" && (
            <SectionCard title="Notifications" description="Choose when Memora reaches out.">
              {[
                { label: "Weekly digest", desc: "Every Sunday at 9am" },
                { label: "New AI insights", desc: "When your library reveals something new" },
                { label: "Product updates", desc: "Occasional emails about new features" },
              ].map((n) => (
                <div key={n.label} className="flex items-center justify-between border-t border-border pt-4 first:border-t-0 first:pt-0">
                  <div>
                    <div className="text-[13.5px] font-medium">{n.label}</div>
                    <div className="text-[12px] text-muted-foreground">{n.desc}</div>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </SectionCard>
          )}

          {active === "security" && (
            <SectionCard title="Security" description="Protect your account and library.">
              <Field label="Change password" placeholder="New password" type="password" />
              <div className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <div className="text-[13.5px] font-medium">Two-factor authentication</div>
                  <div className="text-[12px] text-muted-foreground">Require a code on every sign-in.</div>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <div className="text-[13.5px] font-medium">Active sessions</div>
                  <div className="text-[12px] text-muted-foreground">2 devices signed in.</div>
                </div>
                <Button variant="outline" className="rounded-full">Sign out others</Button>
              </div>
            </SectionCard>
          )}

          {active === "danger" && (
            <SectionCard title="Danger zone" description="Irreversible actions.">
              <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <div>
                  <div className="text-[13.5px] font-medium text-destructive">Delete account</div>
                  <div className="text-[12px] text-muted-foreground">Erase your library and personal data.</div>
                </div>
                <Button variant="destructive" className="rounded-full">Delete</Button>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <div className="text-[13.5px] font-medium">Export data</div>
                  <div className="text-[12px] text-muted-foreground">Download a JSON of your entire library.</div>
                </div>
                <Button variant="outline" className="rounded-full">Export</Button>
              </div>
            </SectionCard>
          )}

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-gradient-to-br from-accent-soft to-surface p-5">
            <Sparkles className="h-5 w-5 text-accent" />
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold">You're on Free</div>
              <div className="text-[12px] text-muted-foreground">Upgrade for unlimited captures and deeper AI.</div>
            </div>
            <Button className="rounded-full">Upgrade</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-surface p-6"
    >
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </motion.section>
  );
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">{label}</div>
      <input
        {...props}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[13.5px] focus:border-foreground/20 focus:outline-none"
      />
    </label>
  );
}
