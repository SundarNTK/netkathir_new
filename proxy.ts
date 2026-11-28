import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, adminConfigured, verifySession } from "@/lib/adminAuth";

// Gate the admin area: every /admin page (except the login page) and every /api/admin call needs a valid session.
// The route handlers check the session again themselves; this only stops unauthenticated visits early.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/admin");
  if (pathname === "/admin/login" || pathname === "/api/admin/login") return NextResponse.next();

  if (!adminConfigured()) {
    return isApi
      ? NextResponse.json({ error: "Admin login is not configured" }, { status: 503 })
      : new NextResponse("Admin login is not configured (set ADMIN_USERNAME and ADMIN_PASSWORD).", { status: 503 });
  }
  if (await verifySession(req.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.next();

  if (isApi) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
