import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, adminConfigured, checkCredentials, cookieOptions, createSession } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  if (!adminConfigured()) return NextResponse.json({ error: "Admin login is not configured" }, { status: 503 });
  let username = "", password = "";
  try {
    const b = await req.json();
    username = String(b.username ?? "");
    password = String(b.password ?? "");
  } catch {}
  if (!checkCredentials(username, password)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return NextResponse.json({ error: "Wrong username or password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, await createSession(), cookieOptions);
  return res;
}
