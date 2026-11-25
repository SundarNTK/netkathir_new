import PageHero from "@/components/PageHero";
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
        title="Transforming Ideas into Intelligent Solutions."
      />
      <Ticker items={["Healthcare", "Education", "eCommerce", "Manufacturing", "HR"]} />

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-6">
          <h2 data-split className="mb-12 font-display text-[clamp(2.2rem,5vw,4.5rem)] leading-[1.02]">Selected work.</h2>
          <div data-stagger className="grid gap-5 md:grid-cols-3">
            {featured.map((c, i) => (
              <article key={c.name} data-tilt className={`glare relative flex min-h-[26rem] flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br p-8 shadow-[0_34px_70px_-36px_rgba(20,83,45,0.6)] ${TONES[i % TONES.length]}`}>
                <span className="font-display text-[8rem] leading-none opacity-[0.12]">0{i + 1}</span>
                <div>
                  <span className="mb-6 flex h-16 w-32 items-center justify-center rounded-2xl bg-white px-3 shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.logo} alt={c.name} className="max-h-11 w-full object-contain" />
                  </span>
                  <h3 className="font-display text-3xl">{c.name}</h3>
                  <p className="mt-3 text-[0.95rem] opacity-85">{CASES[c.name]}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-3 py-16 sm:px-6">
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

      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-6">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-ice">Everyone we have worked with</p>
          <ul className="border-t border-ink/10">
            {CLIENTS.map((c, i) => (
              <li key={c.name} data-reveal data-hover className="group relative flex items-center justify-between gap-6 overflow-hidden border-b border-ink/10 py-6 md:py-8">
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-[#bbf7d0] via-[#fef3c7]/60 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-0" />
                <span className="relative font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span className="relative hidden h-16 w-28 shrink-0 items-center justify-center rounded-xl bg-white px-2 shadow-sm sm:flex">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.logo} alt="" className="max-h-12 w-full object-contain" />
                </span>
                <h3 className="relative flex-1 font-display text-[clamp(1.6rem,4.5vw,4.2rem)] leading-none transition-transform duration-500 group-hover:translate-x-4">{c.name}</h3>
                <span className="relative hidden max-w-xs text-right text-sm text-muted md:block">{CASES[c.name] ?? "Delivered by Netkathir"}</span>
                <span className="relative text-3xl text-gold transition-transform duration-500 group-hover:rotate-45">↗</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
