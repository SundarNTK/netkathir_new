"use client";

import { useState } from "react";
import { SITE } from "@/lib/data";
import ServiceSelect from "./ServiceSelect";

const field =
  "peer w-full rounded-xl border border-ink/10 bg-white/70 pl-11 pr-4 pt-5 pb-2 outline-none transition-all duration-300 placeholder-transparent focus:border-ice focus:bg-white focus:shadow-[0_0_0_4px_rgba(22,163,74,0.12)]";
const label =
  "absolute left-11 top-3.5 text-muted text-sm pointer-events-none transition-all duration-300 peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-ice peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[11px]";
const iconCls =
  "pointer-events-none absolute left-4 top-4 h-5 w-5 text-muted transition-colors duration-300 peer-focus:text-ice";

const ICONS: Record<string, React.ReactNode> = {
  "Full Name": <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0" />,
  Email: <path d="M3 6h18v12H3zM3 7l9 6 9-6" />,
  Company: <path d="M4 21V5l8-2v18M12 9h8v12M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2" />,
  Phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />,
  Service: <path d="M4 6h16M4 12h16M4 18h10" />,
  Message: <path d="M4 5h16v11H8l-4 4z" />,
};

function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={iconCls}>
      {ICONS[name]}
    </svg>
  );
}

export default function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  // saves the enquiry to the contact_submissions table (app/api/contact/route.ts)
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;
    const form = e.currentTarget;
    const f = new FormData(form);
    const get = (k: string) => String(f.get(k) ?? "");
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: get("Full Name"),
          email: get("Email"),
          company: get("Company"),
          phone: get("Phone"),
          service: get("Service"),
          message: get("Message"),
          website: get("website"),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Something went wrong. Please try again.");
      form.reset();
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : `Something went wrong. Please email ${SITE.email}.`);
      setState("error");
    }
  }

  return (
    <div data-reveal className="ct-border flex h-full flex-col rounded-[2rem] p-[1.5px]">
      <form
        id="contact-form"
        onSubmit={submit}
        className="glass relative flex flex-1 flex-col rounded-[calc(2rem-1.5px)] p-5 sm:p-8 md:p-10"
      >
        {/* soft animated blobs behind the form (clipped in their own layer so the dropdown can overflow) */}
        <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <span className="ct-blob ct-blob-a" />
          <span className="ct-blob ct-blob-b" />
        </span>

        <div className="relative mb-6 flex flex-wrap items-end justify-between gap-3 md:mb-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ice">Start a conversation</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl md:text-4xl">
              Tell us about your <span className="text-grad">project</span>
            </h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-3 py-1.5 text-xs text-muted">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
            </span>
            Online · replies within 24h
          </span>
        </div>

        <div className="relative grid flex-1 content-start gap-4 md:grid-cols-2 md:gap-5 lg:grid-rows-[auto_auto_auto_1fr]">
          {[
            ["Full Name", "text", true],
            ["Email", "email", true],
            ["Company", "text", false],
            ["Phone", "tel", false],
          ].map(([n, t, r], i) => (
            <div key={n as string} className="ct-field relative" style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
              <input
                id={`cf-${i}`}
                name={n as string}
                type={t as string}
                required={r as boolean}
                placeholder={n as string}
                className={field}
              />
              <Icon name={n as string} />
              <label htmlFor={`cf-${i}`} className={label}>
                {n as string}
                {r ? " *" : ""}
              </label>
            </div>
          ))}

          <div className="ct-field relative z-20 md:col-span-2" style={{ animationDelay: "0.42s" }}>
            <ServiceSelect name="Service" />
          </div>

          <div className="ct-field relative flex flex-col md:col-span-2" style={{ animationDelay: "0.5s" }}>
            <textarea
              id="cf-msg"
              name="Message"
              required
              rows={5}
              placeholder="Message"
              className={field + " h-full min-h-[140px] resize-none !pt-7"}
            />
            <Icon name="Message" />
            <label htmlFor="cf-msg" className={label}>
              Message *
            </label>
          </div>
        </div>

        <div className="relative mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-6 md:mt-8">
          {/* honeypot for bots: hidden from people and screen readers */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
          <button type="submit" disabled={state === "sending"} className="btn btn-solid group justify-center disabled:opacity-70" data-magnetic>
            <span className="relative z-10">{state === "sending" ? "Sending…" : "Send Message"}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="relative z-10 h-5 w-5 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:rotate-12">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
            </svg>
          </button>
          {state === "sent" ? (
            <p className="ct-sent flex items-center gap-2 text-sm font-medium text-ice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-5 w-5">
                <path d="M5 12l5 5L20 7" className="ct-check" />
              </svg>
              Thanks! We&apos;ve received your message and will reply within 24h.
            </p>
          ) : state === "error" ? (
            <p role="alert" className="text-center text-sm font-medium text-red-600 sm:text-left">{error}</p>
          ) : (
            <p className="text-center text-xs text-muted sm:text-left">🔒 Your details stay private. No spam, ever.</p>
          )}
        </div>
      </form>
    </div>
  );
}
