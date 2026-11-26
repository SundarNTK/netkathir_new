"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { SERVICE_GROUPS } from "@/lib/data";

type Option = { group: string; value: string };

const GROUP_ICONS: Record<string, React.ReactNode> = {
  "AI & GenAI": <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z" />,
  "Enterprise Software": <path d="M4 5h16v11H4zM8 20h8M12 16v4" />,
  "Cloud & DevOps": <path d="M7 18a4 4 0 01-.6-8 6 6 0 0111.4 1.5A3.5 3.5 0 0117.5 18z" />,
  "Digital Transformation": <path d="M4 17l5-5 4 4 7-8M15 8h5v5" />,
  Other: <path d="M12 8v4M12 16h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />,
};

export default function ServiceSelect({ name = "Service" }: { name?: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [invalid, setInvalid] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const options: Option[] = useMemo(
    () => [
      ...SERVICE_GROUPS.flatMap((g) => g.items.map((v) => ({ group: g.name, value: v }))),
      { group: "Other", value: "Other" },
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.value.toLowerCase().includes(q) || o.group.toLowerCase().includes(q)) : options;
  }, [options, query]);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // focus search when opened
  useEffect(() => {
    if (open) requestAnimationFrame(() => search.current?.focus());
  }, [open]);

  // keep the highlighted option visible
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function openList() {
    setQuery("");
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function choose(v: string) {
    setValue(v);
    setInvalid(false);
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) choose(filtered[active].value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  let lastGroup = "";

  return (
    <div ref={root} className="relative" onKeyDown={onKey}>
      {/* real input so the browser's required-field check still works */}
      <input
        tabIndex={-1}
        aria-hidden
        name={name}
        value={value}
        required
        onChange={() => {}}
        onInvalid={(e) => {
          e.preventDefault();
          setInvalid(true);
          openList();
        }}
        className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0"
      />

      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-haspopup="listbox"
        onClick={() => (open ? setOpen(false) : openList())}
        className={`ss-trigger ${open ? "is-open" : ""} ${invalid ? "is-invalid" : ""}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="ss-lead h-5 w-5">
          {value ? GROUP_ICONS[options.find((o) => o.value === value)?.group ?? "Other"] : <path d="M4 6h16M4 12h16M4 18h10" />}
        </svg>
        <span className="min-w-0 flex-1 text-left">
          <span className={`block transition-all duration-300 ${value ? "text-[11px] text-ice" : "text-sm text-muted"}`}>
            Service interested in *
          </span>
          {value && <span className="block truncate font-medium text-fg">{value}</span>}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ss-chev h-5 w-5 text-muted">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {invalid && !open && <p className="mt-1.5 text-xs text-red-600">Please choose a service.</p>}

      <div className={`ss-panel ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <div className="relative border-b border-ink/10 p-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            ref={search}
            value={query}
            tabIndex={open ? 0 : -1}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search services…"
            className="w-full rounded-lg bg-[#f0fdf4] py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-ice/30"
          />
        </div>

        <ul ref={list} id={`${id}-list`} role="listbox" className="ss-list" data-lenis-prevent>
          {filtered.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">No matching service</li>}
          {filtered.map((o, i) => {
            const header = o.group !== lastGroup && o.group !== "Other";
            lastGroup = o.group;
            const selected = o.value === value;
            return (
              <li key={o.value} role="presentation">
                {header && (
                  <p className="ss-group">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      {GROUP_ICONS[o.group]}
                    </svg>
                    {o.group}
                  </p>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-i={i}
                  tabIndex={-1}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(o.value)}
                  className={`ss-option ${i === active ? "is-active" : ""} ${selected ? "is-selected" : ""}`}
                  style={{ animationDelay: open ? `${Math.min(i, 12) * 18}ms` : "0ms" }}
                >
                  <span className="flex-1 text-left">{o.value}</span>
                  {selected && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-ice">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
