"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "./ui";

const MENU: { href: string; label: string; hint: string; icon: IconName }[] = [
  { href: "/admin/blogs", label: "Blogs", hint: "Write & publish", icon: "doc" },
  { href: "/admin/contacts", label: "Enquiries", hint: "Contact submissions", icon: "inbox" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (path === "/admin/login") return <div className="adm-bg min-h-screen">{children}</div>;

  async function logout() {
    setBusy(true);
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="adm-bg min-h-screen text-[#10231a] lg:grid lg:grid-cols-[17.5rem_1fr]">
      <aside className="sticky top-0 z-30 lg:h-screen lg:p-3">
        <div className="flex items-center gap-3 border-b border-[#14532d]/10 bg-white/90 px-4 py-3 backdrop-blur lg:h-full lg:flex-col lg:items-stretch lg:gap-0 lg:rounded-[1.75rem] lg:border lg:px-4 lg:py-5 lg:shadow-[0_30px_60px_-44px_rgba(20,83,45,0.7)]">
          <Link href="/admin/blogs" className="flex items-center gap-3 lg:mb-7 lg:px-2">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] ring-1 ring-[#14532d]/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/brand/netkathir-emblem.png" alt="" className="h-7 w-7 object-contain" />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-extrabold tracking-tight text-[#14532d]">Netkathir</span>
              <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-[#14532d] px-2 py-px text-[0.6rem] font-bold uppercase tracking-[0.14em] text-white">
                <Icon name="spark" className="h-2.5 w-2.5" /> Admin
              </span>
            </span>
          </Link>

          <p className="mb-2.5 hidden items-center gap-3 px-3 text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#8aa093] lg:flex">
            Manage <span className="h-px flex-1 bg-gradient-to-r from-[#14532d]/15 to-transparent" />
          </p>
          <nav className="flex flex-1 gap-1.5 lg:flex-none lg:flex-col">
            {MENU.map((m) => {
              const on = path.startsWith(m.href);
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  aria-current={on ? "page" : undefined}
                  className={`group relative flex items-center gap-3 rounded-2xl border px-3 py-2.5 outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#16a34a]/50 ${
                    on
                      ? "border-[#16a34a]/20 bg-gradient-to-r from-[#ecfdf3] to-white shadow-[0_14px_28px_-20px_rgba(21,128,61,0.8)]"
                      : "border-transparent hover:translate-x-0.5 hover:bg-[#f1f8f3]"
                  }`}
                >
                  {/* glowing marker on the active item */}
                  <span
                    aria-hidden
                    className={`absolute -left-3 top-1/2 hidden h-7 w-1.5 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#22c55e] to-[#15803d] shadow-[0_0_14px_rgba(34,197,94,0.8)] transition-all duration-300 lg:block ${
                      on ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"
                    }`}
                  />
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-all duration-300 ${
                      on
                        ? "bg-gradient-to-br from-[#16a34a] to-[#22c55e] text-white shadow-[0_10px_20px_-10px_rgba(21,128,61,0.95)]"
                        : "bg-[#14532d]/6 text-[#15803d] group-hover:scale-105 group-hover:bg-white group-hover:shadow-sm"
                    }`}
                  >
                    <Icon name={m.icon} className="h-[1.2rem] w-[1.2rem]" />
                  </span>
                  <span className="hidden min-w-0 flex-1 leading-tight sm:block">
                    <span className={`block text-sm font-bold ${on ? "text-[#14532d]" : "text-[#2f4a3b]"}`}>{m.label}</span>
                    <span className="hidden truncate text-[0.72rem] text-[#7f9588] lg:block">{m.hint}</span>
                  </span>
                  <Icon
                    name="arrowLeft"
                    className={`hidden h-4 w-4 shrink-0 rotate-180 transition-all duration-300 lg:block ${
                      on ? "translate-x-0 text-[#16a34a] opacity-100" : "-translate-x-1 text-[#8aa093] opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 lg:mt-auto lg:flex-col lg:items-stretch">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="group relative hidden items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#14532d] to-[#15803d] px-3.5 py-3.5 text-white shadow-[0_18px_34px_-20px_rgba(20,83,45,0.9)] outline-none transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#16a34a]/60 lg:flex"
            >
              <span aria-hidden className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" />
              <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-white/15">
                <Icon name="globe" className="h-[1.1rem] w-[1.1rem]" />
              </span>
              <span className="relative leading-tight">
                <span className="block text-sm font-bold">View website</span>
                <span className="block text-[0.7rem] text-white/70">Opens in a new tab</span>
              </span>
              <Icon name="external" className="relative ml-auto h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
            <button
              onClick={logout}
              disabled={busy}
              aria-label="Sign out"
              className="group flex items-center justify-center gap-2.5 rounded-2xl border border-transparent px-3 py-2.5 text-sm font-semibold text-[#5b7567] outline-none transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-60 lg:justify-start lg:py-3"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#14532d]/6 transition-colors group-hover:bg-red-100">
                <Icon name="logout" className="h-[1.05rem] w-[1.05rem]" />
              </span>
              <span className="hidden sm:inline">{busy ? "Signing out…" : "Sign out"}</span>
            </button>
          </div>        </div>
      </aside>
      <div className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
    </div>
  );
}
