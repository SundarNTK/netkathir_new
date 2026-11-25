"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ──────────────────────────────────────────────────────────────
   ServiceReveal — a tile that grows into a full panel as you scroll,
   then each service area opens in turn with its offering details.
   ────────────────────────────────────────────────────────────── */
export type Area = { name: string; blurb: string; items: string[]; tags: string[]; image: string; bg: string; ink: string; accent: string };

export function ServiceReveal({ areas }: { areas: Area[] }) {
  const sec = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = sec.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const panel = root.querySelector<HTMLElement>("[data-sr-panel]")!;
      const groups = Array.from(root.querySelectorAll<HTMLElement>("[data-sr-g]"));
      const tabs = Array.from(root.querySelectorAll<HTMLElement>("[data-sr-i]"));
      const fills = Array.from(root.querySelectorAll<HTMLElement>("[data-sr-fill]"));
      const imgs = Array.from(root.querySelectorAll<HTMLElement>("[data-sr-img]"));
      const chips = Array.from(root.querySelectorAll<HTMLElement>("[data-sr-chip]"));
      const head = root.querySelector<HTMLElement>("[data-sr-head]")!;
      const n = groups.length;
      const E = 0.16; // expand phase
      const seg = (1 - E) / n;
      gsap.set(groups, { autoAlpha: 0 });
      gsap.set(imgs, { clipPath: "inset(100% 0% 0% 0%)", scale: 1.18 });
      gsap.set(chips, { autoAlpha: 0, y: 40, scale: 0.9 });
      gsap.set(fills, { scaleX: 0 });
      groups.forEach((g) => {
        gsap.set(g.querySelectorAll("[data-sr-n]"), { yPercent: 45, autoAlpha: 0, rotate: 4 });
        gsap.set(g.querySelectorAll("[data-sr-a]"), { y: 40, autoAlpha: 0 });
        gsap.set(g.querySelectorAll("[data-sr-x]"), { x: -34, autoAlpha: 0 });
        gsap.set(g.querySelectorAll("[data-sr-t]"), { scale: 0.7, autoAlpha: 0 });
      });

      const tl = gsap.timeline({ scrollTrigger: { trigger: root, start: "top top", end: `+=${n * 1500 + 700}`, pin: true, scrub: 0.7, anticipatePin: 1 } });
      tl.to({}, { duration: 1 }, 0); // fixes total length at 1
      tl.fromTo(panel, { clipPath: "inset(16% 26% 16% 26% round 3rem)", scale: 0.92 }, { clipPath: "inset(0% 0% 0% 0% round 1.75rem)", scale: 1, ease: "none", duration: E }, 0);
      tl.fromTo(head, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -60, ease: "none", duration: E * 0.7 }, 0);
      groups.forEach((g, i) => {
        const s = E + i * seg;
        const num = g.querySelectorAll("[data-sr-n]");
        const a = g.querySelectorAll("[data-sr-a]");
        const xs = g.querySelectorAll("[data-sr-x]");
        const ts = g.querySelectorAll("[data-sr-t]");
        // colours of the panel follow the step
        tl.to(panel, { backgroundColor: areas[i].bg, "--sr-ink": areas[i].ink, duration: 0.03, ease: "none" }, s);
        // picture wipes up over the previous one, then slowly settles
        tl.to(imgs[i], { clipPath: "inset(0% 0% 0% 0%)", duration: 0.05, ease: "power2.inOut" }, s);
        tl.to(imgs[i], { scale: 1, duration: seg, ease: "none" }, s);
        tl.to(chips[i], { autoAlpha: 1, y: 0, scale: 1, duration: 0.05, ease: "back.out(1.6)" }, s + 0.03);
        // text arrives piece by piece
        tl.to(g, { autoAlpha: 1, duration: 0.01 }, s);
        tl.to(num, { yPercent: 0, autoAlpha: 1, rotate: 0, duration: 0.06, ease: "power3.out" }, s + 0.005);
        tl.to(a, { y: 0, autoAlpha: 1, stagger: 0.012, duration: 0.05, ease: "power3.out" }, s + 0.012);
        tl.to(xs, { x: 0, autoAlpha: 1, stagger: 0.01, duration: 0.05, ease: "power3.out" }, s + 0.03);
        tl.to(ts, { scale: 1, autoAlpha: 1, stagger: 0.008, duration: 0.04, ease: "back.out(2)" }, s + 0.06);
        // progress line of this step fills while it is on screen
        tl.to(fills[i], { scaleX: 1, duration: seg, ease: "none" }, s);
        if (i < n - 1) {
          const o = s + seg - 0.045;
          tl.to(xs, { x: 30, autoAlpha: 0, stagger: 0.004, duration: 0.03, ease: "power2.in" }, o);
          tl.to(a, { y: -30, autoAlpha: 0, stagger: 0.004, duration: 0.035, ease: "power2.in" }, o);
          tl.to(num, { yPercent: -45, autoAlpha: 0, duration: 0.035, ease: "power2.in" }, o);
          tl.to(ts, { scale: 0.7, autoAlpha: 0, duration: 0.03 }, o);
          tl.to(chips[i], { autoAlpha: 0, y: -30, duration: 0.03 }, o);
          tl.to(g, { autoAlpha: 0, duration: 0.005 }, s + seg - 0.006);
        }
      });
      tl.eventCallback("onUpdate", () => {
        const p = tl.progress();
        const k = p < E ? -1 : Math.min(n - 1, Math.floor((p - E) / seg));
        tabs.forEach((el, j) => el.setAttribute("data-on", j === k ? "1" : "0"));
      });
    });
    return () => mm.revert();
  }, [areas]);

  return (
    <section ref={sec} data-nolift className="relative bg-white">
      {/* desktop: pinned expanding panel */}
      <div className="relative hidden h-screen items-center justify-center overflow-hidden px-3 md:flex">
        <div data-sr-head className="absolute inset-x-0 top-[14vh] z-10 text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-[#15803d]">What we offer</p>
          <h2 className="font-display text-[clamp(2.4rem,5.6vw,5rem)] leading-[1] text-[#0a2417]">Twenty capabilities.<br />Four disciplines.</h2>
        </div>
        <div data-sr-panel className="relative mt-16 h-[calc(100vh-7rem)] w-full max-w-[84rem] overflow-hidden" style={{ backgroundColor: areas[0].bg, clipPath: "inset(16% 26% 16% 26% round 3rem)", ["--sr-ink" as string]: areas[0].ink, color: "var(--sr-ink)" }}>
          {/* right: pictures wipe over each other */}
          <div className="absolute inset-y-0 right-0 w-[40%] overflow-hidden">
            {areas.map((a) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={a.name} data-sr-img src={a.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ))}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
            {areas.map((a, i) => (
              <div key={a.name} data-sr-chip className="absolute bottom-5 left-5 max-w-[16rem] rounded-2xl bg-white/95 px-4 py-3 shadow-xl">
                <p className="font-mono text-[0.8rem] font-extrabold uppercase tracking-[0.2em] text-black">0{i + 1} / 0{areas.length}</p>
                <p className="mt-1 font-display text-xl leading-tight" style={{ color: a.ink === "#ecfdf5" ? "#052e16" : a.ink }}>{a.name}</p>
                <p className="text-xs text-[#3f5a4a]">{a.items.length} services · {a.tags.slice(0, 2).join(" · ")}</p>
              </div>
            ))}
          </div>

          {/* step tabs with progress lines */}
          <ol className="absolute left-0 top-0 z-10 flex w-[60%] gap-3 px-8 pt-7 lg:px-12">
            {areas.map((a, i) => (
              <li key={a.name} data-sr-i data-on="0" className="group min-w-0 flex-1 opacity-45 transition-opacity duration-500 data-[on='1']:opacity-100">
                <span className="block truncate font-mono text-[0.62rem] font-bold uppercase tracking-widest">0{i + 1} · {a.name.split(" ")[0]}</span>
                <span className="relative mt-2 block h-[3px] overflow-hidden rounded bg-current/20">
                  <span data-sr-fill className="absolute inset-0 origin-left rounded bg-current" />
                </span>
              </li>
            ))}
          </ol>

          {/* content */}
          <div className="absolute inset-y-0 left-0 w-[60%]">
            {areas.map((a, i) => (
              <div key={a.name} data-sr-g className="absolute inset-0 flex flex-col justify-center px-8 pt-10 lg:px-12" style={{ color: a.ink }}>
                <span data-sr-n className="pointer-events-none absolute right-6 top-24 font-display text-[6rem] leading-none opacity-[0.09] lg:text-[8rem]">0{i + 1}</span>
                <p data-sr-a className="relative font-mono text-xs uppercase tracking-[0.3em]" style={{ color: a.accent }}>{a.items.length} services</p>
                <h3 data-sr-a className="relative mt-3 font-display text-[clamp(2rem,3.9vw,3.6rem)] leading-[0.98]">{a.name}</h3>
                <p data-sr-a className="relative mt-3 max-w-md text-[0.95rem] opacity-75">{a.blurb}</p>
                <ul className="relative mt-6 grid max-w-xl grid-cols-1 gap-x-8 gap-y-1.5 xl:grid-cols-2">
                  {a.items.map((s) => (
                    <li key={s} data-sr-x className="flex items-start gap-2 text-[0.88rem] leading-snug">
                      <span className="mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: a.accent }} />
                      {s.replace(/ \(.*\)/, "")}
                    </li>
                  ))}
                </ul>
                <div className="relative mt-6 flex flex-wrap gap-2">
                  {a.tags.map((t) => (
                    <span key={t} data-sr-t className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: `${a.ink}33`, background: "rgba(255,255,255,.55)", color: a.ink === "#ecfdf5" ? "#052e16" : a.ink }}>{t}</span>
                  ))}
                </div>
                <Link data-sr-a href="/contact#contact-form" className="btn btn-solid relative mt-7 w-fit">Discuss this →</Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* mobile / reduced motion: simple stacked cards */}
      <div className="space-y-5 px-4 py-14 md:hidden">
        <h2 data-split className="font-display text-[clamp(2rem,8vw,3rem)] leading-none text-[#0a2417]">Twenty capabilities. Four disciplines.</h2>
        {areas.map((a, i) => (
          <div key={a.name} data-reveal className="overflow-hidden rounded-3xl border border-[#14532d]/10 shadow-sm" style={{ background: a.bg, color: a.ink }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.image} alt="" className="h-40 w-full object-cover" />
            <div className="p-5">
              <p className="font-mono text-xs" style={{ color: a.accent }}>0{i + 1} · {a.items.length} services</p>
              <h3 className="mt-1 font-display text-2xl">{a.name}</h3>
              <p className="mt-2 text-sm opacity-75">{a.blurb}</p>
              <ul className="mt-3 space-y-1 text-sm">
                {a.items.map((s) => (
                  <li key={s} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: a.accent }} />{s.replace(/ \(.*\)/, "")}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   Collage — editorial product story: dome edge, big headline, tall hero
   image with smaller pictures floating at different scroll speeds.
   ────────────────────────────────────────────────────────────── */
export function Collage({ tag, lines, text, cta, href, main, floats, sticker }: { tag: string; lines: [string, string, string]; text: string; cta: string; href: string; main: string; floats: [string, string]; sticker: string }) {
  const sec = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = sec.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const st = (trigger: Element) => ({ trigger, start: "top bottom", end: "bottom top", scrub: 0.8 });
      const m = root.querySelector("[data-c-main]");
      const a = root.querySelector("[data-c-a]");
      const b = root.querySelector("[data-c-b]");
      const s = root.querySelector("[data-c-s]");
      const t = root.querySelectorAll("[data-c-t]");
      if (m) gsap.fromTo(m, { y: 90, scale: 0.94 }, { y: -50, scale: 1, ease: "none", scrollTrigger: st(root) });
      if (a) gsap.fromTo(a, { y: 220, rotate: 4 }, { y: -170, rotate: -3, ease: "none", scrollTrigger: st(root) });
      if (b) gsap.fromTo(b, { y: 260, rotate: -5 }, { y: -90, rotate: 2, ease: "none", scrollTrigger: st(root) });
      if (s) gsap.fromTo(s, { rotate: -40, y: 120 }, { rotate: 220, y: -120, ease: "none", scrollTrigger: st(root) });
      gsap.fromTo(t, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.12, ease: "none", scrollTrigger: { trigger: root, start: "top 70%", end: "top 15%", scrub: 0.6 } });
      gsap.fromTo(root.querySelector("[data-c-topo]"), { yPercent: 8 }, { yPercent: -8, ease: "none", scrollTrigger: st(root) });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={sec} data-nolift className="relative z-10 -mt-16 overflow-hidden bg-[#f5f4ec] pb-24 pt-32 md:pt-44" style={{ borderRadius: "50% 50% 0 0 / 6rem 6rem 0 0" }}>
      <svg data-c-topo aria-hidden className="pointer-events-none absolute inset-0 h-[115%] w-full opacity-60" viewBox="0 0 1200 800" fill="none" preserveAspectRatio="none">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M-50 ${120 + i * 120} C 200 ${40 + i * 120}, 380 ${260 + i * 110}, 620 ${150 + i * 120} S 1000 ${60 + i * 110}, 1260 ${180 + i * 120}`} stroke="#14532d" strokeOpacity=".09" strokeWidth="1.3" />
        ))}
      </svg>
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1fr_1fr]">
        <div className="relative z-10">
          <p data-c-t className="mb-5 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#14532d]">
            <span className="h-2 w-2 rounded-full bg-[#84cc16]" />
            {tag}
          </p>
          <h2 className="font-display text-[clamp(3rem,8.4vw,7.6rem)] font-bold uppercase leading-[0.86] tracking-tight text-[#10241a]">
            <span data-c-t className="block">{lines[0]}</span>
            <span data-c-t className="block">{lines[1]}</span>
            <span data-c-t className="block bg-gradient-to-r from-[#14532d] via-[#22a559] to-[#eab308] bg-clip-text font-light italic text-transparent">{lines[2]}</span>
          </h2>
          <p data-c-t className="mt-8 max-w-md text-lg leading-relaxed text-[#10241a]/80">{text}</p>
          <Link data-c-t href={href} className="mt-8 inline-flex items-center gap-2 rounded-md bg-[#d4f63a] px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-[#10241a] shadow-[0_14px_30px_-14px_rgba(132,204,22,0.9)] transition-transform hover:-translate-y-1">
            {cta} <span aria-hidden>↗</span>
          </Link>
        </div>
        <div className="relative mx-auto h-[34rem] w-full max-w-xl sm:h-[42rem]">
          <div data-c-main className="absolute left-[14%] top-0 h-[78%] w-[62%] overflow-hidden shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={main} alt="" className="h-full w-full object-cover" />
          </div>
          <div data-c-a className="absolute right-0 top-[18%] h-[26%] w-[40%] overflow-hidden shadow-[0_30px_60px_-30px_rgba(0,0,0,0.55)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={floats[0]} alt="" className="h-full w-full object-cover" />
          </div>
          <div data-c-b className="absolute bottom-0 left-0 h-[34%] w-[38%] overflow-hidden bg-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.55)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={floats[1]} alt="" className="h-full w-full object-cover" />
          </div>
          <div data-c-s className="absolute bottom-[4%] right-[4%] grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-[#14532d] to-[#22a559] text-center font-display text-sm font-bold uppercase leading-tight text-[#fde68a] shadow-xl">
            {sticker}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   LetterWall — giant extruded letters in rows that slide against each
   other while a card floats in the middle.
   ────────────────────────────────────────────────────────────── */
export function LetterWall({ rows, title, sub, stamp }: { rows: string[]; title: string; sub: string; stamp: string }) {
  const ext = Array.from({ length: 9 }, (_, i) => `${i + 1}px ${i + 1}px 0 #0b3a1f`).join(",");
  return (
    <section data-nolift className="relative my-8 overflow-hidden bg-[#06190e] py-10">
      <div aria-hidden className="absolute inset-0 opacity-70" style={{ backgroundImage: "radial-gradient(rgba(134,239,172,.2) 1.2px, transparent 1.4px)", backgroundSize: "28px 28px" }} />
      <div className="relative space-y-1">
        {rows.map((r, i) => (
          <div key={r + i} data-scrub-x={i % 2 ? "1" : "-1"} className="flex justify-center gap-[0.35em] whitespace-nowrap font-display text-[clamp(5rem,15vw,13rem)] font-bold uppercase leading-[0.82]" style={{ color: i % 2 ? "#22c55e" : "#eab308", textShadow: ext }}>
            {Array.from({ length: 3 }).map((_, k) => (
              <span key={k}>{r}</span>
            ))}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 grid place-items-center px-4">
        <div data-reveal className="pointer-events-auto w-full max-w-md rounded-sm bg-[#efefea] p-8 text-[#06190e] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)] sm:p-10">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-[#15803d]">{stamp}</p>
          <h3 className="mt-4 font-display text-3xl leading-[1.02] sm:text-4xl">{title}</h3>
          <p className="mt-3 text-sm text-[#3f5a4a]">{sub}</p>
          <Link href="/contact" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#06190e] px-5 py-2.5 text-sm font-bold text-[#fde68a]">Start a project <span aria-hidden>→</span></Link>
        </div>
      </div>
    </section>
  );
}
