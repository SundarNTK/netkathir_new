import Live from "./Live";

/** Small looping illustrations, one per step. Light colours, drawn in code. */
function Art({ k }: { k: number }) {
  const g = "#16a34a";
  const ink = "#14532d";
  const gold = "#eab308";
  if (k === 0)
    return (
      <svg viewBox="0 0 240 150" className="h-full w-full" aria-hidden>
        {Array.from({ length: 5 }).flatMap((_, r) =>
          Array.from({ length: 9 }).map((__, c) => <circle key={`${r}-${c}`} cx={22 + c * 24} cy={22 + r * 26} r="2.6" fill="#bbf7d0" />)
        )}
        {[[70, 48], [118, 74], [166, 48], [142, 100]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="5" fill={i === 1 ? gold : g} className="fx-pop" style={{ animationDelay: `${i * 0.5}s` }} />
        ))}
        <path d="M70 48 118 74 166 48M118 74 142 100" stroke={g} strokeWidth="1.6" strokeDasharray="4 4" fill="none" opacity=".6" />
        <g className="fx-scan" transform="translate(98 62)">
          <circle cx="0" cy="0" r="21" fill="rgba(255,255,255,.55)" stroke={ink} strokeWidth="4" />
          <path d="m15 15 18 18" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        </g>
      </svg>
    );
  if (k === 1)
    return (
      <svg viewBox="0 0 240 150" className="h-full w-full" aria-hidden>
        <rect x="30" y="16" width="180" height="118" rx="12" fill="#fff" stroke={ink} strokeWidth="2.4" className="fx-draw" pathLength={400} />
        <path d="M30 40h180" stroke={ink} strokeWidth="2" className="fx-draw d1" pathLength={400} />
        {[46, 58, 70].map((x, i) => (
          <circle key={x} cx={x - 8 + i * 0} cy="28" r="3" fill={[gold, g, "#86efac"][i]} />
        ))}
        <rect x="46" y="54" width="62" height="64" rx="8" fill="#dcfce7" stroke={g} strokeWidth="2" className="fx-draw d2" pathLength={400} />
        <rect x="120" y="54" width="74" height="26" rx="8" fill="#fef9c3" stroke={gold} strokeWidth="2" className="fx-draw d3" pathLength={400} />
        <rect x="120" y="92" width="74" height="26" rx="8" fill="#dcfce7" stroke={g} strokeWidth="2" className="fx-draw d4" pathLength={400} />
        <path d="m150 100 0 24 7-6 6 12 5-3-6-11 9-1z" fill={ink} className="fx-cursor" />
      </svg>
    );
  if (k === 2)
    return (
      <svg viewBox="0 0 240 150" className="h-full w-full" aria-hidden>
        <rect x="26" y="14" width="188" height="122" rx="12" fill="#fff" stroke="#bbf7d0" strokeWidth="2" />
        <rect x="26" y="14" width="188" height="24" rx="12" fill="#ecfdf3" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={42 + i * 14} cy="26" r="3.4" fill={[gold, g, "#86efac"][i]} />
        ))}
        {[
          [44, 54, 70, g],
          [58, 70, 104, ink],
          [58, 86, 60, gold],
          [44, 102, 88, g],
          [44, 118, 40, "#86efac"],
        ].map(([x, y, w, c], i) => (
          <rect key={i} x={x as number} y={y as number} width={w as number} height="8" rx="4" fill={c as string} className="fx-type" style={{ animationDelay: `${i * 0.35}s` }} />
        ))}
        <rect x="136" y="116" width="3" height="12" fill={ink} className="fx-caret" />
      </svg>
    );
  return (
    <svg viewBox="0 0 240 150" className="h-full w-full" aria-hidden>
      <path d="M24 128h192" stroke="#bbf7d0" strokeWidth="2" />
      {[30, 52, 74, 98, 122].map((h, i) => (
        <rect key={i} x={36 + i * 38} y={128 - h} width="24" height={h} rx="6" fill={i === 4 ? g : i === 3 ? "#4ade80" : "#bbf7d0"} className="fx-bar" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
      <path d="M40 104 84 88 122 78 160 52 206 24" stroke={ink} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" className="fx-draw" pathLength={400} />
      <circle cx="206" cy="24" r="6.5" fill={gold} className="fx-pop" />
    </svg>
  );
}

const TINT = ["from-[#ecfdf3] to-[#d9f6e2]", "from-[#fffbe6] to-[#fdf0b8]", "from-[#e9f9f0] to-[#d4f1de]", "from-[#f0fbe3] to-[#dff4c2]"];

/** Four steps climbing like a staircase: each card sits higher than the last, and each has its own little animation. */
export default function Steps({ steps }: { steps: string[][] }) {
  return (
    <Live className="st">
      <svg className="st-path" viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden>
        <path d="M0 280 C 220 280, 260 220, 420 205 S 700 140, 800 110 S 1040 40, 1200 24" fill="none" stroke="#16a34a" strokeWidth="2.4" strokeDasharray="3 11" strokeLinecap="round" className="st-dash" />
      </svg>
      <div data-stagger className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        {steps.map(([t, d], i) => (
          <article key={t} className="st-card" style={{ ["--lift" as string]: `${i * -2.6}rem` }}>
            <div className={`st-art bg-gradient-to-br ${TINT[i]}`}>
              <span className="st-no">0{i + 1}</span>
              <Art k={i} />
            </div>
            <div className="p-6 pt-5">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.26em] text-[#15803d]">{["Understand", "Shape", "Make", "Grow"][i]}</p>
              <h3 className="mt-2 font-display text-[1.65rem] font-semibold leading-tight text-ink">{t}</h3>
              <p className="mt-2 text-[0.94rem] leading-relaxed text-muted">{d}</p>
            </div>
          </article>
        ))}
      </div>
    </Live>
  );
}
