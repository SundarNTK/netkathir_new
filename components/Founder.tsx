import Image from "next/image";

/** Futuristic founder portrait: holographic rings, scan line, HUD corners and floating data chips. */
export default function Founder() {
  return (
    <div className="relative mx-auto w-full max-w-[34rem]" data-reveal>
      {/* energy halo */}
      <div className="absolute left-1/2 top-[46%] h-[92%] w-[92%] -translate-x-1/2 -translate-y-1/2" aria-hidden>
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#166534,#22c55e,#eab308,#bef264,#166534)] opacity-60 blur-2xl animate-[spin_14s_linear_infinite]" />
        <div className="absolute inset-[6%] rounded-full border border-violet/40 animate-[spin_30s_linear_infinite] [border-style:dashed]" />
        <div className="absolute inset-[-4%] rounded-full border border-cyan/30" />
        <div className="absolute inset-[16%] rounded-full bg-gradient-to-b from-white/90 to-white/20 backdrop-blur-sm" />
      </div>

      {/* HUD frame */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-[2.2rem] border border-white/80 bg-gradient-to-b from-white/60 via-white/30 to-violet/10 shadow-[0_40px_90px_-30px_rgba(22,101,52,0.55)] backdrop-blur-md">
        <div
          className="absolute inset-0 opacity-60"
          style={{ backgroundImage: "linear-gradient(rgba(22,101,52,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(22,101,52,0.07) 1px, transparent 1px)", backgroundSize: "34px 34px" }}
        />
<Image
          src="/images/team/founder.webp"
          alt="Maraimani Chakkaravarthy, Founder & CEO of Netkathir Technologies"
          width={1000}
          height={1499}
          sizes="(min-width: 768px) 34rem, 90vw"
          className="absolute bottom-0 left-1/2 z-10 h-[104%] w-auto max-w-none -translate-x-1/2 object-cover object-bottom drop-shadow-[0_24px_40px_rgba(30,20,100,0.35)]"
        />
        {/* corner brackets */}
        {["left-4 top-4 border-l-2 border-t-2 rounded-tl-xl", "right-4 top-4 border-r-2 border-t-2 rounded-tr-xl", "left-4 bottom-4 border-l-2 border-b-2 rounded-bl-xl", "right-4 bottom-4 border-r-2 border-b-2 rounded-br-xl"].map((c) => (
          <span key={c} className={`absolute z-30 h-7 w-7 border-violet/70 ${c}`} />
        ))}
        {/* CEO tag */}
        <div className="absolute inset-x-5 bottom-5 z-30 overflow-hidden rounded-2xl border border-[#f3d98a] bg-gradient-to-br from-[#fff3c4] via-[#f5cf6b] to-[#c9922b] px-5 py-3.5 shadow-[0_18px_40px_-14px_rgba(160,110,20,0.75),inset_0_1px_0_rgba(255,255,255,0.7)]">
          <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent [animation:tag-shine_4.5s_ease-in-out_infinite]" />
          <div className="relative flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg font-bold leading-tight text-[#3a2a05]">Maraimani Chakkaravarthy</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#14532d] px-3.5 py-1.5 font-display text-xs font-bold uppercase tracking-[0.2em] text-[#fde68a] shadow-[inset_0_0_0_1px_rgba(253,230,138,0.5)]">Founder &amp; CEO</span>
          </div>
        </div>
      </div>

      <blockquote className="relative z-30 mt-7 rounded-3xl border border-white bg-white/70 p-6 shadow-[0_24px_60px_-30px_rgba(22,101,52,0.5)] backdrop-blur-xl">
        <p className="font-display text-xl leading-snug sm:text-2xl">“We connect AI to real business workflows — not demos.”</p>
      </blockquote>

      {/* floating data chips */}
      <span className="absolute -left-3 top-[14%] z-30 hidden sm:flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-sm font-semibold shadow-[0_16px_40px_-14px_rgba(22,101,52,0.55)] backdrop-blur-xl" style={{ animation: "label-float 7s ease-in-out infinite" }}>
        <span className="h-2 w-2 rounded-full bg-violet" /> AI-First Vision
      </span>
      <span className="absolute -right-3 top-[34%] z-30 hidden sm:flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-sm font-semibold shadow-[0_16px_40px_-14px_rgba(34,197,94,0.55)] backdrop-blur-xl" style={{ animation: "label-float 8s ease-in-out 1s infinite" }}>
        <span className="h-2 w-2 rounded-full bg-cyan" /> Est. 2015
      </span>
      <span className="absolute -left-2 top-[58%] z-30 hidden sm:flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-sm font-semibold shadow-[0_16px_40px_-14px_rgba(234,179,8,0.5)] backdrop-blur-xl" style={{ animation: "label-float 7.5s ease-in-out 2s infinite" }}>
        <span className="h-2 w-2 rounded-full bg-glow" /> 6 Countries
      </span>
    </div>
  );
}
