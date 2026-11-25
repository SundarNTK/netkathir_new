"use client";

import { useEffect, useRef } from "react";

/**
 * Soft colour fields, rings and a dot grid that drift, rotate and breathe as the page scrolls.
 * Pure CSS gradients + one rAF loop writing transforms (no blur filters), so it stays cheap on every device.
 */
const BLOBS = [
  { c: "rgba(34,165,89,.22)", s: 52, x: 8, y: 6, sp: 0.16, amp: 90, ph: 0 },
  { c: "rgba(234,179,8,.20)", s: 44, x: 74, y: 22, sp: 0.28, amp: 120, ph: 1.6 },
  { c: "rgba(94,234,212,.20)", s: 48, x: 62, y: 62, sp: 0.12, amp: 80, ph: 3.1 },
  { c: "rgba(132,204,22,.18)", s: 40, x: 4, y: 70, sp: 0.34, amp: 110, ph: 4.4 },
  { c: "rgba(20,83,45,.12)", s: 56, x: 40, y: 38, sp: 0.2, amp: 70, ph: 5.5 },
];

export default function ScrollBackdrop() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const blobs = Array.from(el.querySelectorAll<HTMLElement>("[data-b]"));
    const rings = Array.from(el.querySelectorAll<HTMLElement>("[data-r]"));
    const grid = el.querySelector<HTMLElement>("[data-g]");
    let cur = window.scrollY;
    let raf = 0;
    let running = false;

    const tick = () => {
      const target = window.scrollY;
      cur += (target - cur) * 0.08;
      const y = cur;
      blobs.forEach((b, i) => {
        const d = BLOBS[i];
        const tx = Math.sin(y / 520 + d.ph) * d.amp;
        const ty = -y * d.sp + Math.cos(y / 700 + d.ph) * 40;
        const sc = 1 + Math.sin(y / 600 + d.ph) * 0.16;
        b.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) scale(${sc.toFixed(3)})`;
      });
      rings.forEach((r, i) => {
        const dir = i % 2 ? -1 : 1;
        r.style.transform = `translate3d(0,${(-y * (0.1 + i * 0.07)).toFixed(1)}px,0) rotate(${(y * 0.06 * dir).toFixed(1)}deg)`;
      });
      if (grid) grid.style.transform = `translate3d(0,${(-y * 0.45).toFixed(1)}px,0)`;
      if (Math.abs(target - cur) < 0.3) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    kick();
    window.addEventListener("scroll", kick, { passive: true });
    return () => {
      window.removeEventListener("scroll", kick);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={root} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {BLOBS.map((b, i) => (
        <div
          key={i}
          data-b
          className="absolute rounded-full will-change-transform"
          style={{
            width: `${b.s}vw`,
            height: `${b.s}vw`,
            left: `${b.x}%`,
            top: `${b.y}%`,
            marginLeft: `-${b.s / 2}vw`,
            marginTop: `-${b.s / 2}vw`,
            background: `radial-gradient(closest-side, ${b.c}, transparent 70%)`,
          }}
        />
      ))}
      <div
        data-g
        className="absolute -inset-x-0 -top-[20%] h-[160%] opacity-[0.5] will-change-transform"
        style={{
          backgroundImage: "radial-gradient(rgba(20,83,45,.16) 1.2px, transparent 1.4px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at 50% 40%, #000 0%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, #000 0%, transparent 72%)",
        }}
      />
      <div data-r className="absolute left-[6%] top-[18%] h-[26rem] w-[26rem] rounded-full border border-[#16a34a]/25 will-change-transform" style={{ borderStyle: "dashed" }} />
      <div data-r className="absolute right-[5%] top-[52%] h-[34rem] w-[34rem] rounded-full border border-[#eab308]/30 will-change-transform" />
      <div data-r className="absolute left-[38%] top-[78%] h-[20rem] w-[20rem] rounded-full border-2 border-[#14532d]/10 will-change-transform" style={{ borderStyle: "dotted" }} />
    </div>
  );
}
