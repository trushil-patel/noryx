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
  title: "Memora — Never lose a great idea again",
  description:
    "Memora is your AI-powered knowledge OS. Save any link from YouTube, Reddit, X, LinkedIn or the web — get instant summaries, key takeaways, and search everything in natural language.",
  authors: [{ name: "Memora" }],
  openGraph: {
    title: "Memora — Your AI knowledge OS",
    description:
      "Save links from anywhere. AI summarizes and organizes. Search naturally, remember everything.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}