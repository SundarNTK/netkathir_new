import Link from "next/link";
import Steps from "@/components/Steps";
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
        title="Our Services"
        sub="Twenty capabilities across four disciplines — one team to take you from idea to scale."
      />
      <Ticker items={["AI & GenAI", "Enterprise Software", "Cloud & DevOps", "Digital Transformation"]} />
      <FlightStrip from="Your idea" to="Live" note="Brief in. Working software out" />

      <ServiceReveal areas={AREAS} />

      <section className="px-3 py-6 sm:px-6 sm:py-12 md:py-16">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white bg-gradient-to-br from-[#f1fbf4] via-white to-[#fff8de] px-5 py-9 shadow-[0_44px_90px_-54px_rgba(20,83,45,0.55)] sm:px-10 sm:py-14 md:px-14 md:py-20">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#14532d]/10 bg-white px-4 py-1.5 text-sm font-semibold text-[#15803d] shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-[#eab308]" />How we work</p>
          <h2 data-split className="max-w-3xl font-display text-[clamp(2.2rem,5vw,4.4rem)] leading-[1.02]">From first conversation to production</h2>
          <div className="mt-8 sm:mt-12">
            <Steps steps={STEPS} />
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
