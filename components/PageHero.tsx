export default function PageHero({
  kicker,
  title,
  sub,
  room,
}: {
  kicker: string;
  title: string;
  sub?: string;
  image?: string;
  /** Keep the right side clear for the 3D scene. */
  room?: boolean;
}) {
  return (
    <section className={room ? "relative pb-8 pt-24 lg:flex lg:min-h-[62vh] lg:items-end lg:pb-12 lg:pt-32" : "relative pt-28 pb-8"}>
      {/* phones: the page's 3D object stands in this space above the title */}
      {room && <div className="h-[min(38vh,17rem)] lg:hidden" aria-hidden />}
      <div className="relative mx-auto w-full max-w-7xl px-6">
        <p
          data-reveal
          className="inline-flex items-center gap-2 rounded-full border border-white bg-white/70 px-4 py-1.5 text-sm font-semibold text-ice shadow-[0_10px_30px_-14px_rgba(22,101,52,0.5)] backdrop-blur-xl mb-5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-violet" />
          {kicker}
        </p>
        <h1
          data-split
          className={`font-display text-[clamp(2.4rem,5vw,5rem)] leading-[1] pb-[0.1em] text-grad ${
            room ? "max-w-3xl lg:max-w-[min(44rem,54%)]" : "max-w-4xl"
          }`}
        >
          {title}
        </h1>
        {sub && (
          <p data-reveal data-delay="0.8" className={`mt-5 text-lg text-muted ${room ? "max-w-xl lg:max-w-[min(34rem,50%)]" : "max-w-2xl"}`}>
            {sub}
          </p>
        )}
      </div>
    </section>
  );
}
