import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { COUNTRIES, PRODUCTS, SERVICE_GROUPS, SITE } from "@/lib/data";
import { answer } from "@/lib/faq";
import { cachedPosts } from "@/lib/blogData";

// Chat widget backend.
// - With ANTHROPIC_API_KEY: Claude answers, streamed as plain text.
// - Without it: the free "smart FAQ" (lib/faq.ts) answers from the site's own data, as JSON { reply, actions }.

const MODEL = process.env.ANTHROPIC_CHAT_MODEL || "claude-opus-5-5";
const FALLBACK = `Thanks for reaching out! Our AI assistant isn't available right now. Please use the Contact Us form (/contact), email ${SITE.email}, or call ${SITE.phones[1]} and our team will reply within 24 hours.`;

// frozen system prompt (no dates or per-request values, so it stays cacheable)
const SYSTEM = `You are the website assistant for ${SITE.name}, an AI-first software company (since 2015, ISO 27001 certified, 50+ engineers, clients in ${COUNTRIES.length} countries).

Your job: answer visitors' questions about Netkathir's services, products and how to work with the team, and guide interested visitors to get in touch.

Company facts (only state facts from this list; if you don't know something, say so and suggest contacting the team):
- Services:
${SERVICE_GROUPS.map((g) => `  - ${g.name}: ${g.items.join("; ")}`).join("\n")}
- Products: ${PRODUCTS.map((p) => `${p.name} (${p.tag}) – ${p.text}`).join(" | ")}
- Offices: ${SITE.offices.map((o) => `${o.country}: ${o.address}`).join(" | ")}
- Countries served: ${COUNTRIES.join(", ")}
- Contact: email ${SITE.email}; phone ${SITE.phones.join(" / ")}; WhatsApp ${SITE.whatsapp}; contact form at /contact
- Website pages: /services, /products, /projects, /blogs, /about, /contact

Style: friendly, professional and concise — usually 2 to 5 short sentences or a short list. Plain text only (no markdown headings or tables; simple "- " bullets are fine). Reply in the visitor's language.
Never invent prices, timelines, client names or guarantees; for quotes, timelines or anything project-specific, invite them to share details through the contact form or WhatsApp.
Stay on topic: politely decline unrelated requests (homework, coding help unrelated to hiring Netkathir, etc.) and steer back to how Netkathir can help.`;

// very small per-IP rate limit (per server instance)
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 12;
}

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
  if (limited(ip)) return NextResponse.json({ error: "You're sending messages too quickly. Please wait a moment." }, { status: 429 });

  let messages: Anthropic.MessageParam[] = [];
  try {
    const body = await req.json();
    messages = (Array.isArray(body.messages) ? body.messages : [])
      .filter((m: { role?: unknown; content?: unknown }) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .slice(-12)
      .map((m: { role: "user" | "assistant"; content: string }) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  } catch {}
  // the conversation must start with the visitor and end with their new message
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return NextResponse.json({ error: "Empty message" }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    const posts = await cachedPosts().catch(() => []);
    const r = answer(String(messages[messages.length - 1].content), posts.map((p) => ({ slug: p.slug, title: p.title, tags: p.tags ?? [] })));
    return NextResponse.json({ mode: "faq", reply: r.reply, actions: r.actions }, { headers: { "Cache-Control": "no-store" } });
  }

  const client = new Anthropic();
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let sent = false;
      try {
        const stream = client.beta.messages.stream({
          model: MODEL,
          max_tokens: 2048, // deliberately short: chat replies are a few sentences
          system: SYSTEM,
          output_config: { effort: "low" }, // chat: fast, low-effort replies
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default", // a safety decline is retried on a suitable fallback model inside the same call
          messages,
        });
        stream.on("text", (t) => {
          sent = true;
          controller.enqueue(encoder.encode(t));
        });
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal" && !sent) controller.enqueue(encoder.encode("Sorry, I can't help with that. Is there anything about Netkathir's services I can help you with?"));
        else if (final.stop_reason === "max_tokens") controller.enqueue(encoder.encode("…"));
      } catch (e) {
        if (e instanceof Anthropic.RateLimitError) console.error("[chat] rate limited");
        else if (e instanceof Anthropic.AuthenticationError) console.error("[chat] invalid ANTHROPIC_API_KEY");
        else if (e instanceof Anthropic.APIError) console.error(`[chat] API error ${e.status}:`, e.message);
        else console.error("[chat] failed", e);
        if (!sent) controller.enqueue(encoder.encode(FALLBACK));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
