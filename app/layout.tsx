import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./ui-extra.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Effects from "@/components/Effects";
import Background from "@/components/Background";
import Intro from "@/components/Intro";
import PageProgress from "@/components/PageProgress";

const sans = Geist({ variable: "--font-body", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Netkathir Technologies — AI-First Software Company",
  description:
    "AI-first software company delivering real-world solutions: AI & GenAI, enterprise software, cloud & DevOps, and digital transformation. ISO 27001 certified.",
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body suppressHydrationWarning>
        <Intro />
        <Background />
        <Effects />
        <PageProgress />
        <Nav />
        <main id="main" className="relative z-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
