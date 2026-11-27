import PageHero from "@/components/PageHero";
import Ticker from "@/components/Ticker";
import Founder from "@/components/Founder";
import WorldMap from "@/components/WorldMap";
import { COUNTRIES, IMAGES, VALUES } from "@/lib/data";

export const metadata = { title: "About Us — Netkathir Technologies" };

export default function About() {
  return (
    <div className="relative isolate">
      <PageHero
        kicker="About Us"
        title="The People and Purpose Behind Netkathir"
        sub="Founded 2015 · Trusted by clients worldwide."
        image={IMAGES.heroes.about}
        room
      />

      <section className="py-10 md:py-12">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#14532d]/10 bg-white px-4 py-1.5 text-sm font-semibold text-[#15803d] shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-[#eab308]" />Who we are</p>
            <h2 data-split className="font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.02]">Founded 2015. AI-first today</h2>
          </div>
          <div data-reveal className="space-y-8">
            <p className="text-[clamp(1.15rem,1.7vw,1.5rem)] leading-relaxed text-ink/85">
              Netkathir was founded in 2015 to build custom ERP and CRM systems, AI automation and enterprise applications — and today we also run our own products, Garage Bill and HRMS.
            </p>
            <p className="border-l-4 border-[#eab308] pl-5 font-display text-[clamp(1.3rem,2vw,1.8rem)] font-semibold leading-snug text-[#14532d]">We connect AI to real business workflows, not demos.</p>
            <div className="flex flex-wrap gap-3">
              {["Custom ERP & CRM", "AI automation", "Enterprise applications", "Garage Bill", "HRMS"].map((t) => (
                <span key={t} className="rounded-full border border-[#14532d]/10 bg-white px-4 py-2 text-sm font-semibold text-[#14532d] shadow-sm">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-3 py-10 md:py-12 sm:px-6">
        <div data-panel className="mx-auto grid max-w-7xl gap-10 rounded-[2rem] bg-gradient-to-br from-[#052e16] via-[#14532d] to-[#166534] px-6 py-16 text-center text-white sm:grid-cols-3 md:py-24">
          {[
            ["11", "+", "Years of excellence"],
            ["50", "+", "Team members"],
            ["6", "", "Countries"],
          ].map(([n, s, l]) => (
            <div key={l}>
              <div data-count={n} data-suffix={s} className="font-display text-[clamp(5rem,12vw,10rem)] leading-none text-grad-night">
                {n}{s}
              </div>
              <p className="mt-2 text-white/70">{l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white bg-white/70 px-4 py-1.5 text-sm font-semibold text-ice shadow-[0_10px_30px_-14px_rgba(22,101,52,0.5)] backdrop-blur-xl mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-violet" /> Leadership &amp; Global Presence
            </p>
            <h2 data-split className="font-display text-[clamp(2.4rem,5vw,4.6rem)] leading-[0.98]">
              Led by vision. Delivering worldwide
            </h2>
          </div>

          <div className="grid lg:grid-cols-[0.82fr_1.18fr] gap-10 items-stretch">
            <Founder />

            <div data-reveal className="glass flex flex-col rounded-[2.2rem] p-6 sm:p-9">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-ice">Global presence</p>
                  <h3 className="font-display text-3xl sm:text-4xl leading-tight">Six countries. One team</h3>
                </div>
                <p className="max-w-[16rem] text-sm text-muted">Headquartered in Puducherry, India — building for clients across four continents.</p>
              </div>

              <div className="relative flex flex-1 items-center rounded-3xl border border-white bg-gradient-to-br from-white/80 via-white/50 to-violet/10 px-1 py-4 sm:px-8 sm:py-10">
                <WorldMap />
              </div>

              <ul className="mt-6 flex flex-wrap gap-2">
                {COUNTRIES.map((c, i) => (
                  <li key={c} className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${i === 0 ? "border-transparent bg-gradient-to-r from-[#166534] to-[#eab308] text-white" : "border-ink/10 bg-white/70"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-white" : "bg-violet"}`} />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      <Ticker items={VALUES.map((v) => v[0])} />
      <section className="py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-6">
          <h2 data-split className="font-display text-[clamp(2.2rem,5vw,4.5rem)] leading-none mb-8">What we stand for</h2>
          <div data-stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map(([t, d], i) => {
              const tones = ["bg-white", "bg-[#ecfccb]", "bg-[#fef3c7]", "bg-[#14532d] text-white"];
              const dark = i % 4 === 3;
              return (
                <div key={t} data-tilt className={`glare flex min-h-[15rem] flex-col justify-between rounded-[1.75rem] border border-[#14532d]/10 p-7 shadow-[0_24px_60px_-36px_rgba(20,83,45,0.5)] ${tones[i % 4]}`}>
                  <span className={`font-display text-5xl ${dark ? "text-[#fde68a]" : "text-[#15803d]/40"}`}>0{i + 1}</span>
                  <div>
                    <h3 className="mb-2 font-display text-2xl">{t}</h3>
                    <p className={`text-sm ${dark ? "text-white/75" : "text-muted"}`}>{d}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-10 md:py-12">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="relative mx-auto mb-6 grid h-36 w-36 place-items-center">
            <span aria-hidden className="absolute h-36 w-36 rounded-full bg-white shadow-[0_10px_28px_-16px_rgba(20,83,45,0.45)]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMAGES.iso} alt="ISO 27001 Certified" className="relative z-10 h-36 w-36 object-contain" />
          </div>
          <p className="font-mono text-xs text-muted mb-3">Established December 2015 · Incorporated May 2019</p>
          <p className="font-display text-3xl text-grad">ISO 27001 Certified</p>
        </div>
      </section>
    </div>
  );
}
