import Live from "./Live";
import { WORLD_DOTS } from "@/lib/worldDots";
import { COUNTRIES } from "@/lib/data";

type Kind = "years" | "countries" | "people";

const W = 1000;
const LAT_TOP = 78;
const LAT_BOT = -56;
const H = ((LAT_TOP - LAT_BOT) / 360) * W;
const px = (lon: number) => ((lon + 180) / 360) * W;
const py = (lat: number) => ((LAT_TOP - lat) / (LAT_TOP - LAT_BOT)) * H;
const PINS: [number, number, boolean][] = [
  [79.8, 11.9, true], // India (HQ)
  [55.3, 25.2, false], // Dubai
  [-98, 39, false], // USA
  [103.8, 1.35, false], // Singapore
  [101.9, 4.4, false], // Malaysia
  [134, -26, false], // Australia
];
const arc = (a: readonly [number, number, boolean], b: readonly [number, number, boolean]) => {
  const x1 = px(a[0]), y1 = py(a[1]), x2 = px(b[0]), y2 = py(b[1]);
  return `M${x1},${y1} Q${(x1 + x2) / 2},${(y1 + y2) / 2 - Math.min(150, Math.hypot(x2 - x1, y2 - y1) * 0.34)} ${x2},${y2}`;
};

/** A person: head and shoulders. */
function Person({ gold, d, tone }: { gold?: boolean; d: number; tone: number }) {
  return (
    <svg viewBox="0 0 24 28" aria-hidden style={{ ["--d" as string]: `${d}s`, color: gold ? "#eab308" : ["#22c55e", "#4ade80", "#16a34a"][tone] }}>
      <circle cx="12" cy="8" r="5.4" fill="currentColor" />
      <path d="M2 27.5c0-6.4 4.3-10.4 10-10.4s10 4 10 10.4z" fill="currentColor" />
    </svg>
  );
}

/** The picture on top of each figure: bars that grow year by year, a world with routes leaving the HQ, a team that ripples. */
function Visual({ kind }: { kind: Kind }) {
  if (kind === "years") {
    const hs = [22, 30, 38, 36, 48, 56, 54, 66, 76, 88, 100];
    return (
      <svg viewBox="0 0 300 150" className="h-full w-full" aria-hidden>
        <path d="M14 124h272" stroke="#86efac" strokeWidth="2" />
        {hs.map((h, i) => (
          <rect key={i} x={20 + i * 24.5} y={124 - h} width="15" height={h} rx="5" fill={i === hs.length - 1 ? "#eab308" : i > 7 ? "#22c55e" : "#86efac"} className="fx-bar" style={{ animationDelay: `${i * 0.16}s` }} />
        ))}
        <path d="M26 96 76 84 124 74 172 58 222 40 268 14" fill="none" stroke="#14532d" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="fx-draw" pathLength={400} />
        <g transform="translate(268 14)">
          <circle r="11" fill="#eab308" opacity=".3" className="sc-ping" />
          <circle r="5.5" fill="#eab308" stroke="#fff" strokeWidth="2.5" />
        </g>
        <text x="20" y="143" fontSize="10" fontWeight="700" fill="#14532d" opacity=".65" letterSpacing="1.6">2015</text>
        <text x="266" y="143" fontSize="10" fontWeight="700" fill="#14532d" opacity=".65" letterSpacing="1.6" textAnchor="middle">2026</text>
      </svg>
    );
  }
  if (kind === "countries")
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
        {WORLD_DOTS.map(([lon, lat], i) => (
          <circle key={i} cx={px(lon)} cy={py(lat)} r="3.4" fill="#16a34a" opacity={0.2 + ((i * 7) % 10) * 0.02} />
        ))}
        {PINS.slice(1).map((p, i) => (
          <path key={i} d={arc(PINS[0], p)} fill="none" stroke="#eab308" strokeWidth="5" strokeLinecap="round" pathLength={100} className="sc-arc" style={{ animationDelay: `${i * 0.45}s` }} />
        ))}
        {PINS.map(([lon, lat, hq], i) => (
          <g key={i} transform={`translate(${px(lon)} ${py(lat)})`}>
            <circle r={hq ? 36 : 24} fill="#16a34a" opacity="0.25" className="sc-ping" style={{ animationDelay: `${i * 0.35}s` }} />
            <circle r={hq ? 14 : 10} fill={hq ? "#eab308" : "#14532d"} stroke="#fff" strokeWidth="4" />
          </g>
        ))}
      </svg>
    );
  return (
    <div className="sc-crowd" aria-hidden>
      {Array.from({ length: 50 }).map((_, i) => (
        <Person key={i} gold={i === 4 || i === 27 || i === 42} d={((i % 10) + Math.floor(i / 10)) * 0.12} tone={(i * 7) % 3} />
      ))}
    </div>
  );
}

const TINT: Record<Kind, string> = {
  years: "from-[#ecfdf3] to-[#d7f5e1]",
  countries: "from-[#effaf2] to-[#dff5e8]",
  people: "from-[#f6fbe6] to-[#e5f6c9]",
};

const CHIPS: Record<Kind, string[]> = {
  years: ["Founded 2015", "Incorporated 2019", "ISO 27001"],
  countries: COUNTRIES.map((c) => c.replace(" (HQ)", "")),
  people: ["AI & ML", "Cloud & DevOps", "Full-stack", "Mobile", "QA"],
};

/** Three figure cards. Each has its own animated picture and a few tags, and the number counts up. */
export default function StatCards({ items }: { items: [string, string, string, Kind][] }) {
  return (
    <Live>
      <div data-stagger className="grid gap-5 md:grid-cols-3">
        {items.map(([n, s, label, kind]) => (
          <article key={label} className="sc-card">
            <div className={`sc-vis bg-gradient-to-br ${TINT[kind]}`}>
              <Visual kind={kind} />
            </div>
            <div className="px-7 pb-8 pt-6">
              <div data-count={n} data-suffix={s} className="sc-n text-grad font-display">
                {n}
                {s}
              </div>
              <p className="mt-2 flex items-center gap-2 text-[1.02rem] font-semibold text-[#14532d]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#eab308]" />
                {label}
              </p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {CHIPS[kind].map((c) => (
                  <li key={c} className="rounded-full border border-[#14532d]/10 bg-[#f1f8f3] px-2.5 py-1 text-[0.7rem] font-semibold text-[#14532d]">{c}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </Live>
  );
}
