"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

export type Post = { id: string; slug: string; title: string; excerpt: string; cover: string | null; date: string; tags: string[] };

const pad = (n: number) => String(n).padStart(2, "0");

function Cover({ src, className = "", eager }: { src: string | null; className?: string; eager?: boolean }) {
  if (!src)
    return (
      <div className={`${className} grid place-items-center bg-gradient-to-br from-[#0f3d22] via-[#15803d] to-[#86efac]`}>
        <span className="font-display text-6xl text-white/80">N</span>
      </div>
    );
  return (
    <div className={`${className} relative overflow-hidden bg-[#eef5f0]`}>
      {/* a tiny copy, blurred, fills the frame; the real image is shown whole on top (covers have mixed proportions) */}
      <Image src={src} alt="" aria-hidden fill sizes="48px" className="cv-blur scale-125 object-cover opacity-70 blur-2xl" />
      <Image
        src={src}
        alt=""
        fill
        draggable={false}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        sizes={eager ? "(min-width: 1024px) 620px, 100vw" : "(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"}
        className="cv-img object-contain"
      />
    </div>
  );
}

/** cards lean towards the pointer (CSS variables only, no re-render) */
function tilt(e: React.PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--rx", `${((e.clientY - r.top) / r.height - 0.5) * -7}deg`);
  el.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 9}deg`);
  el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
  el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
}
function untilt(e: React.PointerEvent<HTMLElement>) {
  e.currentTarget.style.setProperty("--rx", "0deg");
  e.currentTarget.style.setProperty("--ry", "0deg");
}

/* ─────────────────────────────── hero ─────────────────────────────── */

const WORD = "Insights";

function Hero({ post, total }: { post: Post; total: number }) {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(110%_80%_at_15%_0%,#eefaf2_0%,#ffffff_55%,#fbf6e6_100%)] pb-14 pt-28 lg:pb-20 lg:pt-36">
      <span aria-hidden className="bh-blob pointer-events-none absolute -right-32 top-10 h-[28rem] w-[28rem] rounded-full bg-[#22c55e]/15 blur-[100px]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <p className="bh-up inline-flex items-center gap-2 rounded-full border border-[#14532d]/10 bg-white/85 px-4 py-1.5 text-sm font-semibold text-[#15803d] backdrop-blur" style={{ animationDelay: "0.05s" }}>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#16a34a]" /> The Netkathir Journal
          </p>
          <h1 aria-label="Insights & ideas that ship" className="mt-6 font-display leading-[0.9] text-[#0f3d22]">
            <span aria-hidden className="flex text-[clamp(3.6rem,10vw,8.5rem)] tracking-[-0.03em]">
              {WORD.split("").map((c, i) => (
                <span key={i} className="inline-block overflow-hidden pb-[0.06em]">
                  <span className="bh-ch inline-block" style={{ animationDelay: `${0.1 + i * 0.05}s` }}>{c}</span>
                </span>
              ))}
            </span>
            <span aria-hidden className="bh-up mt-1 block text-[clamp(1.6rem,4vw,3.2rem)] tracking-[-0.02em]" style={{ animationDelay: "0.55s" }}>
              &amp; <span className="bd-ink">ideas</span> that ship.
            </span>
          </h1>
          <p className="bh-up mt-6 max-w-lg text-lg leading-relaxed text-[#4b6357]" style={{ animationDelay: "0.7s" }}>
            Practical write-ups from our engineers on AI, cloud, DevOps and building business software that keeps running.
          </p>
          <div className="bh-up mt-8 flex flex-wrap items-center gap-8" style={{ animationDelay: "0.85s" }}>
            <div>
              <p className="font-display text-3xl text-[#15803d]">{total}</p>
              <p className="text-sm text-[#6b8577]">Articles</p>
            </div>
            <a href="#articles" className="group inline-flex items-center gap-3 rounded-full bg-[#0f3d22] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#15803d]">
              Browse all <span className="transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
            </a>
          </div>
        </div>

        {/* featured: the latest article, cover shown whole with the details underneath */}
        <Link
          href={`/blogs/${post.slug}`}
          onPointerMove={tilt}
          onPointerLeave={untilt}
          className="bh-feat bg-tilt bc-ring group relative block rounded-[2rem] bg-white p-3 shadow-[0_50px_100px_-45px_rgba(15,61,34,0.75)]"
        >
          <div className="relative overflow-hidden rounded-[1.5rem]">
            <Cover src={post.cover} eager className="bh-feat-img aspect-[16/9] w-full" />
          </div>
          <span aria-hidden className="bg-glare rounded-[2rem]" />
          <div className="flex items-end justify-between gap-5 px-3 pb-3 pt-5 sm:px-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2.5 font-mono text-xs text-[#a16207]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#facc15] px-2.5 py-0.5 font-sans text-[0.68rem] font-bold uppercase tracking-wider text-[#14532d]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#14532d]" /> Latest
                </span>
                {post.date}
              </p>
              <h2 className="mt-1.5 font-display text-[clamp(1.25rem,2.1vw,1.75rem)] leading-tight text-[#0f3d22] transition-colors group-hover:text-[#15803d]">{post.title}</h2>
            </div>
            <span className="bc-go shrink-0">
              <span className="bc-go-t">Read</span>
              <span aria-hidden>→</span>
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}

/* ─────────────────────────────── grid of every article ─────────────────────────────── */

function Grid({ posts }: { posts: Post[] }) {
  const root = useRef<HTMLElement>(null);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");

  const tags = useMemo(() => {
    const count = new Map<string, number>();
    posts.forEach((p) => p.tags.forEach((t) => count.set(t, (count.get(t) ?? 0) + 1)));
    return [...count.entries()].filter(([t]) => t.length <= 22).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([t]) => t);
  }, [posts]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return posts
      .map((p, i) => ({ p, n: i + 1 }))
      .filter(
        ({ p }) => (!tag || p.tags.includes(tag)) && (!s || p.title.toLowerCase().includes(s) || p.excerpt.toLowerCase().includes(s) || p.tags.some((t) => t.toLowerCase().includes(s)))
      );
  }, [posts, q, tag]);

  const filtering = !!(q.trim() || tag);

  // cards flip in as they reach the viewport (row by row via the --d delay); search / topic results show at once
  useEffect(() => {
    const cards = Array.from(root.current?.querySelectorAll<HTMLElement>("[data-card]:not(.in)") ?? []);
    if (filtering || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cards.forEach((c) => c.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [shown, filtering]);

  // the list gets shorter while filtering: bring the results back into view if the visitor was further down
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const top = root.current?.getBoundingClientRect().top ?? 0;
    if (top < -120) window.scrollTo({ top: window.scrollY + top - 70, behavior: "smooth" });
  }, [q, tag]);

  return (
    <section ref={root} id="articles" className="relative scroll-mt-24 bg-white pb-24 pt-14 lg:pb-32 lg:pt-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#a16207]">All articles</p>
            <h2 className="mt-2 font-display text-[clamp(2rem,4.5vw,3.6rem)] leading-none text-[#0f3d22]">
              Read, learn, <span className="bd-ink">build</span>
            </h2>
          </div>
          <label className="relative block w-full sm:w-80">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#15803d]"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles…" className="w-full rounded-full border border-[#14532d]/15 bg-[#f7faf8] py-3 pl-12 pr-5 outline-none transition focus:border-[#16a34a] focus:bg-white focus:shadow-[0_0_0_4px_rgba(22,163,74,0.12)]" />
          </label>
        </div>
        {tags.length > 0 && (
          <div className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" data-lenis-prevent-touch>
            {["", ...tags].map((t) => (
              <button
                key={t || "all"}
                onClick={() => setTag(t)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-300 ${
                  tag === t ? "border-[#15803d] bg-[#15803d] text-white shadow-[0_10px_24px_-12px_rgba(21,128,61,0.9)]" : "border-[#14532d]/15 text-[#3f5a4b] hover:border-[#15803d] hover:text-[#15803d]"
                }`}
              >
                {t || `All (${posts.length})`}
              </button>
            ))}
          </div>
        )}

        <div className={`mt-10 grid grid-cols-1 gap-7 [perspective:1600px] sm:grid-cols-2 lg:grid-cols-3 ${filtering ? "min-h-[40vh] content-start" : ""}`}>
          {shown.map(({ p, n }, i) => {
            const style = { "--d": `${filtering ? i * 45 : (i % 3) * 120}ms` } as React.CSSProperties;
            const cls = `bc bg-tilt bc-ring group relative min-w-0 rounded-[2rem] p-3 ${filtering ? "in bc-pop" : ""}`;
            return (
              <Link key={p.id} href={`/blogs/${p.slug}`} data-card onPointerMove={tilt} onPointerLeave={untilt} style={style} className={`${cls} flex flex-col`}>
                <span aria-hidden className="bc-mesh" />
                {/* cover: shown whole, with a glass number badge and a glass info strip on the image */}
                <div className="bc-frame relative overflow-hidden rounded-[1.4rem]">
                  <Cover src={p.cover} className="aspect-[16/9] w-full" />
                  <span aria-hidden className="bc-shine" />
                  <span className="bc-glass absolute left-3 top-3 rounded-full px-2.5 py-1 font-mono text-[0.68rem] font-bold text-[#0f3d22]">{pad(n)}</span>
                </div>
                <span aria-hidden className="bg-glare rounded-[2rem]" />
                <div className="bc-body relative flex flex-1 flex-col px-3 pb-1.5 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="bc-ribbon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
                      {p.date}
                    </span>
                    {p.tags[0] && <span className="min-w-0 truncate rounded-full bg-[#ecfdf3] px-3 py-1 text-[0.72rem] font-semibold text-[#15803d]">#{p.tags[0]}</span>}
                  </div>
                  <h3 className="mt-3.5 font-display text-[1.28rem] leading-snug text-[#10231a] transition-colors duration-300 group-hover:text-[#15803d]">
                    <span className="bc-title">{p.title}</span>
                  </h3>
                  {p.excerpt && <p className="mb-5 mt-2.5 line-clamp-2 text-sm leading-relaxed text-[#5b7366]">{p.excerpt}</p>}
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-dashed border-[#14532d]/12 pt-4">
                    <span className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f0fdf4] ring-1 ring-[#15803d]/15">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/brand/netkathir-emblem.png" alt="" className="h-5 w-5 object-contain" />
                      </span>
                      <span className="leading-tight">
                        <span className="block text-[0.8rem] font-semibold text-[#10231a]">Netkathir Team</span>
                        <span className="block text-[0.7rem] text-[#6b8577]">Engineering blog</span>
                      </span>
                    </span>
                    <span className="bc-arrow" aria-hidden>
                      <span className="bc-arrow-a">→</span>
                      <span className="bc-arrow-b">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {shown.length === 0 && <p className="py-16 text-center text-[#6b8577]">No articles match “{q || tag}”.</p>}
      </div>
    </section>
  );
}

export default function BlogScroll({ posts }: { posts: Post[] }) {
  return (
    <>
      <Hero post={posts[0]} total={posts.length} />
      <Grid posts={posts} />
    </>
  );
}
