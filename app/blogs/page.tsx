import PageHero from "@/components/PageHero";
import { FlightStrip } from "@/components/Flight";
import Ticker from "@/components/Ticker";
import { BLOGS } from "@/lib/data";

export const metadata = { title: "Blogs — Netkathir Technologies" };

export default function Blogs() {
  const [first, ...rest] = BLOGS;
  return (
    <div className="relative isolate">
      <PageHero
        kicker="Insights"
        title="Insights / Blogs."
        sub="Notes on AI, cloud, DevOps and building software that lasts."
      />
      <Ticker items={["AI", "Cloud", "DevOps", "ERP", "Software engineering"]} />
      <FlightStrip from="Question" to="Answer" note="Notes from the cockpit." />

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-6">
          <a href={first.url} target="_blank" rel="noreferrer" className="group grid items-center gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
            <div data-clip className="relative aspect-[16/10] overflow-hidden bg-[#0f3d22] shadow-[0_40px_90px_-40px_rgba(20,83,45,0.7)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img data-clip-img src={first.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <div data-reveal>
              <span className="inline-flex rounded-full bg-[#fef3c7] px-4 py-1.5 text-sm font-semibold text-[#92620a]">Latest · {first.date}</span>
              <h2 className="mt-5 font-display text-[clamp(2rem,4.2vw,3.6rem)] leading-[1.04] transition-colors group-hover:text-[#15803d]">{first.title}</h2>
              <span className="mt-6 inline-flex items-center gap-2 font-semibold text-[#15803d]">Read the article <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span></span>
            </div>
          </a>
        </div>
      </section>

      <section className="pb-12 md:pb-16 pt-10">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((b) => (
            <a
              key={b.n}
              href={b.url}
              target="_blank"
              rel="noreferrer"
              data-reveal
              data-tilt
              className="glare group block overflow-hidden rounded-[1.75rem] border border-[#14532d]/10 bg-white shadow-[0_24px_60px_-36px_rgba(20,83,45,0.5)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_34px_70px_-30px_rgba(20,83,45,0.6)]"
            >
              <div className="relative h-52 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.image} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 font-mono text-[0.7rem] font-semibold text-[#14532d]">{b.n}</span>
              </div>
              <div className="p-6">
                <p className="mb-3 font-mono text-xs text-[#a16207]">{b.date}</p>
                <h3 className="font-display text-[1.45rem] leading-snug transition-colors group-hover:text-[#15803d]">{b.title}</h3>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
