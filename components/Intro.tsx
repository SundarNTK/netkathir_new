"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { IntroState } from "./IntroScene";

const IntroScene = dynamic(() => import("./IntroScene"), { ssr: false });

declare global {
  interface Window {
    __nkIntro?: "playing" | "done";
  }
}

const FLAG_N = 40;
const MESSAGES = [
  "Eleven years of innovation, trust & technology.",
  "Engineering intelligent software for clients across six countries.",
  "With gratitude to every client, partner and team member on this journey.",
];
const FINALE = "Now entering the AI era.".split(" ");
const YEARS = Array.from({ length: 12 }, (_, i) => 2015 + i);

function canRender3D() {
  try {
    const c = document.createElement("canvas");
    if (!(c.getContext("webgl2") || c.getContext("webgl"))) return false;
    const nav = navigator as Navigator & { deviceMemory?: number };
    if ((nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2) return false; // very weak devices get the static logo
    return true;
  } catch {
    return false;
  }
}

/**
 * Netkathir opening (≈10 s, skippable):
 *  1. a calendar page turns 2015 → 2026,
 *  2. the real logo appears as a physical 3D object, with the "11 · YEARS OF EXCELLENCE" lockup and message,
 *  3. "Now entering the AI era." takes the screen, zooms through, and the site is revealed.
 * One timeline drives everything, the 3D scene mounts only while it is needed, and weak devices get a static logo.
 */
export default function Intro() {
  const [show, setShow] = useState(true); // rendered on the server so there is no flash of the site
  const [gl, setGl] = useState(true);
  const [sceneOn, setSceneOn] = useState(false);
  const [logoRun, setLogoRun] = useState(false); // the 3D logo canvas only renders while the logo is on screen
  const root = useRef<HTMLDivElement>(null);
  const barEl = useRef<HTMLSpanElement>(null);
  const sheetEls = useRef<(HTMLDivElement | null)[]>([]);
  const cardEl = useRef<HTMLDivElement>(null);
  const curEl = useRef<HTMLSpanElement>(null);
  const [state] = useState<IntroState>(() => ({ logo: 0, burst: 0 }));
  const tl = useRef<gsap.core.Timeline | null>(null);
  const gate = useRef({ ready: false, waiting: false, timer: 0 });
  const closed = useRef(false);
  const ldBar = useRef<HTMLSpanElement>(null);

  const resume = useCallback(() => {
    const g = gate.current;
    if (!g.waiting) return;
    g.waiting = false;
    window.clearTimeout(g.timer);
    tl.current?.resume();
  }, []);
  const readyWaiter = useRef<(() => void) | null>(null);
  const onReady = useCallback(() => {
    gate.current.ready = true;
    readyWaiter.current?.();
    resume();
  }, [resume]);

  const dismiss = useCallback(() => {
    if (closed.current) return;
    closed.current = true;
    window.clearTimeout(gate.current.timer);
    tl.current?.kill();
    window.__nkIntro = "done";
    document.documentElement.style.overflow = "";
    window.dispatchEvent(new Event("nk:intro-reveal"));
    window.dispatchEvent(new Event("nk:intro-done"));
    setSceneOn(false);
    setLogoRun(false);
    setShow(false);
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      window.__nkIntro = "done";
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced motion is only knowable on the client
      setShow(false);
      window.dispatchEvent(new Event("nk:intro-done"));
      return;
    }

    const use3D = canRender3D();
    if (!use3D) {
      setGl(false);
      gate.current.ready = true;
    }
    closed.current = false;
    window.__nkIntro = "playing";
    document.documentElement.style.overflow = "hidden";
    const compact = window.matchMedia("(max-width: 640px)").matches;

    const ctx = gsap.context(() => {
      const t = gsap.timeline({ paused: true, onComplete: dismiss }); // starts only after the loader has finished
      tl.current = t;
      const cur = curEl.current!;
      const sheets = sheetEls.current.filter(Boolean) as HTMLDivElement[];
      cur.textContent = "2015";
      gsap.set(sheets, { opacity: 0 });
      gsap.set(".i-fw-word", { yPercent: 125, opacity: 0 });
      gsap.set(".i-glow", { opacity: 0 });
      gsap.set(".i-flag-strip", { opacity: 0, x: -36 });

      // ---- 1. calendar: the page turns from 2015 to 2026, slowing a little as it lands
      t.fromTo(".i-cal", { opacity: 0, y: 26, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" }, 0)
        .fromTo(".i-track", { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.2);
      // a different, shuffled heading for each year so the rockets scatter to every side
      const headings = Array.from({ length: YEARS.length - 1 }, (_, k) => (k * 360) / (YEARS.length - 1) + (Math.random() - 0.5) * 24).sort(() => Math.random() - 0.5);
      let at = 0.7;
      for (let i = 1; i < YEARS.length; i++) {
        const from = String(YEARS[i - 1]);
        const to = String(YEARS[i]);
        const gap = 0.7 + Math.max(0, i - 8) * 0.12;
        const item = sheets[i % sheets.length];
        const paper = item.querySelector(".nk-paper") as HTMLElement;
        const word = paper.querySelector(".nk-word") as HTMLElement;
        const sheet = paper.querySelector(".nk-sheet") as HTMLElement;
        const plane = paper.querySelector(".nk-plane") as HTMLElement;
        // every year the page lands on a different side OUTSIDE the calendar (0° = up, clockwise), then leaves from there
        const a = headings[i - 1];
        const rad = (a * Math.PI) / 180;
        const card = (cardEl.current as HTMLElement).getBoundingClientRect();
        const px = Math.sin(rad) * (card.width / 2 + 120);
        const py = -Math.cos(rad) * (card.height / 2 + 120);
        const far = Math.hypot(window.innerWidth, window.innerHeight) * 0.8 + 260;
        const tx = px + Math.sin(rad) * far;
        const ty = py - Math.cos(rad) * far;
        // torn off the calendar -> flung out beside it -> folds into a paper plane -> hovers -> glides off-screen
        t.call(
          () => {
            word.textContent = from;
            cur.textContent = to;
          },
          undefined,
          at
        )
          .set(item, { opacity: 1 }, at)
          .set(paper, { x: 0, y: 0, rotate: 0, scale: 1, scaleX: 1, scaleY: 1, opacity: 1 }, at)
          .set(sheet, { opacity: 1 }, at)
          .set(word, { opacity: 1 }, at)
          .set(plane, { opacity: 0 }, at)
          .to(paper, { y: 9, rotate: -3, duration: 0.2, ease: "sine.out" }, at) // the tear
          .to(paper, { x: px, y: py, rotate: (Math.random() - 0.5) * 30, scale: 0.85, duration: 0.8, ease: "power3.out", force3D: true }, at + 0.2) // out of the calendar
          .to(word, { opacity: 0, duration: 0.3, ease: "sine.inOut" }, at + 0.55)
          // the fold is a squash + cross-fade into a pre-drawn paper plane (transform/opacity only, so it stays on the GPU)
          .to(paper, { scaleX: 0.44, scaleY: 0.8, rotate: a, duration: 0.85, ease: "sine.inOut" }, at + 0.7)
          .to(sheet, { opacity: 0, duration: 0.45, ease: "sine.inOut" }, at + 0.95)
          .to(plane, { opacity: 1, duration: 0.45, ease: "sine.inOut" }, at + 0.95)
          .to(paper, { x: tx, y: ty, scale: 0.6, duration: 1.5, ease: "power1.in", force3D: true }, at + 1.0) // glide away
          .set(item, { opacity: 0 }, at + 2.6)
          .to(barEl.current, { width: `${(i / (YEARS.length - 1)) * 100}%`, duration: gap, ease: "none" }, at);
        at += gap;
      }
      const calEnd = at + 1.3;
      t.to(cur, { filter: "drop-shadow(0 0 14px rgba(250,204,21,0.9)) drop-shadow(0 0 38px rgba(34,197,94,0.65))", duration: 0.5, ease: "power2.out" }, at + 0.05)
        .fromTo(".i-cal-glow", { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1.15, duration: 0.7, ease: "power2.out" }, at + 0.05)
        .to(".i-cal-glow", { opacity: 0.55, duration: 0.45, yoyo: true, repeat: 1, ease: "sine.inOut" }, at + 0.75)
        .fromTo(".i-shine", { xPercent: -130 }, { xPercent: 130, duration: 0.9, ease: "power2.inOut" }, at + 0.15)
        // wait here only if the 3D logo is not built yet (never longer than 3.5 s)
        .call(
          () => {
            const g = gate.current;
            if (g.ready || !use3D) return;
            g.waiting = true;
            t.pause();
            g.timer = window.setTimeout(resume, 3500);
          },
          undefined,
          calEnd
        )
        .to(".i-cal, .i-track, .i-cal-glow", { opacity: 0, y: -18, scale: 0.97, duration: 0.45, ease: "power2.in" }, calEnd + 0.02);

      // ---- 2. the 3D logo + anniversary lockup
      const L = calEnd + 0.4;
      t.call(() => setLogoRun(true), undefined, L - 0.15);
      t.fromTo(".i-scene", { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" }, L)
        .to(state, { logo: 1, duration: 1.7, ease: "power2.out" }, L)
        .fromTo(".i-fallback", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, L)
        .fromTo(".i-eleven", { opacity: 0, y: 26, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1, ease: "expo.out" }, L + 1.1)
        .fromTo(".i-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power3.inOut" }, L + 1.35)
        .fromTo(".i-label", { opacity: 0, y: 10, letterSpacing: "0.7em" }, { opacity: 1, y: 0, letterSpacing: compact ? "0.18em" : "0.44em", duration: 0.9, ease: "power3.out" }, L + 1.5)
        .fromTo(".i-m0", { opacity: 0, y: 14, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "power3.out" }, L + 2.0)
        .to(".i-m0", { opacity: 0, y: -10, duration: 0.6, ease: "power2.in" }, L + 4.6)
        .fromTo(".i-m1", { opacity: 0, y: 14, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.0, ease: "power3.out" }, L + 5.4)
        .to(".i-m1", { opacity: 0, y: -10, duration: 0.6, ease: "power2.in" }, L + 8.0)
        .fromTo(".i-m2", { opacity: 0, y: 14, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.0, ease: "power3.out" }, L + 8.8);

      // ---- 3. dissolve the logo scene, then the AI-era finale takes the centre
      const X = L + 12.3;
      t.to(".i-content, .i-fallback", { opacity: 0, y: -14, duration: 0.6, ease: "power2.in" }, X)
        .to(state, { burst: 1, duration: 0.7, ease: "power2.in" }, X)
        .to(".i-scene", { opacity: 0, duration: 0.5, ease: "power2.in" }, X + 0.15)
        .call(() => setSceneOn(false), undefined, X + 0.75) // free the GPU before the finale
        .to(".i-glow", { opacity: 1, scale: 1, duration: 1.2, ease: "power3.out" }, X + 0.5)
        .to(".i-fw-word", { yPercent: 0, opacity: 1, duration: 1.0, ease: "expo.out", stagger: 0.12 }, X + 0.7)
        .to(".i-flag-strip", { opacity: 1, x: 0, duration: 0.8, ease: "power3.out", stagger: { each: 0.02, from: "start" } }, X + 1.5)
        .to(".i-finale", { scale: 5, opacity: 0, filter: "blur(14px)", duration: 1.2, ease: "power3.in" }, X + 3.1)
        .add(() => window.dispatchEvent(new Event("nk:intro-reveal")), X + 3.5)
        .to(root.current, { opacity: 0, duration: 0.9, ease: "power2.inOut" }, X + 3.5);
    }, root);

    // dev aid: /?introAt=6.5 freezes the intro at that moment (used to check the layout)
    const at = new URLSearchParams(window.location.search).get("introAt");
    let cancelled = false;
    if (at) {
      gate.current.ready = true;
      gsap.set(".ld", { autoAlpha: 0 });
      setSceneOn(true);
      tl.current?.pause().time(Number(at));
    } else {
      // ---- loader: wait until the page is genuinely ready, then play the intro on a warm, idle main thread
      const prog = { v: 0 };
      let done = 0;
      const tasks: Promise<unknown>[] = [];
      const track = (p: Promise<unknown>) => {
        tasks.push(p.catch(() => undefined).then(() => (done += 1)));
      };
      track(document.fonts?.ready ?? Promise.resolve());
      track(
        document.readyState === "complete"
          ? Promise.resolve()
          : new Promise((res) => window.addEventListener("load", res, { once: true }))
      );
      ["/images/brand/netkathir-logo-hd.png", "/images/brand/netkathir-logo-3d.png", "/images/brand/netkathir-icon.png"].forEach((src) =>
        track(
          new Promise((res) => {
            const im = new Image();
            im.onload = im.onerror = () => res(null);
            im.src = src;
          })
        )
      );
      if (use3D) {
        setSceneOn(true); // build the 3D logo now, while the loader covers the screen, so the calendar never hitches
        track(new Promise((res) => { readyWaiter.current = () => res(null); }));
        track(import("./IntroScene"));
        track(import("./Scene"));
        track(
          (window as unknown as { __nkSceneReady?: boolean }).__nkSceneReady
            ? Promise.resolve()
            : new Promise((res) => window.addEventListener("nk:scene-ready", res, { once: true }))
        );
      }
      const total = tasks.length;
      const started = performance.now();
      const paint = () => {
        const target = Math.min(done / total, 0.97);
        prog.v += (target - prog.v) * 0.12;
        if (ldBar.current) ldBar.current.style.transform = `scaleX(${prog.v.toFixed(3)})`;
      };
      gsap.ticker.add(paint);
      const finish = () => {
        if (cancelled) return;
        cancelled = true;
        gsap.ticker.remove(paint);
        gsap.to(prog, {
          v: 1,
          duration: 0.35,
          ease: "power2.out",
          onUpdate: () => {
            if (ldBar.current) ldBar.current.style.transform = `scaleX(${prog.v.toFixed(3)})`;
          },
          onComplete: () => {
            if (closed.current) return;
            gsap.to(".ld", { opacity: 0, duration: 0.6, ease: "power2.inOut", onComplete: () => gsap.set(".ld", { display: "none" }) });
            gsap.delayedCall(0.25, () => tl.current?.play());
          },
        });
      };
      Promise.all(tasks).then(() => window.setTimeout(finish, Math.max(0, 1100 - (performance.now() - started))));
      window.setTimeout(finish, 8000); // never hold the visitor longer than this
    }

    return () => {
      cancelled = true;
      window.clearTimeout(gate.current.timer);
      ctx.revert();
      document.documentElement.style.overflow = "";
    };
  }, [state, dismiss, resume]);

  if (!show) return null;

  return (
    <div ref={root} className="fixed inset-0 z-[120] overflow-hidden bg-[#f6faf6] text-ink" role="dialog" aria-label="Netkathir Technologies — 2015 to 2026, 11 years of excellence">
      {/* loader: shown until the page, fonts, images and 3D are ready */}
      <div className="ld absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#f6faf6] px-6">
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_55%_45%_at_50%_42%,rgba(34,150,80,0.18),transparent_70%),radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(217,185,106,0.22),transparent_70%)]" />
        <div className="ld-logo relative w-[min(19rem,68vw)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/brand/netkathir-logo-hd.png" alt="Netkathir Technologies" className="w-full animate-[ld-breathe_2.4s_ease-in-out_infinite]" />
        </div>
        <div className="relative mt-9 w-[min(14rem,56vw)]">
          <span className="block h-[3px] overflow-hidden rounded-full bg-[#14532d]/12">
            <span ref={ldBar} style={{ transform: "scaleX(0)" }} className="block h-full origin-left rounded-full bg-gradient-to-r from-[#14532d] via-[#22a559] to-[#eab308]" />
          </span>
          <p className="mt-3 text-center font-mono text-[0.68rem] uppercase tracking-[0.34em] text-[#14532d]/65">Loading</p>
        </div>
      </div>

      {/* atmosphere: soft green light, champagne warmth — plain gradients, no dots, no circles */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 24%, rgba(34,150,80,0.16), transparent 70%), radial-gradient(ellipse 70% 50% at 50% 100%, rgba(217,185,106,0.22), transparent 70%), radial-gradient(ellipse 45% 40% at 8% 90%, rgba(22,163,74,0.08), transparent 70%), #f6faf6",
        }}
      />

      {/* 1 — calendar page */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6">
        <div className="i-cal-glow pointer-events-none absolute h-[min(30rem,86vw)] w-[min(30rem,86vw)] rounded-full bg-[radial-gradient(circle,rgba(250,204,21,0.45),rgba(34,197,94,0.25)_45%,transparent_70%)] opacity-0" />
        <div ref={cardEl} className="i-cal relative z-40 w-[min(22rem,82vw)] rounded-[1.4rem] border border-white bg-white shadow-[0_40px_80px_-30px_rgba(20,83,45,0.45),0_2px_0_rgba(255,255,255,0.9)_inset] opacity-0">
          <div className="relative flex h-11 items-center justify-center rounded-t-[1.3rem] bg-gradient-to-r from-[#14532d] via-[#1f7a43] to-[#2f8f4e]">
            <span className="absolute left-6 top-2 h-3 w-3 rounded-full bg-[#f6faf6] shadow-inner" />
            <span className="absolute right-6 top-2 h-3 w-3 rounded-full bg-[#f6faf6] shadow-inner" />
            <span className="font-display text-[0.68rem] font-semibold uppercase tracking-[0.5em] text-white/90">Netkathir</span>
          </div>
          <div className="i-cal-year relative flex h-[clamp(7.2rem,min(24vh,24vw),11rem)] items-center justify-center rounded-b-[1.3rem] bg-white">
            <span ref={curEl} className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,#14532d_0%,#1f7a43_55%,#c9a24d_115%)] bg-clip-text font-display text-[clamp(4.6rem,min(17vh,19vw),8rem)] font-light leading-none tracking-[-0.05em] text-transparent tabular-nums [backface-visibility:hidden]">
              2015
            </span>
            <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[1.3rem]"><span className="i-shine absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/80 to-transparent" /></span>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <div key={n} ref={(el) => { sheetEls.current[n] = el; }} className="pointer-events-none absolute inset-0 z-10 opacity-0">
                <div className="nk-paper absolute inset-0 will-change-transform">
                  <div className="nk-sheet absolute inset-0 flex items-center justify-center rounded-b-[1.3rem] bg-white shadow-[0_14px_30px_-8px_rgba(20,83,45,0.35)]">
                    <span className="nk-word font-display text-[clamp(4.6rem,min(17vh,19vw),8rem)] font-light leading-none tracking-[-0.05em] text-[#1f7a43] tabular-nums">2015</span>
                  </div>
                  {/* the paper plane (nose up): shaded half, crease, lit half */}
                  <svg className="nk-plane absolute inset-0 h-full w-full opacity-0 " viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                    <polygon points="46,14 50,0 50,74 0,94" fill="#dbe4f0" />
                    <polygon points="50,0 54,14 100,94 50,74" fill="#ffffff" />
                    <line x1="50" y1="0" x2="50" y2="74" stroke="#9fb0c8" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="i-track relative z-0 mt-6 flex w-[min(18rem,70vw)] items-center gap-3 opacity-0">
          <span className="font-mono text-[0.62rem] tracking-[0.16em] text-[#14532d]/55">2015</span>
          <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-[#14532d]/12">
            <span ref={barEl} className="absolute inset-y-0 left-0 w-0 rounded-full bg-gradient-to-r from-[#1f7a43] to-[#c9a24d]" />
          </span>
          <span className="font-mono text-[0.62rem] tracking-[0.16em] text-[#c9a24d]">2026</span>
        </div>
      </div>

      {/* 2 — 3D logo (mounted only while needed) or the static logo on weak devices */}
      {gl ? (
        // the wrapper always exists (the timeline targets it); the heavy 3D scene inside mounts only while needed
        <div className="i-scene absolute inset-0 opacity-0">{sceneOn && <IntroScene state={state} onReady={onReady} run={logoRun} />}</div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/images/brand/netkathir-logo-hd.png" alt="Netkathir Technologies" className="i-fallback absolute left-1/2 top-[28%] w-[min(34rem,78vw)] -translate-x-1/2 -translate-y-1/2 opacity-0 drop-shadow-[0_18px_30px_rgba(20,83,45,0.25)]" />
      )}

      <div className="i-content pointer-events-none absolute inset-x-0 top-[50%] flex flex-col items-center px-6 text-center">
        <div className="i-eleven opacity-0">
          <span className="block bg-[linear-gradient(180deg,#14532d_0%,#1f7a43_46%,#c9a24d_100%)] bg-clip-text font-display text-[clamp(4.2rem,min(15vh,13vw),9rem)] font-light leading-[0.95] tracking-[-0.04em] text-transparent [filter:drop-shadow(0_1px_0_rgba(255,255,255,0.8))_drop-shadow(0_12px_18px_rgba(20,83,45,0.22))]">
            11
          </span>
        </div>
        <div className="mt-[clamp(0.3rem,1.2vh,0.8rem)] flex w-full max-w-[calc(100vw-3rem)] items-center justify-center gap-3 sm:gap-6">
          <span className="i-rule h-px w-6 shrink-0 origin-right scale-x-0 bg-gradient-to-l from-[#c9a24d] to-transparent sm:w-16" />
          <span className="i-label whitespace-nowrap font-display text-[0.62rem] font-semibold uppercase text-[#14532d] opacity-0 sm:text-[0.78rem]">Years of Excellence</span>
          <span className="i-rule h-px w-6 shrink-0 origin-left scale-x-0 bg-gradient-to-r from-[#c9a24d] to-transparent sm:w-16" />
        </div>
        <div className="relative mt-[clamp(1rem,3.4vh,2rem)] h-[clamp(7rem,19vh,10.5rem)] w-full max-w-3xl">
          {MESSAGES.map((m, k) => (
            <p key={k} className={`i-m${k} absolute inset-x-0 top-0 font-display text-[clamp(1.6rem,min(4.8vh,6vw),3rem)] font-semibold leading-tight tracking-[-0.02em] opacity-0 bg-[linear-gradient(100deg,#14532d,#15803d_55%,#b7791f)] bg-clip-text text-transparent`}>
              {m}
            </p>
          ))}
        </div>
      </div>

      {/* 3 — finale */}
      <div className="i-finale pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
        <div className="i-glow absolute h-[min(34rem,80vw)] w-[min(34rem,80vw)] scale-75 rounded-full bg-[radial-gradient(circle,rgba(34,150,80,0.3),rgba(217,185,106,0.18)_45%,transparent_70%)] opacity-0" />
        <h2 className="relative font-display text-[clamp(2rem,min(6.4vw,14vh),7rem)] font-bold leading-[1.02] tracking-tight">
          {FINALE.map((w, i) => (
            <span key={i} className="mr-[0.22em] inline-block overflow-hidden px-[0.04em] pb-[0.18em] align-top last:mr-0">
              <span className="i-fw-word inline-block bg-[linear-gradient(100deg,#052e16,#14532d_28%,#15803d_55%,#65a30d_78%,#ca8a04)] bg-clip-text text-transparent">{w}</span>
            </span>
          ))}
        </h2>
        {/* the logo unfurls like a flag and keeps waving */}
        <div className="i-flag relative mt-8 aspect-[1800/738] w-[min(17rem,58vw)] [filter:drop-shadow(0_10px_14px_rgba(20,83,45,0.22))]" role="img" aria-label="Netkathir Technologies">
          {Array.from({ length: FLAG_N }, (_, k) => (
            <span
              key={k}
              className="i-flag-strip nk-wave absolute inset-y-0"
              style={{
                left: `${(k / FLAG_N) * 100}%`,
                width: `${100 / FLAG_N + 0.25}%`,
                backgroundImage: "url(/images/brand/netkathir-logo-hd.png)",
                backgroundSize: `${FLAG_N * 100}% 100%`,
                backgroundPosition: `${(k / (FLAG_N - 1)) * 100}% 0`,
                ["--amp" as string]: `${(0.4 + (k / FLAG_N) * 5.6).toFixed(2)}px`,
                animationDelay: `${(-k * 0.075).toFixed(3)}s`,
              }}
            />
          ))}
        </div>
      </div>

      <button
        onClick={dismiss}
        className="group absolute bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#14532d] px-5 py-2.5 text-[0.75rem] font-bold uppercase tracking-[0.24em] text-white shadow-[0_10px_28px_-8px_rgba(20,83,45,0.7)] transition-all duration-300 hover:bg-[#166534] hover:shadow-[0_14px_34px_-8px_rgba(20,83,45,0.85)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16a34a] sm:bottom-8 sm:right-8"
        aria-label="Skip the introduction"
      >
        Skip
        <span className="inline-block transition-transform duration-300 group-hover:translate-x-1" aria-hidden>→</span>
      </button>
    </div>
  );
}
