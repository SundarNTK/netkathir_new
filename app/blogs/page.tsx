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
        title="Insights / Blogs"
        sub="Notes on AI, cloud, DevOps and building software that lasts."
      />
      <Ticker items={["AI", "Cloud", "DevOps", "ERP", "Software engineering"]} />
      <FlightStrip from="Question" to="Answer" note="Notes from the cockpit" />

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
        <div data-batch className="mx-auto grid max-w-7xl gap-7 px-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((b) => (
            <a
              key={b.n}
              href={b.url}
              target="_blank"
              rel="noreferrer"
              data-tilt
              className="bl-card glare group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-[#14532d]/10 bg-white"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.image} alt="" loading="lazy" className="bl-img h-full w-full object-cover" />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#04140c]/70 via-[#04140c]/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 font-mono text-[0.7rem] font-semibold text-[#14532d] shadow-sm backdrop-blur">
                  #{b.n}
                </span>
                <span className="absolute bottom-4 left-4 translate-y-3 rounded-full bg-[#facc15] px-3 py-1 text-xs font-semibold text-[#14532d] opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  Read article
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="mb-3 flex items-center gap-2 font-mono text-xs text-[#a16207]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ca8a04]" />
                  {b.date}
                </p>
                <h3 className="font-display text-[1.35rem] leading-snug transition-colors duration-300 group-hover:text-[#15803d]">{b.title}</h3>
                <div className="mt-auto flex items-center justify-between pt-6">
                  <span className="text-sm font-semibold text-[#15803d]">Read more</span>
                  <span className="bl-arrow grid h-10 w-10 place-items-center rounded-full border border-[#15803d]/25 text-[#15803d]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M7 17L17 7M9 7h8v8" />
                    </svg>
                  </span>
                </div>
              </div>
              <span aria-hidden className="bl-bar" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
