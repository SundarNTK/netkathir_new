import Link from "next/link";
import PageHero from "@/components/PageHero";
import { SERVICE_GROUPS } from "@/lib/data";

export const metadata = { title: "Services — Netkathir Technologies" };

const TONES = [
  { bg: "#ffffff", dark: false, accent: "#15803d" },
  { bg: "#ecfccb", dark: false, accent: "#4d7c0f" },
  { bg: "#fef3c7", dark: false, accent: "#a16207" },
  { bg: "#14532d", dark: true, accent: "#fde68a" },
];

const STEPS = [
  ["Discover", "We map your workflows, data and goals before a single line is written."],
  ["Design", "Architecture, interfaces and AI flows shaped around how your team really works."],
  ["Build", "Iterative delivery with testing and security built in from the first sprint."],
  ["Scale", "Cloud, monitoring and continuous improvement so it keeps performing."],
];

export default function Services() {
  return (
    <>
      <PageHero
        kicker="Services"
        title="Our Services."
        sub="Twenty capabilities across four disciplines — one team to take you from idea to scale."
      />

      <div className="overflow-hidden py-6" aria-hidden>
        <p data-scrub-x="1" className="whitespace-nowrap font-display text-[clamp(3.6rem,13vw,11rem)] leading-[1.05] text-outline">AI · Software · Cloud · Strategy ·</p>
      </div>

      <section className="pb-6">
        <div className="mx-auto max-w-7xl px-6 space-y-5">
          {SERVICE_GROUPS.map((g, i) => {
            const t = TONES[i % TONES.length];
            return (
              <div
                key={g.name}
                className="sticky grid gap-6 overflow-hidden rounded-[1.8rem] border border-[#14532d]/10 p-6 shadow-[0_30px_70px_-40px_rgba(20,83,45,0.55)] md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-10 md:p-9"
                style={{ top: `${5.25 + i * 0.7}rem`, background: t.bg }}
              >
                <div className="relative">
                  <span className="pointer-events-none absolute -top-4 -left-2 font-display text-[7rem] leading-none opacity-[0.1] md:text-[10rem]" style={{ color: t.accent }}>0{i + 1}</span>
                  <span className="relative font-mono text-xs" style={{ color: t.accent }}>0{i + 1} / 04</span>
                  <h2 className={`relative mt-3 font-display text-[clamp(1.9rem,3.4vw,3rem)] leading-none ${t.dark ? "text-white" : "text-[#14532d]"}`}>{g.name}</h2>
                  <p className={`relative mt-4 max-w-sm text-sm ${t.dark ? "text-white/75" : "text-muted"}`}>{g.blurb}</p>
                </div>
                <ul className={`divide-y ${t.dark ? "divide-white/15" : "divide-[#14532d]/10"}`}>
                  {g.items.map((s, n) => (
                    <li key={s} className="group">
                      <Link href="/contact#contact-form" className="flex items-center justify-between gap-4 py-2.5">
                        <span className="flex items-baseline gap-3">
                          <span className="font-mono text-xs" style={{ color: t.accent }}>{String(n + 1).padStart(2, "0")}</span>
                          <span className={`text-base transition-all duration-300 group-hover:translate-x-2 ${t.dark ? "text-white" : "text-ink"}`}>{s}</span>
                        </span>
                        <span className="-translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" style={{ color: t.accent }}>→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-3 py-20 sm:px-6">
        <div data-panel className="mx-auto max-w-7xl rounded-[2rem] bg-gradient-to-br from-[#052e16] via-[#14532d] to-[#166534] px-6 py-16 text-white md:px-12 md:py-24">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-[#fde68a]">How we work</p>
          <h2 data-split className="max-w-3xl font-display text-[clamp(2.2rem,5vw,4.4rem)] leading-[1.02]">From first conversation to production.</h2>
          <div data-stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([t, d], i) => (
              <div key={t} className="rounded-3xl border border-white/10 bg-white/[0.06] p-7">
                <span className="font-display text-5xl text-[#fde68a]">0{i + 1}</span>
                <h3 className="mt-6 font-display text-2xl">{t}</h3>
                <p className="mt-2 text-sm text-white/70">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 text-center">
        <h2 data-split className="font-display text-[clamp(1.8rem,4vw,3rem)] leading-none">Not sure which service you need?</h2>
        <Link href="/contact" className="btn btn-solid mt-6">Talk to us →</Link>
      </section>
    </>
  );
}
