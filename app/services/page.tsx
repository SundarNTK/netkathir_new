import Link from "next/link";
import PageHero from "@/components/PageHero";
import { SERVICE_GROUPS } from "@/lib/data";

export const metadata = { title: "Services — Netkathir Technologies" };

export default function Services() {
  return (
    <>
      <PageHero
        kicker="Services"
        title="Our Services."
        sub="Twenty capabilities across four disciplines — one team to take you from idea to scale."
      />

      <section className="pb-6">
        <div className="mx-auto max-w-7xl px-6 space-y-4">
          {SERVICE_GROUPS.map((g, i) => (
            <div
              key={g.name}
              className="sticky glass rounded-[1.6rem] p-5 md:p-7 grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-5 md:gap-8 md:items-start !bg-white"
              style={{ top: `${5.25 + i * 0.7}rem` }}
            >
              <div>
                <span className="font-mono text-xs text-ice">0{i + 1} / 04</span>
                <h2 className="font-display text-[clamp(1.7rem,3vw,2.6rem)] leading-none mt-2 text-grad">{g.name}</h2>
                <p className="mt-3 text-sm text-muted max-w-sm">{g.blurb}</p>
              </div>
              <ul className="divide-y divide-ink/10">
                {g.items.map((s, n) => (
                  <li key={s} className="group">
                    <Link href="/contact#contact-form" className="flex items-center justify-between py-2.5 gap-4">
                      <span className="flex gap-3 items-baseline">
                        <span className="font-mono text-xs text-muted">{String(n + 1).padStart(2, "0")}</span>
                        <span className="text-base group-hover:translate-x-2 group-hover:text-ice transition-all duration-300">
                          {s}
                        </span>
                      </span>
                      <span className="text-ice opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="py-10 text-center">
        <h2 data-split className="font-display text-[clamp(1.8rem,4vw,3rem)] leading-none">
          Not sure which service you need?
        </h2>
        <Link href="/contact" className="btn btn-solid mt-6">Talk to us →</Link>
      </section>
    </>
  );
}
