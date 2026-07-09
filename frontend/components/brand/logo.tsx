import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 group", className)}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-elegant transition-transform group-hover:scale-105">
        <span className="text-[15px] font-semibold tracking-tight">M</span>
        <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
      </span>
      {showWordmark && (
        <span className="text-[17px] font-semibold tracking-tight text-foreground">Memora</span>
      )}
    </Link>
  );
}