import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { BLOG_TAG } from "@/lib/blogData";
import { rest, type BlogPost } from "@/lib/supabase";
import { apiError, denyUnlessAdmin } from "@/lib/adminApi";
import { parseBlogInput } from "@/lib/blogInput";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// update a post
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await denyUnlessAdmin(req);
  if (deny) return deny;
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Unknown post" }, { status: 404 });
  const { errors, row } = parseBlogInput(await req.json().catch(() => ({})));
  if (errors.length) return NextResponse.json({ error: errors.join(". ") }, { status: 400 });
  try {
    const rows = await rest<BlogPost[]>(`blog_posts?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ ...row, updated_at: new Date().toISOString() }),
      prefer: "return=representation",
    });
    if (!rows.length) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    revalidateTag(BLOG_TAG, { expire: 0 });
    return NextResponse.json(rows[0]);
  } catch (e) {
    return apiError(e);
  }
}

// delete one post (only when the admin confirms it in the panel)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await denyUnlessAdmin(req);
  if (deny) return deny;
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Unknown post" }, { status: 404 });
  try {
    const rows = await rest<BlogPost[]>(`blog_posts?id=eq.${id}`, { method: "DELETE", prefer: "return=representation" });
    if (!rows.length) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    revalidateTag(BLOG_TAG, { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
