import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./ui-extra.css";
import "./fresh.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Effects from "@/components/Effects";
import Background from "@/components/Background";
import Intro from "@/components/Intro";
import PageProgress from "@/components/PageProgress";
import SiteOnly from "@/components/SiteOnly";
import ChatWidget from "@/components/ChatWidget";
import Analytics from "@/components/Analytics";

const sans = Geist({ variable: "--font-body", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Netkathir Technologies — AI-First Software Company",
  description:
    "AI-first software company delivering real-world solutions: AI & GenAI, enterprise software, cloud & DevOps, and digital transformation. ISO 27001 certified.",
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
  // Search Console / Bing Webmaster ownership tags (rendered only when the env values are set)
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body suppressHydrationWarning>
        {/* SiteOnly reads the path (hides the site chrome on /admin); Suspense keeps dynamic routes like /blogs/[slug] streamable */}
        <Suspense fallback={null}>
          <SiteOnly>
            <Intro />
            <Background />
            <Effects />
            <PageProgress />
            <Nav />
          </SiteOnly>
        </Suspense>
        <main id="main" className="relative z-10">
          {children}
        </main>
        <Suspense fallback={null}>
          <SiteOnly>
            <Footer />
            <ChatWidget />
          </SiteOnly>
        </Suspense>
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      </body>
    </html>
  );
}
