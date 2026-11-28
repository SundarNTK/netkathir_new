// Validates and normalises the blog form payload sent by the admin editor.

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function parseBlogInput(b: Record<string, unknown>) {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const title = str(b.title);
  const slug = slugify(str(b.slug) || title);
  const excerpt = str(b.excerpt);
  const body_html = typeof b.body_html === "string" ? b.body_html : "";
  const status = b.status === "published" ? "published" : "draft";
  const tags = (Array.isArray(b.tags) ? b.tags : str(b.tags).split(","))
    .map((t) => String(t).trim())
    .filter(Boolean)
    .slice(0, 20);
  const cover_image_url = str(b.cover_image_url) || null;
  let published_at: string | null = str(b.published_at) || null;
  if (published_at && isNaN(Date.parse(published_at))) published_at = null;
  if (status === "published" && !published_at) published_at = new Date().toISOString();

  const errors: string[] = [];
  if (!title) errors.push("Title is required");
  if (!slug) errors.push("Slug is required");
  if (!excerpt) errors.push("Short description (excerpt) is required");
  if (status === "published" && !body_html.replace(/<[^>]*>/g, "").trim()) errors.push("Content is required to publish");
  if (cover_image_url && !/^(https?:\/\/|\/)/.test(cover_image_url)) errors.push("Cover image must be a URL");

  return { errors, row: { title, slug, excerpt, body_html, status, tags, cover_image_url, published_at } };
}
