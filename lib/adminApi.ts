import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySession } from "@/lib/adminAuth";
import { SupabaseError } from "@/lib/supabase";

/** Returns a 401 response when the request has no valid admin session, otherwise null. */
export async function denyUnlessAdmin(req: NextRequest) {
  if (await verifySession(req.cookies.get(ADMIN_COOKIE)?.value)) return null;
  return NextResponse.json({ error: "Not signed in" }, { status: 401 });
}

export function apiError(e: unknown) {
  if (e instanceof SupabaseError) {
    const conflict = e.status === 409 || /duplicate key/i.test(e.message);
    return NextResponse.json(
      { error: conflict ? "A post with this slug already exists. Choose another slug." : e.message },
      { status: conflict ? 409 : e.status >= 400 && e.status < 500 ? e.status : 502 }
    );
  }
  console.error(e);
  return NextResponse.json({ error: e instanceof Error ? e.message : "Unexpected error" }, { status: 500 });
}
