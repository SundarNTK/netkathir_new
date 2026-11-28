import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { BLOG_TAG } from "@/lib/blogData";
import { rest, type BlogPost } from "@/lib/supabase";
import { apiError, denyUnlessAdmin } from "@/lib/adminApi";
import { parseBlogInput } from "@/lib/blogInput";

// list every post (drafts too), newest first
export async function GET(req: NextRequest) {
  const deny = await denyUnlessAdmin(req);
  if (deny) return deny;
  try {
    // the list skips body_html (the article text) — it is ~85% of the payload and only the editor needs it
    const rows = await rest<BlogPost[]>("blog_posts?select=id,slug,title,excerpt,cover_image_url,tags,status,published_at,created_at,updated_at&order=published_at.desc.nullsfirst,created_at.desc");
    return NextResponse.json(rows);
  } catch (e) {
    return apiError(e);
  }
}

// create a post
export async function POST(req: NextRequest) {
  const deny = await denyUnlessAdmin(req);
  if (deny) return deny;
  const { errors, row } = parseBlogInput(await req.json().catch(() => ({})));
  if (errors.length) return NextResponse.json({ error: errors.join(". ") }, { status: 400 });
  try {
    const [created] = await rest<BlogPost[]>("blog_posts", { method: "POST", body: JSON.stringify(row), prefer: "return=representation" });
    revalidateTag(BLOG_TAG, { expire: 0 });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
