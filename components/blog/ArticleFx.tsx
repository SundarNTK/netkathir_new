"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";

/** thin reading-progress bar pinned to the top of the window */
export function ReadingProgress({ target }: { target: string }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = document.getElementById(target);
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      setP(Math.min(1, Math.max(0, (window.innerHeight * 0.4 - r.top) / Math.max(1, total))));
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, [target]);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
      <div className="ar-progress h-full origin-left" style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}

/** article blocks rise in as they scroll into view; headings get a slide, images a soft zoom */
export function BodyReveal({ target }: { target: string }) {
  useEffect(() => {
    const el = document.getElementById(target);
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const kids = Array.from(el.children) as HTMLElement[];
    el.classList.add("fx");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          (e.target as HTMLElement).classList.add("in");
          io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    kids.forEach((k) => {
      // anything already on screen shows at once (no flash of hidden text)
      if (k.getBoundingClientRect().top < window.innerHeight) k.classList.add("in");
      else io.observe(k);
    });
    return () => io.disconnect();
  }, [target]);
  return null;
}

/** "On this page": a progress rail with a dot per section, a pill that glides to the section being read */
export function Toc({ items }: { items: { id: string; text: string; level: number }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const box = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const pct = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const heads = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    if (!heads.length) return;
    const body = document.getElementById("article-body");
    let raf = 0;
    const update = () => {
      raf = 0;
      // the section being read = the last heading that has reached the upper third of the screen
      const line = window.innerHeight * 0.33;
      let cur = heads[0].id;
      for (const h of heads) if (h.getBoundingClientRect().top <= line) cur = h.id;
      // at the very bottom the last heading may never reach the line
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = heads[heads.length - 1].id;
      setActive(cur);
      if (body && bar.current && pct.current) {
        const r = body.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (window.innerHeight * 0.4 - r.top) / Math.max(1, r.height - window.innerHeight * 0.6)));
        bar.current.style.transform = "scaleX(" + p + ")";
        pct.current.textContent = Math.round(p * 100) + "%";
      }
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, [items]);

  // place the rail / progress fill / gliding pill, and keep the highlighted title visible in the (scrollable) list
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const links = Array.from(el.querySelectorAll<HTMLElement>("a[data-id]"));
    const place = () => {
      const cur = links.find((l) => l.dataset.id === active);
      if (!cur || !rail.current || !fill.current || !pill.current) return;
      const first = links[0].offsetTop + 15;
      const last = links[links.length - 1].offsetTop + 15;
      rail.current.style.top = first + "px";
      rail.current.style.height = Math.max(0, last - first) + "px";
      fill.current.style.top = first + "px";
      fill.current.style.height = Math.max(0, cur.offsetTop + 15 - first) + "px";
      pill.current.style.top = cur.offsetTop - 2 + "px";
      pill.current.style.height = cur.offsetHeight + 4 + "px";
      pill.current.style.opacity = "1";
      const top = cur.offsetTop;
      if (top < el.scrollTop + 24 || top + cur.offsetHeight > el.scrollTop + el.clientHeight - 24) {
        el.scrollTo({ top: top - el.clientHeight / 2 + cur.offsetHeight / 2, behavior: "smooth" });
      }
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [active, items]);

  if (items.length < 2) return null;
  const idx = Math.max(0, items.findIndex((i) => i.id === active));
  return (
    <nav aria-label="On this page" className="ar-card ar-toc-card p-5">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#4ade80] to-[#15803d] text-white shadow-[0_12px_22px_-10px_rgba(21,128,61,0.95)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-[1.15rem] w-[1.15rem]"><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></svg>
        </span>
        <div className="min-w-0 leading-tight">
          <p className="font-display text-[1.05rem] text-[#10231a]">On this page</p>
          <p className="mt-0.5 font-mono text-[0.68rem] text-[#6b8577]">
            <b className="ar-count font-bold text-[#15803d]" key={idx}>{String(idx + 1).padStart(2, "0")}</b> / {String(items.length).padStart(2, "0")} sections
          </p>
        </div>
      </div>

      <div ref={box} data-lenis-prevent style={{ maxHeight: "clamp(9rem, calc(100vh - 27rem), 44vh)" }} className="ar-toc relative overflow-y-auto overscroll-contain">
        <span ref={rail} aria-hidden className="ar-rail" />
        <span ref={fill} aria-hidden className="ar-rail-fill" />
        <span ref={pill} aria-hidden className="ar-pill" />
        <ol>
          {items.map((i, n) => (
            <li key={i.id}>
              <a
                href={"#" + i.id}
                data-id={i.id}
                data-s={n < idx ? "done" : n === idx ? "on" : "todo"}
                data-l={i.level}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(i.id);
                  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110, behavior: "smooth" });
                }}
                className={"ar-link relative block py-1.5 pr-3 leading-snug " + (i.level === 3 ? "pl-11 text-[0.78rem]" : "pl-8 text-[0.83rem]")}
              >
                <i aria-hidden className="ar-dot" />
                {i.text}
              </a>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 border-t border-dashed border-[#14532d]/15 pt-3.5">
        <div className="flex items-center justify-between font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#6b8577]">
          <span>Reading progress</span>
          <span ref={pct} className="text-[#15803d]">0%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#15803d]/10">
          <div ref={bar} className="ar-pbar h-full origin-left rounded-full" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
    </nav>
  );
}

