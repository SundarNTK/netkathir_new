"use client";

import Link from "next/link";
import { useState } from "react";

const ACCENTS = ["#16a34a", "#f59e0b", "#0ea5e9", "#8b5cf6"];

type Group = { name: string; blurb: string; items: string[]; image: string };

/**
 * Four tall photo panels side by side. The one you point at opens up and shows what is inside; the others fold to a slim
 * strip. (On phones they simply stack, each fully open.)
 */
export default function Capabilities({ groups }: { groups: Group[] }) {
  const [on, setOn] = useState(0);
  return (
    <div className="xp" onMouseLeave={() => setOn(on)}>
      {groups.map((g, i) => (
        <Link
          key={g.name}
          href="/services"
          className="xp-item group"
          data-on={on === i ? "1" : "0"}
          style={{ ["--c" as string]: ACCENTS[i % ACCENTS.length] }}
          onMouseEnter={() => setOn(i)}
          onFocus={() => setOn(i)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={g.image} alt="" className="xp-img" loading="lazy" decoding="async" />
          <span className="xp-veil" aria-hidden />
          <span className="xp-strip" aria-hidden>
            <b>0{i + 1}</b>
            <i>{g.name}</i>
          </span>
          <span className="xp-go" aria-hidden>↗</span>
          <div className="xp-body">
            <div className="xp-card">
            <span className="xp-pill">0{i + 1} · {g.items.length} services</span>
            <h3 className="mt-4 font-display text-[clamp(1.7rem,2.6vw,2.4rem)] font-semibold leading-[1.05]">{g.name}</h3>
            <p className="xp-blurb mt-3 max-w-sm text-[0.95rem] leading-snug">{g.blurb}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {g.items.slice(0, 3).map((it) => (
                <li key={it} className="xp-chip rounded-full px-3 py-1.5 text-xs font-semibold">
                  {it.replace(/ \(.*\)/, "")}
                </li>
              ))}
              {g.items.length > 3 && <li className="xp-more px-1.5 py-1.5 text-xs font-bold">+{g.items.length - 3} more</li>}
            </ul>
            <span className="xp-link mt-6 inline-flex items-center gap-2 text-sm font-bold">
              Explore <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
            </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
