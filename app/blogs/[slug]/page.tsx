import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { coverUrl, formatDate } from "@/lib/supabase";
import { cachedPost, cachedPosts } from "@/lib/blogData";
import { BodyReveal, Cta, ReadingProgress, Share, Toc } from "@/components/blog/ArticleFx";

export const metadata = { title: "Blog — Netkathir Technologies" };

// every published article is prerendered at build time; new ones are cached on their first visit
export async function generateStaticParams() {
  try {
    const posts = await cachedPosts();
    if (posts.length) return posts.map((p) => ({ slug: p.slug }));
  } catch (e) {
    console.error("[blog] could not list posts for prerendering", e);
  }
  return [{ slug: "welcome" }];
}

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <div className="relative isolate pb-20 pt-24 md:pt-28">
      <Suspense fallback={<PostSkeleton />}>
        <Post params={params} />
      </Suspense>
    </div>
  );
}

const strip = (s: string) => s.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const idOf = (s: string) => strip(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "section";

/** Gives headings anchor ids (for the contents list). Older posts write headings as a bold-only paragraph, so those
 *  become real headings too: numbered ones ("1. Dockerfile") as sub-headings. */
function prepare(html: string, title: string) {
  const toc: { id: string; text: string; level: number }[] = [];
  const used = new Set<string>();
  const uid = (t: string) => {
    let id = idOf(t), n = 2;
    while (used.has(id)) id = `${idOf(t)}-${n++}`;
    used.add(id);
    return id;
  };
  // the hero already shows the title: drop a leading heading that just repeats it
  const wordSet = (t: string) => new Set(strip(t).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2));
  const tw = wordSet(title);
  const repeatsTitle = (t: string) => {
    const hw = wordSet(t);
    if (!hw.size || !tw.size || strip(t).length > 140) return false;
    let hit = 0;
    tw.forEach((w) => hw.has(w) && hit++);
    return hit / tw.size >= 0.75 && hit / hw.size >= 0.6;
  };
  // skip empty paragraphs before the first block, then drop that block if it repeats the title
  html = html.replace(/^(\s*<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>)+/i, "");
  html = html.replace(/^(\s*<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>)*\s*<(h[1-3]|p)[^>]*>([\s\S]*?)<\/\2>/i, (m, _e, _tag, inner: string) => (repeatsTitle(inner) ? "" : m));
  let out = html.replace(/<p>\s*<(strong|b)>([^<]{2,90})<\/\1>\s*(?::\s*)?<\/p>/gi, (_m, _t, text: string) => {
    const level = /^\s*\d+[.)]/.test(text) ? 3 : 2;
    return `<h${level}>${text}</h${level}>`;
  });
  out = out.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_m, lv: string, attrs: string, inner: string) => {
    const text = strip(inner);
    if (!text) return _m;
    const id = /\sid="([^"]+)"/.exec(attrs)?.[1] ?? uid(text);
    toc.push({ id, text, level: Number(lv) });
    return `<h${lv}${attrs.includes("id=") ? attrs : `${attrs} id="${id}"`}>${inner}</h${lv}>`;
  });
  const words = strip(html).split(" ").length;
  return { html: out, toc, minutes: Math.max(1, Math.round(words / 220)) };
}

