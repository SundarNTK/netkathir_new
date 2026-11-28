import { Suspense } from "react";
import BlogScroll, { type Post } from "@/components/blog/BlogScroll";
import { coverUrl, formatDate } from "@/lib/supabase";
import { cachedPosts } from "@/lib/blogData";

export const metadata = { title: "Blogs — Netkathir Technologies" };

export default function Blogs() {
  return (
    <div className="relative isolate bg-white">
      <Suspense fallback={<BlogSkeleton />}>
        <BlogBody />
      </Suspense>
    </div>
  );
}

// posts come from Supabase through a tagged cache (refreshed by the admin panel on every change)
async function BlogBody() {
  let posts: Post[] = [];
  let failed = false;
  try {
    posts = (await cachedPosts()).map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt ?? "",
      cover: coverUrl(p.cover_image_url),
      date: formatDate(p.published_at),
      tags: [...new Set(p.tags ?? [])],
    }));
  } catch (e) {
    console.error("[blogs] load failed", e);
    failed = true;
  }
  if (!posts.length)
    return (
      <section className="grid min-h-[70vh] place-items-center px-6 pt-28">
        <p className="text-center text-muted">{failed ? "We couldn't load the articles right now. Please try again shortly." : "No articles yet — check back soon."}</p>
      </section>
    );
  return <BlogScroll posts={posts} />;
}

function BlogSkeleton() {
  return (
    <section className="grid min-h-[100svh] place-items-center bg-[radial-gradient(120%_90%_at_50%_10%,#f3fbf5_0%,#ffffff_55%,#f6f1df_100%)]" aria-busy>
      <div className="h-[52vh] w-[min(34rem,86vw)] animate-pulse rounded-[2rem] bg-[#14532d]/8" />
    </section>
  );
}
