import Live from "./Live";

type Photo = { src: string; year: string; cap: string };

/** A scatter of taped polaroids that tell the story in three snapshots. They float gently and straighten when you point at one. */
export default function Story({ photos }: { photos: [Photo, Photo, Photo] }) {
  return (
    <Live className="pol">
      {photos.map((p, i) => (
        <figure key={p.year} className={`pol-card c${i + 1}`}>
          <span className="pol-tape" aria-hidden />
          <div className="pol-img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt={p.cap} loading="lazy" decoding="async" />
          </div>
          <figcaption>
            <b>{p.year}</b>
            <span>{p.cap}</span>
          </figcaption>
        </figure>
      ))}
      <span className="pol-star s1" aria-hidden>✦</span>
      <span className="pol-star s2" aria-hidden>✦</span>
    </Live>
  );
}
