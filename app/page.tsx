import Link from "next/link";
import { FlightJourney, FlyAnywhere } from "@/components/Flight";
import { Collage } from "@/components/Showcase";
import { CLIENTS, IMAGES, SERVICE_GROUPS, TESTIMONIALS } from "@/lib/data";

const SHOWCASE = [
  { href: "/services", label: "Services", image: IMAGES.heroes.services, desc: "AI agents, ERP, cloud and automation built around your workflow." },
  { href: "/products", label: "Products", image: IMAGES.heroes.products, desc: "Garage Bill and HRMS — our own software, live with real teams." },
  { href: "/projects", label: "Projects", image: IMAGES.heroes.projects, desc: "Selected client work across retail, health, education and more." },
  { href: "/about", label: "About", image: IMAGES.heroes.about, desc: "Eleven years, 50+ people and a team across six countries." },
];

const JOURNEY = [
  { k: "Discover", image: IMAGES.heroes.about, t: "We map your workflow", d: "Sit with your team, find the slow, manual steps worth automating.", tags: ["Workshops", "Process maps"] },
  { k: "Design", image: IMAGES.heroes.products, t: "Architecture & UX", d: "Clear screens and a system that fits how you already work.", tags: ["Next.js", "Figma"] },
  { k: "Build AI", image: IMAGES.heroes.services, t: "Agents, RAG & LLMs", d: "Chatbots and assistants wired into your own data and tools.", tags: ["LLMs", "RAG", "Python"] },
  { k: "Deploy", image: IMAGES.heroes.projects, t: "Cloud & DevOps", d: "Secure releases on AWS or Azure with automated pipelines.", tags: ["AWS", "Docker", "CI/CD"] },
  { k: "Support", image: IMAGES.heroes.contact, t: "Run it, improve it", d: "Monitoring and a team that stays after launch. ISO 27001.", tags: ["24/7", "ISO 27001"] },
];

const REACH = ["ERP systems", "CRM platforms", "AI chatbots", "AI agents", "RAG search", "Workflow automation", "Garage Bill", "HRMS", "Cloud migration", "DevOps pipelines"];

const AI_WORDS = ["Generative AI", "AI Agents", "RAG", "LLMs", "Chatbots", "Automation", "ERP", "Cloud", "DevOps"];

