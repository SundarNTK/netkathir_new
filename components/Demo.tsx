import Link from "next/link";
import Live from "./Live";

/** A soft, light call-to-action: copy on the left, three floating product photos and a turning "Book a demo" stamp on the right. */
export default function Demo({ photos }: { photos: [string, string, string] }) {
  const chars = Array.from("BOOK A DEMO ✦ BOOK A DEMO ✦ ");
  return (
    <Live className="demo">
      <span className="demo-blob a" aria-hidden />
      <span className="demo-blob b" aria-hidden />
      <div className="relative grid items-center gap-12 px-6 py-14 sm:px-12 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-16">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#14532d]/10 bg-white px-4 py-1.5 text-sm font-semibold text-[#15803d] shadow-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#eab308]" />
            See it live
          </p>
          <h2 data-split className="font-display text-[clamp(2.2rem,4.8vw,4.2rem)] leading-[1.03]">
            Want to see one of them <span className="text-grad">in action?</span>
          </h2>
          <p className="mt-5 max-w-lg text-[1.05rem] leading-relaxed text-muted">A guided walk-through with the team that built it. Real screens, your questions, no slide deck.</p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/contact" className="btn btn-solid">Book a demo →</Link>
            <Link href="/projects" className="btn">See our work</Link>
          </div>
        </div>
        <div className="demo-stack">
          {/* eslint-disable @next/next/no-img-element */}
          <img src={photos[0]} alt="" className="demo-ph p1" loading="lazy" decoding="async" />
          <img src={photos[1]} alt="" className="demo-ph p2" loading="lazy" decoding="async" />
          <img src={photos[2]} alt="" className="demo-ph p3" loading="lazy" decoding="async" />
          {/* eslint-enable @next/next/no-img-element */}
          <Link href="/contact" className="demo-stamp" aria-label="Book a demo">
            <span className="demo-stamp-ring" aria-hidden>
              {chars.map((c, i) => (
                <b key={i} style={{ transform: `rotate(${i * (360 / chars.length)}deg)` }}>{c}</b>
              ))}
            </span>
            <span className="demo-stamp-arrow">↗</span>
          </Link>
        </div>
      </div>
    </Live>
  );
}
