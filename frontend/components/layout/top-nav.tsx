import Link from "next/link";
import {
  Bell,
  Menu,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export function TopNav({
  onOpenMenu,
}: {
  onOpenMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-3 backdrop-blur-md sm:px-4 lg:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onOpenMenu}
        className="h-9 w-9 rounded-full lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="text-[13px] font-semibold lg:hidden">
        Memora
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>

        <Link href="/app/capture">
          <Button
            size="sm"
            className="rounded-full"
          >
            <Plus className="h-4 w-4" />

            <span className="hidden sm:inline">
              Capture
            </span>
          </Button>
        </Link>
      </div>
    </header>
  );
}