export default function Home() {
  const logos = [...CLIENTS, ...CLIENTS];
  const ai = SERVICE_GROUPS[0];
  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section className="relative">
        <div className="relative flex min-h-screen flex-col justify-start overflow-hidden pt-28 pb-12 lg:h-screen lg:flex-row lg:items-center lg:justify-center lg:pt-24 lg:pb-10">

        <div className="relative mx-auto max-w-7xl px-6 w-full">
          <div className="max-w-[34rem]">
          <div
            data-reveal
            data-delay="0.3"
            className="inline-flex items-center gap-4 rounded-2xl border border-white bg-white/80 p-2 pr-6 shadow-[0_18px_50px_-20px_rgba(22,101,52,0.55)] backdrop-blur-xl mb-[clamp(0.9rem,3vh,2.25rem)]"
          >
            <span className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#166534] via-[#16a34a] to-[#eab308] font-display text-[2.4rem] font-bold leading-none tracking-tighter text-white shadow-inner">
              <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.45)_50%,transparent_70%)] bg-[length:250%_100%] animate-[btn-flow_3.5s_linear_infinite]" />
              <span className="relative">11</span>
            </span>
            <span className="flex flex-col">
              <span className="font-display text-lg font-semibold leading-tight tracking-tight text-ink">Years of engineering excellence</span>
              <span className="mt-0.5 flex items-center gap-2 text-sm text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-glow" />
                Since 2015 · ISO 27001 Certified
              </span>
            </span>
          </div>
          <h1 data-split data-delay="0.2" className="font-display text-[clamp(2.3rem,min(6.2vw,11vh),6.6rem)] leading-[0.92] text-grad">
            AI-First Software Company
          </h1>
          {/* mobile: the robot stands in this gap, under the title and above the subtitle */}
          <div className="h-[min(52vh,24rem)] lg:hidden" aria-hidden />
          <h2 data-split data-delay="0.9" className="font-display text-[clamp(1.1rem,min(2.3vw,3.6vh),2.1rem)] leading-tight mt-6 text-ink/90 lg:mt-[clamp(0.7rem,2.2vh,1.6rem)]">
            Intelligence engineered into every line.
          </h2>
          <p data-reveal data-delay="1.1" className="mt-[clamp(0.5rem,1.8vh,1.4rem)] max-w-xl text-muted text-[clamp(0.9rem,2.1vh,1.1rem)]">
            AI agents, GenAI and enterprise software that plug into real workflows — for healthcare, education, eCommerce, manufacturing and HR.
          </p>
          <div data-reveal data-delay="1.3" className="mt-[clamp(0.9rem,3.6vh,2.6rem)] flex flex-wrap gap-4">
            <Link href="/services" data-magnetic className="btn btn-solid">
              Explore Our Services →
            </Link>
            <Link href="/contact" data-magnetic className="btn bg-white/70 backdrop-blur-xl">
              Contact Us
            </Link>
          </div>
          <ul data-reveal data-delay="1.5" className="mt-[clamp(0.9rem,3.2vh,2.6rem)] flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-ink/70">
            {["ISO 27001 Certified", "Clients in 6 countries", "50+ engineers"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <svg viewBox="0 0 20 20" className="h-4 w-4 text-glow" fill="currentColor" aria-hidden>
                  <path d="M10 1.8l2.3 1.5 2.7-.2 1.1 2.5 2.3 1.5-.6 2.6.6 2.6-2.3 1.5-1.1 2.5-2.7-.2L10 18.2l-2.3-1.5-2.7.2-1.1-2.5L1.6 12.9l.6-2.6-.6-2.6 2.3-1.5L5 3.7l2.7.2L10 1.8zm-1 11.2l4.6-4.6-1.1-1.1L9 10.8 7.5 9.3 6.4 10.4 9 13z" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-ink/40 text-[0.65rem] tracking-[0.3em] font-mono">
          SCROLL
          <span className="block h-12 w-px bg-gradient-to-b from-cyan via-violet to-transparent float" />
        </div>
      </div>
      </section>

      {/* ───────────── WORD BAND ───────────── */}
      <section className="py-6 overflow-hidden border-y border-ink/10 bg-white/40 backdrop-blur-sm" aria-hidden>
        <div className="marquee-track items-center">
          {[...AI_WORDS, ...AI_WORDS, ...AI_WORDS, ...AI_WORDS].map((w, i) => (
            <span key={i} className="flex items-center font-display text-[clamp(2.5rem,6vw,5rem)] leading-none whitespace-nowrap">
              <span className={i % 2 ? "text-outline" : "text-ink/90"}>{w}</span>
              <span className="mx-8 text-violet">✦</span>
            </span>
          ))}
        </div>
      </section>

      {/* ───────────── CLIENT LOGOS ───────────── */}
      <section className="py-14 overflow-hidden">
        <p className="mb-8 text-center font-mono text-xs uppercase tracking-[0.3em] text-ink/40">Trusted by teams across 6 countries</p>
        <div className="marquee-track items-center">
          {logos.map((c, i) => (
            <div
              key={`${c.name}-${i}`}
              className="mx-3 flex h-24 w-48 shrink-0 items-center justify-center rounded-2xl bg-white px-4 shadow-[0_16px_40px_-18px_rgba(22,101,52,0.5)] border border-ink/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.logo} alt={c.name} className="max-h-14 w-full object-contain" />
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── 11 YEARS ───────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-16 items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-ice mb-4">Why Netkathir</p>
            <h2 data-split className="font-display text-[clamp(2.4rem,6vw,5.5rem)] leading-[0.95]">
              Building software that ships.
            </h2>
          </div>
          <div className="flex items-end gap-6">
            <span data-count="11" data-suffix="+" className="font-display text-[clamp(6rem,16vw,14rem)] leading-none text-grad">
              11+
            </span>
            <p className="pb-6 text-muted max-w-[14rem]">Years of shipping software — founded 2015, now AI-first.</p>
          </div>
        </div>
      </section>

      {/* ───────────── AI CAPABILITIES ───────────── */}
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-[0.9fr_1.1fr] gap-16">
          <div className="lg:sticky lg:top-32 self-start">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-ice mb-4">Artificial Intelligence</p>
            <h2 data-split className="font-display text-[clamp(2.4rem,5.5vw,5rem)] leading-[0.95]">
              AI that connects to real workflows.
            </h2>
            <p data-reveal className="mt-8 text-muted max-w-md text-lg">
              {ai.blurb} From first prototype to production — secure, measurable and built around how your team already works.
            </p>
            <Link href="/services" data-magnetic className="btn btn-solid mt-10">
              See all services →
            </Link>
          </div>
          <ol data-stagger className="divide-y divide-ink/10 border-y border-ink/10">
            {ai.items.map((it, i) => (
              <li key={it}>
                <Link
                  href="/services"
                  className="group flex items-center gap-6 py-7 transition-all duration-500 hover:pl-4"
                >
                  <span className="font-mono text-xs text-ink/30 group-hover:text-glow transition-colors">0{i + 1}</span>
                  <span className="flex-1 font-display text-[clamp(1.3rem,2.4vw,2rem)] leading-tight text-ink/80 group-hover:text-ink transition-colors">
                    {it}
                  </span>
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-ink/15 text-ink/50 transition-all duration-500 group-hover:border-transparent group-hover:bg-gradient-to-br group-hover:from-violet group-hover:to-cyan group-hover:text-white group-hover:rotate-[-45deg]">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <FlightJourney kicker="How we deliver" title="From idea to AI, in flight." stops={JOURNEY} />

      {/* ───────────── SHOWCASE ───────────── */}
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-glow mb-4">Explore</p>
          <h2 data-split className="font-display text-[clamp(2.2rem,5vw,4.5rem)] leading-none mb-20">
            The work, in color.
          </h2>
          <div data-stagger className="grid gap-5 pb-10 sm:grid-cols-2 lg:grid-cols-4">
            {SHOWCASE.map((s, i) => (
              <div key={s.href}>
                <Link href={s.href} data-rise={i % 2 ? "-1" : "1"} className="block">
                  <div data-tilt className="group relative h-[26rem] overflow-hidden rounded-[1.75rem] border border-[#14532d]/10 bg-[#0a2417] shadow-[0_30px_70px_-38px_rgba(20,83,45,0.7)]">
                    <div data-pimg className="absolute -inset-x-2 -inset-y-10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.image} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#06190e]/95 via-[#06190e]/35 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#22a559]/35 via-transparent to-[#eab308]/25 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 font-mono text-[0.7rem] font-bold tracking-widest text-[#14532d]">0{i + 1}</span>
                    <span className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/25 text-white opacity-0 backdrop-blur-xl transition-all duration-500 -translate-y-2 group-hover:translate-y-0 group-hover:opacity-100">↗</span>
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                      <span className="mb-3 block h-[3px] w-10 origin-left rounded bg-gradient-to-r from-[#22c55e] to-[#eab308] transition-all duration-500 group-hover:w-24" />
                      <h3 className="font-display text-3xl leading-none">{s.label}</h3>
                      <p className="mt-2 text-sm leading-snug text-white/75">{s.desc}</p>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#fde68a]">Explore <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span></span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FlyAnywhere caption="What we automate" lead="We build" items={REACH} mark="Technology" />

      <Collage
        tag="Our product · Garage Bill"
        lines={["Wrenches", "to", "Wallets."]}
        text="Billing, invoicing and workshop management built for garages and service centres — designed, run and supported by Netkathir."
        cta="See Garage Bill"
        href="/products"
        main="/images/garage-bill/garage-owners.jpg"
        floats={["/images/garage-bill/digital-invoicing.jpg", "/images/garage-bill/mechanics.jpg"]}
        sticker="Built in-house"
      />

      {/* ───────────── SERVICE GROUPS ───────────── */}
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#14532d]/10 bg-white px-4 py-1.5 text-sm font-semibold text-[#15803d] shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-[#eab308]" />Capabilities</p>
              <h2 data-split className="font-display text-[clamp(2.2rem,5vw,4.5rem)] leading-[1.02]">Built for what&apos;s next.</h2>
            </div>
            <Link href="/services" className="btn">All services →</Link>
          </div>
          <div data-stagger className="grid gap-5 md:grid-cols-2">
            {SERVICE_GROUPS.map((g, i) => (
              <Link
                key={g.name}
                href="/services"
                className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-[#14532d]/10 bg-white p-8 shadow-[0_24px_60px_-34px_rgba(20,83,45,0.45)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_34px_70px_-30px_rgba(20,83,45,0.6)]"
              >
                <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-[0.18] bg-gradient-to-r from-[#14532d] via-[#22a559] to-[#eab308] transition-transform duration-700 group-hover:scale-x-100" />
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#14532d] to-[#22a559] font-display text-lg font-bold text-white shadow-[0_10px_20px_-8px_rgba(21,128,61,0.8)]">0{i + 1}</span>
                  <span className="rounded-full bg-[#fef3c7] px-3 py-1 text-xs font-bold text-[#92620a]">{g.items.length} services</span>
                </div>
                <h3 className="mt-6 font-display text-[1.7rem] font-semibold leading-tight">{g.name}</h3>
                <p className="mt-2 max-w-md text-[0.95rem] text-muted">{g.blurb}</p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {g.items.slice(0, 3).map((it) => (
                    <li key={it} className="rounded-full border border-[#14532d]/10 bg-[#f1f8f3] px-3 py-1.5 text-xs font-medium text-[#14532d]">{it.replace(/ \(.*\)/, "")}</li>
                  ))}
                  {g.items.length > 3 && <li className="rounded-full px-2 py-1.5 text-xs font-semibold text-[#15803d]">+{g.items.length - 3} more</li>}
                </ul>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#15803d]">Explore <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── TESTIMONIALS ───────────── */}
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-6">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#14532d]/10 bg-white px-4 py-1.5 text-sm font-semibold text-[#15803d] shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-[#eab308]" />Testimonials</p>
          <h2 data-split className="mb-8 font-display text-[clamp(2.2rem,5vw,4.5rem)] leading-[1.02]">Trusted by teams worldwide.</h2>
          <div data-stagger className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <figure key={t.org} className={`relative flex min-h-[19rem] flex-col justify-between overflow-hidden rounded-[1.75rem] border p-8 ${i === 1 ? "border-transparent bg-gradient-to-br from-[#14532d] via-[#166534] to-[#15803d] text-white shadow-[0_34px_70px_-30px_rgba(20,83,45,0.8)]" : "border-[#14532d]/10 bg-white shadow-[0_24px_60px_-34px_rgba(20,83,45,0.4)]"}`}>
                <svg viewBox="0 0 48 48" className={`h-10 w-10 ${i === 1 ? "text-[#fde68a]" : "text-[#22a559]"}`} fill="currentColor" aria-hidden><path d="M10 28c0-8 4-14 12-16l1.5 3C19 17 17 20 17 23h6v13H10V28zm18 0c0-8 4-14 12-16l1.5 3C37 17 35 20 35 23h6v13H28V28z" /></svg>
                <blockquote className={`mt-5 text-[1.12rem] font-medium leading-relaxed ${i === 1 ? "text-white" : "text-ink"}`}>{t.text}</blockquote>
                <figcaption className="mt-8 flex items-center gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-full font-display text-sm font-bold ${i === 1 ? "bg-[#fde68a] text-[#14532d]" : "bg-[#e7f5ec] text-[#14532d]"}`}>{t.who.trim().charAt(0)}</span>
                  <span className={`text-sm font-medium ${i === 1 ? "text-white/85" : "text-muted"}`}>{t.who}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── ISO ───────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="relative mx-auto w-56 h-56 mb-6 flex items-center justify-center">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="absolute inset-0 rounded-full border border-violet/60"
                style={{ animation: `pulse-ring 3.6s ease-out ${i * 1.2}s infinite` }}
              />
            ))}
            <span aria-hidden className="absolute h-40 w-40 rounded-full bg-white shadow-[0_10px_28px_-16px_rgba(20,83,45,0.45)]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMAGES.iso} alt="ISO 27001 Certified" className="relative z-10 w-40 h-40 object-contain" />
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-ice mb-4">Security &amp; Trust</p>
          <h2 data-split className="font-display text-[clamp(2.2rem,5vw,4.5rem)] leading-none">
            Proven security with ISO 27001 certification.
          </h2>
        </div>
      </section>

      {/* ───────────── CTA ───────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 data-split className="font-display text-[clamp(2.4rem,7vw,6.5rem)] leading-[0.95] max-w-5xl mb-8">
            We build your future with AI &amp; ERP.
          </h2>
          <div data-stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              ["Custom Solutions", "Designed around how you actually work."],
              ["Future-Ready Tech", "Modern stacks that last."],
              ["Proven Track Record", "Delivered for clients across 6 countries."],
              ["End-to-End Services", "From strategy to launch to support."],
            ].map(([t, d]) => (
              <div key={t} className="border-t border-violet/50 pt-6">
                <h3 className="font-display text-2xl mb-2">{t}</h3>
                <p className="text-muted text-sm">{d}</p>
              </div>
            ))}
          </div>
          <Link href="/contact#contact-form" data-magnetic className="btn btn-solid mt-8">
            Get Started Now →
          </Link>
        </div>
      </section>
    </>
  );
}
