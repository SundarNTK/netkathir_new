/** Four big lines of type. Pointing at one sweeps green behind it, nudges the word along and pops a small photo out at the side. */
export default function ValueRows({ rows }: { rows: { t: string; d: string; image: string }[] }) {
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
          <span className="vr-photo" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.image} alt="" loading="lazy" decoding="async" />
          </span>
          <span className="vr-arrow" aria-hidden>→</span>
        </li>
      ))}
    </ul>
  );
}
