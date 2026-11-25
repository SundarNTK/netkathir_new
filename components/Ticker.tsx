/** Slim, quiet keyword strip: small uppercase labels drifting slowly between hairlines. */
export default function Ticker({ items }: { items: string[] }) {
  const row = [...items, ...items, ...items, ...items];
  return (
    <div className="overflow-hidden border-y border-[#14532d]/10 bg-white py-4" aria-hidden>
      <div className="marquee-track items-center">
        {row.map((t, i) => (
          <span key={i} className="flex items-center whitespace-nowrap font-mono text-[0.76rem] font-medium uppercase tracking-[0.32em] text-[#14532d]/70">
            <span>{t}</span>
            <span className="mx-8 h-1.5 w-1.5 rounded-full bg-[#eab308]" />
          </span>
        ))}
      </div>
    </div>
  );
}
