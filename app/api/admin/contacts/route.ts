import { NextResponse, type NextRequest } from "next/server";
import { rest, type ContactSubmission } from "@/lib/supabase";
import { apiError, denyUnlessAdmin } from "@/lib/adminApi";

// read-only list of contact form submissions, newest first
export async function GET(req: NextRequest) {
  const deny = await denyUnlessAdmin(req);
  if (deny) return deny;
  try {
    const rows = await rest<ContactSubmission[]>("contact_submissions?select=*&order=created_at.desc&limit=2000");
    return NextResponse.json(rows);
  } catch (e) {
    return apiError(e);
  }
}
