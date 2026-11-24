import Link from "next/link";
import PageHero from "@/components/PageHero";
import { PRODUCTS } from "@/lib/data";

export const metadata = { title: "Products — Netkathir Technologies" };

export default function Products() {
  return (
    <>
      <PageHero
        kicker="Products"
        title="Products Built by Netkathir."
        sub="Software we design, run and stand behind ourselves."
      />
      <section className="pb-16">
        <div data-stagger className="mx-auto max-w-7xl px-6 grid lg:grid-cols-3 gap-6">
          {PRODUCTS.map((p, i) => (
            <article
              key={p.name}
              data-tilt
              className="relative glass rounded-[2rem] min-h-[34rem] flex flex-col overflow-hidden"
            >
              <div className="relative h-52 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" className="h-full w-full object-cover" />
                {p.icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.icon} alt="" className="absolute left-5 bottom-4 h-14 w-14 rounded-2xl object-cover ring-2 ring-white/30" />
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between p-8">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs text-muted">0{i + 1}</span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full border ${
                      p.live ? "border-emerald-500/40 text-emerald-600" : "border-amber-500/40 text-amber-600"
                    }`}
                  >
                    {p.live && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300 mr-2 animate-pulse" />}
                    {p.tag}
                  </span>
                </div>
                <div>
                  <h2 className="font-display text-5xl text-grad mb-3">{p.name}</h2>
                  <p className="font-display text-xl mb-4">{p.line}</p>
                  <p className="text-muted">{p.text}</p>
                  {p.shots.length > 0 && (
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      {p.shots.map((src) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={src} src={src} alt="" className="h-24 w-full rounded-xl object-cover" />
                      ))}
                    </div>
                  )}
                  <Link href="/contact" className="inline-block mt-8 text-ice hover:underline">
                    {p.live ? "Request a demo →" : "Notify me →"}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
