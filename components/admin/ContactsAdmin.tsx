"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { readCache, writeCache } from "./cache";
import { useRouter } from "next/navigation";
import { Icon, IconButton, PageHead, SearchBox, Select, Stat, btnGhost, btnPrimary } from "./ui";

type Row = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service: string | null;
  message: string;
  submitted_ip: string | null;
};

function when(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function csv(rows: Row[]) {
  const cols: (keyof Row)[] = ["created_at", "full_name", "email", "phone", "company", "service", "message"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const text = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `contact-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const TINTS = ["#16a34a", "#0d9488", "#ca8a04", "#2563eb", "#7c3aed", "#db2777"];
function Avatar({ name, size = "h-11 w-11" }: { name: string; size?: string }) {
  const tint = TINTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];
  return (
    <span className={`grid ${size} shrink-0 place-items-center rounded-2xl text-base font-extrabold text-white shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)]`} style={{ background: `linear-gradient(135deg, ${tint}, ${tint}bb)` }}>
      {(name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

/** Read-only list of the contact form submissions. */
export default function ContactsAdmin() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [service, setService] = useState("");
  const [open, setOpen] = useState<Row | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);
  const [spin, setSpin] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    setError("");
    setSpin(true);
    try {
      const res = await fetch("/api/admin/contacts", { cache: "no-store" });
      if (res.status === 401) return router.replace("/admin/login");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not load submissions");
      setRows(j);
      writeCache("contacts", j);
      setLoadedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load submissions");
    } finally {
      setSpin(false);
    }
  }, [router]);

  useEffect(() => {
    // show the last list straight away, then refresh it
    const cached = readCache<Row[]>("contacts");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (cached) setRows(cached);
    load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  const services = useMemo(() => [...new Set((rows ?? []).map((r) => r.service).filter(Boolean) as string[])].sort(), [rows]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows ?? []).filter(
      (r) =>
        (!service || r.service === service) &&
        (!s || [r.full_name, r.email, r.phone, r.company, r.message].some((v) => v?.toLowerCase().includes(s)))
    );
  }, [rows, q, service]);
  const last30 = useMemo(() => (rows ?? []).filter((r) => loadedAt - Date.parse(r.created_at) < 30 * 864e5).length, [rows, loadedAt]);
  const serviceOpts = useMemo(
    () => [{ value: "", label: "All services", icon: "filter" as const }, ...services.map((s) => ({ value: s, label: s }))],
    [services]
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHead title="Enquiries" sub="Everyone who filled the Contact Us form, newest first.">
        <button onClick={load} className={btnGhost}>
          <Icon name="refresh" className={`h-[1.1rem] w-[1.1rem] ${spin ? "animate-spin" : ""}`} /> Refresh
        </button>
        <button onClick={() => csv(shown)} disabled={!shown.length} className={btnPrimary}>
          <Icon name="download" className="h-[1.1rem] w-[1.1rem]" /> Export CSV
        </button>
      </PageHead>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <Stat icon="inbox" label="Total enquiries" value={rows?.length ?? "–"} delay={60} />
        <Stat icon="clock" label="Last 30 days" value={rows ? last30 : "–"} tone="blue" delay={120} />
        <Stat icon="filter" label="Showing" value={rows ? shown.length : "–"} tone="amber" delay={180} />
      </div>

      <div className="adm-rise mt-6 flex flex-wrap gap-3" style={{ animationDelay: "220ms" }}>
        <SearchBox value={q} onChange={setQ} placeholder="Search name, email, phone, company, message…" className="w-full sm:w-96" />
        <Select value={service} onChange={setService} options={serviceOpts} icon="filter" placeholder="All services" className="w-full sm:w-64" label="Filter by service" />
      </div>

      {error && (
        <p className="mt-6 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <Icon name="alert" className="h-4 w-4" /> {error}{" "}
          <button onClick={load} className="ml-1 font-semibold underline">
            Retry
          </button>
        </p>
      )}

      <div className="mt-5">
        {!rows && !error ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-3xl bg-white/80" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="grid place-items-center rounded-3xl border border-dashed border-[#14532d]/20 bg-white/70 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f1f8f3] text-[#15803d]">
              <Icon name="inbox" className="h-6 w-6" />
            </span>
            <p className="mt-4 font-bold text-[#14532d]">No submissions match</p>
            <p className="mt-1 text-sm text-[#6b8577]">Try another search or filter.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {shown.map((r, i) => (
              <li
                key={r.id}
                onClick={() => setOpen(r)}
                className="adm-rise group flex cursor-pointer flex-col gap-3 rounded-3xl border border-[#14532d]/8 bg-white p-4 shadow-[0_16px_36px_-32px_rgba(20,83,45,0.7)] transition duration-300 hover:-translate-y-0.5 hover:border-[#16a34a]/30 hover:shadow-[0_26px_50px_-30px_rgba(20,83,45,0.65)] lg:flex-row lg:items-center lg:gap-5"
                style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
              >
                <div className="flex min-w-0 items-center gap-3.5 lg:w-72">
                  <Avatar name={r.full_name} />
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-[#10231a]">{r.full_name}</span>
                    <span className="flex items-center gap-1.5 truncate text-xs text-[#6b8577]">
                      {r.company ? (
                        <>
                          <Icon name="building" className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{r.company}</span>
                        </>
                      ) : (
                        <>
                          <Icon name="mail" className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{r.email}</span>
                        </>
                      )}
                    </span>
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  {r.service && <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[0.7rem] font-bold text-[#166534]"><Icon name="spark" className="h-3 w-3" />{r.service}</span>}
                  <p className="line-clamp-2 text-sm text-[#3f5a4b]">{r.message}</p>
                </div>
                <div className="flex items-center gap-3 lg:justify-end">
                  <span className="flex items-center gap-1.5 whitespace-nowrap text-xs text-[#6b8577]">
                    <Icon name="clock" className="h-3.5 w-3.5" />
                    {when(r.created_at)}
                  </span>
                  <div className="ml-auto flex items-center gap-1 rounded-2xl bg-[#f6faf7] p-1 lg:ml-0">
                    <IconButton icon="eye" label="View details" tone="green" onClick={() => setOpen(r)} />
                    <IconButton icon="mail" label="Reply by email" tone="blue" href={`mailto:${r.email}?subject=${encodeURIComponent("Re: your enquiry to Netkathir Technologies")}`} />
                    {r.phone && <IconButton icon="phone" label={`Call ${r.phone}`} tone="green" href={`tel:${r.phone}`} />}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {open && (
        <div className="adm-fade fixed inset-0 z-50 grid place-items-center bg-[#04140c]/45 p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div role="dialog" aria-modal className="adm-pop max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative bg-gradient-to-br from-[#14532d] to-[#16a34a] p-6 text-white">
              <button onClick={() => setOpen(null)} aria-label="Close" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/15 transition hover:rotate-90 hover:bg-white/25">
                <Icon name="x" className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-4">
                <Avatar name={open.full_name} size="h-14 w-14" />
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-extrabold">{open.full_name}</h2>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/80">
                    <Icon name="clock" className="h-3.5 w-3.5" /> {when(open.created_at)}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                {(
                  [
                    ["mail", "Email", open.email, `mailto:${open.email}`],
                    ["phone", "Phone", open.phone, open.phone ? `tel:${open.phone}` : ""],
                    ["building", "Company", open.company, ""],
                    ["spark", "Service", open.service, ""],
                  ] as const
                ).map(([icon, k, v, href]) => (
                  <div key={k} className="flex items-center gap-3 rounded-2xl bg-[#f6faf7] p-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#15803d] shadow-sm">
                      <Icon name={icon} className="h-[1.05rem] w-[1.05rem]" />
                    </span>
                    <span className="min-w-0">
                      <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-[#8aa093]">{k}</dt>
                      <dd className="truncate font-semibold text-[#10231a]">
                        {v ? href ? <a href={href} className="text-[#15803d] hover:underline">{v}</a> : v : "—"}
                      </dd>
                    </span>
                  </div>
                ))}
              </dl>
              <p className="mt-5 flex items-center gap-1.5 text-sm font-bold text-[#3f5a4b]">
                <Icon name="message" className="h-4 w-4 text-[#15803d]" /> Message
              </p>
              <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-[#f6faf7] p-4 text-sm leading-relaxed text-[#10231a]">{open.message}</p>
              <a
                href={`mailto:${open.email}?subject=${encodeURIComponent("Re: your enquiry to Netkathir Technologies")}`}
                className={`${btnPrimary} mt-5 w-full`}
              >
                <Icon name="mail" className="h-[1.1rem] w-[1.1rem]" /> Reply by email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
