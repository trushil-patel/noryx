import Image from "next/image";
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
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center transition-transform group-hover:scale-105">
        <Image
          src="/noryx-logo.png"
          alt="noryX logo"
          width={36}
          height={36}
          priority
          className="h-9 w-9 object-contain dark:invert"
        />
      </span>
      {showWordmark && (
        <span className="text-[17px] font-semibold tracking-tight text-foreground">noryX</span>
      )}
    </Link>
  );
}
