export type Platform =
  | "youtube"
  | "reddit"
  | "instagram"
  | "linkedin"
  | "twitter"
  | "blog"
  | "article";

export interface KnowledgeItem {
  id: string;
  platform: Platform;
  title: string;
  source: string;
  url: string;
  author: string;
  savedAt: string;
  summary: string;
  takeaways: string[];
  whyItMatters: string;
  tags: string[];
  bookmarked?: boolean;
  readTime?: string;
  thumbnailHue?: number;
}

export const platformMeta: Record<Platform, { label: string; color: string; dot: string }> = {
  youtube: { label: "YouTube", color: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500" },
  reddit: { label: "Reddit", color: "bg-orange-50 text-orange-700 border-orange-100", dot: "bg-orange-500" },
  instagram: { label: "Instagram", color: "bg-pink-50 text-pink-700 border-pink-100", dot: "bg-pink-500" },
  linkedin: { label: "LinkedIn", color: "bg-sky-50 text-sky-700 border-sky-100", dot: "bg-sky-600" },
  twitter: { label: "X", color: "bg-neutral-100 text-neutral-800 border-neutral-200", dot: "bg-neutral-900" },
  blog: { label: "Blog", color: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  article: { label: "Article", color: "bg-indigo-50 text-indigo-700 border-indigo-100", dot: "bg-indigo-500" },
};

export const knowledgeItems: KnowledgeItem[] = [
  {
    id: "k1",
    platform: "youtube",
    title: "How the best startups nail early distribution",
    source: "youtube.com",
    url: "https://youtube.com/watch?v=abc",
    author: "First Round Capital",
    savedAt: "2 hours ago",
    readTime: "24 min watch",
    summary:
      "A walkthrough of how modern seed-stage startups earn distribution before product-market fit — including community-first launches, founder-led content and the 'one wedge, one channel' rule.",
    takeaways: [
      "Pick one distribution wedge and go deep for 90 days before adding a second.",
      "Founder-led content converts 4-6x better than brand accounts in year one.",
      "Community rituals (weekly threads, live demos) outperform paid acquisition at seed.",
    ],
    whyItMatters:
      "Distribution is now the moat. Great product without a channel dies quietly — this is the operator's playbook.",
    tags: ["startups", "distribution", "growth", "marketing"],
    thumbnailHue: 275,
  },
  {
    id: "k2",
    platform: "twitter",
    title: "A short thread on why product taste can't be delegated",
    source: "x.com",
    url: "https://x.com/naval/status/xyz",
    author: "@naval",
    savedAt: "Yesterday",
    readTime: "3 min read",
    summary:
      "Taste is the compression of 10,000 micro-decisions into instinct. It's the one part of building products you can never fully hand off — and the reason founder-led design still wins.",
    takeaways: [
      "Taste is a compounding asset, not a fixed trait.",
      "The best PMs review every pixel for the first year.",
      "Delegating taste too early is the #1 cause of drift.",
    ],
    whyItMatters:
      "Explains why the best AI-era products still feel hand-made — and what to protect as you scale.",
    tags: ["product", "design", "taste", "leadership"],
    thumbnailHue: 220,
  },
  {
    id: "k3",
    platform: "article",
    title: "The second brain is dead. Long live the intelligent brain.",
    source: "every.to",
    url: "https://every.to/napkin-math/the-second-brain-is-dead",
    author: "Dan Shipper",
    savedAt: "2 days ago",
    readTime: "9 min read",
    summary:
      "Note-taking apps promised us superhuman recall. Instead we built graveyards of unread PDFs. LLMs finally close the loop between capture and retrieval.",
    takeaways: [
      "Search > structure. Stop tagging, start querying.",
      "Capture friction beats organization complexity every time.",
      "Your knowledge base should answer questions, not just store them.",
    ],
    whyItMatters:
      "This is the thesis behind Memora — and a clean explanation of why the note-taking category is being rewritten.",
    tags: ["ai", "knowledge", "productivity", "tools"],
    thumbnailHue: 145,
  },
  {
    id: "k4",
    platform: "linkedin",
    title: "What great engineering leaders do in their first 90 days",
    source: "linkedin.com",
    url: "https://linkedin.com/pulse/abc",
    author: "Camille Fournier",
    savedAt: "3 days ago",
    readTime: "6 min read",
    summary:
      "A field-tested framework for new eng leaders: listen first, ship a small visible win in week 4, and rewrite the roadmap only after month 2.",
    takeaways: [
      "Do a listening tour — 30 people in 30 days.",
      "Ship one small, visible improvement in month one.",
      "Rewrite roadmaps in month 3, not month 1.",
    ],
    whyItMatters:
      "Concrete template for anyone stepping into a new leadership role — cuts the flailing period in half.",
    tags: ["leadership", "engineering", "management"],
    thumbnailHue: 210,
  },
  {
    id: "k5",
    platform: "reddit",
    title: "r/MachineLearning — Why RAG is winning over long context",
    source: "reddit.com",
    url: "https://reddit.com/r/MachineLearning/comments/xyz",
    author: "r/MachineLearning",
    savedAt: "4 days ago",
    readTime: "7 min read",
    summary:
      "A well-argued thread on why retrieval-augmented generation still beats million-token context windows for factual workloads — cost, latency and provenance.",
    takeaways: [
      "Long context ≠ better recall. It costs 10-40x per query.",
      "RAG gives citations; long context doesn't.",
      "Hybrid (RAG + 200k context) is the current sweet spot.",
    ],
    whyItMatters:
      "Anyone building AI features needs a defensible retrieval strategy. This thread is the shortcut.",
    tags: ["ai", "engineering", "rag", "llm"],
    thumbnailHue: 20,
  },
  {
    id: "k6",
    platform: "blog",
    title: "Writing is thinking. AI doesn't change that.",
    source: "paulgraham.com",
    url: "https://paulgraham.com/writing.html",
    author: "Paul Graham",
    savedAt: "1 week ago",
    readTime: "5 min read",
    summary:
      "The value of writing was never the artifact — it was the forced clarity. LLMs remove typing friction but not the thinking that has to happen upstream.",
    takeaways: [
      "AI can draft — but you still have to know what you think.",
      "Outlines matter more, not less, in the AI era.",
      "The 'blank page' is a feature, not a bug.",
    ],
    whyItMatters:
      "Reframes how to actually use AI tools without losing your own voice.",
    tags: ["writing", "thinking", "ai"],
    thumbnailHue: 155,
  },
  {
    id: "k7",
    platform: "instagram",
    title: "Studio tour: how Teenage Engineering prototypes",
    source: "instagram.com",
    url: "https://instagram.com/p/xyz",
    author: "@teenageengineering",
    savedAt: "1 week ago",
    readTime: "2 min",
    summary:
      "Behind-the-scenes look at how TE runs weekly hardware sprints — foam mockups on Monday, working prototype by Friday.",
    takeaways: [
      "Physical prototypes accelerate design decisions.",
      "Weekly cadence beats quarterly milestones.",
      "Constraints (materials, budget) sharpen taste.",
    ],
    whyItMatters:
      "A masterclass in industrial design velocity — transferable to software teams.",
    tags: ["design", "hardware", "process"],
    thumbnailHue: 320,
  },
  {
    id: "k8",
    platform: "article",
    title: "The interface layer is the next platform war",
    source: "stratechery.com",
    url: "https://stratechery.com/2025/interface-layer",
    author: "Ben Thompson",
    savedAt: "2 weeks ago",
    readTime: "12 min read",
    summary:
      "Analysis of why the OS is being unbundled by AI-native surfaces — command bars, voice agents, and ambient assistants — and what it means for incumbents.",
    takeaways: [
      "Interfaces, not models, will decide who wins consumer AI.",
      "Aggregators become primary UX, apps become APIs.",
      "Distribution in AI = default app placement + habit.",
    ],
    whyItMatters:
      "The single best framing of where the AI platform battle is actually being fought.",
    tags: ["strategy", "ai", "platforms"],
    thumbnailHue: 260,
  },
];

export const activityFeed = [
  { icon: "sparkles", text: "AI summarized 3 saved links", time: "2m ago" },
  { icon: "bookmark", text: "You bookmarked 'The second brain is dead'", time: "1h ago" },
  { icon: "tag", text: "Added tag 'ai' to 4 items", time: "3h ago" },
  { icon: "link", text: "Captured link from x.com", time: "Yesterday" },
  { icon: "search", text: "Searched: 'startup marketing'", time: "Yesterday" },
];

export const weeklyGrowth = [
  { day: "Mon", saved: 4 },
  { day: "Tue", saved: 7 },
  { day: "Wed", saved: 3 },
  { day: "Thu", saved: 9 },
  { day: "Fri", saved: 12 },
  { day: "Sat", saved: 5 },
  { day: "Sun", saved: 8 },
];

export const platformBreakdown = [
  { name: "YouTube", value: 34, color: "oklch(0.65 0.22 25)" },
  { name: "X", value: 22, color: "oklch(0.3 0.02 260)" },
  { name: "Articles", value: 18, color: "oklch(0.52 0.22 275)" },
  { name: "LinkedIn", value: 14, color: "oklch(0.55 0.15 240)" },
  { name: "Reddit", value: 8, color: "oklch(0.7 0.18 45)" },
  { name: "Other", value: 4, color: "oklch(0.7 0.02 260)" },
];

export const monthlyGrowth = Array.from({ length: 12 }).map((_, i) => ({
  month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
  items: Math.round(20 + i * 14 + Math.sin(i) * 10),
}));

export const interests = [
  { id: "ai", label: "AI & ML", emoji: "🧠" },
  { id: "startups", label: "Startups", emoji: "🚀" },
  { id: "design", label: "Design", emoji: "✦" },
  { id: "engineering", label: "Engineering", emoji: "⚙" },
  { id: "productivity", label: "Productivity", emoji: "◉" },
  { id: "product", label: "Product", emoji: "◆" },
  { id: "writing", label: "Writing", emoji: "✎" },
  { id: "finance", label: "Finance", emoji: "$" },
  { id: "health", label: "Health", emoji: "♡" },
  { id: "philosophy", label: "Philosophy", emoji: "◐" },
  { id: "marketing", label: "Marketing", emoji: "◈" },
  { id: "leadership", label: "Leadership", emoji: "★" },
];

export const recentSearches = [
  "YouTube video about startup marketing",
  "Notes on RAG vs long context",
  "Everything tagged 'design'",
  "Saved from Ben Thompson",
];

export const searchSuggestions = [
  "What did I save about AI agents?",
  "Show me videos from last week",
  "Anything about product taste",
  "LinkedIn posts I bookmarked",
];
