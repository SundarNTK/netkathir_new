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
  const goTo = useRef<(i: number) => void>(() => {});

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
      // clicking a tab scrolls to that step (the timeline is scroll-driven, so we aim at its progress)
      goTo.current = (i: number) => {
        const st = tl.scrollTrigger;
        if (!st) return;
        const prog = E + i * seg + seg * 0.4;
        window.scrollTo({ top: st.start + (st.end - st.start) * prog, behavior: "smooth" });
      };
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
              <li key={a.name} data-sr-i data-on="0" className="group min-w-0 flex-1 opacity-45 transition-opacity duration-500 hover:opacity-90 data-[on='1']:opacity-100">
                <button type="button" onClick={() => goTo.current(i)} aria-label={`Go to ${a.name}`} className="block w-full cursor-pointer pointer-events-auto text-left">
                  <span className="block truncate font-mono text-[0.62rem] font-bold uppercase tracking-widest">0{i + 1} · {a.name.split(" ")[0]}</span>
                  <span className="relative mt-2 block h-[3px] overflow-hidden rounded bg-current/20 transition-all group-hover:h-[5px]">
                    <span data-sr-fill className="absolute inset-0 origin-left rounded bg-current" />
                  </span>
                </button>
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
      const enter = (trigger: Element, start = "top 80%", end = "top 25%") => ({ trigger, start, end, scrub: 0.7 });
      const q = (x: string) => root.querySelector<HTMLElement>(x);
      const m = q("[data-c-main]");
      const a = q("[data-c-a]");
      const b = q("[data-c-b]");
      const s = q("[data-c-s]");

      // dome edge: the section rises into place as the page above leaves
      gsap.fromTo(root, { y: 70 }, { y: 0, ease: "none", scrollTrigger: { trigger: root, start: "top 100%", end: "top 55%", scrub: 0.6 } });

      // the contour lines draw themselves, then drift
      root.querySelectorAll<SVGPathElement>("[data-c-topo] path").forEach((p, i) => {
        gsap.fromTo(p, { strokeDasharray: 2400, strokeDashoffset: 2400 }, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: root, start: "top 90%", end: `top ${20 - i * 4}%`, scrub: 0.8 } });
      });
      gsap.fromTo(q("[data-c-topo]"), { yPercent: 8 }, { yPercent: -8, ease: "none", scrollTrigger: st(root) });

      // headline: letters rise out of a mask, line by line, tied to the scroll
      root.querySelectorAll<HTMLElement>("[data-c-line]").forEach((line, i) => {
        const chs = line.querySelectorAll("[data-c-ch]");
        gsap.fromTo(chs, { yPercent: 118, rotateX: -75, opacity: 0, transformPerspective: 700 }, { yPercent: 0, rotateX: 0, opacity: 1, stagger: 0.04, ease: "none", scrollTrigger: enter(root, `top ${78 - i * 6}%`, `top ${34 - i * 6}%`) });
      });
      gsap.fromTo(q("[data-c-tag]"), { x: -40, opacity: 0 }, { x: 0, opacity: 1, ease: "none", scrollTrigger: enter(root, "top 80%", "top 50%") });
      const para = q("[data-c-p]");
      if (para) {
        para.innerHTML = (para.textContent ?? "").split(/\s+/).map((w) => `<span style="opacity:.15">${w}</span>`).join(" ");
        gsap.to(para.querySelectorAll("span"), { opacity: 1, stagger: 0.12, ease: "none", scrollTrigger: { trigger: para, start: "top 85%", end: "bottom 50%", scrub: true } });
      }
      gsap.fromTo(q("[data-c-cta]"), { y: 40, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, ease: "none", scrollTrigger: enter(root, "top 40%", "top 5%") });

      // pictures: each one is unmasked by a wipe from a different side, then keeps drifting at its own speed
      const wipe = (el: HTMLElement | null, from: string, y0: number, y1: number, rot0: number, rot1: number, delay: number) => {
        if (!el) return;
        const img = el.querySelector("img");
        gsap.fromTo(el, { clipPath: from }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: enter(root, `top ${82 - delay}%`, `top ${30 - delay}%`) });
        if (img) gsap.fromTo(img, { scale: 1.5 }, { scale: 1, ease: "none", scrollTrigger: st(root) });
        gsap.fromTo(el, { y: y0, rotate: rot0 }, { y: y1, rotate: rot1, ease: "none", scrollTrigger: st(root) });
      };
      wipe(m, "inset(100% 0% 0% 0%)", 90, -50, 0, 0, 0);
      wipe(a, "inset(0% 0% 0% 100%)", 220, -170, 5, -3, 8);
      wipe(b, "inset(0% 100% 0% 0%)", 260, -90, -6, 2, 14);
      if (s) {
        gsap.fromTo(s, { scale: 0, rotate: -120 }, { scale: 1, rotate: 0, ease: "back.out(1.8)", scrollTrigger: { trigger: root, start: "top 35%", toggleActions: "play none none reverse" } });
        gsap.fromTo(s, { y: 120 }, { y: -120, ease: "none", scrollTrigger: st(root), immediateRender: false, overwrite: false });
      }
      const ring = q("[data-c-ring]");
      if (ring) gsap.fromTo(ring, { rotate: 0 }, { rotate: 300, ease: "none", scrollTrigger: st(root) });
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
          <p data-c-tag className="mb-5 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#14532d]">
            <span className="h-2 w-2 rounded-full bg-[#84cc16]" />
            {tag}
          </p>
          <h2 className="font-display text-[clamp(3rem,7.4vw,6.6rem)] leading-[0.98] tracking-[-0.02em] text-[#10241a]">
            {lines.map((ln, li) => (
              <span key={li} data-c-line className="block overflow-hidden pb-[0.14em]">
                {ln.split("").map((ch, k) => (
                  <span key={k} data-c-ch className="inline-block" style={{ color: li === 2 ? `hsl(${150 - (k / Math.max(1, ln.length - 1)) * 105} ${62 + (k % 2) * 4}% ${30 + (k / Math.max(1, ln.length - 1)) * 18}%)` : undefined }}>
                    {ch === " " ? " " : ch}
                  </span>
                ))}
              </span>
            ))}
          </h2>
          <p data-c-p className="mt-8 max-w-md text-lg leading-relaxed text-[#10241a]/80">{text}</p>
          <Link data-c-cta href={href} className="mt-8 inline-flex items-center gap-2 rounded-md bg-[#d4f63a] px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-[#10241a] shadow-[0_14px_30px_-14px_rgba(132,204,22,0.9)] transition-transform hover:-translate-y-1">
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
            <span data-c-ring aria-hidden className="pointer-events-none absolute -inset-2 rounded-full border-2 border-dashed border-[#eab308]/80" />
            <span className="relative px-2">{sticker}</span>
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

