// Notifications for a new contact-form submission: a Microsoft Teams Adaptive Card (Power Automate workflow)
// and an email to the team (Resend). Both are optional: each one is skipped when its env key is missing,
// and a failure is logged without affecting the visitor (the submission is already saved in Supabase).
import { SITE } from "@/lib/data";

export type ContactNotice = {
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service: string | null;
  message: string;
  submitted_ip: string | null;
};

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://netkathir.com").replace(/\/$/, "");

function when() {
  return new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) + " IST";
}

/* ---------------------------------- Teams ---------------------------------- */

/** Posts an Adaptive Card to the Teams channel behind TEAMS_WEBHOOK_URL (Power Automate "Teams webhook" trigger). */
export async function notifyTeams(c: ContactNotice) {
  const url = process.env.TEAMS_WEBHOOK_URL;
  if (!url) return;
  const fact = (title: string, value: string | null) => ({ title, value: value?.trim() || "—" });
  const card = {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    msteams: { width: "Full" },
    body: [
      {
        type: "Container",
        style: "good",
        bleed: true,
        items: [
          { type: "TextBlock", text: "📬 New website enquiry", weight: "Bolder", size: "Large", wrap: true },
          { type: "TextBlock", text: `${c.full_name}${c.company ? ` · ${c.company}` : ""}`, size: "Medium", wrap: true, spacing: "Small" },
          { type: "TextBlock", text: when(), isSubtle: true, size: "Small", spacing: "None", wrap: true },
        ],
      },
      {
        type: "FactSet",
        spacing: "Medium",
        facts: [fact("Name", c.full_name), fact("Email", c.email), fact("Phone", c.phone), fact("Company", c.company), fact("Service", c.service)],
      },
      { type: "TextBlock", text: "Message", weight: "Bolder", spacing: "Medium" },
      { type: "TextBlock", text: c.message, wrap: true, spacing: "Small" },
    ],
    actions: [
      { type: "Action.OpenUrl", title: "Reply by email", url: `mailto:${c.email}?subject=${encodeURIComponent("Re: your enquiry to Netkathir Technologies")}` },
      ...(c.phone ? [{ type: "Action.OpenUrl", title: "Call", url: `tel:${c.phone.replace(/[^\d+]/g, "")}` }] : []),
      { type: "Action.OpenUrl", title: "Open admin", url: `${SITE_URL}/admin/contacts` },
    ],
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "message",
      attachments: [{ contentType: "application/vnd.microsoft.card.adaptive", contentUrl: null, content: card }],
    }),
  });
  if (!res.ok) throw new Error(`Teams webhook ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

/* ---------------------------------- Email ---------------------------------- */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Emails the submission to the team through Resend; "Reply" goes straight to the visitor. */
export async function emailTeam(c: ContactNotice) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  // Resend only sends from a domain verified in the Resend account. Until netkathir.com is verified there,
  // the default test sender can deliver only to the Resend account owner's own address.
  const from = process.env.RESEND_FROM_EMAIL || "Netkathir Website <onboarding@resend.dev>";
  const to = (process.env.CONTACT_TO_EMAIL || SITE.email).split(",").map((s) => s.trim()).filter(Boolean);

  const row = (k: string, v: string | null) =>
    `<tr><td style="padding:8px 12px;color:#5b7366;font-size:13px;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:8px 12px;color:#10231a;font-size:14px">${v ? esc(v) : "—"}</td></tr>`;
  const html = `<!doctype html><html><body style="margin:0;background:#f3f6f4;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:linear-gradient(135deg,#15803d,#22c55e);border-radius:16px 16px 0 0;padding:22px 24px;color:#fff">
      <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.85">New website enquiry</div>
      <div style="font-size:22px;font-weight:bold;margin-top:6px">${esc(c.full_name)}${c.company ? ` · ${esc(c.company)}` : ""}</div>
      <div style="font-size:12px;opacity:.85;margin-top:4px">${when()}</div>
    </div>
    <div style="background:#fff;border-radius:0 0 16px 16px;padding:12px 12px 22px">
      <table style="width:100%;border-collapse:collapse">
        ${row("Name", c.full_name)}${row("Email", c.email)}${row("Phone", c.phone)}${row("Company", c.company)}${row("Service", c.service)}
      </table>
      <div style="margin:14px 12px 0;padding:14px 16px;background:#f0fdf4;border-left:4px solid #22c55e;border-radius:8px;color:#10231a;font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(c.message)}</div>
      <div style="margin:20px 12px 0">
        <a href="mailto:${esc(c.email)}" style="display:inline-block;background:#15803d;color:#fff;text-decoration:none;font-weight:bold;padding:10px 18px;border-radius:10px;font-size:14px">Reply to ${esc(c.full_name)}</a>
        <a href="${SITE_URL}/admin/contacts" style="display:inline-block;margin-left:8px;color:#15803d;font-weight:bold;font-size:14px;padding:10px 6px">Open admin →</a>
      </div>
    </div>
  </div></body></html>`;
  const text = [
    `New website enquiry — ${when()}`,
    `Name: ${c.full_name}`,
    `Email: ${c.email}`,
    `Phone: ${c.phone || "—"}`,
    `Company: ${c.company || "—"}`,
    `Service: ${c.service || "—"}`,
    "",
    c.message,
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      reply_to: c.email,
      subject: `New enquiry: ${c.full_name}${c.service ? ` — ${c.service}` : ""}`,
      html,
      text,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

/** Runs every configured notification; never throws. */
export async function notifyNewContact(c: ContactNotice) {
  const results = await Promise.allSettled([notifyTeams(c), emailTeam(c)]);
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`[contact] ${i === 0 ? "Teams" : "email"} notification failed:`, r.reason);
  });
}
