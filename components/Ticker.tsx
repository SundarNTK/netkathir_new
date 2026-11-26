"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Slim, quiet keyword strip: small uppercase labels drifting slowly between hairlines. It wipes open when it enters the screen. */
export default function Ticker({ items }: { items: string[] }) {
  const row = [...items, ...items, ...items, ...items];
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const words = el.querySelectorAll("[data-tk]");
    const ctx = gsap.context(() => {
      gsap.set(el, { clipPath: "inset(0% 100% 0% 0%)", opacity: 0 });
      gsap.set(words, { yPercent: 120, opacity: 0 });
      ScrollTrigger.create({
        trigger: el,
        start: "top 96%",
        once: true,
        onEnter: () => {
          gsap.to(el, { clipPath: "inset(0% 0% 0% 0%)", opacity: 1, duration: 1.1, ease: "power3.inOut", delay: 0.5 });
          gsap.to(words, { yPercent: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: { each: 0.035, from: "start" }, delay: 0.75 });
        },
      });
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <div ref={root} className="overflow-hidden border-y border-[#14532d]/10 bg-white py-4" aria-hidden>
      <div className="marquee-track items-center">
        {row.map((t, i) => (
          <span key={i} className="flex items-center whitespace-nowrap font-mono text-[0.76rem] font-medium uppercase tracking-[0.32em] text-[#14532d]/70">
            <span data-tk className="inline-block">{t}</span>
            <span data-tk className="mx-8 h-1.5 w-1.5 rounded-full bg-[#eab308]" />
          </span>
        ))}
      </div>
    </div>
  );
}
