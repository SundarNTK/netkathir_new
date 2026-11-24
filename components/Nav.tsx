"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV, SITE } from "@/lib/data";

const LINKS = NAV.slice(0, 6);

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [pill, setPill] = useState({ x: 0, w: 0, o: 0 });
  const wrap = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLAnchorElement | null)[]>([]);

  const activeIndex = LINKS.findIndex((n) => (n.href === "/" ? path === "/" : path.startsWith(n.href)));

  // eslint-disable-next-line react-hooks/set-state-in-effect -- close the menu after navigation
  useEffect(() => setOpen(false), [path]);

  // wait for the anniversary intro before sliding in
  useEffect(() => {
    if (window.__nkIntro !== "playing") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- window flag is client-only
      setReady(true);
      return;
    }
    const f = () => setReady(true);
    window.addEventListener("nk:intro-reveal", f, { once: true });
    return () => window.removeEventListener("nk:intro-reveal", f);
  }, []);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 40);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  // sliding highlight pill
  useEffect(() => {
    const i = hover ?? activeIndex;
    const el = i >= 0 ? items.current[i] : null;
    if (!el || !wrap.current) return setPill((p) => ({ ...p, o: 0 }));
    setPill({ x: el.offsetLeft, w: el.offsetWidth, o: 1 });
  }, [hover, activeIndex, path]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-700 ease-[cubic-bezier(.2,.8,.2,1)] ${
        ready ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div className="absolute inset-0 border-b border-white/80 bg-white/75 shadow-[0_10px_40px_-24px_rgba(22,101,52,0.45)] backdrop-blur-xl" />
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="relative z-[60] flex items-center gap-3" aria-label="Netkathir home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SITE.logo}
            alt="Netkathir Technologies"
            className="h-14 w-auto drop-shadow-[0_6px_18px_rgba(234,179,8,0.3)]"
          />
        </Link>

        <nav
          ref={wrap}
          onMouseLeave={() => setHover(null)}
          className={`hidden lg:flex relative items-center rounded-full p-1.5 border transition-all duration-500 ${
            scrolled
              ? "bg-white/85 border-white shadow-[0_14px_50px_-14px_rgba(22,101,52,0.45)]"
              : "bg-white/60 border-white shadow-[0_8px_30px_-14px_rgba(22,101,52,0.3)]"
          } backdrop-blur-md`}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-1.5 h-[2px] rounded-full bg-gradient-to-r from-[#166534] via-[#16a34a] to-[#eab308] transition-all duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
            style={{ left: pill.x + 18, width: Math.max(0, pill.w - 36), opacity: 0 }}
          />
          {LINKS.map((n, i) => (
            <Link
              key={n.href}
              href={n.href}
              ref={(el) => {
                items.current[i] = el;
              }}
              onMouseEnter={() => setHover(i)}
              className={`relative z-10 rounded-full px-5 py-2 text-sm transition-colors duration-300 ${
                i === (hover ?? activeIndex) ? "bg-gradient-to-r from-[#14532d] via-[#15803d] to-[#22a559] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(21,128,61,0.8)]" : "text-ink/65 hover:bg-[#15803d]/10 hover:text-[#14532d]"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="relative z-[60] flex items-center gap-3">
          <Link
            href="/contact"
            data-magnetic
            className="max-lg:!hidden btn btn-solid !py-2.5 !px-6 text-sm group"
          >
            Contact Us
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
          <button
            className="lg:hidden w-11 h-11 rounded-full border border-ink/10 bg-white/80 backdrop-blur-xl flex flex-col items-center justify-center gap-1.5"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            aria-expanded={open}
          >
            <span className={`h-px w-5 bg-ink transition-transform duration-300 ${open ? "rotate-45 translate-y-[3.5px]" : ""}`} />
            <span className={`h-px w-5 bg-ink transition-transform duration-300 ${open ? "-rotate-45 -translate-y-[3.5px]" : ""}`} />
          </button>
        </div>
      </div>

      {/* full-screen menu */}
      <div
        className={`lg:hidden fixed inset-0 z-[55] bg-[#f6fbf7]/97 backdrop-blur-md flex flex-col justify-center gap-2 px-8 transition-[clip-path,opacity] duration-700 ease-[cubic-bezier(.7,0,.2,1)] ${
          open ? "opacity-100 pointer-events-auto [clip-path:circle(150%_at_90%_5%)]" : "opacity-0 pointer-events-none [clip-path:circle(0%_at_90%_5%)]"
        }`}
      >
        {NAV.map((n, i) => (
          <Link
            key={n.href}
            href={n.href}
            style={{ transitionDelay: `${open ? 200 + i * 60 : 0}ms` }}
            className={`flex items-baseline gap-4 font-display text-[2.6rem] leading-tight transition-all duration-700 ${
              open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <span className="font-mono text-xs text-ice">0{i + 1}</span>
            {n.label}
          </Link>
        ))}
        <p
          className={`mt-8 font-mono text-xs text-ink/50 transition-opacity duration-700 delay-500 ${open ? "opacity-100" : "opacity-0"}`}
        >
          {SITE.email}
        </p>
      </div>
    </header>
  );
}
