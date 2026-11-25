"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

export default function Background() {
  const home = usePathname() === "/"; // inner pages sit on plain white; only the home hero keeps the atmosphere
  const [gl, setGl] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- WebGL support is only knowable on the client
    setGl(typeof WebGL2RenderingContext !== "undefined" || typeof WebGLRenderingContext !== "undefined");
  }, []);
  return (
    <div className={`fixed inset-0 z-0 overflow-hidden transition-colors duration-500 ${home ? "bg-[#f6fbf7]" : "bg-white"}`} aria-hidden>
      {home && (
        <>
          {/* soft colour atmosphere: plain radial gradients (cheap), only transforms animate */}
          <div className="blob absolute -top-60 -right-48 h-[56rem] w-[56rem] rounded-full bg-[radial-gradient(circle,rgba(22,163,74,0.26),transparent_68%)]" />
          <div className="blob absolute top-1/4 -left-64 h-[50rem] w-[50rem] rounded-full bg-[radial-gradient(circle,rgba(132,204,22,0.22),transparent_68%)] [animation-delay:-9s]" />
          <div className="blob absolute -bottom-72 right-1/4 h-[50rem] w-[50rem] rounded-full bg-[radial-gradient(circle,rgba(250,204,21,0.26),transparent_68%)] [animation-delay:-18s]" />
          <div
            className="absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]"
            style={{ backgroundImage: "radial-gradient(rgba(22,101,52,0.16) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
          />
        </>
      )}
      {gl && <Scene />}
    </div>
  );
}
