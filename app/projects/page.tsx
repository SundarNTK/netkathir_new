import PageHero from "@/components/PageHero";
import { CLIENTS, IMAGES } from "@/lib/data";

export const metadata = { title: "Projects — Netkathir Technologies" };

const CASES: Record<string, string> = {
  HEB: "Concurrent booking system — 1,000+ bookings for firewalking events.",
  APPGM: "Malaysia impact portal — project management for social programmes.",
  WhyScience: "Online education platform for curious learners.",
};

export default function Projects() {
  return (
    <>
      <PageHero
        kicker="Projects"
        title="Transforming Ideas into Intelligent Solutions."
        image={IMAGES.heroes.projects}
      />
      <section className="pb-32">
        <div className="mx-auto max-w-7xl px-6">
          <ul className="border-t border-ink/10">
            {CLIENTS.map((c, i) => (
              <li
                key={c.name}
                data-reveal
                data-hover
                className="group relative border-b border-ink/10 py-6 md:py-8 flex items-center justify-between gap-6 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-glow/25 via-cyan/15 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out" />
                <span className="relative font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span className="relative hidden sm:flex h-16 w-28 shrink-0 items-center justify-center rounded-xl bg-white px-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.logo} alt="" className="max-h-12 w-full object-contain" />
                </span>
                <h2 className="relative flex-1 font-display text-[clamp(1.6rem,4.5vw,4.2rem)] leading-none group-hover:translate-x-4 transition-transform duration-500">
                  {c.name}
                </h2>
                <span className="relative hidden md:block max-w-xs text-sm text-muted text-right">
                  {CASES[c.name] ?? "Delivered by Netkathir"}
                </span>
                <span className="relative text-3xl text-gold group-hover:rotate-45 transition-transform duration-500">↗</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
