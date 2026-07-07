import { platformMeta, type Platform } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Youtube, Linkedin, Instagram, MessageCircle, FileText, Rss, Twitter } from "lucide-react";

const icons: Record<Platform, React.ComponentType<{ className?: string }>> = {
  youtube: Youtube,
  linkedin: Linkedin,
  instagram: Instagram,
  reddit: MessageCircle,
  twitter: Twitter,
  article: FileText,
  blog: Rss,
};

export function PlatformBadge({ platform, className }: { platform: Platform; className?: string }) {
  const meta = platformMeta[platform];
  const Icon = icons[platform];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        meta.color,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}
