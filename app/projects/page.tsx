import PageHero from "@/components/PageHero";
import { FlightStrip } from "@/components/Flight";
import { ClientReel, LetterWall } from "@/components/Showcase";
import Ticker from "@/components/Ticker";
import { CLIENTS } from "@/lib/data";

export const metadata = { title: "Projects — Netkathir Technologies" };

const CASES: Record<string, string> = {
  HEB: "Concurrent booking system — 1,000+ bookings for firewalking events.",
  APPGM: "Malaysia impact portal — project management for social programmes.",
  WhyScience: "Online education platform for curious learners.",
};

const TONES = [
  "from-[#052e16] via-[#14532d] to-[#166534] text-white",
  "from-[#ecfccb] via-[#d9f99d] to-[#bef264] text-[#14532d]",
  "from-[#fef3c7] via-[#fde68a] to-[#facc15] text-[#3a2a05]",
];

export default function Projects() {
  const featured = CLIENTS.filter((c) => CASES[c.name]);
  return (
    <div className="relative isolate">
      <PageHero
        kicker="Projects"
        title="Transforming Ideas into Intelligent Solutions"
      />
      <Ticker items={["Healthcare", "Education", "eCommerce", "Manufacturing", "HR"]} />
      <FlightStrip from="2015" to="2026" note="11 years of clients, one flight path" />

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-6">
          <h2 data-split className="mb-12 font-display text-[clamp(2.2rem,5vw,4.5rem)] leading-[1.02]">Selected work</h2>
          <div data-stagger className="grid gap-5 md:grid-cols-3">
            {featured.map((c, i) => (
              <article key={c.name} data-tilt className={`glare relative flex flex-col overflow-hidden rounded-[2rem] bg-gradient-to-br p-3 shadow-[0_34px_70px_-36px_rgba(20,83,45,0.6)] ${TONES[i % TONES.length]}`}>
                <div className="relative flex h-44 items-center justify-center rounded-[1.5rem] bg-white px-8 shadow-[0_14px_34px_-18px_rgba(0,0,0,0.45)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.logo} alt={c.name} className="max-h-24 w-full object-contain" />
                  <span className="absolute right-4 top-3 font-mono text-xs font-semibold text-[#14532d]/45">0{i + 1}</span>
                </div>
                <div className="px-4 pb-5 pt-6">
                  <h3 className="font-display text-[1.9rem] leading-tight">{c.name}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed opacity-85">{CASES[c.name]}</p>
                  <span className="mt-5 inline-flex rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ring-current/25">Case study</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <LetterWall rows={["PLAN", "DESIGN", "BUILD", "CONNECT", "AUTOMATE", "INTEGRATE", "DELIVER", "SUPPORT", "SCALE", "SECURE", "MAINTAIN"]} stamp="Netkathir · 2015 — 2026" title="11 years. 50+ projects. One team" sub="From hospitals to marine to e-commerce — software that keeps running." />
      <section className="px-3 py-10 md:py-14 sm:px-6">
        <div data-panel className="mx-auto grid max-w-7xl gap-10 rounded-[2rem] bg-gradient-to-br from-[#052e16] via-[#14532d] to-[#166534] px-6 py-16 text-center text-white sm:grid-cols-3 md:py-24">
          {[
            ["11", "+", "Years of delivery"],
            ["6", "", "Countries served"],
            ["50", "+", "Engineers"],
          ].map(([n, s, l]) => (
            <div key={l}>
              <div data-count={n} data-suffix={s} className="font-display text-[clamp(4.5rem,10vw,8rem)] leading-none text-grad-night">{n}{s}</div>
              <p className="mt-2 text-white/70">{l}</p>
            </div>
          ))}
        </div>
      </section>

      <ClientReel clients={CLIENTS} notes={CASES} />
    </div>
  );
}
