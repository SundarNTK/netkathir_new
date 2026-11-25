"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/data";

type Cta = { line: string; label: string; href: string };

const CTAS: Record<string, Cta> = {
  "/": { line: "Let's build your next intelligent solution.", label: "Get Started Now", href: "/contact#contact-form" },
  "/services": { line: "Tell us what you want to automate.", label: "Talk to our engineers", href: "/contact#contact-form" },
  "/products": { line: "See Garage Bill and HRMS in action.", label: "Request a demo", href: "/contact#contact-form" },
  "/projects": { line: "Your project could be next.", label: "Start a project", href: "/contact#contact-form" },
  "/blogs": { line: "Have a topic you want us to cover?", label: "Suggest a topic", href: "/contact#contact-form" },
  "/about": { line: "Work with the team behind Netkathir.", label: "Get in touch", href: "/contact#contact-form" },
  "/contact": { line: "We would love to hear from you.", label: SITE.email, href: `mailto:${SITE.email}` },
};

/** The footer's headline and button change with the page you are on. */
export default function FooterCta() {
  const path = usePathname();
  const c = CTAS[path] ?? CTAS["/"];
  const external = c.href.startsWith("mailto:");
  return (
    <>
      <p className="font-display text-[clamp(1.8rem,4.4vw,3.8rem)] leading-[1] text-grad-night max-w-5xl">{c.line}</p>
      {external ? (
        <a href={c.href} className="btn btn-solid mt-10">
          {c.label} →
        </a>
      ) : (
        <Link href={c.href} className="btn btn-solid mt-10">
          {c.label} →
        </Link>
      )}
    </>
  );
}
