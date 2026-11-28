"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/* ───────────────────────────── icons ───────────────────────────── */

const P = {
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <path d="M3 3l18 18M10.6 5.1A9.7 9.7 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-3.2 4.1M6.5 6.6A17 17 0 002 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1M9.9 9.9a3 3 0 004.2 4.2" />,
  pencil: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></>,
  trash: <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  refresh: <path d="M20 11a8 8 0 00-14.9-3M4 5v4h4M4 13a8 8 0 0014.9 3M20 19v-4h-4" />,
  download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />,
  logout: <path d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4M16 8l4 4-4 4M20 12H9" />,
  doc: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>,
  inbox: <path d="M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  upload: <path d="M12 16V5M7 9l5-5 5 5M5 20h14" />,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 9" /></>,
  link: <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />,
  unlink: <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1M4 4l16 16" />,
  bold: <path d="M7 5h6a3.5 3.5 0 010 7H7zM7 12h7a3.5 3.5 0 010 7H7z" />,
  italic: <path d="M10 5h8M6 19h8M14 5l-4 14" />,
  underline: <path d="M7 4v7a5 5 0 0010 0V4M5 20h14" />,
  list: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></>,
  listOrdered: <path d="M10 6h10M10 12h10M10 18h10M4 5l1.5-1v4M3.5 14.5c0-1 2.5-1 2.5.3 0 1-2.5 2-2.5 3h2.6" />,
  quote: <path d="M4 18v-5a5 5 0 015-5M13 18v-5a5 5 0 015-5" />,
  code: <path d="M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14" />,
  eraser: <path d="M4 16l9-11 7 6-8 9H7zM9 20h11" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></>,
  building: <path d="M4 21V5l8-2v18M12 9h8v12M4 21h16M7 9h2M7 13h2M7 17h2M15 13h2M15 17h2" />,
  tag: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1" /></>,
  sort: <path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4" />,
  filter: <path d="M4 5h16l-6 8v6l-4-2v-4z" />,
  heading: <path d="M5 4v16M19 4v16M5 12h14" />,
  paragraph: <path d="M13 4H9a4 4 0 000 8h4M13 4v16M17 4v16" />,
  spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  alert: <path d="M12 8v5M12 17h.01M10.3 4l-8 14a2 2 0 001.7 3h16a2 2 0 001.7-3l-8-14a2 2 0 00-3.4 0z" />,
  message: <path d="M4 5h16v11H9l-5 4z" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof P;

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {P[name]}
    </svg>
  );
}

/* ───────────────────────── shared classes ───────────────────────── */

export const field =
  "w-full rounded-2xl border border-[#14532d]/12 bg-white px-4 py-3 text-[#10231a] outline-none transition placeholder:text-[#8aa093] hover:border-[#14532d]/25 focus:border-[#16a34a] focus:shadow-[0_0_0_4px_rgba(22,163,74,0.13)]";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#15803d] to-[#22c55e] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_-16px_rgba(21,128,61,0.95)] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-[#14532d]/12 bg-white px-4 py-3 text-sm font-semibold text-[#3f5a4b] transition hover:border-[#14532d]/25 hover:bg-[#f1f8f3] disabled:opacity-60";

/* ─────────────────────────── icon button ─────────────────────────── */

const TONE = {
  neutral: "text-[#4a6354] hover:bg-[#14532d]/8 hover:text-[#14532d]",
  green: "bg-[#15803d]/10 text-[#15803d] hover:bg-[#15803d] hover:text-white",
  red: "text-[#dc2626] hover:bg-[#dc2626] hover:text-white",
  blue: "text-[#2563eb] hover:bg-[#2563eb] hover:text-white",
};

type IBProps = { icon: IconName; label: string; tone?: keyof typeof TONE; className?: string };

