"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

export default function Background() {
  const [gl, setGl] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let t = 0;
    const f = (e: Event) => {
      window.clearTimeout(t);
      const on = (e as CustomEvent<boolean>).detail;
      if (on) t = window.setTimeout(() => setBusy(true), 250); // only show if loading actually takes a moment
      else setBusy(false);
    };
    window.addEventListener("nk:obj-loading", f);
    return () => {
      window.removeEventListener("nk:obj-loading", f);
      window.clearTimeout(t);
    };
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- WebGL support is only knowable on the client
    setGl(typeof WebGL2RenderingContext !== "undefined" || typeof WebGLRenderingContext !== "undefined");
  }, []);
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-white" aria-hidden>
      {gl && <Scene />}
      <div className={`pointer-events-none absolute right-[14%] top-[38%] flex items-center gap-3 rounded-full border border-[#14532d]/10 bg-white/90 px-4 py-2 shadow-lg transition-opacity duration-300 ${busy ? "opacity-100" : "opacity-0"}`}>
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#14532d]/20 border-t-[#16a34a]" />
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[#14532d]/70">Loading</span>
      </div>
    </div>
  );
}
