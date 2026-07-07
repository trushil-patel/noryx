import { Bell, Plus, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function TopNav({ onOpenSearch }: { onOpenSearch: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6">
      <button
        onClick={onOpenSearch}
        className="group flex flex-1 items-center gap-2.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13px] text-muted-foreground transition hover:border-foreground/20 max-w-md"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search or ask anything…</span>
        <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <Bell className="h-4 w-4" />
        </Button>
        <Link to="/app/capture">
          <Button size="sm" className="rounded-full">
            <Plus className="h-4 w-4" />
            Capture
          </Button>
        </Link>
      </div>
    </header>
  );
}
