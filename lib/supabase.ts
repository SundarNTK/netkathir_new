// Server-only access to the Supabase REST API (PostgREST + Storage) with the service-role key.
// Never import this from a client component: the key must stay on the server.

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string | null;
  tags: string[];
  body_html: string;
  status: "published" | "draft" | string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ContactSubmission = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service: string | null;
  message: string;
  submitted_ip: string | null;
};

export const BLOG_IMAGE_BUCKET = "blog-images";

function env() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
  return { url: url.replace(/\/$/, ""), key };
}

export class SupabaseError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Call PostgREST: `rest("blog_posts?select=*")`. Returns parsed JSON (or null for empty bodies). */
export async function rest<T = unknown>(path: string, init: RequestInit & { prefer?: string } = {}): Promise<T> {
  const { url, key } = env();
  const { prefer, headers, ...rest } = init;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...rest,
    cache: "no-store",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
      ...headers,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try {
      const j = JSON.parse(text);
      msg = j.message || j.error || text;
    } catch {}
    throw new SupabaseError(res.status, msg);
  }
  return (text ? JSON.parse(text) : null) as T;
}

/** Upload a file to the public blog-images bucket and return its public URL. */
export async function uploadBlogImage(file: Blob, ext: string): Promise<string> {
  const { url, key } = env();
  const name = `${crypto.randomUUID()}.${ext}`;
  const res = await fetch(`${url}/storage/v1/object/${BLOG_IMAGE_BUCKET}/${name}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": file.type || "application/octet-stream", "x-upsert": "false" },
    body: file,
  });
  if (!res.ok) throw new SupabaseError(res.status, (await res.text()) || "Upload failed");
  return `${url}/storage/v1/object/public/${BLOG_IMAGE_BUCKET}/${name}`;
}

/** Older posts store covers as site-relative paths ("/images/blog/…") that live on netkathir.com. */
export function coverUrl(u: string | null | undefined) {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return `https://netkathir.com${u.startsWith("/") ? "" : "/"}${u}`;
}

const POST_LIST = "id,slug,title,excerpt,cover_image_url,tags,status,published_at,created_at,updated_at";

export async function getPublishedPosts() {
  return rest<Omit<BlogPost, "body_html">[]>(`blog_posts?select=${POST_LIST}&status=eq.published&order=published_at.desc.nullslast`);
}

export async function getPublishedPost(slug: string) {
  const rows = await rest<BlogPost[]>(`blog_posts?select=*&status=eq.published&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  return rows[0] ?? null;
}

export function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
