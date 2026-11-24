"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Pins the section and scrolls the track sideways as the user scrolls down. */
export default function HorizontalScroll({
  title,
  kicker,
  items,
}: {
  title: string;
  kicker: string;
  items: { title: string; text: string; image?: string }[];
}) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
      const dist = () => track.current!.scrollWidth - window.innerWidth + 120;
      gsap.to(track.current, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          pin: true,
          scrub: 0.8,
          start: "top top",
          end: () => "+=" + dist(),
          invalidateOnRefresh: true,
          onUpdate: (self) => gsap.set(bar.current, { scaleX: self.progress }),
        },
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} className="relative min-h-screen flex flex-col justify-center py-24 overflow-hidden">
      <div className="px-6 mx-auto max-w-7xl w-full mb-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-ice mb-4">{kicker}</p>
        <h2 data-split className="font-display text-[clamp(2.2rem,6vw,5rem)] leading-none">
          {title}
        </h2>
      </div>
      <div ref={track} className="flex gap-6 px-6 md:pl-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] flex-col md:flex-row w-max-none md:w-max">
        {items.map((it, i) => (
          <article
            key={it.title}
            className="hcard glass rounded-3xl p-8 md:w-[28rem] w-full min-h-[26rem] flex flex-col justify-between overflow-hidden"
          >
            <div>
              <span className="font-mono text-xs text-ice">0{i + 1}</span>
              {it.image && (
                <div className="mt-5 h-40 overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.image} alt="" className="h-full w-full object-cover transition duration-700 hover:scale-105" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-display text-3xl leading-tight mb-4">{it.title}</h3>
              <p className="text-muted">{it.text}</p>
            </div>
          </article>
        ))}
        <div className="md:w-24 shrink-0" />
      </div>
      <div className="hidden md:block mx-auto max-w-7xl w-full px-6 mt-14">
        <div className="h-px bg-ink/10">
          <div ref={bar} className="h-px bg-gradient-to-r from-glow to-violet origin-left scale-x-0" />
        </div>
      </div>
    </section>
  );
}