/** Square icon button with a tooltip. Renders a link when `href` is given. */
export function IconButton(props: IBProps & ({ href: string; external?: boolean } | { onClick: () => void; href?: undefined; disabled?: boolean })) {
  const { icon, label, tone = "neutral", className = "" } = props;
  const cls = `adm-ib group/ib relative grid h-10 w-10 place-items-center rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${TONE[tone]} ${className}`;
  const inner = (
    <>
      <Icon name={icon} className="h-[1.15rem] w-[1.15rem]" />
      <span className="adm-tip" role="tooltip">{label}</span>
    </>
  );
  if (props.href !== undefined)
    return (
      <a href={props.href} aria-label={label} className={cls} {...(props.external ? { target: "_blank", rel: "noreferrer" } : {})} onClick={(e) => e.stopPropagation()}>
        {inner}
      </a>
    );
  return (
    <button type="button" aria-label={label} disabled={props.disabled} onClick={(e) => { e.stopPropagation(); props.onClick(); }} className={cls}>
      {inner}
    </button>
  );
}

/* ─────────────────────────── status pill ─────────────────────────── */

export function StatusPill({ on, yes = "Published", no = "Draft" }: { on: boolean; yes?: string; no?: string }) {
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${on ? "bg-[#dcfce7] text-[#166534]" : "bg-[#fef3c7] text-[#92620a]"}`}>
      <span className="relative flex h-1.5 w-1.5">
        {on && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#16a34a] opacity-60" />}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${on ? "bg-[#16a34a]" : "bg-[#ca8a04]"}`} />
      </span>
      {on ? yes : no}
    </span>
  );
}

/* ───────────────────────── custom dropdown ───────────────────────── */

export type Opt = { value: string; label: string; hint?: string; icon?: IconName };

/**
 * A custom dropdown (replaces the browser's native <select>): rounded trigger, animated popover,
 * keyboard support (↑ ↓ Enter Esc), a check on the chosen row and click-outside to close.
 */
