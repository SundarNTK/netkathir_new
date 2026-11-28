"use client";

import { useState } from "react";
import { Icon, btnPrimary, field } from "./ui";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: f.get("username"), password: f.get("password") }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Sign in failed");
      const next = new URLSearchParams(window.location.search).get("next");
      // only follow admin-internal paths
      window.location.assign(next && next.startsWith("/admin/") ? next : "/admin/blogs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <span aria-hidden className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full border border-dashed border-[#16a34a]/30" />
      <span aria-hidden className="pointer-events-none absolute -right-20 bottom-10 h-96 w-96 rounded-full border border-[#eab308]/30" />
      <div className="adm-rise relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="grid h-16 w-16 place-items-center rounded-3xl bg-white shadow-[0_24px_50px_-24px_rgba(20,83,45,0.7)] ring-1 ring-[#14532d]/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/brand/netkathir-emblem.png" alt="" className="h-10 w-10 object-contain" />
          </span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[#0f3d22]">Welcome back</h1>
          <p className="mt-1.5 text-sm text-[#6b8577]">Sign in to manage blogs and contact enquiries</p>
        </div>
        <form onSubmit={submit} className="space-y-5 rounded-[2rem] border border-[#14532d]/8 bg-white p-6 shadow-[0_40px_80px_-44px_rgba(20,83,45,0.6)] sm:p-8">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#3f5a4b]">Username</span>
            <span className="relative block">
              <Icon name="user" className="pointer-events-none absolute left-4 top-1/2 h-[1.1rem] w-[1.1rem] -translate-y-1/2 text-[#6b8577]" />
              <input name="username" autoComplete="username" required autoFocus className={field + " pl-11"} />
            </span>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#3f5a4b]">Password</span>
            <span className="relative block">
              <Icon name="lock" className="pointer-events-none absolute left-4 top-1/2 h-[1.1rem] w-[1.1rem] -translate-y-1/2 text-[#6b8577]" />
              <input name="password" type={show ? "text" : "password"} autoComplete="current-password" required className={field + " pl-11 pr-12"} />
              <button
                type="button"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-[#6b8577] transition hover:bg-[#14532d]/8 hover:text-[#14532d]"
              >
                <Icon name={show ? "eyeOff" : "eye"} className="h-[1.1rem] w-[1.1rem]" />
              </button>
            </span>
          </label>
          {error && (
            <p role="alert" className="adm-pop flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <Icon name="alert" className="h-4 w-4 shrink-0" /> {error}
            </p>
          )}
          <button disabled={busy} className={btnPrimary + " w-full py-3.5 text-base"}>
            {busy ? "Signing in…" : "Sign in"}
            {!busy && <Icon name="arrowLeft" className="h-[1.1rem] w-[1.1rem] rotate-180" />}
          </button>
        </form>
      </div>
    </div>
  );
}
