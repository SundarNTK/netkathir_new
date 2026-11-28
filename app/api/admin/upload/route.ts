import { NextResponse, type NextRequest } from "next/server";
import { uploadBlogImage } from "@/lib/supabase";
import { apiError, denyUnlessAdmin } from "@/lib/adminApi";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };
const MAX = 2 * 1024 * 1024; // the bucket's own limit

// upload a blog image (cover or inline) to the blog-images bucket
export async function POST(req: NextRequest) {
  const deny = await denyUnlessAdmin(req);
  if (deny) return deny;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob)) return NextResponse.json({ error: "No file" }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Use a JPG, PNG, WebP, GIF or AVIF image" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "Image must be 2 MB or smaller" }, { status: 400 });
  try {
    return NextResponse.json({ url: await uploadBlogImage(file, ext) });
  } catch (e) {
    return apiError(e);
  }
}
