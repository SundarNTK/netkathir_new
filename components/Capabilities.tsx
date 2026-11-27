"use client";

import Link from "next/link";
import { useState } from "react";

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
            <span className="xp-pill">0{i + 1} · {g.items.length} services</span>
            <h3 className="mt-4 font-display text-[clamp(1.7rem,2.6vw,2.4rem)] font-semibold leading-[1.05]">{g.name}</h3>
            <p className="mt-3 max-w-sm text-[0.95rem] leading-snug text-white/80">{g.blurb}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {g.items.slice(0, 3).map((it) => (
                <li key={it} className="rounded-full bg-white/18 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/30">
                  {it.replace(/ \(.*\)/, "")}
                </li>
              ))}
              {g.items.length > 3 && <li className="px-1.5 py-1.5 text-xs font-semibold text-[#fde68a]">+{g.items.length - 3} more</li>}
            </ul>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#fde68a]">
              Explore <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
