import { Bell, Plus, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function TopNav({ onOpenSearch }: { onOpenSearch: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6">
      

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <Bell className="h-4 w-4" />
        </Button>
        <Link href="/app/capture">
          <Button size="sm" className="rounded-full">
            <Plus className="h-4 w-4" />
            Capture
          </Button>
        </Link>
      </div>
    </header>
  );
}