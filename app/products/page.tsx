import Link from "next/link";
import PageHero from "@/components/PageHero";
import Ticker from "@/components/Ticker";
import { PRODUCTS } from "@/lib/data";

export const metadata = { title: "Products — Netkathir Technologies" };

export default function Products() {
  return (
    <div className="relative isolate">
      <PageHero
        kicker="Products"
        title="Products Built by Netkathir."
        sub="Software we design, run and stand behind ourselves."
      />
      <Ticker items={["Garage Bill", "HRMS", "Designed in-house", "Run and supported by Netkathir"]} />

      <div className="space-y-6 pb-16 md:space-y-10">
        {PRODUCTS.map((p, i) => (
          <section key={p.name} className="relative overflow-hidden py-10 md:py-16">
            <div className={`relative mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-2 lg:gap-16 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <div data-clip className="relative aspect-[4/3] overflow-hidden bg-[#0f3d22] shadow-[0_40px_90px_-40px_rgba(20,83,45,0.7)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img data-clip-img src={p.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#052e16]/55 via-transparent to-transparent" />
                {p.icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.icon} alt="" className="absolute bottom-5 left-5 h-16 w-16 rounded-2xl object-cover ring-2 ring-white/60" />
                )}
              </div>
              <div data-reveal>
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${p.live ? "bg-[#dcfce7] text-[#166534]" : "bg-[#fef3c7] text-[#92620a]"}`}>
                  {p.live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#16a34a]" />}
                  {p.tag}
                </span>
                <h2 className="mt-5 font-display text-[clamp(2.6rem,6vw,5rem)] leading-[0.98] text-grad">{p.name}</h2>
                <p className="mt-3 font-display text-[clamp(1.2rem,2vw,1.7rem)] leading-snug text-[#14532d]">{p.line}</p>
                <p className="mt-4 max-w-xl text-muted">{p.text}</p>
                {p.shots.length > 0 && (
                  <div className="mt-6 grid max-w-xl grid-cols-2 gap-3">
                    {p.shots.map((src) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={src} src={src} alt="" className="h-28 w-full rounded-2xl object-cover shadow-[0_18px_40px_-24px_rgba(20,83,45,0.6)]" />
                    ))}
                  </div>
                )}
                <Link href="/contact" className="btn btn-solid mt-8">{p.live ? "Request a demo →" : "Notify me →"}</Link>
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="px-3 pb-20 sm:px-6">
        <div data-panel className="mx-auto max-w-7xl rounded-[2rem] bg-gradient-to-br from-[#052e16] via-[#14532d] to-[#166534] px-6 py-16 text-center text-white md:py-24">
          <h2 data-split className="mx-auto max-w-3xl font-display text-[clamp(2rem,4.6vw,4rem)] leading-[1.03]">Want to see one of them in action?</h2>
          <Link href="/contact" className="btn mt-8 !border-transparent !bg-[#fde68a] !text-[#14532d]">Book a demo →</Link>
        </div>
      </section>
    </div>
  );
}
