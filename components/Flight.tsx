"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* Scroll "flight" sections — a paper plane (our intro motif) that flies along a path as you scroll.
   FlightJourney: pinned, plane visits stations, background shifts day → night.
   FlyAnywhere:   pinned, "We automate ✈ …" destination list that cycles with the scroll.
   FlightStrip:   light, un-pinned plane crossing used between sections. */

export function PlaneIcon({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 26 24" className={className} style={style} aria-hidden>
      <defs>
        <linearGradient id="pl-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22c55e" />
          <stop offset="1" stopColor="#14532d" />
        </linearGradient>
      </defs>
      <polygon points="25,12 1,2 7.5,12 1,22" fill="url(#pl-g)" />
      <polygon points="25,12 7.5,12 1,22" fill="#0f3d22" opacity=".55" />
      <polyline points="25,12 7.5,12" stroke="#fde68a" strokeWidth="1.3" fill="none" />
    </svg>
  );
}

const PATH = "M0 358 C170 358 190 154 340 154 S 520 366 660 366 S 860 138 990 154 S 1130 268 1200 203";
const STOP_X = [0.1, 0.3, 0.5, 0.7, 0.9]; // stages sit at even spacing across the width, so cards never collide

export type Stop = { k: string; t: string; d: string; tags: string[]; image?: string };

