"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/data";

const NEED = 700; // wheel distance (px) needed at the very bottom to complete the bar
const TOUCH_NEED = 260;

/**
 * "Keep scrolling" footer strip: once the page is at its very bottom, further scrolling fills a progress bar,
 * and when it completes the next page opens (through the normal animated page transition).
 */
export default function NextPage() {
  const path = usePathname();
  const i = Math.max(0, NAV.findIndex((n) => n.href === path));
  const next = NAV[(i + 1) % NAV.length];
  const root = useRef<HTMLAnchorElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const arrow = useRef<HTMLSpanElement>(null);
  const pct = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let p = 0;
    let target = 0;
    let fired = false;
    let raf = 0;
    let idle = 0;
    let touchY = 0;
    const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 3;
    const paint = () => {
      p += (target - p) * 0.2;
      if (Math.abs(target - p) < 0.002) p = target;
      if (fill.current) fill.current.style.transform = `scaleX(${p.toFixed(3)})`;
      if (arrow.current) arrow.current.style.transform = `translateX(${(p * 8).toFixed(1)}px) scale(${(1 + p * 0.2).toFixed(3)})`;
      if (pct.current) pct.current.textContent = `${Math.round(p * 100)}%`;
      if (root.current) root.current.style.setProperty("--np", p.toFixed(3));
      if (p !== target || target > 0) raf = requestAnimationFrame(paint);
      else raf = 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const add = (amount: number, need: number) => {
      if (fired) return;
      target = Math.min(1, Math.max(0, target + amount / need));
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        target = 0; // let go and it drains back
        kick();
      }, 900);
      kick();
      if (target >= 1) {
        fired = true;
        window.setTimeout(() => root.current?.click(), 180); // goes through the animated page transition
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (!atBottom()) {
        if (target > 0 && !fired) {
          target = 0;
          kick();
        }
        return;
      }
      add(e.deltaY, NEED); // scrolling up drains it
    };
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const d = touchY - y;
      touchY = y;
      if (atBottom()) add(d, TOUCH_NEED);
      else if (target > 0 && !fired) {
        target = 0;
        kick();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (!atBottom()) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " " || e.key === "End") add(140, NEED);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(idle);
      cancelAnimationFrame(raf);
    };
  }, [path]);

  return (
    <a
      ref={root}
      href={next.href}
      className="group relative mt-8 block overflow-hidden rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 sm:px-5"
      style={{ ["--np" as string]: 0 }}
    >
      <span ref={fill} aria-hidden className="absolute inset-0 origin-left bg-[linear-gradient(100deg,#14532d,#22a559_60%,#eab308)]" style={{ transform: "scaleX(0)" }} />
      <span aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full border border-white/10" />
      <span className="relative flex flex-wrap items-center justify-between gap-4">
        <span>
          <span className="block font-mono text-[0.58rem] uppercase tracking-[0.24em] text-[#bbf7d0]">Keep scrolling · Up next</span>
          <span className="block font-display text-[clamp(1.1rem,1.8vw,1.35rem)] leading-[1.15] text-white">{next.label}</span>
        </span>
        <span className="flex items-center gap-4">
          <span ref={pct} className="font-mono text-xs tracking-widest text-white/70">0%</span>
          <span ref={arrow} className="grid h-8 w-8 place-items-center rounded-full bg-white text-sm text-[#14532d] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)]">→</span>
        </span>
      </span>
      <span className="relative mt-2.5 block h-[2px] overflow-hidden rounded bg-white/15">
        <span aria-hidden className="absolute inset-y-0 left-0 w-full origin-left bg-[#fde68a]" style={{ transform: "scaleX(var(--np))" }} />
      </span>
    </a>
  );
}
