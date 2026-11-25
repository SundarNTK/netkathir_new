"use client";

import { useEffect, useRef } from "react";

/** A slim bar on the right edge that fills as you scroll down the page. */
export default function PageProgress() {
  const bar = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (bar.current) bar.current.style.transform = `scaleY(${p.toFixed(4)})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed right-0 top-0 z-[60] h-screen w-[3px] bg-[#14532d]/8" aria-hidden>
      <span ref={bar} className="block h-full origin-top rounded-b-full bg-gradient-to-b from-[#14532d] via-[#22a559] to-[#eab308]" style={{ transform: "scaleY(0)" }} />
    </div>
  );
}
