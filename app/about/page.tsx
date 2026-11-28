import PageHero from "@/components/PageHero";
import Story from "@/components/Story";
import StatCards from "@/components/StatCards";
import ValueRows from "@/components/ValueRows";
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

      <section className="py-10 md:py-14">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#14532d]/10 bg-white px-4 py-1.5 text-sm font-semibold text-[#15803d] shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-[#eab308]" />Who we are</p>
            <h2 data-split className="font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.02]">Founded 2015. AI-first today</h2>
            <p data-reveal className="mt-7 max-w-xl text-[clamp(1.08rem,1.5vw,1.3rem)] leading-relaxed text-ink/80">
              Netkathir was founded in 2015 to build custom ERP and CRM systems, AI automation and enterprise applications — and today we also run our own products, Garage Bill and HRMS.
            </p>
            <p data-reveal className="mt-7 max-w-xl font-display text-[clamp(1.4rem,2.2vw,2rem)] font-semibold leading-snug text-[#14532d]">
              We connect AI to <span className="hl">real business workflows</span>, not demos.
            </p>
            <div data-reveal className="mt-9 flex flex-wrap gap-3">
              {["Custom ERP & CRM", "AI automation", "Enterprise applications", "Garage Bill", "HRMS"].map((t) => (
                <span key={t} className="rounded-full border border-[#14532d]/10 bg-white px-4 py-2 text-sm font-semibold text-[#14532d] shadow-sm transition-transform duration-300 hover:-translate-y-1">{t}</span>
              ))}
            </div>
          </div>
          <div data-reveal>
            <Story
              photos={[
                { src: "/images/contact/puducherry.jpg", year: "2015", cap: "Founded in Puducherry, India" },
                { src: "/images/contact/dubai.jpg", year: "2019", cap: "Incorporated, reaching the Gulf" },
                { src: IMAGES.heroes.about, year: "TODAY", cap: "50+ people, six countries" },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="px-3 py-10 sm:px-6 md:py-12">
        <div className="mx-auto max-w-7xl">
          <StatCards items={[["11", "+", "Years of excellence", "years"], ["50", "+", "Team members", "people"], ["6", "", "Countries", "countries"]]} />
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
          <ValueRows rows={VALUES.map(([t, d], i) => ({ t, d, kind: (["idea", "team", "tech", "growth"] as const)[i % 4] }))} />
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
