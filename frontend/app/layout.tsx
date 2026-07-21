import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "noryX — Never lose a great idea again",
  description:
    "noryX is your AI-powered knowledge OS. Save links from YouTube, Reddit, X, LinkedIn or the web — get instant summaries, key takeaways, and search everything in natural language.",
  authors: [{ name: "noryX" }],
  openGraph: {
    title: "noryX — Your AI knowledge OS",
    description:
      "Save links from anywhere. AI summarizes and organizes. Search naturally, remember everything.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/noryx-logo.png",
  },
};

const themeScript = `
(function () {
  try {
    var savedTheme = localStorage.getItem("memora-theme");
    var theme =
      savedTheme === "light" ||
      savedTheme === "dark" ||
      savedTheme === "system"
        ? savedTheme
        : "system";

    var systemIsDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    var shouldUseDark =
      theme === "dark" ||
      (theme === "system" && systemIsDark);

    document.documentElement.classList.toggle(
      "dark",
      shouldUseDark
    );

    document.documentElement.style.colorScheme =
      shouldUseDark ? "dark" : "light";
  } catch (error) {
    console.error("Unable to apply noryX theme", error);
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />
      </head>

      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