/** "Need help?" card: drifting aurora, ringing chat icon, cursor spotlight, shimmering button */
export function Cta() {
  const move = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", e.clientX - r.left + "px");
    e.currentTarget.style.setProperty("--my", e.clientY - r.top + "px");
  };
  return (
    <Link href="/contact" onPointerMove={move} className="ar-cta2 group relative block overflow-hidden rounded-[1.75rem] p-6 text-white">
      <span aria-hidden className="ar-cta2-aurora" />
      <span aria-hidden className="ar-cta2-aurora ar-cta2-aurora-b" />
      <span aria-hidden className="ar-cta2-grid" />
      <span aria-hidden className="ar-cta2-spot" />
      <span aria-hidden className="ar-spark" style={{ left: "58%", top: "10%" }} />
      <span aria-hidden className="ar-spark" style={{ left: "90%", top: "36%", animationDelay: "1.1s" }} />
      <span aria-hidden className="ar-spark" style={{ left: "70%", top: "88%", animationDelay: "2.1s" }} />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/35 backdrop-blur">
            <span aria-hidden className="ar-ring" />
            <span aria-hidden className="ar-ring" style={{ animationDelay: "1.2s" }} />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="ar-bubble relative h-[1.65rem] w-[1.65rem]">
              <path d="M3 11h3a2 2 0 012 2v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-5zm0 0a9 9 0 1118 0m0 0v5a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z" />
              <path d="M21 16v2a4 4 0 01-4 4h-5" />
              <circle cx="12" cy="22" r="0.6" fill="currentColor" />
            </svg>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[0.68rem] font-semibold ring-1 ring-white/30 backdrop-blur">
            <span aria-hidden className="ar-live" /> Let’s talk
          </span>
        </div>
        <p className="mt-5 font-mono text-[0.68rem] uppercase tracking-[0.18em] font-semibold text-white/90 [text-shadow:0_1px_2px_rgba(5,60,28,0.45)]">Need help with this?</p>
        <p className="mt-2 font-display text-[1.4rem] leading-[1.15] [text-shadow:0_2px_10px_rgba(5,60,28,0.35)]">Talk to our engineers about your project</p>
        <span className="ar-cta2-btn relative mt-5 inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-white py-2 pl-5 pr-2 text-sm font-bold text-[#0f3d22] shadow-[0_14px_28px_-12px_rgba(0,0,0,0.55)]">
          Contact us
          <span className="ar-cta2-go grid h-7 w-7 place-items-center rounded-full bg-[#15803d] text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </span>
        </span>
      </div>
    </Link>
  );
}

/** share: a flying paper plane, tiles that pop in, wave, and fill with each network's colour on hover */
export function Share({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => window.location.href.split("#")[0];
  const open = (base: string) => window.open(base, "_blank", "noopener,noreferrer,width=640,height=560");
  const tile = (c: string, i: number) => ({ "--c": c, "--i": i }) as CSSProperties;
  return (
    <div className="ar-card ar-share relative p-5">
      <div aria-hidden className="ar-share-bg"><span /><span /></div>
      <div className="relative flex items-center gap-3">
        <span className="ar-plane-box relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#fde047] to-[#f59e0b] text-[#6b3f02] shadow-[0_12px_22px_-10px_rgba(245,158,11,0.95)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="ar-plane h-[1.15rem] w-[1.15rem]"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
        </span>
        <div className="min-w-0 leading-tight">
          <p className="font-display text-[1.05rem] text-[#10231a]">Share this article</p>
          <p className="mt-0.5 font-mono text-[0.68rem] text-[#6b8577]">Send it to your team</p>
        </div>
      </div>
      <div className="relative mt-4 grid grid-cols-4 gap-2.5">
        <button
          type="button"
          aria-label="Copy link"
          data-tip={copied ? "Copied!" : "Copy link"}
          data-done={copied ? "1" : "0"}
          className="ar-sh"
          style={tile("#15803d", 0)}
          onClick={async () => {
            await navigator.clipboard?.writeText(url()).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
        >
          {copied ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="ar-check h-[1.15rem] w-[1.15rem]"><path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-[1.15rem] w-[1.15rem]"><path d="M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1" /></svg>
          )}
        </button>
        <button type="button" aria-label="Share on LinkedIn" data-tip="LinkedIn" className="ar-sh" style={tile("#0a66c2", 1)} onClick={() => open("https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url()))}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-[1.15rem] w-[1.15rem]"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.6 8.65 21 11.2 21 14.5V21h-4v-5.8c0-1.4-.03-3.2-1.95-3.2-1.95 0-2.25 1.52-2.25 3.1V21H9z" /></svg>
        </button>
        <button type="button" aria-label="Share on X" data-tip="X" className="ar-sh" style={tile("#111827", 2)} onClick={() => open("https://twitter.com/intent/tweet?url=" + encodeURIComponent(url()) + "&text=" + encodeURIComponent(title))}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-[1.1rem] w-[1.1rem]"><path d="M17.5 3h3.1l-6.8 7.8L22 21h-6.3l-4.9-6.4L5.2 21H2.1l7.3-8.3L1.8 3h6.4l4.4 5.9zm-1.1 16.2h1.7L7.7 4.7H5.9z" /></svg>
        </button>
        <button type="button" aria-label="Share on WhatsApp" data-tip="WhatsApp" className="ar-sh" style={tile("#22c55e", 3)} onClick={() => open("https://wa.me/?text=" + encodeURIComponent(title + " " + url()))}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-[1.15rem] w-[1.15rem]"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.2-.4.7-1.4a.5.5 0 000-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 001.8-1.3 2.2 2.2 0 00.1-1.3c0-.1-.2-.2-.5-.3z" /></svg>
        </button>
      </div>
    </div>
  );
}
