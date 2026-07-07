import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { CommandPalette } from "@/components/search/command-palette";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const [cmdOpen, setCmdOpen] = useState(false);
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav onOpenSearch={() => setCmdOpen(true)} />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 20 }}
        className="fixed bottom-6 right-6 z-40 lg:hidden"
      >
        <Link
          to="/app/capture"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-float hover:scale-105 transition-transform"
          aria-label="Capture"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </motion.div>
    </div>
  );
}
