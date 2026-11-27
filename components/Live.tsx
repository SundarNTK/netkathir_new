"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Marks itself `data-live="1"` while it is on screen. The `fx-*` animations stay paused until then (see fresh.css), so
 * illustrations start playing as they scroll into view and nothing keeps animating off-screen.
 */
export default function Live({ className = "", style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (el.dataset.live = e.isIntersecting ? "1" : "0"), { rootMargin: "80px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`fx ${className}`} style={style}>
      {children}
    </div>
  );
}