async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, all] = await Promise.all([
    cachedPost(slug).catch(() => null),
    cachedPosts().catch(() => []),
  ]);
  if (!post) notFound();
  const cover = coverUrl(post.cover_image_url);
  const { html, toc, minutes } = prepare(post.body_html ?? "", post.title);
  const tags = [...new Set(post.tags ?? [])];
  const more = all.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <ReadingProgress target="article-body" />

      {/* ---- hero: text on the left, the cover floating on the right ---- */}
      <header className="mx-auto max-w-7xl px-5 sm:px-6">
        <Link href="/blogs" className="ar-in group inline-flex items-center gap-2 rounded-full border border-[#15803d]/15 bg-white/80 px-4 py-2 text-sm font-semibold text-[#15803d] backdrop-blur transition hover:border-[#15803d]/40" style={{ animationDelay: "0.05s" }}>
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span> All articles
        </Link>
        <div className={`mt-8 grid items-center gap-10 ${cover ? "lg:grid-cols-[1.05fr_1fr] lg:gap-14" : ""}`}>
          <div>
            <div className="ar-in flex flex-wrap items-center gap-2.5 text-sm" style={{ animationDelay: "0.12s" }}>
              <span className="rounded-full bg-[#fef3c7] px-3.5 py-1.5 font-semibold text-[#92620a]">{formatDate(post.published_at)}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-3.5 py-1.5 font-semibold text-[#15803d]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                {minutes} min read
              </span>
            </div>
            <h1 className="ar-in mt-5 font-display text-[clamp(2.1rem,4.6vw,3.9rem)] leading-[1.04] text-grad" style={{ animationDelay: "0.2s" }}>
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="ar-in mt-5 max-w-2xl text-lg leading-relaxed text-[#4b6357]" style={{ animationDelay: "0.3s" }}>
                {post.excerpt}
              </p>
            )}
            {tags.length > 0 && (
              <ul className="ar-in mt-6 flex flex-wrap gap-2" style={{ animationDelay: "0.38s" }}>
                {tags.map((t) => (
                  <li key={t} className="rounded-full border border-[#15803d]/20 bg-white/85 px-3 py-1 text-xs font-semibold text-[#15803d] backdrop-blur">
                    #{t}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {cover && (
            <div className="ar-cover relative">
              <div aria-hidden className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-[#22c55e]/25 via-[#facc15]/15 to-[#38bdf8]/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-[0_50px_100px_-45px_rgba(20,83,45,0.75)]">
                <div className="relative aspect-[16/10] w-full">
                  <Image src={cover} alt="" fill loading="eager" fetchPriority="high" sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" />
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ---- article + sticky sidebar ---- */}
      <div className="mx-auto mt-14 grid max-w-7xl gap-8 px-5 sm:px-6 lg:mt-20 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-12">
        <article className="ar-card ar-in px-5 py-8 sm:px-10 sm:py-12 lg:px-14" style={{ animationDelay: "0.45s" }}>
          {/* body_html is written by the site admins in the admin panel */}
          <div id="article-body" className="blog-body mx-auto max-w-[46rem]" dangerouslySetInnerHTML={{ __html: html }} />
          <BodyReveal target="article-body" />
        </article>
        <aside className="flex flex-col gap-5">
          <Cta />
          {/* the contents list + share stay in view while reading; sized so they always fit the window */}
          <div className="space-y-5 lg:sticky lg:top-28">
            <Toc items={toc} />
            <Share title={post.title} />
          </div>
        </aside>
      </div>

      {/* ---- more articles ---- */}
      {more.length > 0 && (
        <section className="mx-auto mt-20 max-w-7xl px-5 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-[clamp(1.7rem,3vw,2.4rem)] text-[#14532d]">More articles</h2>
            <Link href="/blogs" className="text-sm font-semibold text-[#15803d] hover:underline">View all →</Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((b) => {
              const c = coverUrl(b.cover_image_url);
              return (
                <Link key={b.id} href={`/blogs/${b.slug}`} className="bl-card group flex flex-col overflow-hidden rounded-[1.5rem] border border-[#14532d]/10 bg-white">
                  <div className="relative aspect-[16/9] overflow-hidden bg-[#14532d]/8">
                    {c && <Image src={c} alt="" fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="bl-img object-cover" />}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="font-mono text-xs text-[#a16207]">{formatDate(b.published_at)}</p>
                    <h3 className="mt-2 font-display text-lg leading-snug transition-colors group-hover:text-[#15803d]">{b.title}</h3>
                    <span className="mt-auto pt-4 text-sm font-semibold text-[#15803d]">Read more →</span>
                  </div>
                  <span aria-hidden className="bl-bar" />
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

function PostSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-2" aria-busy>
      <div className="space-y-5">
        <div className="h-8 w-40 animate-pulse rounded-full bg-[#14532d]/10" />
        <div className="h-14 w-full animate-pulse rounded-xl bg-[#14532d]/10" />
        <div className="h-14 w-3/4 animate-pulse rounded-xl bg-[#14532d]/10" />
        <div className="h-5 w-5/6 animate-pulse rounded bg-[#14532d]/10" />
      </div>
      <div className="aspect-[16/10] animate-pulse rounded-[1.75rem] bg-[#14532d]/8" />
    </div>
  );
}
