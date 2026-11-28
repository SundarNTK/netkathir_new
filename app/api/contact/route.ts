import { after, NextResponse, type NextRequest } from "next/server";
import { rest } from "@/lib/supabase";
import { notifyNewContact } from "@/lib/notify";

const LIMITS = { full_name: 120, email: 200, phone: 40, company: 160, service: 160, message: 5000 };

function clean(v: unknown, max: number) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

// Saves a contact-form submission into the contact_submissions table.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  // honeypot: real visitors never fill the hidden "website" field
  if (clean(body.website, 200)) return NextResponse.json({ ok: true });

  const row = {
    full_name: clean(body.full_name, LIMITS.full_name),
    email: clean(body.email, LIMITS.email),
    phone: clean(body.phone, LIMITS.phone) || null,
    company: clean(body.company, LIMITS.company) || null,
    service: clean(body.service, LIMITS.service) || null,
    message: clean(body.message, LIMITS.message),
    submitted_ip: (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "").trim() || null,
  };
  if (!row.full_name || !row.message) return NextResponse.json({ error: "Please fill in your name and message." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });

  try {
    await rest("contact_submissions", { method: "POST", body: JSON.stringify(row), prefer: "return=minimal" });
    // Teams card + team email go out after the visitor already has their answer
    after(() => notifyNewContact(row));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[contact] save failed", e);
    return NextResponse.json({ error: "Sorry, we couldn't send your message right now. Please email us instead." }, { status: 502 });
  }
}
