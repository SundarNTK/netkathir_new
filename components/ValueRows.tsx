export type ValueKind = "idea" | "team" | "tech" | "growth";

const STAR = "M0 -6 L1.7 -1.7 L6 0 L1.7 1.7 L0 6 L-1.7 1.7 L-6 0 L-1.7 -1.7Z";

/** A small animated picture for each value (plays while the row is pointed at). */
function Art({ kind }: { kind: ValueKind }) {
  if (kind === "idea")
    return (
      <svg viewBox="12 2 168 112" className="va">
        <g className="va-rays">
          {Array.from({ length: 8 }, (_, i) => (
            <line key={i} x1="96" y1="15" x2="96" y2="6" transform={`rotate(${i * 45} 96 52)`} stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
          ))}
        </g>
        <circle className="va-glow" cx="96" cy="52" r="30" fill="#fde047" opacity=".35" />
        <circle cx="96" cy="52" r="22" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
        <path d="M89 54 q3.5-9 7 0 t7 0" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
        <path d="M86 70 h20 l-2 8 h-16z" fill="#fef3c7" stroke="#ca8a04" strokeWidth="1.6" />
        <rect x="88" y="79" width="16" height="7" rx="3" fill="#14532d" />
        <rect x="91" y="87" width="10" height="5" rx="2.5" fill="#14532d" />
        {([[34, 34, 0], [158, 40, 0.5], [150, 98, 1], [44, 94, 1.5]] as const).map(([x, y, d], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <path className="va-star" d={STAR} fill={i % 2 ? "#16a34a" : "#eab308"} style={{ animationDelay: `${d}s` }} />
          </g>
        ))}
      </svg>
    );

  if (kind === "team") {
    const P = ([[40, 66, "#16a34a"], [96, 52, "#eab308"], [152, 66, "#0d9488"]] as const).map(([x, y, c], i) => (
      <g key={i} className="va-person" style={{ animationDelay: `${i * 0.25}s` }}>
        <circle cx={x} cy={y - 14} r="10" fill={c} />
        <path d={`M${x - 17} ${y + 24} a17 17 0 0 1 34 0z`} fill={c} opacity=".9" />
      </g>
    ));
    return (
      <svg viewBox="12 2 168 112" className="va">
        <path className="va-flow" d="M44 46 Q70 18 96 34" fill="none" stroke="#14532d" strokeWidth="2" strokeLinecap="round" />
        <path className="va-flow" d="M96 34 Q122 18 148 46" fill="none" stroke="#14532d" strokeWidth="2" strokeLinecap="round" />
        {P}
        <g className="va-bubble">
          <rect x="22" y="14" width="34" height="20" rx="8" fill="#fff" />
          <path d="M30 34 l-4 7 9-7z" fill="#fff" />
          <circle cx="32" cy="24" r="2" fill="#16a34a" />
          <circle cx="39" cy="24" r="2" fill="#16a34a" />
          <circle cx="46" cy="24" r="2" fill="#16a34a" />
        </g>
        <g className="va-bubble va-bubble2">
          <rect x="136" y="14" width="34" height="20" rx="8" fill="#fff" />
          <path d="M162 34 l4 7 -9-7z" fill="#fff" />
          <path d="M145 24 l4 4 8-9" fill="none" stroke="#0d9488" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    );
  }

  if (kind === "tech")
    return (
      <svg viewBox="12 2 168 112" className="va">
        <rect x="26" y="20" width="132" height="82" rx="9" fill="#fff" stroke="#14532d" strokeOpacity=".18" strokeWidth="1.5" />
        <path d="M26 29a9 9 0 019-9h114a9 9 0 019 9v8H26z" fill="#14532d" opacity=".9" />
        <circle cx="37" cy="29" r="2.6" fill="#f87171" />
        <circle cx="46" cy="29" r="2.6" fill="#facc15" />
        <circle cx="55" cy="29" r="2.6" fill="#4ade80" />
        {([[0, 62, "#16a34a"], [10, 88, "#0d9488"], [10, 48, "#eab308"], [0, 76, "#16a34a"], [10, 56, "#0d9488"]] as const).map(([ind, w, c], i) => (
          <rect key={i} className="va-code" x={38 + ind} y={46 + i * 11} width={w} height="5.5" rx="2.7" fill={c} style={{ animationDelay: `${i * 0.35}s` }} />
        ))}
        <rect className="va-caret" x="108" y="90" width="3" height="8" rx="1" fill="#14532d" />
        <g transform="translate(156 92)">
          <g className="va-gear">
            <circle r="12.7" fill="none" stroke="#15803d" strokeWidth="5.5" strokeDasharray="5 5" />
            <circle r="9" fill="#fff" stroke="#15803d" strokeWidth="3" />
            <circle r="2.6" fill="#15803d" />
          </g>
        </g>
      </svg>
    );

  return (
    <svg viewBox="12 2 168 112" className="va">
      <path d="M22 104H172" stroke="#14532d" strokeOpacity=".25" strokeWidth="2" strokeLinecap="round" />
      {[20, 32, 45, 58, 74].map((h, i) => (
        <rect key={i} className="va-bar" x={36 + i * 26} y={104 - h} width="17" height={h} rx="4" fill={i === 4 ? "#eab308" : i > 1 ? "#16a34a" : "#86efac"} style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
      <path className="va-trend" d="M30 88 L68 72 L100 76 L134 48 L166 24" fill="none" stroke="#14532d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
      <circle className="va-tip" cx="166" cy="24" r="6" fill="#14532d" />
      <path className="va-sprout" d="M168 16 q10-8 14-1 q-9 3-14 1z" fill="#22c55e" />
    </svg>
  );
}

/** Four big lines of type. Pointing at one sweeps green behind it, nudges the word along and pops a small picture out at the side. */
export default function ValueRows({ rows }: { rows: { t: string; d: string; kind: ValueKind }[] }) {
  return (
    <ul className="vr">
      {rows.map((r, i) => (
        <li key={r.t} className="vr-row group">
          <span className="vr-sweep" aria-hidden />
          <span className="vr-no">0{i + 1}</span>
          <div className="vr-main">
            <h3 className="vr-word font-display">{r.t}</h3>
            <p className="vr-desc">{r.d}</p>
          </div>
          <span className={`vr-photo vr-art vr-art--${r.kind}`} aria-hidden>
            <Art kind={r.kind} />
          </span>
          <span className="vr-arrow" aria-hidden>→</span>
        </li>
      ))}
    </ul>
  );
}
