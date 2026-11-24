import PageHero from "@/components/PageHero";
import { BLOGS, IMAGES } from "@/lib/data";

export const metadata = { title: "Blogs — Netkathir Technologies" };

export default function Blogs() {
  return (
    <>
      <PageHero
        kicker="Insights"
        title="Insights / Blogs."
        sub="Notes on AI, cloud, DevOps and building software that lasts."
        image={IMAGES.heroes.blogs}
      />
      <section className="pb-32">
        <div className="mx-auto max-w-7xl px-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BLOGS.map((b) => (
            <a
              key={b.n}
              href={b.url}
              target="_blank"
              rel="noreferrer"
              data-reveal
              className="group glass overflow-hidden rounded-3xl block"
            >
              <div className="relative h-48 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.image} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <p className="font-mono text-xs text-gold mb-3">
                  {b.n} · {b.date}
                </p>
                <h2 className="font-display text-2xl leading-snug group-hover:text-ice transition-colors">
                  {b.title}
                </h2>
              </div>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