export function Select({
  value, onChange, options, placeholder = "Select", icon, className = "", size = "md", align = "left", keepFocus = false, label,
}: {
  value: string; onChange: (v: string) => void; options: Opt[]; placeholder?: string; icon?: IconName;
  className?: string; size?: "sm" | "md"; align?: "left" | "right"; keepFocus?: boolean; label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const cur = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [open]);

  const toggle = () => {
    setHi(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen((o) => !o);
  };
  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return setOpen(false);
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      return toggle();
    }
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => (h + 1) % options.length); }
    if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => (h - 1 + options.length) % options.length); }
    if (e.key === "Enter") { e.preventDefault(); pick(options[hi].value); }
  };
  const hold = keepFocus ? (e: React.MouseEvent) => e.preventDefault() : undefined;

  return (
    <div ref={box} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onMouseDown={hold}
        onClick={toggle}
        onKeyDown={key}
        className={`group flex w-full items-center gap-2.5 border bg-white text-left font-semibold outline-none transition ${
          size === "sm" ? "h-9 rounded-xl px-2.5 text-sm" : "rounded-2xl px-4 py-3 text-[0.95rem]"
        } ${open ? "border-[#16a34a] shadow-[0_0_0_4px_rgba(22,163,74,0.13)]" : "border-[#14532d]/12 hover:border-[#14532d]/25 focus-visible:border-[#16a34a]"} ${cur ? "text-[#10231a]" : "text-[#8aa093]"}`}
      >
        {icon && <Icon name={icon} className="h-[1.1rem] w-[1.1rem] shrink-0 text-[#15803d]" />}
        <span className="min-w-0 flex-1 truncate">{cur?.label ?? placeholder}</span>
        <Icon name="chevron" className={`h-4 w-4 shrink-0 text-[#6b8577] transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          className={`adm-pop absolute z-40 mt-2 max-h-72 min-w-full overflow-y-auto rounded-2xl border border-[#14532d]/10 bg-white p-1.5 shadow-[0_24px_60px_-20px_rgba(20,83,45,0.45)] ${align === "right" ? "right-0" : "left-0"}`}
          style={{ minWidth: "12rem" }}
        >
          {options.map((o, i) => {
            const on = o.value === value;
            return (
              <li key={o.value} role="option" aria-selected={on}>
                <button
                  type="button"
                  onMouseDown={hold}
                  onMouseEnter={() => setHi(i)}
                  onClick={() => pick(o.value)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    hi === i ? "bg-[#15803d]/9" : ""
                  } ${on ? "font-bold text-[#14532d]" : "font-medium text-[#3f5a4b]"}`}
                >
                  {o.icon && <Icon name={o.icon} className="h-4 w-4 shrink-0 text-[#15803d]" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{o.label}</span>
                    {o.hint && <span className="block truncate text-xs font-normal text-[#6b8577]">{o.hint}</span>}
                  </span>
                  {on && <Icon name="check" className="h-4 w-4 shrink-0 text-[#16a34a]" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ───────────────────────── date & time picker ───────────────────────── */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const p2 = (n: number) => String(n).padStart(2, "0");
const toVal = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
function parseVal(v: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v);
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null;
}

/** Custom date + time picker (replaces <input type="datetime-local">). Value is "YYYY-MM-DDTHH:mm" in local time. */
export function DateTimePicker({ value, onChange, placeholder = "Pick date & time" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const sel = parseVal(value);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => { const d = sel ?? new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", down);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", down);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  const base = sel ?? new Date(new Date().setSeconds(0, 0));
  const commit = (d: Date) => onChange(toVal(d));
  const h24 = base.getHours();
  const h12 = h24 % 12 || 12;
  const pm = h24 >= 12;
  const setTime = (h: number, m: number) => commit(new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m));
  const setH12 = (h: number, isPm: boolean) => setTime((h % 12) + (isPm ? 12 : 0), base.getMinutes());

  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const start = new Date(first); start.setDate(1 - first.getDay());
  const days = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  const today = new Date();
  const same = (a: Date, b: Date | null) => !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const go = (n: number) => setView((v) => new Date(v.getFullYear(), v.getMonth() + n, 1));
  const label = sel
    ? sel.toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric" }) + " · " + sel.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" })
    : "";

  const step = "grid h-7 w-full place-items-center rounded-lg text-[#6b8577] transition hover:bg-[#15803d]/10 hover:text-[#14532d]";
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (!open) { const d = sel ?? new Date(); setView(new Date(d.getFullYear(), d.getMonth(), 1)); }
          setOpen((o) => !o);
        }}
        className={`flex w-full items-center gap-2.5 rounded-2xl border bg-white px-4 py-3 text-left text-sm font-semibold outline-none transition ${
          open ? "border-[#16a34a] shadow-[0_0_0_4px_rgba(22,163,74,0.13)]" : "border-[#14532d]/12 hover:border-[#14532d]/25 focus-visible:border-[#16a34a]"
        } ${sel ? "text-[#10231a]" : "text-[#8aa093]"}`}
      >
        <Icon name="calendar" className="h-[1.1rem] w-[1.1rem] shrink-0 text-[#15803d]" />
        <span className="min-w-0 flex-1 truncate">{label || placeholder}</span>
        {sel && (
          <span
            role="button"
            aria-label="Clear date"
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[#6b8577] hover:bg-[#14532d]/8"
          >
            <Icon name="x" className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="Choose date and time" className="adm-pop absolute right-0 z-40 mt-2 w-[19.5rem] max-w-[calc(100vw-2rem)] rounded-3xl border border-[#14532d]/10 bg-white p-4 shadow-[0_30px_70px_-24px_rgba(20,83,45,0.5)]">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" aria-label="Previous month" onClick={() => go(-1)} className="grid h-8 w-8 place-items-center rounded-xl text-[#3f5a4b] transition hover:bg-[#15803d]/10">
              <Icon name="chevron" className="h-4 w-4 rotate-90" />
            </button>
            <span className="text-sm font-extrabold text-[#14532d]">{MONTHS[view.getMonth()]} {view.getFullYear()}</span>
            <button type="button" aria-label="Next month" onClick={() => go(1)} className="grid h-8 w-8 place-items-center rounded-xl text-[#3f5a4b] transition hover:bg-[#15803d]/10">
              <Icon name="chevron" className="h-4 w-4 -rotate-90" />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-[0.68rem] font-bold uppercase tracking-wider text-[#8aa093]">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i} className="py-1.5">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {days.map((d) => {
              const inMonth = d.getMonth() === view.getMonth();
              const on = same(d, sel);
              const now = same(d, today);
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => {
                    commit(new Date(d.getFullYear(), d.getMonth(), d.getDate(), base.getHours(), base.getMinutes()));
                    if (!inMonth) setView(new Date(d.getFullYear(), d.getMonth(), 1));
                  }}
                  className={`relative mx-auto grid h-9 w-9 place-items-center rounded-xl text-sm font-semibold transition ${
                    on
                      ? "bg-gradient-to-br from-[#16a34a] to-[#22c55e] text-white shadow-[0_8px_16px_-8px_rgba(21,128,61,0.9)]"
                      : inMonth
                        ? "text-[#10231a] hover:bg-[#15803d]/10"
                        : "text-[#b6c4bb] hover:bg-[#15803d]/6"
                  }`}
                >
                  {d.getDate()}
                  {now && !on && <span aria-hidden className="absolute bottom-1 h-1 w-1 rounded-full bg-[#eab308]" />}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[#f4f9f6] p-2.5">
            <Icon name="clock" className="ml-1 h-[1.05rem] w-[1.05rem] shrink-0 text-[#15803d]" />
            <div className="grid w-12 place-items-center">
              <button type="button" aria-label="Hour up" onClick={() => setH12(h12 === 12 ? 1 : h12 + 1, pm)} className={step}><Icon name="chevron" className="h-3.5 w-3.5 rotate-180" /></button>
              <span className="py-0.5 text-lg font-extrabold tabular-nums text-[#14532d]">{p2(h12)}</span>
              <button type="button" aria-label="Hour down" onClick={() => setH12(h12 === 1 ? 12 : h12 - 1, pm)} className={step}><Icon name="chevron" className="h-3.5 w-3.5" /></button>
            </div>
            <span className="pb-0.5 text-lg font-extrabold text-[#8aa093]">:</span>
            <div className="grid w-12 place-items-center">
              <button type="button" aria-label="Minute up" onClick={() => setTime(h24, (base.getMinutes() + 5) % 60)} className={step}><Icon name="chevron" className="h-3.5 w-3.5 rotate-180" /></button>
              <span className="py-0.5 text-lg font-extrabold tabular-nums text-[#14532d]">{p2(base.getMinutes())}</span>
              <button type="button" aria-label="Minute down" onClick={() => setTime(h24, (base.getMinutes() + 55) % 60)} className={step}><Icon name="chevron" className="h-3.5 w-3.5" /></button>
            </div>
            <div className="ml-auto grid grid-rows-2 gap-1 rounded-xl bg-white p-1 shadow-sm">
              {([false, true] as const).map((isPm) => (
                <button
                  key={String(isPm)}
                  type="button"
                  onClick={() => setH12(h12, isPm)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition ${pm === isPm ? "bg-[#15803d] text-white shadow" : "text-[#6b8577] hover:bg-[#15803d]/10"}`}
                >
                  {isPm ? "PM" : "AM"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="rounded-xl px-3 py-2 text-sm font-semibold text-[#6b8577] transition hover:bg-[#14532d]/6">Clear</button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { const n = new Date(); n.setSeconds(0, 0); commit(n); setView(new Date(n.getFullYear(), n.getMonth(), 1)); }}
                className="rounded-xl px-3 py-2 text-sm font-bold text-[#15803d] transition hover:bg-[#15803d]/10"
              >
                Now
              </button>
              <button type="button" onClick={() => { if (!sel) commit(base); setOpen(false); }} className="rounded-xl bg-gradient-to-r from-[#15803d] to-[#22c55e] px-4 py-2 text-sm font-bold text-white shadow-[0_10px_20px_-10px_rgba(21,128,61,0.9)] transition hover:brightness-105">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
/* ───────────────────────── segmented control ───────────────────────── */

/** Pills with a sliding highlight. */
export function Segmented<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; count?: number }[] }) {
  const i = Math.max(0, items.findIndex((x) => x.value === value));
  return (
    <div className="relative grid rounded-2xl border border-[#14532d]/12 bg-white p-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}>
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 rounded-xl bg-gradient-to-r from-[#15803d] to-[#22c55e] shadow-[0_10px_20px_-10px_rgba(21,128,61,0.9)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.3,0.64,1)]"
        style={{ width: `calc((100% - 0.5rem) / ${items.length})`, transform: `translateX(${i * 100}%)` }}
      />
      {items.map((x) => (
        <button
          key={x.value}
          type="button"
          onClick={() => onChange(x.value)}
          className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${value === x.value ? "text-white" : "text-[#3f5a4b] hover:text-[#14532d]"}`}
        >
          {x.label}
          {x.count !== undefined && (
            <span className={`rounded-full px-1.5 text-[0.7rem] font-bold ${value === x.value ? "bg-white/25" : "bg-[#14532d]/8"}`}>{x.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ───────────────────────── stat card + search ───────────────────────── */

export function Stat({ icon, label, value, tone = "green", delay = 0 }: { icon: IconName; label: string; value: ReactNode; tone?: "green" | "amber" | "blue"; delay?: number }) {
  const t = { green: "from-[#dcfce7] to-[#f0fdf4] text-[#15803d]", amber: "from-[#fef3c7] to-[#fffbeb] text-[#b45309]", blue: "from-[#dbeafe] to-[#eff6ff] text-[#2563eb]" }[tone];
  return (
    <div className="adm-rise group flex items-center gap-4 rounded-3xl border border-[#14532d]/8 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(20,83,45,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_50px_-30px_rgba(20,83,45,0.6)]" style={{ animationDelay: `${delay}ms` }}>
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${t} transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}>
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <span>
        <span className="block text-2xl font-bold leading-none text-[#10231a]">{value}</span>
        <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-[#6b8577]">{label}</span>
      </span>
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder, className = "" }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <label className={`relative block ${className}`}>
      <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-[1.1rem] w-[1.1rem] -translate-y-1/2 text-[#6b8577]" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${field} pl-11 pr-10`} />
      {value && (
        <button type="button" aria-label="Clear" onClick={() => onChange("")} className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[#6b8577] hover:bg-[#14532d]/8">
          <Icon name="x" className="h-3.5 w-3.5" />
        </button>
      )}
    </label>
  );
}

/* ───────────────────────── confirm dialog ───────────────────────── */

export function Confirm({
  title, text, confirm, busy, onCancel, onConfirm,
}: { title: string; text: string; confirm: string; busy?: boolean; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onCancel]);
  return (
    <div className="adm-fade fixed inset-0 z-50 grid place-items-center bg-[#04140c]/45 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div role="alertdialog" aria-modal className="adm-pop w-full max-w-sm rounded-[1.75rem] bg-white p-7 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]">
          <Icon name="trash" className="h-7 w-7" />
        </span>
        <h2 className="mt-5 text-xl font-bold text-[#10231a]">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#4a6354]">{text}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} className={btnGhost}>Cancel</button>
          <button type="button" onClick={onConfirm} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#dc2626] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_-14px_rgba(220,38,38,0.9)] transition hover:bg-[#b91c1c] disabled:opacity-60">
            {busy ? "Deleting…" : confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Toast({ text }: { text: string }) {
  return (
    <div role="status" className="adm-pop fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-[#14532d] py-3 pl-3 pr-5 text-sm font-semibold text-white shadow-[0_24px_50px_-18px_rgba(20,83,45,0.9)]">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#22c55e]">
        <Icon name="check" className="h-4 w-4" />
      </span>
      {text}
    </div>
  );
}

export function PageHead({ title, sub, children }: { title: string; sub: string; children?: ReactNode }) {
  return (
    <div className="adm-rise flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[1.9rem] font-extrabold leading-tight tracking-tight text-[#0f3d22] sm:text-4xl">{title}</h1>
        <p className="mt-1.5 text-sm text-[#6b8577]">{sub}</p>
      </div>
      {children && <div className="flex flex-wrap gap-2.5">{children}</div>}
    </div>
  );
}
