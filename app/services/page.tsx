import Link from "next/link";
import PageHero from "@/components/PageHero";
import { FlightStrip } from "@/components/Flight";
import { ServiceReveal } from "@/components/Showcase";
import Ticker from "@/components/Ticker";
import { IMAGES, SERVICE_GROUPS } from "@/lib/data";

export const metadata = { title: "Services — Netkathir Technologies" };

const STEPS = [
  ["Discover", "We map your workflows, data and goals before a single line is written."],
  ["Design", "Architecture, interfaces and AI flows shaped around how your team really works."],
  ["Build", "Iterative delivery with testing and security built in from the first sprint."],
  ["Scale", "Cloud, monitoring and continuous improvement so it keeps performing."],
];

const AREAS = [
  { tags: ["OpenAI", "LangChain", "Python", "Vector DB"], image: IMAGES.heroes.services, bg: "#dcfce7", ink: "#052e16", accent: "#15803d" },
  { tags: [".NET", "React", "Angular", "Flutter"], image: IMAGES.heroes.products, bg: "#fef3c7", ink: "#422006", accent: "#b45309" },
  { tags: ["AWS", "Azure", "Docker", "Jenkins"], image: IMAGES.heroes.projects, bg: "#d9f2f4", ink: "#083344", accent: "#0e7490" },
  { tags: ["Roadmaps", "Architecture", "Modernization"], image: IMAGES.heroes.about, bg: "#0f3d22", ink: "#ecfdf5", accent: "#fde68a" },
].map((a, i) => ({ ...a, name: SERVICE_GROUPS[i].name, blurb: SERVICE_GROUPS[i].blurb, items: SERVICE_GROUPS[i].items }));

export default function Services() {
  return (
    <div className="relative isolate">
      <PageHero
        kicker="Services"
        title="Our Services."
        sub="Twenty capabilities across four disciplines — one team to take you from idea to scale."
      />
      <Ticker items={["AI & GenAI", "Enterprise Software", "Cloud & DevOps", "Digital Transformation"]} />
      <FlightStrip from="Your idea" to="Live" note="Brief in. Working software out." />

      <ServiceReveal areas={AREAS} />

      <section className="px-3 py-12 md:py-16 sm:px-6">
        <div data-panel className="mx-auto max-w-7xl rounded-[2rem] bg-gradient-to-br from-[#052e16] via-[#14532d] to-[#166534] px-6 py-16 text-white md:px-12 md:py-24">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-[#fde68a]">How we work</p>
          <h2 data-split className="max-w-3xl font-display text-[clamp(2.2rem,5vw,4.4rem)] leading-[1.02]">From first conversation to production.</h2>
          <div data-stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([t, d], i) => (
              <div key={t} data-tilt className="glare rounded-3xl border border-white/10 bg-white/[0.06] p-7">
                <span className="font-display text-5xl text-[#fde68a]">0{i + 1}</span>
                <h3 className="mt-6 font-display text-2xl">{t}</h3>
                <p className="mt-2 text-sm text-white/70">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 text-center">
        <h2 data-split className="font-display text-[clamp(1.8rem,4vw,3rem)] leading-none">Not sure which service you need?</h2>
        <Link href="/contact" className="btn btn-solid mt-6">Talk to us →</Link>
      </section>
    </div>
  );
}
