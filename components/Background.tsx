"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

export default function Background() {
  const [gl, setGl] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- WebGL support is only knowable on the client
    setGl(typeof WebGL2RenderingContext !== "undefined" || typeof WebGLRenderingContext !== "undefined");
  }, []);
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-white" aria-hidden>
      {gl && <Scene />}
    </div>
  );
}
