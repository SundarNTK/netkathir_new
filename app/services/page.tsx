import Link from "next/link";
import PageHero from "@/components/PageHero";
import { IMAGES, SERVICE_GROUPS } from "@/lib/data";

export const metadata = { title: "Services — Netkathir Technologies" };

export default function Services() {
  return (
    <>
      <PageHero
        kicker="Services"
        title="Our Services."
        sub="Twenty capabilities across four disciplines — one team to take you from idea to scale."
        image={IMAGES.heroes.services}
      />

      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-6 space-y-8">
          {SERVICE_GROUPS.map((g, i) => (
            <div
              key={g.name}
              className="sticky glass rounded-[2rem] p-8 md:p-14 grid md:grid-cols-[1fr_1.2fr] gap-10 !bg-white"
              style={{ top: `${6 + i * 1.5}rem` }}
            >
              <div>
                <span className="font-mono text-xs text-ice">0{i + 1} / 04</span>
                <h2 className="font-display text-[clamp(2rem,4.5vw,4rem)] leading-none mt-4 text-grad">{g.name}</h2>
                <p className="mt-5 text-muted max-w-sm">{g.blurb}</p>
              </div>
              <ul className="divide-y divide-ink/10">
                {g.items.map((s, n) => (
                  <li key={s} className="group">
                    <Link href="/contact#contact-form" className="flex items-center justify-between py-4 gap-4">
                      <span className="flex gap-4 items-baseline">
                        <span className="font-mono text-xs text-muted">{String(n + 1).padStart(2, "0")}</span>
                        <span className="text-lg group-hover:translate-x-2 group-hover:text-ice transition-all duration-300">
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

      <section className="py-32 text-center">
        <h2 data-split className="font-display text-[clamp(2.2rem,6vw,5.5rem)] leading-none">
          Not sure which service you need?
        </h2>
        <Link href="/contact" className="btn btn-solid mt-10">Talk to us →</Link>
      </section>
    </>
  );
}
