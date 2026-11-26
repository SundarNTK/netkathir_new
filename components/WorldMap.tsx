import { WORLD_DOTS } from "@/lib/worldDots";

const W = 1000;
const LAT_TOP = 78;
const LAT_BOT = -56;
const H = ((LAT_TOP - LAT_BOT) / 360) * W; // equirectangular

const px = (lon: number) => ((lon + 180) / 360) * W;
const py = (lat: number) => ((LAT_TOP - lat) / (LAT_TOP - LAT_BOT)) * H;

type Pin = { name: string; lon: number; lat: number; hq?: boolean; label: "t" | "b" | "l" | "r" };

const PINS: Pin[] = [
  { name: "India (HQ)", lon: 79.8, lat: 11.9, hq: true, label: "b" },
  { name: "Dubai", lon: 55.3, lat: 25.2, label: "t" },
  { name: "USA", lon: -98, lat: 39, label: "t" },
  { name: "Singapore", lon: 103.8, lat: 1.35, label: "r" },
  { name: "Malaysia", lon: 101.9, lat: 4.4, label: "t" },
  { name: "Australia", lon: 134, lat: -26, label: "b" },
];

const hq = PINS[0];

function arc(a: Pin, b: Pin) {
  const x1 = px(a.lon), y1 = py(a.lat), x2 = px(b.lon), y2 = py(b.lat);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - Math.min(160, Math.hypot(x2 - x1, y2 - y1) * 0.32);
  return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
}

const labelPos: Record<Pin["label"], string> = {
  t: "-translate-x-1/2 -translate-y-[170%]",
  b: "-translate-x-1/2 translate-y-[90%]",
  l: "-translate-x-[110%] -translate-y-1/2",
  r: "translate-x-[28%] -translate-y-1/2",
};

/** Real dotted world map (Natural Earth land mask) with animated routes from the India HQ. */
export default function WorldMap() {
  return (
    <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" role="img" aria-label="Netkathir global presence map">
        <defs>
          <linearGradient id="arcg" x1="0" x2="1">
            <stop offset="0" stopColor="#166534" />
            <stop offset="0.5" stopColor="#eab308" />
            <stop offset="1" stopColor="#22c55e" />
          </linearGradient>
          <radialGradient id="pin">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#16a34a" />
          </radialGradient>
        </defs>
        {WORLD_DOTS.map(([lon, lat], i) => (
          <circle key={i} cx={px(lon)} cy={py(lat)} r="2.1" fill="#166534" opacity={0.28 + ((i * 7) % 10) * 0.025} />
        ))}
        {PINS.slice(1).map((p) => (
          <g key={p.name}>
            <path d={arc(hq, p)} fill="none" stroke="url(#arcg)" strokeWidth="1.6" strokeLinecap="round" opacity="0.35" />
            <path d={arc(hq, p)} fill="none" stroke="url(#arcg)" strokeWidth="2.4" strokeLinecap="round" className="map-arc" pathLength={100} />
          </g>
        ))}
        {PINS.map((p) => (
          <g key={p.name} transform={`translate(${px(p.lon)} ${py(p.lat)})`}>
            <circle r={p.hq ? 22 : 14} fill="#16a34a" opacity="0.18" className="map-ping" />
            <circle r={p.hq ? 9 : 6.5} fill="url(#pin)" stroke="#fff" strokeWidth="2.5" />
          </g>
        ))}
      </svg>

      {PINS.map((p) => (
        <span
          key={p.name}
          className={`absolute hidden whitespace-nowrap rounded-full sm:block border border-white bg-white/85 px-3 py-1.5 text-[0.7rem] font-semibold shadow-[0_12px_30px_-12px_rgba(22,101,52,0.6)] backdrop-blur-xl sm:text-sm ${labelPos[p.label]} ${
            p.hq ? "bg-gradient-to-r from-[#166534] to-[#eab308] !border-transparent text-white" : "text-ink"
          }`}
          style={{ left: `${(px(p.lon) / W) * 100}%`, top: `${(py(p.lat) / H) * 100}%` }}
        >
          {p.name}
        </span>
      ))}
    </div>
  );
}
