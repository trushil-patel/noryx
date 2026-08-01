import React from "react";
import {
  BookOpen,
  Code2,
  FileText,
  Globe2,
  MessageCircle,
  Newspaper,
  Play,
  Rss,
} from "lucide-react";

import { platformMeta, type Platform } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const YoutubeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M23.5 6.2s-.2-1.6-.8-2.3c-.8-.9-1.7-.9-2.1-1-2.9-.2-7.2-.2-7.2-.2h-.1s-4.3 0-7.2.2c-.4.1-1.3.1-2.1 1C.7 4.6.5 6.2.5 6.2S.2 8 .2 9.8v.5c0 1.8.2 3.6.2 3.6s.2 1.6.8 2.3c.8.9 1.9.9 2.4 1 1.8.1 7.6.2 7.6.2s4.3 0 7.2-.2c.4-.1 1.3-.1 2.1-1 .6-.7.8-2.3.8-2.3s.2-1.8.2-3.6v-.5c0-1.8-.2-3.6-.2-3.6z" />
    <path d="M9.5 15.5V8.5l6 3.5-6 3.5z" fill="#fff" />
  </svg>
);

const LinkedinIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4v14h-4V8zM8.5 8h3.8v1.9h.1c.5-.9 1.8-1.9 3.7-1.9 4 0 4.7 2.6 4.7 6v8h-4v-7c0-1.7 0-3.9-2.5-3.9-2.5 0-2.9 2-2.9 3.8V22h-4V8z" />
  </svg>
);

const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 6.1A4.9 4.9 0 1016.9 13 4.9 4.9 0 0012 8.1zM18.4 6.6a1.1 1.1 0 11-1.1-1.1 1.1 1.1 0 011.1 1.1z" />
  </svg>
);

const TwitterIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M23 4.6c-.8.4-1.6.7-2.4.8a4.2 4.2 0 001.8-2.3 8.3 8.3 0 01-2.6 1 4.1 4.1 0 00-7 3.7A11.7 11.7 0 013 3.6a4.1 4.1 0 001.3 5.5c-.7 0-1.5-.2-2.1-.6v.1a4.1 4.1 0 003.3 4 4.2 4.2 0 01-1.1.1c-.3 0-.6 0-.9-.1a4.1 4.1 0 003.8 2.8A8.2 8.2 0 012 19.5 11.6 11.6 0 008.3 21c7.5 0 11.6-6.4 11.6-12v-.5A8.3 8.3 0 0023 4.6z" />
  </svg>
);

const icons: Record<Platform, React.ComponentType<{ className?: string }>> = {
  youtube: YoutubeIcon,
  linkedin: LinkedinIcon,
  instagram: InstagramIcon,
  reddit: MessageCircle,
  twitter: TwitterIcon,
  repository: Code2,
  documentation: BookOpen,
  news: Newspaper,
  forum: MessageCircle,
  video: Play,
  website: Globe2,
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
