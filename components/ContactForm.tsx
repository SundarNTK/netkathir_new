"use client";

import { useState } from "react";
import { CONTACT_SERVICES, SITE } from "@/lib/data";

const field =
  "peer w-full border-0 border-b border-ink/20 py-3 outline-none focus:border-ice transition-colors placeholder-transparent";
const label =
  "absolute left-0 top-3 text-muted text-sm pointer-events-none transition-all peer-focus:-top-3 peer-focus:text-xs peer-focus:text-ice peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-xs";

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  // NOTE: no backend yet — this opens the visitor's mail client with the details filled in.
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = [...f.entries()].map(([k, v]) => `${k}: ${v}`).join("\n");
    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(
      "Website enquiry: " + f.get("Service")
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <form id="contact-form" onSubmit={submit} className="glass rounded-[2rem] p-8 md:p-12 grid gap-9 md:grid-cols-2">
      {[
        ["Full Name", "text", true],
        ["Email", "email", true],
        ["Company", "text", false],
        ["Phone", "tel", false],
      ].map(([n, t, r]) => (
        <div key={n as string} className="relative">
          <input name={n as string} type={t as string} required={r as boolean} placeholder={n as string} className={field} />
          <label className={label}>{n as string}{r ? " *" : ""}</label>
        </div>
      ))}

      <div className="md:col-span-2 relative">
        <select name="Service" required defaultValue="" className={field + " text-fg"}>
          <option value="" disabled>Service interested in *</option>
          {CONTACT_SERVICES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2 relative">
        <textarea name="Message" required rows={4} placeholder="Message" className={field + " resize-none"} />
        <label className={label}>Message *</label>
      </div>

      <div className="md:col-span-2 flex items-center gap-6">
        <button type="submit" className="btn btn-solid">Send Message →</button>
        {sent && <p className="text-sm text-ice">Opening your email app…</p>}
      </div>
    </form>
  );
}
