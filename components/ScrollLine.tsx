"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * A single flowing line that draws itself down the page as you scroll, passing behind the content
 * (put it first inside an `isolate relative` wrapper). Green to gold, like the brand.
 */
export default function ScrollLine() {
  const svg = useRef<SVGSVGElement>(null);
  const path = useRef<SVGPathElement>(null);

  useEffect(() => {
    const el = path.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.set(el, { strokeDashoffset: reduce ? 0 : 1 });
    if (reduce) return;
    let st: ScrollTrigger | undefined;
    const timer = window.setTimeout(() => {
      st = ScrollTrigger.create({
        trigger: svg.current!.parentElement!,
        start: "top 70%",
        end: "bottom 75%",
        scrub: 0.7,
        onUpdate: (self) => {
          el.style.strokeDashoffset = String(1 - self.progress);
        },
      });
      ScrollTrigger.refresh();
    }, 250);
    return () => {
      window.clearTimeout(timer);
      st?.kill();
    };
  }, []);

  return (
    <svg ref={svg} className="pointer-events-none absolute inset-0 -z-10 h-full w-full" viewBox="0 0 1000 3000" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="sl-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="3000">
          <stop offset="0" stopColor="#14532d" />
          <stop offset="0.5" stopColor="#22a559" />
          <stop offset="1" stopColor="#eab308" />
        </linearGradient>
      </defs>
      <path
        ref={path}
        pathLength={1}
        d="M 90 0 C 90 260, 930 220, 900 560 S 70 860, 130 1260 S 940 1520, 880 1900 S 90 2200, 150 2560 S 700 2800, 520 3000"
        fill="none"
        stroke="url(#sl-grad)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray="1"
        strokeDashoffset="1"
        opacity="0.9"
      />
    </svg>
  );
}
