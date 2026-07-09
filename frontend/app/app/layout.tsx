"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { CommandPalette } from "@/components/search/command-palette";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav onOpenSearch={() => setCmdOpen(true)} />
        <main className="flex-1">{children}</main>
      </div>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 20 }}
        className="fixed bottom-6 right-6 z-40 lg:hidden"
      >
        <Link
          href="/app/capture"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-float hover:scale-105 transition-transform"
          aria-label="Capture"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </motion.div>
    </div>
  );
}