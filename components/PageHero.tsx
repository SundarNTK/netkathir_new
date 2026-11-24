export default function PageHero({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: string;
  sub?: string;
  image?: string;
}) {
  return (
    <section className="relative min-h-[82vh] flex items-end pb-20 pt-40">
      <div className="relative mx-auto max-w-7xl px-6 w-full">
        <p
          data-reveal
          className="inline-flex items-center gap-2 rounded-full border border-white bg-white/70 px-4 py-1.5 text-sm font-semibold text-ice shadow-[0_10px_30px_-14px_rgba(22,101,52,0.5)] backdrop-blur-xl mb-7"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-violet" />
          {kicker}
        </p>
        <h1 data-split className="font-display text-[clamp(2.4rem,5vw,5rem)] leading-[1] max-w-3xl lg:max-w-[min(44rem,54%)] pb-[0.1em] text-grad shimmer">
          {title}
        </h1>
        {sub && (
          <p data-reveal data-delay="0.8" className="mt-8 max-w-xl lg:max-w-[min(34rem,50%)] text-lg text-muted">
            {sub}
          </p>
        )}
      </div>
    </section>
  );
}
