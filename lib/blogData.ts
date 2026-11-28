// Cached reads of the published blog posts. The admin API calls revalidateTag(BLOG_TAG, { expire: 0 }) after every
// create / update / delete, so visitors get instant pages and still see changes straight away.
import { cacheLife, cacheTag } from "next/cache";
import { getPublishedPost, getPublishedPosts } from "@/lib/supabase";

export const BLOG_TAG = "blogs";

export async function cachedPosts() {
  "use cache";
  cacheTag(BLOG_TAG);
  cacheLife("hours");
  return getPublishedPosts();
}

export async function cachedPost(slug: string) {
  "use cache";
  cacheTag(BLOG_TAG);
  cacheLife("hours");
  return getPublishedPost(slug);
}
