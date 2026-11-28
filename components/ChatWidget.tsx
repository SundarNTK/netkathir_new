"use client";

import { useEffect, useRef, useState } from "react";

type Action = { label: string; href: string };
type Msg = { role: "user" | "assistant"; content: string; actions?: Action[] };

const KEY = "nk-chat";
const GREETING: Msg = {
  role: "assistant",
  content: "Hi! I'm the Netkathir assistant. Ask me about our AI, software, cloud or product services — or how to start a project with us.",
};
const SUGGESTIONS = ["What services do you offer?", "Tell me about Garage Bill", "How do I start a project?", "Where are your offices?"];

/** turns bare URLs, emails and site paths into links (the reply is plain text) */
function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+\.[\w.]+|(?<![\w/])\/(?:contact|services|products|projects|blogs|about)\b)/g);
  return parts.map((p, i) => {
    if (/^https?:\/\//.test(p)) return <a key={i} href={p} target="_blank" rel="noreferrer" className="underline">{p}</a>;
    if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(p)) return <a key={i} href={`mailto:${p}`} className="underline">{p}</a>;
    if (/^\/(contact|services|products|projects|blogs|about)$/.test(p)) return <a key={i} href={p} className="font-semibold underline">{p}</a>;
    return p;
  });
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);

  // restore this tab's conversation; show a one-time teaser bubble
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
      if (Array.isArray(saved) && saved.length) setMsgs(saved);
    } catch {}
    if (sessionStorage.getItem(KEY + "-teased")) return;
    const t = setTimeout(() => {
      setTeaser(true);
      sessionStorage.setItem(KEY + "-teased", "1");
    }, 9000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-30)));
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  useEffect(() => {
    if (open) {
      setTeaser(false);
      setTimeout(() => field.current?.focus(), 250);
    }
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const history: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    abort.current = new AbortController();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // the greeting is UI only; the API wants the conversation to start with the visitor
        body: JSON.stringify({ messages: history.filter((m, i) => !(i === 0 && m.content === GREETING.content)).map(({ role, content }) => ({ role, content })) }),
        signal: abort.current.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Something went wrong. Please try again.");
      }
      // smart FAQ: the full answer + buttons arrive at once; reveal it with a short typing effect
      if (res.headers.get("content-type")?.includes("application/json")) {
        const j: { reply?: string; actions?: Action[] } = await res.json();
        const full = j.reply || "Sorry, I didn't get that. Could you rephrase?";
        await new Promise((r) => setTimeout(r, 350));
        const step = Math.max(2, Math.ceil(full.length / 45));
        for (let k = step; k < full.length; k += step) {
          if (abort.current?.signal.aborted) return;
          const part = full.slice(0, k);
          setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: part }]);
          await new Promise((r) => setTimeout(r, 16));
        }
        setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: full, actions: j.actions ?? [] }]);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: acc }]);
      }
      if (!acc) setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: "Sorry, I didn't get a reply. Please try again." }]);
    } catch (e) {
      if ((e as Error).name !== "AbortError")
        setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: e instanceof Error ? e.message : "Something went wrong." }]);
    } finally {
      setBusy(false);
      abort.current = null;
    }
  }

  function reset() {
    abort.current?.abort();
    setMsgs([GREETING]);
    setBusy(false);
  }

  const onlyGreeting = msgs.length === 1;

  return (
    <div className="nk-chat pointer-events-none fixed bottom-5 right-5 z-[80] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {/* panel */}
      <div
        role="dialog"
        aria-label="Chat with Netkathir"
        aria-hidden={!open}
        className={`chat-panel flex w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/95 shadow-[0_40px_90px_-30px_rgba(10,60,30,0.55)] backdrop-blur-xl ${
          open ? "is-open pointer-events-auto" : "pointer-events-none"
        }`}
        style={{ height: "min(36rem, calc(100dvh - 7.5rem))" }}
      >
        <div className="relative flex items-center gap-3 overflow-hidden bg-gradient-to-br from-[#0f3d22] via-[#15803d] to-[#22c55e] px-4 py-3.5 text-white">
          <span aria-hidden className="chat-sheen" />
          <span className="relative grid h-10 w-10 place-items-center rounded-full bg-white shadow-[0_8px_18px_-8px_rgba(0,0,0,0.5)] ring-2 ring-white/70">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/brand/netkathir-emblem.png" alt="" className="h-8 w-8 object-contain" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#15803d] bg-[#86efac]" />
          </span>
          <div className="relative min-w-0 flex-1">
            <p className="font-semibold leading-tight">Netkathir Assistant</p>
            <p className="text-xs text-white/75">Online · replies instantly</p>
          </div>
          <button onClick={reset} title="New chat" className="relative grid h-8 w-8 place-items-center rounded-full hover:bg-white/15">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.8L3 8M3 3v5h5" /></svg>
          </button>
          <button onClick={() => setOpen(false)} aria-label="Close chat" className="relative grid h-8 w-8 place-items-center rounded-full hover:bg-white/15">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div ref={list} className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[linear-gradient(180deg,#f6faf7,#ffffff)] px-4 py-4" data-lenis-prevent>
          {msgs.map((m, i) => (
            <div key={i} className="chat-msg">
              <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[0.9rem] leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-md bg-gradient-to-br from-[#15803d] to-[#16a34a] text-white shadow-[0_8px_20px_-12px_rgba(21,128,61,0.9)]"
                    : "rounded-bl-md border border-[#14532d]/8 bg-white text-[#10231a] shadow-sm"
                }`}
              >
                {m.content ? linkify(m.content) : (
                  <span className="flex gap-1 py-1" aria-label="Typing">
                    <i className="chat-dot" />
                    <i className="chat-dot" style={{ animationDelay: "0.15s" }} />
                    <i className="chat-dot" style={{ animationDelay: "0.3s" }} />
                  </span>
                )}
              </div>
            </div>
              {m.actions && m.actions.length > 0 && (
                <div className="chat-actions mt-2 flex flex-wrap gap-1.5 pl-1">
                  {m.actions.map((a, k) => {
                    const ext = /^(https?:|tel:|mailto:)/.test(a.href);
                    return (
                      <a
                        key={a.href + k}
                        href={a.href}
                        {...(ext && a.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                        style={{ animationDelay: `${k * 70}ms` }}
                        className={`chat-act inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5 ${
                          k === 0 ? "bg-[#15803d] text-white shadow-[0_8px_18px_-10px_rgba(21,128,61,0.9)] hover:bg-[#166534]" : "border border-[#15803d]/25 bg-white text-[#15803d] hover:bg-[#f0fdf4]"
                        }`}
                      >
                        {a.label}
                        <span aria-hidden>{ext ? "↗" : "→"}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {onlyGreeting && (
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-[#15803d]/25 bg-white px-3 py-1.5 text-xs font-semibold text-[#15803d] transition hover:-translate-y-0.5 hover:bg-[#15803d] hover:text-white">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 border-t border-[#14532d]/8 bg-white p-3"
        >
          <textarea
            ref={field}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder="Type your question…"
            className="max-h-28 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-[#14532d]/15 bg-[#f7faf8] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#16a34a] focus:bg-white"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#15803d] to-[#22c55e] text-white shadow-[0_10px_24px_-12px_rgba(21,128,61,0.9)] transition hover:brightness-110 disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" /></svg>
          </button>
        </form>
        <p className="bg-white pb-2 text-center text-[0.65rem] text-[#6b8577]">Automated answers · for quotes, use the <a href="/contact" className="underline">contact form</a></p>
      </div>

      {/* teaser bubble */}
      {teaser && !open && (
        <button onClick={() => setOpen(true)} className="chat-teaser pointer-events-auto hidden max-w-[15rem] sm:block rounded-2xl rounded-br-md border border-white bg-white px-4 py-3 text-left text-sm text-[#10231a] shadow-[0_20px_50px_-20px_rgba(10,60,30,0.5)]">
          👋 Hi! Questions about AI, software or our products? <span className="font-semibold text-[#15803d]">Ask me.</span>
        </button>
      )}

      {/* launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Chat with us"}
        aria-expanded={open}
        className="chat-launcher nk-launch pointer-events-auto group relative h-[3.75rem] w-[3.75rem]"
      >
        {!open && <span aria-hidden className="nk-label">Chat with us</span>}
        {!open && <span aria-hidden className="nk-ripple" />}
        {!open && <span aria-hidden className="nk-ripple nk-ripple2" />}
        <span className="nk-orb">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={`nk-ico absolute h-7 w-7 transition-all duration-300 ${open ? "rotate-90 scale-50 opacity-0" : "opacity-100"}`}>
            <path d="M12 5.2V3" />
            <circle cx="12" cy="2.4" r="1" fill="currentColor" stroke="none" />
            <rect x="4" y="5.2" width="16" height="12.3" rx="4.2" />
            <path d="M2 10.5v3.2M22 10.5v3.2" />
            <circle className="nk-eye" cx="9" cy="11" r="1.35" fill="currentColor" stroke="none" />
            <circle className="nk-eye" cx="15" cy="11" r="1.35" fill="currentColor" stroke="none" />
            <path d="M9.6 14.2c1.4.9 3.4.9 4.8 0" strokeWidth="1.7" />
            <path d="M8.2 17.5L7 21.2l4.4-3.7" />
          </svg>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className={`absolute h-6 w-6 transition-all duration-300 ${open ? "opacity-100" : "-rotate-90 scale-50 opacity-0"}`}>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </span>
        {!open && <span aria-hidden className="nk-online" />}
      </button>    </div>
  );
}
