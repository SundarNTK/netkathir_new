"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export type BlogCard = { id: string | number; slug: string; title: string; excerpt: string | null; cover: string | null; date: string };

const TOPICS = ["AI", "Cloud", "DevOps", "ERP", "Automation", "Software engineering"];

function Cover({ src, className = "" }: { src: string | null; className?: string }) {
  if (!src)
    return (
      <div className={`${className} grid place-items-center bg-gradient-to-br from-[#14532d] via-[#15803d] to-[#86efac]`}>
        <span className="font-display text-5xl text-white/85">N</span>
      </div>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" draggable={false} className={className} />;
}

const pad = (n: number) => String(n).padStart(2, "0");

/* ────────────────────────────── hero ────────────────────────────── */

export function BlogHero({ posts = [] }: { posts?: BlogCard[] }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const q = (s: string) => Array.from(el.querySelectorAll<HTMLElement>(s));
      const tl = gsap.timeline({ delay: 0.15 });
      tl.from(q("[data-bh-pill]"), { y: 24, autoAlpha: 0, duration: 0.7, ease: "power3.out" }, 0)
        .from(q("[data-bh-l] > span"), { yPercent: 118, rotate: 3, duration: 1.1, ease: "expo.out", stagger: 0.12 }, 0.1)
        .from(q("[data-bh-sub]"), { y: 28, autoAlpha: 0, duration: 0.9, ease: "power3.out" }, 0.55)
        .from(q("[data-bh-topic]"), { scale: 0.6, autoAlpha: 0, duration: 0.7, ease: "back.out(2)", stagger: 0.07 }, 0.7)
        .from(q("[data-bh-paper]"), { y: 160, rotate: 0, x: 0, autoAlpha: 0, scale: 0.8, duration: 1.3, ease: "expo.out", stagger: 0.12 }, 0.2)
        .from(q("[data-bh-float]"), { scale: 0, autoAlpha: 0, duration: 0.8, ease: "back.out(2.4)", stagger: 0.08 }, 0.9);

      // the paper stack follows the pointer, each layer by its own depth
      const layers = q("[data-depth]").map((n) => ({
        n,
        d: Number(n.dataset.depth) || 0,
        x: gsap.quickTo(n, "x", { duration: 0.9, ease: "power3" }),
        y: gsap.quickTo(n, "y", { duration: 0.9, ease: "power3" }),
      }));
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        layers.forEach((l) => {
          l.x(px * l.d);
          l.y(py * l.d * 0.7);
        });
      };
      el.addEventListener("pointermove", move);

      // scrolling away: the stack lifts and spins slightly, the words slide apart
      const st = { trigger: el, start: "top top", end: "bottom top", scrub: 0.6 };
      gsap.to(q("[data-bh-stack]"), { yPercent: -14, rotate: 4, ease: "none", scrollTrigger: st });
      gsap.to(q("[data-bh-rail]"), { xPercent: -22, ease: "none", scrollTrigger: st });
      return () => el.removeEventListener("pointermove", move);
    });
    return () => mm.revert();
  }, []);

  const covers = posts.slice(0, 3);
  const papers = [
    { rot: -9, x: "-9%", y: "8%", z: 1, depth: 14 },
    { rot: 7, x: "9%", y: "2%", z: 2, depth: 26 },
    { rot: -1.5, x: "0%", y: "-2%", z: 3, depth: 40 },
  ];

  return (
    <section ref={root} data-nolift className="fx bh relative overflow-hidden bg-white pb-6 pt-28 lg:pt-32" data-live="1">
      {/* giant outlined words drifting behind everything */}
      <div aria-hidden data-bh-rail className="bh-rail pointer-events-none absolute inset-x-0 bottom-[3%] z-0 whitespace-nowrap font-display text-[clamp(7rem,17vw,16rem)] leading-none">
        Insights · Ideas · Stories · Insights · Ideas · Stories
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-5 sm:px-6 lg:min-h-[64vh] lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
        <div>
          <p data-bh-pill className="inline-flex items-center gap-2.5 rounded-full border border-[#14532d]/12 bg-[#f1f8f3] px-4 py-1.5 text-sm font-semibold text-[#14532d]">
            <span className="relative flex h-2 w-2">
              <span className="bh-dot absolute inline-flex h-full w-full rounded-full bg-[#16a34a]" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#16a34a]" />
            </span>
            Insights · Blogs
          </p>
          <h1 className="mt-6 font-display text-[clamp(2.7rem,7.4vw,6.4rem)] leading-[0.95] tracking-[-0.02em] text-[#0a2417]">
            <span data-bh-l className="block overflow-hidden pb-[0.08em]"><span className="block">Notes from</span></span>
            <span data-bh-l className="block overflow-hidden pb-[0.12em]">
              <span className="block">
                the people who{" "}
                <span className="relative inline-block text-grad">
                  build
                  <svg aria-hidden viewBox="0 0 220 24" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-[0.28em] w-full overflow-visible">
                    <path className="bh-scribble" d="M3 15 C 40 3, 70 22, 110 11 S 180 4, 217 13" fill="none" stroke="#eab308" strokeWidth="5" strokeLinecap="round" pathLength={1} />
                  </svg>
                </span>
              </span>
            </span>
          </h1>
          <p data-bh-sub className="mt-6 max-w-lg text-lg text-[#4a6354]">
            Short, honest write-ups on AI, cloud, DevOps and shipping software that keeps running.
          </p>
          <ul className="mt-7 flex flex-wrap gap-2">
            {TOPICS.map((t) => (
              <li key={t} data-bh-topic className="bh-topic rounded-full border border-[#14532d]/12 bg-white px-3.5 py-1.5 text-[0.82rem] font-semibold text-[#14532d] shadow-[0_8px_20px_-14px_rgba(20,83,45,0.6)]">
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* a fanned stack of the latest covers */}
        <div data-bh-stack className="relative mx-auto h-[min(26rem,62vw)] w-full max-w-[34rem] lg:h-[30rem]">
          {papers.map((p, i) => {
            const post = covers[2 - i] ?? covers[0];
            return (
              <div key={i} data-depth={p.depth} className="absolute inset-0 grid place-items-center" style={{ zIndex: p.z }}>
                <div data-bh-paper>
                <div
                  className="bh-paper"
                  style={{ ["--r" as string]: `${p.rot}deg`, ["--tx" as string]: p.x, ["--ty" as string]: p.y, animationDelay: `${i * -1.7}s` }}
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[1.1rem]">
                    <Cover src={post?.cover ?? null} className="h-full w-full object-cover" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 font-mono text-[0.62rem] font-bold text-[#14532d]">
                      {pad(3 - i)}
                    </span>
                  </div>
                  <div className="px-1 pb-1 pt-3">
                    <div className="h-2.5 w-4/5 rounded-full bg-[#14532d]/85" />
                    <div className="mt-2 h-2 w-full rounded-full bg-[#14532d]/12" />
                    <div className="mt-1.5 h-2 w-3/5 rounded-full bg-[#14532d]/12" />
                  </div>
                </div>
                </div>
              </div>
            );
          })}
          {/* little floating badges around the stack */}
          <span data-bh-float data-depth="60" className="absolute -left-1 top-[12%] z-10">
            <span className="bh-float grid h-14 w-14 place-items-center rounded-2xl bg-[#14532d] font-display text-2xl text-white shadow-[0_20px_40px_-16px_rgba(20,83,45,0.8)]" style={{ animationDelay: "-1s" }}>
              AI
            </span>
          </span>
          <span data-bh-float data-depth="52" className="absolute -right-2 top-[26%] z-10">
            <span className="bh-float block rounded-full bg-[#facc15] px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-[#14532d] shadow-[0_18px_36px_-16px_rgba(161,98,7,0.7)]" style={{ animationDelay: "-2.4s" }}>
              New
            </span>
          </span>
          <span data-bh-float data-depth="70" className="absolute bottom-[8%] left-[4%] z-10">
            <span className="bh-float grid h-12 w-12 place-items-center rounded-full border-2 border-dashed border-[#16a34a]/60 bg-white text-[#16a34a]" style={{ animationDelay: "-3.3s" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
            </span>
          </span>
          {posts.length > 0 && (
            <span data-bh-float data-depth="48" className="absolute -bottom-1 right-[6%] z-10">
              <span className="bh-float block rounded-2xl bg-white px-4 py-2.5 shadow-[0_24px_50px_-20px_rgba(20,83,45,0.6)]" style={{ animationDelay: "-0.4s" }}>
                <span className="block font-display text-2xl leading-none text-[#14532d]">{posts.length}</span>
                <span className="block text-[0.7rem] font-semibold text-[#4a6354]">articles</span>
              </span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────── feed ────────────────────────────── */

export function BlogFeed({ posts }: { posts: BlogCard[] }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const q = (s: string, r: ParentNode = el) => Array.from(r.querySelectorAll<HTMLElement>(s));

      // featured article: the picture opens like a window and settles, the ghost number drifts, the text arrives piece by piece
      const feat = q("[data-bf-feat]")[0];
      if (feat) {
        const media = q("[data-bf-fmedia]", feat)[0];
        const img = q("[data-bf-fimg]", feat)[0];
        gsap.fromTo(media, { clipPath: "inset(16% 10% 16% 10% round 2.6rem)" }, { clipPath: "inset(0% 0% 0% 0% round 1.75rem)", ease: "none", scrollTrigger: { trigger: feat, start: "top 92%", end: "top 38%", scrub: 0.6 } });
        gsap.fromTo(img, { scale: 1.22, yPercent: -2 }, { scale: 1.04, yPercent: 2, ease: "none", scrollTrigger: { trigger: feat, start: "top bottom", end: "bottom top", scrub: 0.6 } });
        gsap.fromTo(q("[data-bf-ghost]", feat), { xPercent: 20 }, { xPercent: -20, ease: "none", scrollTrigger: { trigger: feat, start: "top bottom", end: "bottom top", scrub: true } });
        gsap.from(q("[data-bf-ft]", feat), { y: 46, autoAlpha: 0, duration: 0.9, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: feat, start: "top 70%", once: true } });
      }

      // grid header: the line draws and the count runs up
      const head = q("[data-bf-head]")[0];
      if (head) {
        gsap.from(q("[data-bf-line]", head), { scaleX: 0, transformOrigin: "0 50%", duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: head, start: "top 90%", once: true } });
        const c = q("[data-bf-count]", head)[0];
        const o = { v: 0 };
        const end = Number(c?.dataset.bfCount) || 0;
        if (c) gsap.to(o, { v: end, duration: 1.6, ease: "power2.out", onUpdate: () => (c.textContent = pad(Math.round(o.v))), scrollTrigger: { trigger: head, start: "top 90%", once: true } });
      }

      // cards: a window wipes open over each picture, the picture drifts inside it, the text rises
      q("[data-bf-card]").forEach((card, i) => {
        const media = q("[data-bf-media]", card)[0];
        const img = q("[data-bf-img]", card)[0];
        const rest = q("[data-bf-r]", card);
        gsap.set(card, { autoAlpha: 0, y: 70, rotate: i % 2 ? 1.6 : -1.6 });
        gsap.set(media, { clipPath: "inset(100% 0% 0% 0% round 1.4rem)" });
        gsap.set(img, { scale: 1.22 });
        gsap.set(rest, { y: 26, autoAlpha: 0 });
        const tl = gsap.timeline({ paused: true });
        tl.to(card, { autoAlpha: 1, y: 0, rotate: 0, duration: 0.9, ease: "power3.out" }, 0)
          .to(media, { clipPath: "inset(0% 0% 0% 0% round 1.4rem)", duration: 1.1, ease: "expo.out" }, 0.05)
          .to(img, { scale: 1.04, duration: 1.4, ease: "power3.out" }, 0.05)
          .to(rest, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08, ease: "power3.out" }, 0.3);
        ScrollTrigger.create({ trigger: card, start: "top 90%", once: true, onEnter: () => tl.play() });
        gsap.fromTo(img, { yPercent: -2 }, { yPercent: 2, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: 0.7 } });
      });
      ScrollTrigger.refresh();
    });
    return () => mm.revert();
  }, [posts]);

  const [first, ...rest] = posts;
  return (
    <div ref={root} className="fx bf" data-live="1">
      {/* featured */}
      <section data-nolift className="relative px-3 pb-6 pt-8 sm:px-6 md:pt-12">
        <div data-bf-feat className="relative mx-auto max-w-7xl">
          <div aria-hidden data-bf-ghost className="pointer-events-none absolute -top-10 left-0 z-0 select-none font-display text-[clamp(8rem,22vw,20rem)] leading-none text-transparent [-webkit-text-stroke:2px_rgba(21,128,61,0.16)]">
            01
          </div>
          <Link href={`/blogs/${first.slug}`} className="bf-feat group relative z-10 grid items-stretch gap-0 overflow-hidden rounded-[2rem] bg-[#0b2a18] text-white lg:grid-cols-[1.65fr_1fr]">
            <div data-bf-fmedia className="relative min-h-[14rem] overflow-hidden sm:min-h-[22rem] lg:min-h-[28rem]">
              <div data-bf-fimg className="absolute inset-0 will-change-transform">
                <Cover src={first.cover} className="h-full w-full object-cover" />
              </div>
              <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0b2a18]/60 max-lg:bg-gradient-to-t" />
            </div>
            <div className="relative flex flex-col justify-center p-7 sm:p-10 lg:p-12">
              <span aria-hidden className="bf-glow pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full" />
              <span data-bf-ft className="relative inline-flex w-fit items-center gap-2 rounded-full bg-[#facc15] px-4 py-1.5 text-sm font-bold text-[#14532d]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#14532d]" /> Latest · {first.date}
              </span>
              <h2 data-bf-ft className="relative mt-5 font-display text-[clamp(1.9rem,3.8vw,3.3rem)] leading-[1.04]">
                <span className="bf-ul">{first.title}</span>
              </h2>
              {first.excerpt && (
                <p data-bf-ft className="relative mt-4 line-clamp-3 text-[1.02rem] text-white/72">
                  {first.excerpt}
                </p>
              )}
              <span data-bf-ft className="relative mt-8 inline-flex items-center gap-3 font-semibold">
                <span className="bf-circle grid h-12 w-12 place-items-center rounded-full bg-white text-[#14532d]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M7 17L17 7M9 7h8v8" />
                  </svg>
                </span>
                Read the article
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* grid */}
      {rest.length > 0 && (
        <section data-nolift className="px-3 pb-16 pt-12 sm:px-6 md:pb-24">
          <div className="mx-auto max-w-7xl">
            <div data-bf-head className="mb-10 flex items-end gap-5 md:mb-14">
              <h2 className="font-display text-[clamp(2rem,4.4vw,3.6rem)] leading-none text-[#0a2417]">More from the desk</h2>
              <span data-bf-line className="mb-2 hidden h-px flex-1 bg-gradient-to-r from-[#16a34a]/60 to-transparent sm:block" />
              <span className="mb-1 ml-auto font-mono text-sm font-bold text-[#14532d] sm:ml-0">
                <span data-bf-count={rest.length}>{pad(rest.length)}</span> articles
              </span>
            </div>
            <div className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((b, i) => (
                <article key={b.id} data-bf-card className={`bf-card ${i % 3 === 1 ? "lg:mt-14" : ""}`}>
                  <Link href={`/blogs/${b.slug}`} className="group block">
                    <div data-bf-media className="bf-media relative aspect-[16/10] overflow-hidden">
                      <div className="bf-zoom absolute inset-0">
                        <div data-bf-img className="h-full w-full will-change-transform">
                          <Cover src={b.cover} className="h-full w-full object-cover" />
                        </div>
                      </div>
                      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#04140c]/55 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 font-mono text-[0.7rem] font-bold text-[#14532d] shadow-sm">{pad(i + 2)}</span>
                      <span className="bf-read absolute bottom-4 right-4 grid h-14 w-14 place-items-center rounded-full bg-[#facc15] text-[#14532d]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5">
                          <path d="M7 17L17 7M9 7h8v8" />
                        </svg>
                      </span>
                    </div>
                    <div className="pt-5">
                      <p data-bf-r className="flex items-center gap-2 font-mono text-xs font-semibold text-[#a16207]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#ca8a04]" />
                        {b.date}
                      </p>
                      <h3 data-bf-r className="mt-2.5 font-display text-[1.55rem] leading-[1.12] text-[#0a2417]">
                        <span className="bf-ul">{b.title}</span>
                      </h3>
                      {b.excerpt && (
                        <p data-bf-r className="mt-2.5 line-clamp-2 text-[0.95rem] text-[#4a6354]">
                          {b.excerpt}
                        </p>
                      )}
                      <span data-bf-r className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#15803d]">
                        Read more <span className="bf-arrow">→</span>
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