/* ──────────────────────────────────────────────────────────────
   ClientReel — a pinned horizontal reel of big client cards. The cards glide sideways as you scroll,
   turn and scale toward the centre, and the whole section tints to the card in focus.
   ────────────────────────────────────────────────────────────── */
const REEL_TONES: [string, string, string][] = [
  ["#e3f8ec", "#a7f3d0", "#065f46"],
  ["#fff6d8", "#fde68a", "#78350f"],
  ["#e4f9ef", "#86efac", "#14532d"],
  ["#e0f7f4", "#99f6e4", "#134e4a"],
  ["#f0fbd8", "#d9f99d", "#365314"],
  ["#fff3cf", "#fcd34d", "#713f12"],
  ["#e5f7ea", "#bbf7d0", "#14532d"],
  ["#e2f8f1", "#a7f3d0", "#064e3b"],
  ["#fdf6c8", "#fde047", "#713f12"],
];
const SECTORS: Record<string, string> = {
  "MedConnect AI": "Healthcare · AI",
  HEB: "Public sector · Bookings",
  "Auroville Learning": "Education",
  WhyScience: "Education",
  "Meena Fiberglas Industries": "Manufacturing",
  APPGM: "Portal · Malaysia",
};

export function ClientReel({ clients, notes }: { clients: { name: string; logo: string }[]; notes: Record<string, string> }) {
  const sec = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = sec.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const track = root.querySelector<HTMLElement>("[data-rl-track]")!;
      const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-rl-card]"));
      const plates = Array.from(root.querySelectorAll<HTMLElement>("[data-rl-plate]"));
      const counter = root.querySelector<HTMLElement>("[data-rl-now]");
      const bar = root.querySelector<HTMLElement>("[data-rl-bar]");
      const n = cards.length;
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      let current = -1;
      const paint = () => {
        const vw = window.innerWidth;
        let best = 0;
        let bestD = 1e9;
        cards.forEach((c, i) => {
          const r = c.getBoundingClientRect();
          const off = (r.left + r.width / 2 - vw / 2) / vw; // -1 .. 1, 0 = centred
          const a = Math.abs(off);
          gsap.set(c, { rotateY: off * -16, scale: 1 - Math.min(0.2, a * 0.2), opacity: 1 - Math.min(0.55, a * 0.6), transformPerspective: 1200 });
          gsap.set(plates[i], { x: off * 70 });
          if (a < bestD) {
            bestD = a;
            best = i;
          }
        });
        if (best !== current) {
          current = best;
          if (counter) counter.textContent = String(best + 1).padStart(2, "0");
          gsap.to(root, { backgroundColor: REEL_TONES[best % REEL_TONES.length][0], duration: 0.7, ease: "power2.out", overwrite: "auto" });
        }
      };
      gsap.set(root, { backgroundColor: REEL_TONES[0][0] });
      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => `+=${dist() + window.innerHeight * 0.5}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (bar) bar.style.transform = `scaleX(${self.progress.toFixed(3)})`;
            paint();
          },
        },
      });
      paint();
      return () => {
        tween.kill();
        gsap.set(root, { clearProps: "backgroundColor" });
      };
    });
    return () => mm.revert();
  }, [clients.length]);

  return (
    <section ref={sec} data-nolift className="relative overflow-hidden bg-[#e3f8ec]">
      {/* desktop: pinned reel */}
      <div className="hidden h-screen flex-col justify-center md:flex">
        <div className="mx-auto mb-8 flex w-full max-w-7xl items-end justify-between gap-6 px-6 pt-20">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-[#15803d]">Everyone we have worked with</p>
            <h2 className="font-display text-[clamp(2.2rem,4.6vw,4.2rem)] leading-[1] text-[#0a2417]">Clients who trust us.</h2>
          </div>
          <div className="text-right font-mono text-xs uppercase tracking-[0.3em] text-[#0a2417]/70">
            <span data-rl-now className="font-display text-5xl normal-case tracking-normal text-[#0a2417]">01</span> / {String(clients.length).padStart(2, "0")}
            <span className="mt-3 block h-[3px] w-40 overflow-hidden rounded bg-[#0a2417]/15">
              <span data-rl-bar className="block h-full origin-left bg-gradient-to-r from-[#14532d] to-[#eab308]" style={{ transform: "scaleX(0)" }} />
            </span>
          </div>
        </div>
        <div data-rl-track className="flex w-max items-center gap-8 px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] pb-10">
          {clients.map((c, i) => {
            const t = REEL_TONES[i % REEL_TONES.length];
            return (
              <article key={c.name} data-rl-card className="relative flex h-[min(30rem,58vh)] w-[min(44rem,66vw)] shrink-0 flex-col justify-between overflow-hidden rounded-[2rem] border border-white/70 p-8 shadow-[0_40px_80px_-40px_rgba(20,83,45,0.55)] will-change-transform" style={{ background: `linear-gradient(145deg, #ffffff 0%, ${t[0]} 40%, ${t[1]} 100%)`, color: t[2] }}>
                <span aria-hidden className="pointer-events-none absolute -bottom-16 -right-6 font-display text-[18rem] font-bold leading-none opacity-[0.1]">{String(i + 1).padStart(2, "0")}</span>
                <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-2 border-current opacity-10" />
                <span aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full border border-current opacity-10" />
                <span className="absolute right-7 top-6 z-10 font-mono text-xs font-bold uppercase tracking-[0.25em] opacity-70">{String(i + 1).padStart(2, "0")} / {String(clients.length).padStart(2, "0")}</span>
                {/* the client logo hangs on the wall like a framed picture */}
                <div data-rl-plate className="relative mx-auto mt-7 w-[min(21rem,58%)]">
                  <svg aria-hidden viewBox="0 0 160 40" className="absolute -top-9 left-1/2 h-10 w-40 -translate-x-1/2" fill="none">
                    <path d="M22 40 L80 8 L138 40" stroke="#a8761a" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="80" cy="7" r="5" fill="#8a6414" />
                    <circle cx="78.5" cy="5.5" r="1.8" fill="#f6dc8a" />
                  </svg>
                  <div className="rounded-[6px] bg-[linear-gradient(145deg,#fbe9a8_0%,#d9ad3f_38%,#a97a1c_62%,#f1d27c_100%)] p-[10px] shadow-[0_34px_46px_-22px_rgba(0,0,0,0.55),0_2px_0_rgba(255,255,255,0.6)_inset]">
                    <div className="rounded-[3px] bg-[#fffaf0] p-[10px] shadow-[inset_0_0_0_1px_rgba(138,100,20,0.35),inset_0_6px_14px_rgba(0,0,0,0.12)]">
                      <div className="relative aspect-[16/10] bg-white shadow-[inset_0_0_14px_rgba(0,0,0,0.08)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.logo} alt={c.name} className="absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] object-contain" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  {SECTORS[c.name] && <span className="mb-3 inline-block rounded-full bg-white/70 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.18em]">{SECTORS[c.name]}</span>}
                  <h3 className="font-display text-[clamp(2rem,3.6vw,3.3rem)] leading-[1.02]">{c.name}</h3>
                  <p className="mt-2 max-w-md text-[0.95rem] opacity-80">{notes[c.name] ?? "Delivered by Netkathir."}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* mobile / reduced motion: a simple stack */}
      <div className="space-y-4 px-4 py-14 md:hidden">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#15803d]">Everyone we have worked with</p>
        <h2 data-split className="font-display text-[clamp(2rem,8vw,3rem)] leading-none text-[#0a2417]">Clients who trust us.</h2>
        {clients.map((c, i) => {
          const t = REEL_TONES[i % REEL_TONES.length];
          return (
            <div key={c.name} data-reveal className="rounded-3xl p-5 shadow-sm" style={{ background: `linear-gradient(145deg,#fff,${t[0]} 45%,${t[1]})`, color: t[2] }}>
              <div className="grid h-24 w-44 place-items-center rounded-xl bg-white p-3 shadow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.logo} alt={c.name} className="max-h-full max-w-full object-contain" />
              </div>
              <h3 className="mt-4 font-display text-2xl">{c.name}</h3>
              <p className="mt-1 text-sm opacity-80">{notes[c.name] ?? "Delivered by Netkathir."}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