export function FlightJourney({ kicker, title, stops }: { kicker: string; title: string; stops: Stop[] }) {
  const sec = useRef<HTMLElement>(null);
  const path = useRef<SVGPathElement>(null);
  const trail = useRef<SVGPathElement>(null);

  useEffect(() => {
    const root = sec.current;
    const p = path.current;
    const tr = trail.current;
    if (!root || !p || !tr) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-stop]"));
    const dots = Array.from(root.querySelectorAll<HTMLElement>("[data-dot]"));
    const plane = root.querySelector<SVGGElement>("[data-plane]")!;
    const floats = Array.from(root.querySelectorAll<HTMLElement>("[data-float]"));
    const count = root.querySelector<HTMLElement>("[data-count-now]");
    const bar = root.querySelector<HTMLElement>("[data-bar]");
    const len = p.getTotalLength();
    // length fraction at which the path reaches each stage's x position
    const FRACS = STOP_X.map((tx) => {
      let lo = 0, hi = len;
      for (let k = 0; k < 24; k++) {
        const mid = (lo + hi) / 2;
        if (p.getPointAtLength(mid).x < tx * 1200) lo = mid;
        else hi = mid;
      }
      return lo / len;
    });
    const pts = FRACS.map((f) => p.getPointAtLength(f * len));
    const place = () => {
      cards.forEach((c, i) => {
        const above = pts[i].y > 280;
        c.style.left = `${(pts[i].x / 1200) * 100}%`;
        c.style.top = `${(pts[i].y / 520) * 100}%`;
        c.dataset.side = above ? "up" : "down";
        c.style.marginTop = above ? "-22px" : "22px";
        gsap.set(c, { xPercent: -50, yPercent: above ? -100 : 0 });
      });
      dots.forEach((d, i) => {
        d.style.left = `${(pts[i].x / 1200) * 100}%`;
        d.style.top = `${(pts[i].y / 520) * 100}%`;
      });
    };
    place();

    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      root.style.setProperty("--fj-fg", "#0a2417");
      gsap.set([p, tr], { strokeDasharray: len, strokeDashoffset: len });
      gsap.set(p, { strokeDasharray: "6 12", strokeDashoffset: 0 });
      gsap.set(cards, { autoAlpha: 0, scale: 0.92, y: 26 });
      gsap.set(dots, { scale: 0.4, opacity: 0.4 });
      const on = cards.map(() => 0);
      const st = { p: 0 };
      const setP = (v: number) => {
        // plane is drawn inside the same SVG as the path, so it can never drift off the line
        const a = p.getPointAtLength(Math.max(0, v * len - 14));
        const b = p.getPointAtLength(Math.min(len, v * len + 14));
        const q = p.getPointAtLength(v * len);
        plane.setAttribute("transform", `translate(${q.x.toFixed(2)} ${q.y.toFixed(2)}) rotate(${((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI).toFixed(2)})`);
        tr.style.strokeDashoffset = String(len * (1 - v));
        const reached = FRACS.filter((f) => v >= f - 0.02).length;
        FRACS.forEach((f, i) => {
          const now = i < reached ? 1 : 0; // a stage stays fully visible once the plane has reached it
          if (now === on[i]) return;
          on[i] = now;
          gsap.to(cards[i], { autoAlpha: now, scale: now ? 1 : 0.92, y: now ? 0 : 26, duration: 0.6, ease: "power3.out", overwrite: "auto" });
          gsap.to(dots[i], { scale: now ? 1 : 0.4, opacity: now ? 1 : 0.4, duration: 0.4, overwrite: "auto" });
        });
        const n = Math.max(1, reached);
        if (count) count.textContent = `0${n}`;
        if (bar) bar.style.transform = `scaleX(${v.toFixed(3)})`;
      };
      setP(0);
      const tl = gsap.timeline({ scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "+=4200",
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      tl.to(st, { p: 1, ease: "none", duration: 0.82, onUpdate: () => setP(st.p) }, 0);
      tl.to({}, { duration: 0.18 }, 0.82); // hold at the end so every stage can be read
      // stays light: white to a soft mint
      tl.fromTo(root, { backgroundColor: "#ffffff" }, { backgroundColor: "#eefaf1", ease: "none", duration: 0.82 }, 0);
      floats.forEach((f, i) => tl.fromTo(f, { x: 80 + i * 40 }, { x: -(260 + i * 140), ease: "none", duration: 1 }, 0));
    });
    mm.add("(max-width: 767px), (prefers-reduced-motion: reduce)", () => {
      gsap.set(tr, { strokeDasharray: "none", strokeDashoffset: 0 });
      gsap.set(cards, { autoAlpha: 1, scale: 1, y: 0 });
      gsap.set(dots, { scale: 1, opacity: 1 });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={sec} data-nolift className="relative overflow-hidden bg-white text-[color:var(--fj-fg,#0a2417)]" style={{ ["--fj-fg" as string]: "#0a2417" }}>
      {/* soft clouds / dust that drift past */}
      {[
        ["12%", "62%", "34rem", "9rem"],
        ["60%", "18%", "28rem", "7rem"],
        ["30%", "84%", "40rem", "10rem"],
      ].map(([l, t, w, h], i) => (
        <span key={i} data-float aria-hidden className="pointer-events-none absolute rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,255,255,.95),rgba(255,255,255,0))] opacity-70 mix-blend-soft-light md:opacity-100" style={{ left: l, top: t, width: w, height: h }} />
      ))}

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-24 md:py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-2">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#14532d]/15 bg-white px-4 py-1.5 text-sm font-semibold text-[#15803d] shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#eab308]" />
              {kicker}
            </p>
            <h2 className="font-display text-[clamp(2rem,4.4vw,3.8rem)] leading-[1.02]">{title}</h2>
          </div>
          <div className="hidden items-center gap-4 font-mono text-xs uppercase tracking-[0.3em] opacity-70 md:flex">
            <span>
              Stage <b data-count-now className="text-base">01</b> / 0{stops.length}
            </span>
            <span className="relative h-[3px] w-40 overflow-hidden rounded bg-current/20">
              <span data-bar className="absolute inset-0 origin-left bg-gradient-to-r from-[#22c55e] to-[#eab308]" style={{ transform: "scaleX(0)" }} />
            </span>
          </div>
        </div>

        {/* desktop: plane flies along the path */}
        <div className="relative mx-auto hidden w-[min(100%,calc((100vh-14rem)*2.3))] md:block" style={{ aspectRatio: "1200 / 520" }}>
          <svg viewBox="0 0 1200 520" className="absolute inset-0 h-full w-full overflow-visible" fill="none">
            <defs>
              <linearGradient id="fj-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1200" y2="0">
                <stop offset="0" stopColor="#22c55e" />
                <stop offset="0.6" stopColor="#84cc16" />
                <stop offset="1" stopColor="#eab308" />
              </linearGradient>
            </defs>
            <path ref={path} d={PATH} stroke="currentColor" strokeOpacity=".35" strokeWidth="2" strokeLinecap="round" />
            <path ref={trail} d={PATH} stroke="url(#fj-grad)" strokeWidth="5" strokeLinecap="round" />
          </svg>
          {stops.map((s, i) => (
            <span key={`d${i}`} data-dot aria-hidden className="absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-[#16a34a] shadow-[0_0_0_6px_rgba(34,197,94,0.25)]" />
          ))}
          {stops.map((s, i) => (
            <article key={s.k} data-stop className="absolute z-20 w-[13.75rem] rounded-2xl border border-[#14532d]/10 bg-white p-4 text-[#0a2417] shadow-[0_26px_60px_-30px_rgba(0,0,0,0.5)]">
              {s.image && (
                <div className="relative -mx-1 -mt-1 mb-3 h-24 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.image} alt="" className="h-full w-full object-cover" />
                  <span className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-[#14532d] to-[#22a559] px-2.5 py-0.5 font-mono text-[0.65rem] font-bold tracking-widest text-white">0{i + 1}</span>
                </div>
              )}
              <div className="mb-2 flex items-center justify-between">
                <span className={`rounded-full bg-gradient-to-r from-[#14532d] to-[#22a559] px-2.5 py-0.5 font-mono text-[0.65rem] font-bold tracking-widest text-white ${s.image ? "hidden" : ""}`}>0{i + 1}</span>
                <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-[#15803d]">{s.k}</span>
              </div>
              <h3 className="font-display text-lg leading-tight">{s.t}</h3>
              <p className="mt-1 text-[0.8rem] leading-snug text-[#3f5a4a]">{s.d}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.tags.map((t) => (
                  <span key={t} className="rounded-full bg-[#ecfccb] px-2 py-0.5 text-[0.65rem] font-semibold text-[#14532d]">{t}</span>
                ))}
              </div>
            </article>
          ))}
          <svg viewBox="0 0 1200 520" className="pointer-events-none absolute inset-0 z-30 h-full w-full overflow-visible" fill="none" aria-hidden>
            <defs>
              <linearGradient id="fj-pl" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#22c55e" />
                <stop offset="1" stopColor="#14532d" />
              </linearGradient>
            </defs>
            <g data-plane transform="translate(0 358)" style={{ filter: "drop-shadow(0 8px 8px rgba(0,0,0,0.28))" }}>
              <g transform="translate(-23 -22) scale(1.85)">
                <polygon points="25,12 1,2 7.5,12 1,22" fill="url(#fj-pl)" />
                <polygon points="25,12 7.5,12 1,22" fill="#0f3d22" opacity=".55" />
                <polyline points="25,12 7.5,12" stroke="#fde68a" strokeWidth="1.3" />
              </g>
            </g>
          </svg>
        </div>

        {/* mobile: simple vertical flight log */}
        <ol className="relative mt-4 space-y-4 border-l-2 border-dashed border-[#16a34a]/40 pl-6 md:hidden">
          {stops.map((s, i) => (
            <li key={s.k} data-reveal className="relative rounded-2xl border border-[#14532d]/10 bg-white p-4 text-[#0a2417] shadow-sm">
              <span className="absolute -left-[2.15rem] top-5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#16a34a]" />
              <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-[#15803d]">0{i + 1} · {s.k}</p>
              <h3 className="font-display text-lg">{s.t}</h3>
              <p className="text-sm text-[#3f5a4a]">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function FlyAnywhere({ lead, items, mark, caption }: { lead: string; items: string[]; mark: string; caption?: string }) {
  const sec = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = sec.current;
    if (!root) return;
    const lis = Array.from(root.querySelectorAll<HTMLElement>("[data-li]"));
    const list = root.querySelector<HTMLElement>("[data-list]")!;
    const word = root.querySelector<HTMLElement>("[data-mark]");
    const now = root.querySelector<HTMLElement>("[data-now]");
    const line = root.querySelector<HTMLElement>("[data-line]");
    const rowH = lis[0].offsetHeight || 56;
    const n = lis.length;
    const paint = (v: number) => {
      const f = v * (n - 1);
      gsap.set(list, { y: -f * rowH });
      lis.forEach((li, i) => {
        const d = Math.abs(i - f);
        gsap.set(li, { opacity: Math.max(0.08, 1 - d * 0.55), scale: Math.max(0.8, 1 - d * 0.08), x: d * 6 });
      });
      if (now) now.textContent = `${String(Math.round(f) + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
    };
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const st = { p: 0 };
      paint(0);
      const tl = gsap.timeline({ scrollTrigger: { trigger: root, start: "top top", end: `+=${n * 260}`, pin: true, scrub: 0.6, anticipatePin: 1 } });
      tl.to(st, { p: 1, ease: "none", duration: 1, onUpdate: () => paint(st.p) }, 0);
      if (word) tl.fromTo(word, { xPercent: 12 }, { xPercent: -22, ease: "none", duration: 1 }, 0);
      if (line) tl.fromTo(line, { scaleX: 0.25 }, { scaleX: 1, ease: "none", duration: 0.25 }, 0);
    });
    mm.add("(prefers-reduced-motion: reduce)", () => paint(0));
    return () => mm.revert();
  }, []);

  return (
    <section ref={sec} data-nolift className="relative overflow-hidden bg-[#07210f] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#07210f] to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(rgba(134,239,172,.18) 1.2px, transparent 1.4px)", backgroundSize: "38px 38px", maskImage: "radial-gradient(ellipse at 50% 55%, #000, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 55%, #000, transparent 70%)" }} />
      <div data-mark aria-hidden className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap font-display text-[clamp(9rem,26vw,24rem)] font-semibold leading-none text-white/[0.05]">
        {mark}
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6">
        <p className="mb-8 font-mono text-xs uppercase tracking-[0.3em] text-[#86efac]">{caption ?? "Our reach"}</p>
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-8">
          <p className="text-right font-display text-[clamp(1.2rem,3.4vw,3rem)] leading-tight">{lead}</p>
          <div className="flex items-center gap-2">
            <span data-line className="hidden h-px w-12 origin-right bg-gradient-to-r from-transparent to-[#86efac] sm:block md:w-24" />
            <PlaneIcon className="h-7 w-7 sm:h-10 sm:w-10" />
            <span className="hidden h-px w-12 bg-gradient-to-r from-[#86efac] to-transparent sm:block md:w-24" />
          </div>
          <div className="relative h-[calc(var(--rows,7)*3.5rem)] overflow-hidden [--rows:7]" style={{ height: "24.5rem", maskImage: "linear-gradient(transparent, #000 30%, #000 70%, transparent)", WebkitMaskImage: "linear-gradient(transparent, #000 30%, #000 70%, transparent)" }}>
            <ul data-list className="absolute inset-x-0 top-[10.5rem] will-change-transform">
              {items.map((it) => (
                <li key={it} data-li className="flex h-14 items-center font-display text-[clamp(1.1rem,3vw,2.6rem)] leading-none will-change-transform">{it}</li>
              ))}
            </ul>
          </div>
        </div>
        <p data-now className="mt-10 font-mono text-xs tracking-[0.3em] text-white/50">01 / 01</p>
      </div>
    </section>
  );
}

export function FlightStrip({ from, to, note }: { from: string; to: string; note: string }) {
  const sec = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = sec.current;
    if (!root) return;
    const p = root.querySelector<SVGPathElement>("[data-sp]")!;
    const tr = root.querySelector<SVGPathElement>("[data-st]")!;
    const plane = root.querySelector<HTMLElement>("[data-sx]")!;
    const msg = root.querySelector<HTMLElement>("[data-sm]")!;
    const len = p.getTotalLength();
    const mm = gsap.matchMedia();
    const paint = (v: number) => {
      const a = p.getPointAtLength(Math.max(0, v * len - 3));
      const b = p.getPointAtLength(Math.min(len, v * len + 3));
      const q = p.getPointAtLength(v * len);
      gsap.set(plane, { left: `${(q.x / 1000) * 100}%`, top: `${(q.y / 180) * 100}%`, rotation: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI });
      tr.style.strokeDashoffset = String(len * (1 - v));
    };
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(tr, { strokeDasharray: len, strokeDashoffset: len });
      gsap.set(msg, { autoAlpha: 0, y: 18 });
      // The plane always starts at the beginning and flies to wherever the scroll position says it should be: on arrival it
      // visibly glides there, and afterwards it follows the scroll smoothly.
      let target = 0;
      let shown = 0;
      let shownMsg = false;
      paint(0);
      const trig = ScrollTrigger.create({ trigger: root, start: "top 92%", end: "bottom 30%", onUpdate: (self) => (target = self.progress) });
      target = trig.progress;
      const tick = () => {
        const d = target - shown;
        if (Math.abs(d) > 0.0005) {
          shown += d * 0.055;
          paint(Math.min(1, Math.max(0, shown)));
        }
        const want = shown > 0.5;
        if (want !== shownMsg) {
          shownMsg = want;
          gsap.to(msg, { autoAlpha: want ? 1 : 0, y: want ? 0 : 18, duration: 0.5, ease: "power2.out", overwrite: "auto" });
        }
      };
      gsap.ticker.add(tick);
      return () => {
        gsap.ticker.remove(tick);
        trig.kill();
      };
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(tr, { strokeDasharray: len, strokeDashoffset: 0 });
      paint(1);
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={sec} data-nolift className="relative mx-auto my-6 w-full max-w-7xl px-6">
      <div className="relative" style={{ aspectRatio: "1000 / 180", maxHeight: "11rem", margin: "0 auto" }}>
        <svg viewBox="0 0 1000 180" className="absolute inset-0 h-full w-full overflow-visible" fill="none" preserveAspectRatio="none">
          <path data-sp d="M0 140 C180 140 220 40 400 60 S 640 150 780 90 S 940 30 1000 50" stroke="#14532d" strokeOpacity=".3" strokeWidth="2" strokeDasharray="5 10" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <path data-st d="M0 140 C180 140 220 40 400 60 S 640 150 780 90 S 940 30 1000 50" stroke="#22a559" strokeWidth="4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div data-sx className="absolute z-10 h-9 w-9 -ml-[1.125rem] -mt-[1.125rem] drop-shadow-[0_8px_10px_rgba(0,0,0,0.25)]">
          <PlaneIcon className="h-full w-full" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#14532d] shadow-sm">{from}</span>
        <p data-sm className="order-last w-full text-center font-display text-lg text-[#14532d] sm:order-none sm:w-auto sm:text-2xl">{note}</p>
        <span className="rounded-full bg-gradient-to-r from-[#14532d] to-[#22a559] px-3 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-sm">{to}</span>
      </div>
    </div>
  );
}
