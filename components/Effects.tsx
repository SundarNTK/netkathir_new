"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { NAV } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger);

/**
 * Global motion layer: smooth scroll, custom cursor, page transitions,
 * and declarative scroll animations driven by data-* attributes:
 *  data-split          -> headline reveals word by word
 *  data-reveal         -> fade/rise on enter (data-delay optional)
 *  data-stagger        -> children rise one by one
 *  data-count="n"      -> animated number (data-suffix optional)
 *  data-parallax="n"   -> vertical parallax speed
 *  data-highlight      -> words light up as you scroll
 *  data-tilt           -> 3D mouse tilt
 *  data-magnetic       -> element is pulled toward the cursor
 */
export default function Effects() {
  const path = usePathname();
  const router = useRouter();
  const pathRef = useRef(path);
  useEffect(() => {
    pathRef.current = path;
  }, [path]);
  const curtain = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Smooth scroll (held while the anniversary intro plays)
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.14, wheelMultiplier: 1.05 });
    lenisRef.current = lenis;
    if (window.__nkIntro === "playing") lenis.stop();
    const resume = () => lenis.start();
    window.addEventListener("nk:intro-done", resume);
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    const smooth = () => gsap.ticker.lagSmoothing(0);
    if (window.__nkIntro === "playing") window.addEventListener("nk:intro-done", smooth, { once: true });
    else smooth();
    const onMenu = (e: Event) => {
      const open = (e as CustomEvent<boolean>).detail;
      if (open) lenis.stop();
      else if (window.__nkIntro !== "playing") lenis.start();
    };
    window.addEventListener("nk:menu", onMenu);
    return () => {
      window.removeEventListener("nk:menu", onMenu);
      window.removeEventListener("nk:intro-done", resume);
      window.removeEventListener("nk:intro-done", smooth);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  // Warm every route in the background so navigation never waits on the network
  useEffect(() => {
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
    idle(() => NAV.forEach((n) => router.prefetch(n.href)));
  }, [router]);

  // Page transition: intercept internal links, cover the screen, then navigate
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === pathRef.current) return;
      e.preventDefault();
      const dest = url.pathname + url.search + url.hash;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(dest);
        return;
      }
      // cover the screen quickly and start loading the next page at the same moment (they overlap, so nothing waits)
      gsap.set(curtain.current, { autoAlpha: 1 });
      const target = NAV.find((n) => n.href === url.pathname)?.label ?? "Netkathir";
      const nm = document.querySelector<HTMLElement>(".pt-name");
      if (nm) nm.textContent = target;
      gsap.killTweensOf(".pt-strip, .pt-center, .pt-plate, .pt-text, .pt-bar, .pt-ringline");
      gsap.set(".pt-center", { opacity: 0 });
      gsap.set(".pt-plate", { scale: 0.5, rotate: -25, opacity: 0 });
      gsap.set(".pt-text", { y: 18, opacity: 0 });
      gsap.set(".pt-bar", { scaleX: 0 });
      gsap.fromTo(".pt-strip", { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: "power3.inOut", stagger: { each: 0.035, from: "edges" } });
      gsap.to(".pt-center", { opacity: 1, duration: 0.2, delay: 0.3 });
      gsap.to(".pt-plate", { scale: 1, rotate: 0, opacity: 1, duration: 0.55, delay: 0.32, ease: "back.out(1.8)" });
      gsap.to(".pt-text", { y: 0, opacity: 1, duration: 0.45, delay: 0.45, stagger: 0.08, ease: "power3.out" });
      gsap.to(".pt-bar", { scaleX: 1, duration: 0.8, delay: 0.4, ease: "power2.inOut" });
      gsap.delayedCall(0.12, () => router.push(dest));
    };
    document.addEventListener("click", onClick, true); // capture: runs before Next's own Link handler
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  // Cursor
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const xr = gsap.quickTo(ring.current, "x", { duration: 0.16, ease: "power3" });
    const yr = gsap.quickTo(ring.current, "y", { duration: 0.16, ease: "power3" });
    const d = dot.current!;
    const move = (e: MouseEvent) => {
      const inHeader = (e.target as HTMLElement).closest?.("header");
      d.style.opacity = inHeader ? "0" : "1";
      if (ring.current) ring.current.style.opacity = inHeader ? "0" : "";
      d.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      xr(e.clientX);
      yr(e.clientY);
    };
    const over = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // The header has its own hover. The cursor ring was swelling into a large circle there.
      if (target.closest("header")) {
        gsap.to(ring.current, { scale: 1, opacity: 0, duration: 0.2 });
        gsap.to(d, { opacity: 0, duration: 0.2 });
        return;
      }
      gsap.to(d, { opacity: 1, duration: 0.2 });
      const hot = target.closest("a,button,[data-hover]");
      gsap.to(ring.current, { scale: hot ? 1.15 : 1, opacity: hot ? 0.85 : 0.6, duration: 0.3 });
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
    };
  }, []);

  // Per-page animations + reveal
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const introPlaying = window.__nkIntro === "playing";

    // Reveal: strips lift away. First load while the anniversary intro owns the screen: stay hidden.
    if (introPlaying) {
      gsap.set(curtain.current, { autoAlpha: 0 });
    } else {
      gsap.set(curtain.current, { autoAlpha: 1 });
      gsap.to(".pt-center", { opacity: 0, scale: 1.12, duration: 0.35, delay: 0.55, ease: "power2.in" });
      gsap.to(".pt-strip", {
        yPercent: -100,
        duration: reduce ? 0 : 0.6,
        ease: "power3.inOut",
        stagger: { each: 0.04, from: "center" },
        delay: reduce ? 0 : 0.7,
        overwrite: "auto",
        onComplete: () => gsap.set([curtain.current, ".pt-center"], { autoAlpha: 0, scale: 1 }),
      });
    }

    let ctx: gsap.Context | undefined;
    let refresh: ReturnType<typeof setTimeout> | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const build = () => {
      if (reduce) return;
      ctx = gsap.context(() => {
        // split text
        document.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
          if (!el.dataset.done) {
            const words = (el.textContent ?? "").split(/\s+/).filter(Boolean);
            el.innerHTML = words
              .map((w) => `<span class="sw"><span>${w.replace(/</g, "&lt;")}</span></span>`)
              .join(" ");
            el.dataset.done = "1";
          }
          const spans = el.querySelectorAll(".sw > span");
          gsap.set(spans, { yPercent: 115, rotate: 6 });
          ScrollTrigger.create({
            trigger: el,
            start: "top 88%",
            once: true,
            onEnter: () =>
              gsap.to(spans, {
                yPercent: 0,
                rotate: 0,
                duration: 1.1,
                ease: "expo.out",
                stagger: 0.06,
                delay: el.dataset.delay ? Number(el.dataset.delay) : 0.3,
              }),
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el, {
            y: 50,
            opacity: 0,
            duration: 1.1,
            ease: "power3.out",
            delay: el.dataset.delay ? Number(el.dataset.delay) : 0,
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
            onComplete: () => gsap.set(el, { clearProps: "transform,opacity" }),
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((el) => {
          gsap.from(el.children, {
            y: 70,
            opacity: 0,
            scale: 0.96,
            rotateX: 16,
            transformPerspective: 1100,
            transformOrigin: "50% 100%",
            duration: 1,
            ease: "power3.out",
            stagger: 0.09,
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
            onComplete: () => gsap.set(el.children, { clearProps: "transform,opacity" }),
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          const end = Number(el.dataset.count);
          const suffix = el.dataset.suffix ?? "";
          const o = { v: 0 };
          gsap.to(o, {
            v: end,
            duration: 2.2,
            ease: "power2.out",
            onUpdate: () => (el.textContent = Math.round(o.v) + suffix),
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
          const s = Number(el.dataset.parallax) || 0.2;
          gsap.to(el, {
            yPercent: -s * 100,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-highlight]").forEach((el) => {
          if (!el.dataset.done) {
            el.innerHTML = (el.textContent ?? "")
              .split(/\s+/)
              .map((w) => `<span style="opacity:.18">${w}</span>`)
              .join(" ");
            el.dataset.done = "1";
          }
          gsap.to(el.querySelectorAll("span"), {
            opacity: 1,
            stagger: 0.1,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
          });
        });

        // 3D tilt cards — only transformed while the pointer is over them, so resting cards stay pixel-sharp
        gsap.utils.toArray<HTMLElement>("[data-tilt]").forEach((el) => {
          const rx = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power3" });
          const ry = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power3" });
          el.addEventListener("mouseenter", () => {
            gsap.killTweensOf(el, "rotationX,rotationY");
            gsap.set(el, { transformPerspective: 900 });
          });
          el.addEventListener("mousemove", (e) => {
            const r = el.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            ry(px * 10);
            rx(-py * 10);
            el.style.setProperty("--mx", `${(px + 0.5) * 100}%`);
            el.style.setProperty("--my", `${(py + 0.5) * 100}%`);
          });
          el.addEventListener("mouseleave", () => {
            gsap.to(el, { rotationX: 0, rotationY: 0, duration: 0.5, ease: "power3", onComplete: () => gsap.set(el, { clearProps: "transform" }) });
          });
        });

        // stacked sticky cards: each card sinks back (smaller, dimmer) as the next one slides over it
        const stack = gsap.utils.toArray<HTMLElement>("[data-stack]");
        stack.forEach((el, i) => {
          const next = stack[i + 1];
          if (!next) return;
          gsap.to(el, { scale: 0.97, transformOrigin: "50% 0%", ease: "none", scrollTrigger: { trigger: next, start: "top 88%", end: "top 24%", scrub: 0.5 } });
        });

        // every content section lifts and fades in as it scrolls into view (scrubbed, so it also plays back in reverse)
        if (pathRef.current !== "/") {
          const secs = gsap.utils.toArray<HTMLElement>("main section").filter((s) => !s.parentElement?.closest("section"));
          secs.forEach((sec, i) => {
            if (i === 0 || sec.hasAttribute("data-panel") || sec.hasAttribute("data-nolift") || sec.querySelector("[data-stack], [data-panel], .sticky")) return;
            gsap.fromTo(sec, { y: 80, opacity: 0 }, { y: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: sec, start: "top 96%", end: "top 62%", scrub: 0.6 } });
          });
        }

        // clip-path window that unfolds to the full image while scrolling; the picture settles from a zoom
        gsap.utils.toArray<HTMLElement>("[data-clip]").forEach((el) => {
          const img = el.querySelector<HTMLElement>("[data-clip-img]");
          gsap.fromTo(
            el,
            { clipPath: "inset(14% 12% 14% 12% round 3rem)" },
            { clipPath: "inset(0% 0% 0% 0% round 1.75rem)", ease: "none", scrollTrigger: { trigger: el, start: "top 95%", end: "top 30%", scrub: 0.6 } }
          );
          if (img) gsap.fromTo(img, { scale: 1.35 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 } });
        });

        // a section that grows into a full-width panel as it arrives
        gsap.utils.toArray<HTMLElement>("[data-panel]").forEach((el) => {
          gsap.fromTo(
            el,
            { scale: 0.9, borderRadius: "4rem" },
            { scale: 1, borderRadius: "2rem", ease: "none", scrollTrigger: { trigger: el, start: "top 100%", end: "top 35%", scrub: 0.6 } }
          );
        });

        // oversized type that slides sideways with the scroll (data-scrub-x="1" or "-1")
        gsap.utils.toArray<HTMLElement>("[data-scrub-x]").forEach((el) => {
          const dir = Number(el.dataset.scrubX) || 1;
          gsap.fromTo(el, { xPercent: dir * -14 }, { xPercent: dir * 14, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
        });

        // cards drift at different speeds (data-rise="1" / "-1") and their pictures slide inside the frame (data-pimg)
        gsap.utils.toArray<HTMLElement>("[data-rise]").forEach((el) => {
          const d = Number(el.dataset.rise) || 1;
          gsap.fromTo(el, { y: d * 46 }, { y: d * -46, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.8 } });
        });
        gsap.utils.toArray<HTMLElement>("[data-pimg]").forEach((el) => {
          gsap.fromTo(el, { yPercent: -7, scale: 1.08 }, { yPercent: 7, scale: 1, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: 0.6 } });
        });

        // content cards sweep in from alternating sides as their row scrolls up, and sink a little as they leave
        if (pathRef.current !== "/") {
          gsap.utils.toArray<HTMLElement>("main [data-tilt]").forEach((el, i) => {
            if (el.closest("[data-stagger]")) return;
            gsap.fromTo(el, { rotate: i % 2 ? 1.4 : -1.4 }, { rotate: 0, ease: "none", scrollTrigger: { trigger: el, start: "top 100%", end: "top 55%", scrub: 0.5 } });
          });
        }

        // magnetic buttons
        gsap.utils.toArray<HTMLElement>("[data-magnetic]").forEach((el) => {
          const mx = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.5)" });
          const my = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.5)" });
          el.addEventListener("mousemove", (e) => {
            const r = el.getBoundingClientRect();
            mx((e.clientX - (r.left + r.width / 2)) * 0.28);
            my((e.clientY - (r.top + r.height / 2)) * 0.4);
          });
          el.addEventListener("mouseleave", () => {
            mx(0);
            my(0);
          });
        });
      });
      refresh = setTimeout(() => ScrollTrigger.refresh(), 150);
    };

    // First load: build page animations when the intro starts dissolving, so the hero animates in as it fades.
    const onReveal = () => build();
    if (introPlaying) window.addEventListener("nk:intro-reveal", onReveal, { once: true });
    else timer = setTimeout(build, 120);

    return () => {
      window.removeEventListener("nk:intro-reveal", onReveal);
      if (refresh) clearTimeout(refresh);
      if (timer) clearTimeout(timer);
      ctx?.revert();
    };
  }, [path]);

  return (
    <>
      <div ref={curtain} className="fixed inset-0 z-[95] pointer-events-none flex" style={{ visibility: "visible" }}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="pt-strip relative h-full flex-1 overflow-hidden bg-[linear-gradient(180deg,#03231a_0%,#064e2b_55%,#0b6b3a_100%)]">
            <span aria-hidden className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-[#fde68a]/70 to-transparent" />
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#eab308]/25 to-transparent" />
          </div>
        ))}
        <div className="pt-center absolute inset-0 flex flex-col items-center justify-center opacity-0">
          <div aria-hidden className="absolute h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(250,204,21,0.22),rgba(34,197,94,0.14)_45%,transparent_70%)]" />
          <div className="pt-plate relative grid h-28 w-28 place-items-center">
            <span aria-hidden className="absolute -inset-1.5 rounded-full [animation:nk-spin_1.6s_linear_infinite]" style={{ background: "conic-gradient(from 0deg, transparent 0deg, #fde68a 90deg, #22c55e 200deg, transparent 280deg)", WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))", mask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))" }} />
            <span className="relative grid h-24 w-24 place-items-center rounded-full bg-white shadow-[0_0_46px_rgba(250,204,21,0.45)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/brand/netkathir-emblem.png" alt="" className="h-[4.4rem] w-[4.4rem] object-contain" />
            </span>
          </div>
          <p className="pt-text relative mt-6 font-mono text-[0.68rem] uppercase tracking-[0.4em] text-[#bbf7d0]">Opening</p>
          <p className="pt-text pt-name relative mt-1 font-display text-4xl tracking-tight text-white md:text-6xl">Netkathir</p>
          <span className="relative mt-6 block h-[3px] w-48 overflow-hidden rounded bg-white/15">
            <span className="pt-bar absolute inset-0 origin-left bg-gradient-to-r from-[#22c55e] to-[#fde68a]" style={{ transform: "scaleX(0)" }} />
          </span>
        </div>
      </div>
      <div ref={ring} className="cursor-ring" />
      <div ref={dot} className="cursor-dot" />
    </>
  );
}
