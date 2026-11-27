/* eslint-disable react-hooks/immutability -- imperative three.js animation: values are mutated per frame by design */
"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { Edges, RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { LiveCtx, useLive } from "@/lib/live";
import { WORLD_DOTS } from "@/lib/worldDots";
export type RobotPalette = {
  uTime: { value: number };
  uA: { value: THREE.Color };
  uB: { value: THREE.Color };
  uC: { value: THREE.Color };
};

/**
 * Every page's 3D object is built, shader-compiled and drawn once, one after another (the visitor's current page first),
 * while the loader screen is still up. Nothing is ever built while someone is scrolling or changing page, which is what
 * made the site hitch. `nk:scene-warm` is announced when the last object is ready; the loader waits for it.
 */
type Job = () => Promise<void>;
const warm = { queue: [] as Job[], running: false, total: 0, done: 0, finished: false };

function finishWarm() {
  if (warm.finished) return;
  warm.finished = true;
  (window as unknown as { __nkWarm?: boolean }).__nkWarm = true;
  window.dispatchEvent(new Event("nk:scene-warm"));
}
async function pumpWarm() {
  if (warm.running) return;
  warm.running = true;
  while (warm.queue.length) {
    const job = warm.queue.shift()!;
    try {
      await job();
    } catch {
      /* a failed warm-up just means that object builds lazily later */
    }
    warm.done++;
    window.dispatchEvent(new CustomEvent("nk:scene-progress", { detail: warm.done / Math.max(1, warm.total) }));
  }
  warm.running = false;
  if (warm.done >= warm.total) finishWarm();
}

/** Scales a hero object in/out as the route changes, and hides it when it is gone. Off-screen objects are hidden and their per-frame work is paused through LiveCtx. */
export function Presence({ active, warm: doWarm = true, children }: { active: boolean; warm?: boolean; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  const { gl, scene, camera } = useThree();
  const [mounted, setMounted] = useState(active);
  const mountedRef = useRef(active);
  const live = useRef(active);
  const warmFrames = useRef(active ? 6 : 0); // draws (while still invisibly small) so shaders compile and textures upload now
  const waiter = useRef<{ n: number; res: () => void } | null>(null);
  const frames = (n: number) =>
    new Promise<void>((res) => {
      waiter.current = { n, res };
    });
  const mount = () => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    setMounted(true);
  };
  useEffect(() => {
    // an object that is not part of the up-front warm-up (phones skip the desktop-only ones) builds lazily on its first visit,
    // once the page has faded in and the browser is idle
    if (!active || mountedRef.current) return;
    const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (n: number) => void };
    let idle = 0;
    const t = window.setTimeout(() => {
      if (w.requestIdleCallback) idle = w.requestIdleCallback(() => mount(), { timeout: 700 });
      else mount();
    }, 650);
    return () => {
      window.clearTimeout(t);
      if (idle && w.cancelIdleCallback) w.cancelIdleCallback(idle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  useEffect(() => {
    if (!doWarm || warm.finished) return;
    warm.total++;
    const job: Job = async () => {
      mount();
      await frames(2); // its children are in the scene
      const g = ref.current;
      if (g) g.visible = true;
      warmFrames.current = 8;
      try {
        await gl.compileAsync(scene, camera); // programs link on the GPU's own threads
      } catch {
        /* older GPUs: they compile on the first draw, which happens below */
      }
      await frames(3); // textures uploaded, everything has been drawn once
    };
    if (active) warm.queue.unshift(job);
    else warm.queue.push(job);
    queueMicrotask(pumpWarm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!mounted || !active) return;
    window.dispatchEvent(new CustomEvent("nk:obj-loading", { detail: false }));
  }, [mounted, active]);
  useFrame((_, dt) => {
    const w = waiter.current;
    if (w && --w.n <= 0) {
      waiter.current = null;
      w.res();
    }
    const g = ref.current;
    if (!g) return;
    const d = Math.min(dt, 0.25);
    const s = THREE.MathUtils.damp(g.scale.x, active ? 1 : 0, 6, d);
    g.scale.setScalar(Math.max(s, 0.0001));
    const warming = warmFrames.current > 0;
    if (warming) warmFrames.current -= 1;
    g.visible = s > 0.01 || warming;
    live.current = active || s > 0.01 || warming;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, active ? 0 : 1.4, 5, d);
  });
  return (
    <group ref={ref} scale={0.0001}>
      <LiveCtx.Provider value={live}>{mounted && children}</LiveCtx.Provider>
    </group>
  );
}

function useMouse() {
  const m = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const f = (e: MouseEvent) => {
      m.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      m.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", f);
    return () => window.removeEventListener("mousemove", f);
  }, []);
  return m;
}

/* ------------------------------ canvas textures ------------------------------ */

function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function circuitTexture() {
  return canvasTex(512, 512, (c) => {
    c.fillStyle = "#0a2417";
    c.fillRect(0, 0, 512, 512);
    c.lineWidth = 3;
    const cols = ["#22d3ee", "#22c55e", "#4ade80"];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 46; i++) {
      c.strokeStyle = cols[i % 3];
      c.globalAlpha = 0.35 + rnd() * 0.5;
      let x = Math.floor(rnd() * 16) * 32 + 16, y = Math.floor(rnd() * 16) * 32 + 16;
      c.beginPath();
      c.moveTo(x, y);
      for (let k = 0; k < 4; k++) {
        if (rnd() > 0.5) x += (rnd() > 0.5 ? 1 : -1) * 32 * (1 + Math.floor(rnd() * 3));
        else y += (rnd() > 0.5 ? 1 : -1) * 32 * (1 + Math.floor(rnd() * 3));
        c.lineTo(x, y);
      }
      c.stroke();
      c.fillStyle = cols[i % 3];
      c.beginPath();
      c.arc(x, y, 6, 0, 7);
      c.fill();
    }
  });
}

function aiLabelTexture() {
  return canvasTex(512, 512, (c) => {
    const g = c.createLinearGradient(0, 0, 512, 512);
    g.addColorStop(0, "#22d3ee");
    g.addColorStop(0.5, "#22c55e");
    g.addColorStop(1, "#86efac");
    c.fillStyle = g;
    c.font = "900 300px Arial, Helvetica, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("AI", 256, 280);
    c.strokeStyle = g;
    c.lineWidth = 10;
    c.strokeRect(70, 70, 372, 372);
  });
}

function dashboardTexture() {
  return canvasTex(1024, 640, (c) => {
    c.fillStyle = "#0b2216";
    c.fillRect(0, 0, 1024, 640);
    const g = c.createLinearGradient(0, 0, 1024, 0);
    g.addColorStop(0, "#166534");
    g.addColorStop(1, "#22c55e");
    c.fillStyle = g;
    c.fillRect(0, 0, 1024, 70);
    c.fillStyle = "#fff";
    c.font = "600 30px Arial";
    c.fillText("Netkathir · AI Insights", 28, 46);
    // KPI cards
    [["Automations", "128"], ["Accuracy", "98.4%"], ["Hours saved", "2.4k"]].forEach(([l, v], i) => {
      c.fillStyle = "rgba(255,255,255,0.07)";
      c.fillRect(28 + i * 330, 100, 310, 120);
      c.fillStyle = "#9aa3c4";
      c.font = "24px Arial";
      c.fillText(l, 48 + i * 330, 142);
      c.fillStyle = "#fff";
      c.font = "700 48px Arial";
      c.fillText(v, 48 + i * 330, 196);
    });
    // bars
    for (let i = 0; i < 14; i++) {
      const h = 60 + ((i * 53) % 150);
      const bg = c.createLinearGradient(0, 600 - h, 0, 600);
      bg.addColorStop(0, "#22d3ee");
      bg.addColorStop(1, "#14532d");
      c.fillStyle = bg;
      c.fillRect(48 + i * 36, 600 - h, 24, h);
    }
    // line chart
    c.strokeStyle = "#86efac";
    c.lineWidth = 5;
    c.beginPath();
    for (let i = 0; i <= 10; i++) {
      const x = 600 + i * 38, y = 520 - Math.sin(i * 0.7) * 50 - i * 10;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.stroke();
    c.fillStyle = "rgba(255,255,255,0.07)";
    c.fillRect(580, 270, 420, 340);
    c.strokeStyle = "#86efac";
    c.beginPath();
    for (let i = 0; i <= 10; i++) {
      const x = 600 + i * 38, y = 560 - Math.sin(i * 0.7) * 60 - i * 14;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.stroke();
  });
}

function chatTexture() {
  return canvasTex(512, 1024, (c) => {
    c.fillStyle = "#0b2216";
    c.fillRect(0, 0, 512, 1024);
    const g = c.createLinearGradient(0, 0, 512, 0);
    g.addColorStop(0, "#166534");
    g.addColorStop(1, "#eab308");
    c.fillStyle = g;
    c.fillRect(0, 0, 512, 110);
    c.fillStyle = "#fff";
    c.font = "600 36px Arial";
    c.fillText("AI Assistant", 36, 68);
    const bubble = (y: number, w: number, me: boolean, t: string) => {
      c.fillStyle = me ? "#16a34a" : "rgba(255,255,255,0.12)";
      const x = me ? 512 - w - 30 : 30;
      c.beginPath();
      c.roundRect(x, y, w, 90, 28);
      c.fill();
      c.fillStyle = "#fff";
      c.font = "28px Arial";
      c.fillText(t, x + 26, y + 55);
    };
    bubble(150, 330, false, "How can I help?");
    bubble(270, 360, true, "Summarise my sales");
    bubble(390, 420, false, "Sales up 18% this week");
    bubble(510, 300, true, "Create the report");
    bubble(630, 380, false, "Done — sent to your team");
  });
}


/* ---------------------------------- chip ---------------------------------- */

export function Chip({ palette }: { palette: RobotPalette }) {
  const outer = useRef<THREE.Group>(null!);
  const spin = useRef<THREE.Group>(null!);
  const layers = useRef<THREE.Group[]>([]);
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: "#22d3ee", toneMapped: false }), []);
  const circuit = useMemo(() => circuitTexture(), []);
  const label = useMemo(() => aiLabelTexture(), []);
  const mouse = useMouse();

  const live = useLive();
  useFrame(() => {
    if (!live.current) return;
    const t = palette.uTime.value;
    glow.color.copy(palette.uC.value).lerp(new THREE.Color("#22d3ee"), 0.5);
    outer.current.position.y = Math.sin(t * 1.1) * 0.1;
    outer.current.rotation.x = THREE.MathUtils.lerp(outer.current.rotation.x, 0.85 - mouse.current.y * 0.25, 0.1);
    // sway towards the cursor, always keeping the AI face upright and readable
    spin.current.rotation.y = Math.sin(t * 0.5) * 0.4 + mouse.current.x * 0.35;
    layers.current.forEach((l, i) => {
      if (l) l.position.y = (i + 1) * 0.62 + Math.sin(t * 1.4 + i) * 0.06;
    });
  });

  const pins = useMemo(() => {
    const out: [number, number, number, number][] = [];
    for (let i = 0; i < 16; i++) {
      const p = -1.4 + (i / 15) * 2.8;
      out.push([p, 0, 1.78, 0], [p, 0, -1.78, 0], [1.78, 0, p, 1], [-1.78, 0, p, 1]);
    }
    return out;
  }, []);

  return (
    <group ref={outer}>
      <group ref={spin}>
        {/* base package */}
        <RoundedBox args={[3.4, 0.2, 3.4]} radius={0.07} smoothness={5}>
          <meshPhysicalMaterial color="#0e2a1a" metalness={0.85} roughness={0.28} clearcoat={0.6} envMapIntensity={1.2} />
          <Edges color="#22c55e" threshold={20} />
        </RoundedBox>
        {pins.map(([x, y, z, rot], i) => (
          <mesh key={i} position={[x, y, z]} scale={rot ? [0.22, 0.05, 0.07] : [0.07, 0.05, 0.22]}>
            <boxGeometry />
            <meshPhysicalMaterial color="#e0b95a" metalness={1} roughness={0.22} envMapIntensity={1.4} />
          </mesh>
        ))}
        {/* floating layers */}
        <group ref={(g) => { if (g) layers.current[0] = g; }}>
          <RoundedBox args={[2.8, 0.1, 2.8]} radius={0.05} smoothness={4}>
            <meshPhysicalMaterial map={circuit} metalness={0.4} roughness={0.35} clearcoat={1} emissiveMap={circuit} emissive="#ffffff" emissiveIntensity={0.55} />
            <Edges color="#22d3ee" threshold={20} />
          </RoundedBox>
        </group>
        <group ref={(g) => { if (g) layers.current[1] = g; }}>
          <RoundedBox args={[2.1, 0.12, 2.1]} radius={0.05} smoothness={4}>
            <meshPhysicalMaterial color="#f4f6ff" roughness={0.16} clearcoat={1} envMapIntensity={1.2} />
            <Edges color="#22c55e" threshold={20} />
          </RoundedBox>
        </group>
        <group ref={(g) => { if (g) layers.current[2] = g; }}>
          <RoundedBox args={[1.5, 0.16, 1.5]} radius={0.06} smoothness={4}>
            <meshPhysicalMaterial color="#aeb6cf" metalness={1} roughness={0.12} clearcoat={0.5} envMapIntensity={1.6} />
          </RoundedBox>
          <mesh position={[0, 0.092, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.2, 1.2]} />
            <meshBasicMaterial map={label} transparent toneMapped={false} />
          </mesh>
        </group>
        {/* energy columns linking the layers */}
        {[[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.95, z]} material={glow}>
            <cylinderGeometry args={[0.014, 0.014, 1.9, 8]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* --------------------------------- globe --------------------------------- */

const CITIES: { n: string; lat: number; lon: number }[] = [
  { n: "India", lat: 11.9, lon: 79.8 },
  { n: "Dubai", lat: 25.2, lon: 55.3 },
  { n: "USA", lat: 39, lon: -98 },
  { n: "Singapore", lat: 1.35, lon: 103.8 },
  { n: "Malaysia", lat: 4.4, lon: 101.9 },
  { n: "Australia", lat: -26, lon: 134 },
];
const R = 1.95;
const ll = (lat: number, lon: number, r = R) => {
  const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
  return new THREE.Vector3(r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo));
};

const ATMO_V = /* glsl */ `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const ATMO_F = /* glsl */ `uniform vec3 uC; varying vec3 vN; void main(){ float i = pow(0.72 - dot(vN, vec3(0.,0.,1.)), 3.0); gl_FragColor = vec4(uC, clamp(i, 0.0, 1.0) * 0.85); }`;

export function Globe({ palette }: { palette: RobotPalette }) {
  const spin = useRef<THREE.Group>(null!);
  const tilt = useRef<THREE.Group>(null!);
  const sat = useRef<THREE.Mesh>(null!);
  const pulses = useRef<THREE.Mesh[]>([]);
  const dotMat = useRef<THREE.PointsMaterial>(null!);
  const labels = useRef<THREE.Sprite[]>([]);
  const beacons = useRef<THREE.Mesh[]>([]);
  const rot = useRef({ y: 0 });
  const labelTex = useMemo(
    () =>
      CITIES.map((c, i) =>
        canvasTex(384, 96, (g) => {
          g.fillStyle = i === 0 ? "#14532d" : "rgba(255,255,255,0.97)";
          g.beginPath();
          g.roundRect(4, 8, 376, 80, 40);
          g.fill();
          g.lineWidth = 4;
          g.strokeStyle = i === 0 ? "#eab308" : "#16a34a";
          g.stroke();
          g.fillStyle = i === 0 ? "#ffffff" : "#14532d";
          g.font = "700 38px Arial";
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillText(i === 0 ? c.n + " · HQ" : c.n, 192, 50);
        })
      ),
    []
  );
  const mouse = useMouse();
  const atmo = useMemo(() => ({ uC: palette.uB }), [palette]);

  const dots = useMemo(() => {
    const p = new Float32Array(WORLD_DOTS.length * 3);
    WORLD_DOTS.forEach(([lon, lat], i) => ll(lat, lon, R + 0.005).toArray(p, i * 3));
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  const dotTex = useMemo(
    () =>
      canvasTex(64, 64, (c) => {
        c.fillStyle = "#fff";
        c.beginPath();
        c.arc(32, 32, 28, 0, 7);
        c.fill();
      }),
    []
  );

  const arcs = useMemo(() => {
    const a = ll(CITIES[0].lat, CITIES[0].lon);
    return CITIES.slice(1).map((c) => {
      const b = ll(c.lat, c.lon);
      const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R + 0.5 + a.distanceTo(b) * 0.18);
      return new THREE.QuadraticBezierCurve3(a, mid, b);
    });
  }, []);
  const arcGeos = useMemo(() => arcs.map((c) => new THREE.TubeGeometry(c, 60, 0.012, 6)), [arcs]);
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: "#eab308", toneMapped: false }), []);

  const live = useLive();
  useFrame(() => {
    if (!live.current) return;
    const t = palette.uTime.value;
    glow.color.copy(palette.uA.value).lerp(new THREE.Color("#eab308"), 0.4);
    if (dotMat.current) dotMat.current.color.copy(palette.uA.value);
    // the globe turns to face each of the six countries in turn and highlights it
    const active = Math.floor(t / 3.4) % CITIES.length;
    const target = -(CITIES[active].lon * Math.PI) / 180 + mouse.current.x * 0.25;
    let diff = target - rot.current.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    rot.current.y += diff * (1 - Math.exp(-2.2 * 0.016));
    spin.current.rotation.y = rot.current.y;
    labels.current.forEach((sp, i) => {
      if (!sp) return;
      const on = i === active;
      const k = THREE.MathUtils.lerp(sp.scale.x / 1.2, on ? 1.35 : 0.8, 0.1);
      sp.scale.set(1.2 * k, 0.3 * k, 1);
      sp.material.opacity = THREE.MathUtils.lerp(sp.material.opacity, on ? 1 : 0.8, 0.1);
    });
    beacons.current.forEach((b, i) => {
      if (!b) return;
      const ph = (t * 0.8 + i * 0.4) % 1;
      b.scale.setScalar(0.5 + ph * (i === active ? 2.4 : 1.4));
      (b.material as THREE.MeshBasicMaterial).opacity = (1 - ph) * (i === active ? 0.9 : 0.4);
    });
    tilt.current.rotation.x = 0.35 - mouse.current.y * 0.2;
    tilt.current.position.y = Math.sin(t * 1.0) * 0.08;
    sat.current.position.set(Math.cos(t * 0.7) * 2.9, Math.sin(t * 0.7) * 0.5, Math.sin(t * 0.7) * 2.9);
    pulses.current.forEach((m, i) => {
      if (!m) return;
      const k = (t * 0.25 + i * 0.17) % 1;
      m.position.copy(arcs[i].getPoint(k));
    });
  });

  return (
    <group ref={tilt}>
      <group ref={spin}>
        {/* glass globe */}
        <mesh>
          <sphereGeometry args={[R, 64, 64]} />
          <meshPhysicalMaterial color="#eef1ff" roughness={0.12} metalness={0} clearcoat={1} transparent opacity={0.55} envMapIntensity={1.3} />
        </mesh>
        <points geometry={dots}>
          <pointsMaterial ref={dotMat} map={dotTex} size={0.052} sizeAttenuation transparent alphaTest={0.4} depthWrite={false} color="#14532d" />
        </points>
        {arcGeos.map((g, i) => (
          <mesh key={i} geometry={g} material={glow} />
        ))}
        {arcs.map((_, i) => (
          <mesh
            key={i}
            ref={(m) => {
              if (m) pulses.current[i] = m;
            }}
            material={glow}
          >
            <sphereGeometry args={[0.055, 16, 16]} />
          </mesh>
        ))}
        {CITIES.map((c, i) => {
          const p = ll(c.lat, c.lon, R + 0.02);
          const n = p.clone().normalize();
          return (
            <group key={c.n}>
              <mesh position={p} material={glow}>
                <sphereGeometry args={[i === 0 ? 0.09 : 0.065, 16, 16]} />
              </mesh>
              <mesh
                position={p}
                quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n)}
                ref={(m) => {
                  if (m) beacons.current[i] = m;
                }}
              >
                <ringGeometry args={[0.1, 0.13, 32]} />
                <meshBasicMaterial color={i === 0 ? "#eab308" : "#16a34a"} transparent toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
              </mesh>
              <sprite
                position={ll(c.lat, c.lon, R + 0.42)}
                scale={[1.2, 0.3, 1]}
                ref={(sp) => {
                  if (sp) labels.current[i] = sp;
                }}
              >
                <spriteMaterial map={labelTex[i]} transparent toneMapped={false} depthWrite={false} />
              </sprite>
            </group>
          );
        })}
      </group>
      {/* atmosphere */}
      <mesh scale={1.12}>
        <sphereGeometry args={[R, 48, 48]} />
        <shaderMaterial vertexShader={ATMO_V} fragmentShader={ATMO_F} uniforms={atmo} transparent side={THREE.BackSide} depthWrite={false} />
      </mesh>
      {/* orbit ring + satellite */}
      <mesh rotation={[1.35, 0, 0.3]}>
        <torusGeometry args={[2.9, 0.01, 8, 200]} />
        <meshBasicMaterial color="#16a34a" transparent opacity={0.45} />
      </mesh>
      <mesh ref={sat}>
        <sphereGeometry args={[0.1, 20, 20]} />
        <meshPhysicalMaterial color="#f4f6ff" metalness={0.9} roughness={0.15} />
      </mesh>
    </group>
  );
}

/* -------------------------------- devices -------------------------------- */

export function Devices({ palette }: { palette: RobotPalette }) {
  const root = useRef<THREE.Group>(null!);
  const phone = useRef<THREE.Group>(null!);
  const board = useRef<THREE.Group>(null!);
  const cards = useRef<THREE.Group[]>([]);
  const dash = useMemo(() => dashboardTexture(), []);
  const chat = useMemo(() => chatTexture(), []);
  const mouse = useMouse();

  const live = useLive();
  useFrame(() => {
    if (!live.current) return;
    const t = palette.uTime.value;
    root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, -0.35 + mouse.current.x * 0.4, 0.08);
    root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, 0.08 - mouse.current.y * 0.15, 0.08);
    board.current.position.y = Math.sin(t * 1.0) * 0.1 + 0.2;
    phone.current.position.y = Math.sin(t * 1.2 + 1) * 0.12 - 0.35;
    cards.current.forEach((c, i) => {
      if (c) c.position.y = [1.55, -1.35][i] + Math.sin(t * 1.3 + i * 2) * 0.12;
    });
  });

  return (
    <group ref={root}>
      <group ref={board} position={[-0.3, 0.2, -0.2]}>
        <RoundedBox args={[3.7, 2.35, 0.1]} radius={0.09} smoothness={5}>
          <meshPhysicalMaterial color="#0e2416" metalness={0.8} roughness={0.25} clearcoat={0.8} envMapIntensity={1.2} />
        </RoundedBox>
        <mesh position={[0, 0, 0.056]}>
          <planeGeometry args={[3.5, 2.15]} />
          <meshBasicMaterial map={dash} toneMapped={false} />
        </mesh>
      </group>
      <group ref={phone} position={[1.75, -0.35, 0.75]} rotation={[0, -0.35, 0.05]}>
        <RoundedBox args={[1.15, 2.3, 0.11]} radius={0.16} smoothness={6}>
          <meshPhysicalMaterial color="#f1f3fb" metalness={0.5} roughness={0.2} clearcoat={1} envMapIntensity={1.3} />
        </RoundedBox>
        <mesh position={[0, 0, 0.062]}>
          <planeGeometry args={[1.02, 2.15]} />
          <meshBasicMaterial map={chat} toneMapped={false} />
        </mesh>
      </group>
      {[
        { x: -1.9, c: "#22d3ee", w: 1.3, h: 0.5 },
        { x: 1.1, c: "#bef264", w: 1.5, h: 0.5 },
      ].map((c, i) => (
        <group
          key={i}
          ref={(g) => {
            if (g) cards.current[i] = g;
          }}
          position={[c.x, 0, 0.9]}
        >
          <RoundedBox args={[c.w, c.h, 0.06]} radius={0.12} smoothness={5}>
            <meshPhysicalMaterial color="#ffffff" transparent opacity={0.72} roughness={0.08} clearcoat={1} envMapIntensity={1.4} />
          </RoundedBox>
          <mesh position={[-c.w / 2 + 0.28, 0, 0.04]}>
            <circleGeometry args={[0.1, 24]} />
            <meshBasicMaterial color={c.c} toneMapped={false} />
          </mesh>
          <mesh position={[0.1, 0.06, 0.04]}>
            <planeGeometry args={[c.w * 0.5, 0.06]} />
            <meshBasicMaterial color="#0e2416" />
          </mesh>
          <mesh position={[0.02, -0.08, 0.04]}>
            <planeGeometry args={[c.w * 0.36, 0.05]} />
            <meshBasicMaterial color="#9aa3c4" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* -------------------------------- workbench (Projects) -------------------------------- */

function editorTexture() {
  return canvasTex(1024, 640, (c) => {
    c.fillStyle = "#0b1f14";
    c.fillRect(0, 0, 1024, 640);
    c.fillStyle = "#14532d";
    c.fillRect(0, 0, 1024, 56);
    ["#ef4444", "#facc15", "#4ade80"].forEach((col, i) => {
      c.fillStyle = col;
      c.beginPath();
      c.arc(32 + i * 30, 28, 8, 0, 7);
      c.fill();
    });
    c.fillStyle = "#bbf7d0";
    c.font = "600 22px Arial";
    c.fillText("project.ts  —  build passing", 140, 36);
    const cols = ["#4ade80", "#facc15", "#e2e8f0", "#86efac", "#fde047"];
    let seed = 5;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 16; i++) {
      c.fillStyle = "#3f6b4f";
      c.font = "20px monospace";
      c.fillText(String(i + 1), 24, 104 + i * 32);
      let x = 70 + (i % 4 === 1 ? 40 : 0) + (i % 5 === 2 ? 40 : 0);
      for (let k = 0; k < 4; k++) {
        const w = 40 + rnd() * 130;
        c.fillStyle = cols[Math.floor(rnd() * cols.length)];
        c.fillRect(x, 90 + i * 32, w, 14);
        x += w + 14;
      }
    }
  });
}

function Gear({ r, teeth, speed, position, color, rev }: { r: number; teeth: number; speed: number; position: [number, number, number]; color: string; rev?: boolean }) {
  const g = useRef<THREE.Group>(null!);
  const live = useLive();
  useFrame((_, dt) => {
    if (!live.current) return;
    g.current.rotation.z += dt * speed * (rev ? -1 : 1);
  });
  return (
    <group ref={g} position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r, r, 0.16, 40]} />
        <meshPhysicalMaterial color={color} metalness={0.9} roughness={0.25} clearcoat={0.5} envMapIntensity={1.3} />
      </mesh>
      {Array.from({ length: teeth }).map((_, i) => {
        const a = (i / teeth) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * (r + 0.05), Math.sin(a) * (r + 0.05), 0]} rotation={[0, 0, a]}>
            <boxGeometry args={[0.14, 0.12, 0.16]} />
            <meshPhysicalMaterial color={color} metalness={0.9} roughness={0.25} envMapIntensity={1.3} />
          </mesh>
        );
      })}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r * 0.35, r * 0.35, 0.2, 24]} />
        <meshStandardMaterial color="#0a2417" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

export function Workbench({ palette }: { palette: RobotPalette }) {
  const root = useRef<THREE.Group>(null!);
  const board = useRef<THREE.Group>(null!);
  const cubes = useRef<THREE.Group[]>([]);
  const ed = useMemo(() => editorTexture(), []);
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: "#4ade80", toneMapped: false }), []);
  const mouse = useMouse();

  const live = useLive();
  useFrame(() => {
    if (!live.current) return;
    const t = palette.uTime.value;
    glow.color.copy(palette.uC.value).lerp(new THREE.Color("#4ade80"), 0.4);
    root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, -0.3 + mouse.current.x * 0.35, 0.08);
    root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, 0.06 - mouse.current.y * 0.12, 0.08);
    board.current.position.y = 0.5 + Math.sin(t * 1.0) * 0.08;
    cubes.current.forEach((c, i) => {
      if (c) c.position.y = -1.45 + Math.sin(t * 1.4 + i * 0.9) * 0.1;
    });
  });

  return (
    <group ref={root}>
      <group ref={board} position={[-0.2, 0.5, -0.2]}>
        <RoundedBox args={[3.5, 2.25, 0.1]} radius={0.09} smoothness={5}>
          <meshPhysicalMaterial color="#0e2416" metalness={0.8} roughness={0.25} clearcoat={0.8} envMapIntensity={1.2} />
        </RoundedBox>
        <mesh position={[0, 0, 0.056]}>
          <planeGeometry args={[3.3, 2.05]} />
          <meshBasicMaterial map={ed} toneMapped={false} />
        </mesh>
      </group>
      {/* build -> test -> review -> deploy pipeline */}
      {[-1.7, -0.57, 0.57, 1.7].map((x, i) => (
        <group
          key={i}
          ref={(g) => {
            if (g) cubes.current[i] = g;
          }}
          position={[x, -1.45, 0.3]}
        >
          <RoundedBox args={[0.7, 0.7, 0.7]} radius={0.12} smoothness={5}>
            <meshPhysicalMaterial color={i === 3 ? "#facc15" : "#f4faf6"} roughness={0.18} clearcoat={1} envMapIntensity={1.3} />
          </RoundedBox>
          <mesh position={[0, 0, 0.36]}>
            <circleGeometry args={[0.14, 24]} />
            <meshBasicMaterial color={i === 3 ? "#14532d" : "#16a34a"} toneMapped={false} />
          </mesh>
          {i < 3 && (
            <mesh position={[0.57, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={glow}>
              <cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />
            </mesh>
          )}
        </group>
      ))}
      <Gear r={0.5} teeth={12} speed={0.5} position={[2.2, 1.35, -0.1]} color="#eab308" />
      <Gear r={0.33} teeth={9} speed={0.5 * (12 / 9)} position={[1.45, 0.9, -0.1]} color="#16a34a" rev />
    </group>
  );
}

/* -------------------------------- articles (Blogs) -------------------------------- */

function articleTexture(variant: number) {
  const tints = [["#16a34a", "#bbf7d0"], ["#ca8a04", "#fef08a"], ["#15803d", "#d9f99d"]][variant];
  return canvasTex(512, 720, (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 512, 720);
    const g = c.createLinearGradient(0, 0, 512, 300);
    g.addColorStop(0, tints[0]);
    g.addColorStop(1, tints[1]);
    c.fillStyle = g;
    c.fillRect(0, 0, 512, 300);
    c.fillStyle = "rgba(255,255,255,0.35)";
    c.beginPath();
    c.arc(380, 120, 90, 0, 7);
    c.fill();
    c.fillStyle = "#14532d";
    c.fillRect(36, 340, 320, 26);
    c.fillRect(36, 384, 230, 26);
    c.fillStyle = "#cbd5c8";
    for (let i = 0; i < 6; i++) c.fillRect(36, 450 + i * 32, i % 3 === 2 ? 250 : 440, 12);
    c.fillStyle = tints[0];
    c.beginPath();
    c.roundRect(36, 660, 120, 36, 18);
    c.fill();
  });
}

export function Articles({ palette }: { palette: RobotPalette }) {
  const root = useRef<THREE.Group>(null!);
  const cards = useRef<THREE.Group[]>([]);
  const pen = useRef<THREE.Group>(null!);
  const tex = useMemo(() => [0, 1, 2].map(articleTexture), []);
  const mouse = useMouse();

  const live = useLive();
  useFrame(() => {
    if (!live.current) return;
    const t = palette.uTime.value;
    root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, mouse.current.x * 0.3, 0.08);
    root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, -mouse.current.y * 0.12, 0.08);
    cards.current.forEach((c, i) => {
      if (c) c.position.y = Math.sin(t * 1.1 + i * 1.7) * 0.1;
    });
    pen.current.position.y = -1.2 + Math.sin(t * 1.3) * 0.08;
    pen.current.rotation.z = 0.9 + Math.sin(t * 2.2) * 0.05;
  });

  const cfg = [
    { x: -1.6, z: -0.2, ry: 0.4, rz: 0.06 },
    { x: 0, z: 0.25, ry: 0, rz: 0 },
    { x: 1.6, z: -0.2, ry: -0.4, rz: -0.06 },
  ];
  return (
    <group ref={root}>
      {cfg.map((c, i) => (
        <group
          key={i}
          ref={(g) => {
            if (g) cards.current[i] = g;
          }}
          position={[c.x, 0, c.z]}
          rotation={[0, c.ry, c.rz]}
        >
          <RoundedBox args={[1.5, 2.1, 0.07]} radius={0.1} smoothness={5}>
            <meshPhysicalMaterial color="#ffffff" roughness={0.2} clearcoat={1} envMapIntensity={1.2} />
            <Edges color="#16a34a" threshold={20} />
          </RoundedBox>
          <mesh position={[0, 0, 0.04]}>
            <planeGeometry args={[1.4, 2.0]} />
            <meshBasicMaterial map={tex[i]} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* bookmark ribbon on the centre article */}
      <mesh position={[0.45, 0.95, 0.35]}>
        <boxGeometry args={[0.14, 0.5, 0.02]} />
        <meshBasicMaterial color="#facc15" toneMapped={false} />
      </mesh>
      {/* pen */}
      <group ref={pen} position={[2.2, -1.2, 0.8]} rotation={[0, 0, 0.9]}>
        <mesh>
          <cylinderGeometry args={[0.07, 0.07, 1.5, 24]} />
          <meshPhysicalMaterial color="#14532d" metalness={0.7} roughness={0.2} clearcoat={1} />
        </mesh>
        <mesh position={[0, -0.85, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.07, 0.22, 24]} />
          <meshPhysicalMaterial color="#facc15" metalness={1} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.5, 0.08]}>
          <boxGeometry args={[0.03, 0.7, 0.03]} />
          <meshStandardMaterial color="#facc15" metalness={1} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}

/* --------------------------------- mail (Contact) --------------------------------- */

function bubbleTexture(text: string, a: string, b: string) {
  return canvasTex(512, 256, (c) => {
    const g = c.createLinearGradient(0, 0, 512, 256);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    c.fillStyle = g;
    c.fillRect(0, 0, 512, 256);
    c.fillStyle = "#fff";
    c.font = "700 74px Arial";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(text, 256, 132);
  });
}

function letterTexture() {
  return canvasTex(512, 320, (c) => {
    c.fillStyle = "#fffdf2";
    c.fillRect(0, 0, 512, 320);
    c.fillStyle = "#14532d";
    c.fillRect(36, 40, 200, 22);
    c.fillStyle = "#cbd5c8";
    for (let i = 0; i < 5; i++) c.fillRect(36, 100 + i * 38, i === 4 ? 220 : 440, 12);
    c.fillStyle = "#facc15";
    c.beginPath();
    c.arc(440, 56, 26, 0, 7);
    c.fill();
  });
}

export function Mail({ palette }: { palette: RobotPalette }) {
  const root = useRef<THREE.Group>(null!);
  const letter = useRef<THREE.Mesh>(null!);
  const flap = useRef<THREE.Mesh>(null!);
  const b1 = useRef<THREE.Group>(null!);
  const b2 = useRef<THREE.Group>(null!);
  const pin = useRef<THREE.Group>(null!);
  const hello = useMemo(() => bubbleTexture("Hello!", "#15803d", "#4ade80"), []);
  const talk = useMemo(() => bubbleTexture("Let's talk", "#ca8a04", "#facc15"), []);
  const lt = useMemo(() => letterTexture(), []);
  const flapGeo = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-1.5, 0);
    sh.lineTo(1.5, 0);
    sh.lineTo(0, -1.05);
    sh.closePath();
    return new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false });
  }, []);
  const pocketShape = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-1.5, -1);
    sh.lineTo(1.5, -1);
    sh.lineTo(1.5, 0.35);
    sh.lineTo(0, -0.3);
    sh.lineTo(-1.5, 0.35);
    sh.closePath();
    return sh;
  }, []);
  const pocketEdge = useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.5, 0.35, 0), new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(1.5, 0.35, 0)]), []);
  const mouse = useMouse();

  const live = useLive();
  useFrame(() => {
    if (!live.current) return;
    const t = palette.uTime.value;
    root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, -0.25 + mouse.current.x * 0.35, 0.08);
    root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, 0.1 - mouse.current.y * 0.12, 0.08);
    const open = 0.5 + 0.5 * Math.sin(t * 0.8);
    flap.current.rotation.x = open * 2.2; // swings back and up, behind the letter
    letter.current.position.y = -0.55 + open * 0.95;
    b1.current.position.y = 1.55 + Math.sin(t * 1.3) * 0.1;
    b2.current.position.y = -1.25 + Math.sin(t * 1.1 + 1.5) * 0.1;
    pin.current.position.y = 1.5 + Math.sin(t * 1.6) * 0.12;
    pin.current.rotation.y = t * 0.9;
  });

  return (
    <group ref={root}>
      <group position={[0, -0.2, 0]}>
        {/* envelope back */}
        <RoundedBox args={[3, 2, 0.12]} radius={0.06} smoothness={4}>
          <meshPhysicalMaterial color="#e3f1e7" roughness={0.35} clearcoat={0.5} envMapIntensity={1.1} />
        </RoundedBox>
        {/* the letter slides out from between the back and the front pocket */}
        <mesh ref={letter} position={[0, -0.55, 0.075]}>
          <planeGeometry args={[2.6, 1.6]} />
          <meshBasicMaterial map={lt} toneMapped={false} />
        </mesh>
        {/* front pocket: the classic V cut, in front of the letter */}
        <mesh position={[0, 0, 0.096]}>
          <shapeGeometry args={[pocketShape]} />
          <meshPhysicalMaterial color="#f4fbf6" roughness={0.3} clearcoat={0.6} envMapIntensity={1.1} />
        </mesh>
        <lineSegments position={[0, 0, 0.098]} geometry={pocketEdge}>
          <lineBasicMaterial color="#16a34a" />
        </lineSegments>
        {/* flap, hinged on the top edge */}
        <mesh ref={flap} geometry={flapGeo} position={[0, 1, 0.1]}>
          <meshPhysicalMaterial color="#16a34a" roughness={0.25} clearcoat={1} envMapIntensity={1.2} />
        </mesh>
      </group>
      <group ref={b1} position={[-2.5, 1.55, 0.7]}>
        <RoundedBox args={[1.5, 0.8, 0.08]} radius={0.2} smoothness={5}>
          <meshPhysicalMaterial color="#ffffff" roughness={0.2} clearcoat={1} />
        </RoundedBox>
        <mesh position={[0, 0, 0.045]}>
          <planeGeometry args={[1.4, 0.7]} />
          <meshBasicMaterial map={hello} toneMapped={false} />
        </mesh>
        <mesh position={[-0.5, -0.5, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.14, 0.24, 3]} />
          <meshBasicMaterial color="#15803d" />
        </mesh>
      </group>
      <group ref={b2} position={[2.0, -1.25, 0.8]}>
        <RoundedBox args={[1.7, 0.8, 0.08]} radius={0.2} smoothness={5}>
          <meshPhysicalMaterial color="#ffffff" roughness={0.2} clearcoat={1} />
        </RoundedBox>
        <mesh position={[0, 0, 0.045]}>
          <planeGeometry args={[1.6, 0.7]} />
          <meshBasicMaterial map={talk} toneMapped={false} />
        </mesh>
        <mesh position={[0.6, -0.5, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.14, 0.24, 3]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      </group>
      {/* location pin */}
      <group ref={pin} position={[2.3, 1.6, 0.3]}>
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.24, 32, 32]} />
          <meshPhysicalMaterial color="#16a34a" roughness={0.2} clearcoat={1} />
        </mesh>
        <mesh position={[0, -0.12, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.2, 0.42, 32]} />
          <meshPhysicalMaterial color="#16a34a" roughness={0.2} clearcoat={1} />
        </mesh>
        <mesh position={[0, 0.2, 0.2]}>
          <circleGeometry args={[0.09, 20]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
      </group>
    </group>
  );
}


/* ------------------------- contact: airmail envelope + paper plane ------------------------- */

/** the envelope cover: cream paper, airmail border, postmark, a stamp with the Netkathir emblem, and the address */
function drawEnvelopeFace(c: CanvasRenderingContext2D, emblem: HTMLImageElement | null) {
  const g = c.createLinearGradient(0, 0, 0, 640);
  g.addColorStop(0, "#fffdf6");
  g.addColorStop(1, "#f3efe2");
  c.fillStyle = g;
  c.fillRect(0, 0, 1024, 640);
  // airmail border: diagonal green / gold stripes
  c.save();
  c.beginPath();
  c.rect(0, 0, 1024, 640);
  c.rect(34, 34, 956, 572);
  c.clip("evenodd");
  for (let i = -20; i < 60; i++) {
    c.fillStyle = i % 2 ? "#15803d" : "#eab308";
    c.beginPath();
    c.moveTo(i * 44, 0);
    c.lineTo(i * 44 + 26, 0);
    c.lineTo(i * 44 + 26 - 640, 640);
    c.lineTo(i * 44 - 640, 640);
    c.fill();
  }
  c.restore();
  // stamp (below the flap line) with the Netkathir emblem
  const sx = 820, sy = 236;
  c.fillStyle = "#ffffff";
  c.fillRect(sx, sy, 128, 152);
  c.strokeStyle = "#15803d";
  c.setLineDash([6, 6]);
  c.lineWidth = 3;
  c.strokeRect(sx + 8, sy + 8, 112, 136);
  c.setLineDash([]);
  if (emblem && emblem.naturalWidth) {
    const w = 96;
    const h = (w * emblem.naturalHeight) / emblem.naturalWidth;
    c.drawImage(emblem, sx + 64 - w / 2, sy + 76 - h / 2, w, h);
  } else {
    c.fillStyle = "#15803d";
    c.fillRect(sx + 20, sy + 20, 88, 112);
  }
  // postmark rings + wavy cancel lines
  c.strokeStyle = "rgba(20,83,45,0.35)";
  c.lineWidth = 3;
  [44, 58].forEach((r) => {
    c.beginPath();
    c.arc(772, 318, r, 0, 7);
    c.stroke();
  });
  for (let k = 0; k < 3; k++) {
    c.beginPath();
    for (let x = 640; x <= 720; x += 4) {
      const y = 300 + k * 16 + Math.sin(x / 9) * 4;
      if (x === 640) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
  // address
  c.textAlign = "left";
  c.textBaseline = "alphabetic";
  c.fillStyle = "#8a6414";
  c.font = "600 26px Arial";
  c.fillText("TO", 120, 372);
  c.fillStyle = "#0f3d22";
  c.font = "800 52px Arial";
  c.fillText("Netkathir Technologies", 120, 432);
  c.fillStyle = "#3f6b52";
  c.font = "500 32px Arial";
  c.fillText("Puducherry  ·  Dubai", 120, 482);
  c.strokeStyle = "rgba(15,61,34,0.18)";
  c.lineWidth = 3;
  [520, 560].forEach((y) => {
    c.beginPath();
    c.moveTo(120, y);
    c.lineTo(640, y);
    c.stroke();
  });
}

function envelopeTexture() {
  return canvasTex(1024, 640, (c) => drawEnvelopeFace(c, null));
}

/** the wax seal face: green wax with the Netkathir emblem pressed into it */
function drawSeal(c: CanvasRenderingContext2D, emblem: HTMLImageElement | null) {
  c.clearRect(0, 0, 256, 256);
  const g = c.createRadialGradient(108, 100, 10, 128, 128, 124);
  g.addColorStop(0, "#22c55e");
  g.addColorStop(0.7, "#15803d");
  g.addColorStop(1, "#0f5a2c");
  c.fillStyle = g;
  c.beginPath();
  // slightly irregular wax edge
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const r = 118 + Math.sin(i * 2.7) * 5;
    c[i ? "lineTo" : "moveTo"](128 + Math.cos(a) * r, 128 + Math.sin(a) * r);
  }
  c.fill();
  c.fillStyle = "#ffffff";
  c.beginPath();
  c.arc(128, 128, 82, 0, 7);
  c.fill();
  if (emblem && emblem.naturalWidth) {
    const s0 = 132;
    const h = (s0 * emblem.naturalHeight) / emblem.naturalWidth;
    c.drawImage(emblem, 128 - s0 / 2, 128 - h / 2, s0, h);
  }
}

/** the letter that slides out */
function contactLetterTexture() {
  return canvasTex(800, 560, (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 800, 560);
    const hg = c.createLinearGradient(0, 0, 800, 0);
    hg.addColorStop(0, "#14532d");
    hg.addColorStop(1, "#16a34a");
    c.fillStyle = hg;
    c.fillRect(0, 0, 800, 12);
    c.fillStyle = "#0f3d22";
    c.font = "800 64px Arial";
    c.fillText("Hello \u{1F44B}", 60, 120);
    c.fillStyle = "#1f5135";
    c.font = "600 40px Arial";
    c.fillText("Let's build your next", 60, 200);
    c.fillText("intelligent solution", 60, 252);
    c.strokeStyle = "rgba(15,61,34,0.14)";
    c.lineWidth = 4;
    [320, 362, 404].forEach((y, i) => {
      c.beginPath();
      c.moveTo(60, y);
      c.lineTo(i === 2 ? 460 : 740, y);
      c.stroke();
    });
    c.fillStyle = "#8a6414";
    c.font = "italic 600 36px Georgia, serif";
    c.fillText("— Team Netkathir", 60, 490);
  });
}

// WhatsApp mark (phone in a speech bubble) and a phone handset, on a 24x24 grid
const WA_PATH =
  "M12.04 2a9.9 9.9 0 00-8.46 15.04L2.2 22l5.08-1.33A9.9 9.9 0 1012.04 2zm0 18.13a8.2 8.2 0 01-4.18-1.14l-.3-.18-3.02.79.8-2.94-.2-.31a8.22 8.22 0 1112.9 1.37 8.16 8.16 0 01-6 2.41zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8s-.39-.12-.55.12-.64.8-.78.96-.29.19-.54.06a6.74 6.74 0 01-3.37-2.94c-.25-.44.25-.41.72-1.36a.46.46 0 000-.43c-.06-.12-.55-1.33-.76-1.82s-.4-.41-.55-.42h-.47a.9.9 0 00-.65.3 2.74 2.74 0 00-.86 2.04 4.76 4.76 0 001 2.53 10.9 10.9 0 004.18 3.69c1.55.67 2.16.73 2.94.61a2.5 2.5 0 001.65-1.16 2.04 2.04 0 00.14-1.16c-.06-.1-.22-.16-.47-.28z";
const PHONE_PATH =
  "M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.36 11.36 0 003.57.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z";
const MAIL_PATH = "M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zm9 7.2L3.6 7v1.9l8.4 5.1 8.4-5.1V7z";
/** draw a 24-grid vector icon centred at (cx, cy) with the given size */
function drawIcon(c: CanvasRenderingContext2D, d: string, cx: number, cy: number, size: number, col = "#ffffff") {
  c.save();
  c.translate(cx - size / 2, cy - size / 2);
  c.scale(size / 24, size / 24);
  c.fillStyle = col;
  c.fill(new Path2D(d));
  c.restore();
}

/** a round contact badge with a label underneath */
function badgeTexture(glyph: string, label: string, a: string, b: string) {
  return canvasTex(256, 320, (c) => {
    c.shadowColor = "rgba(10,60,30,0.3)";
    c.shadowBlur = 18;
    c.shadowOffsetY = 6;
    const g = c.createLinearGradient(28, 20, 228, 220);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    c.fillStyle = g;
    c.beginPath();
    c.arc(128, 120, 96, 0, 7);
    c.fill();
    c.shadowColor = "transparent";
    c.strokeStyle = "rgba(255,255,255,0.8)";
    c.lineWidth = 5;
    c.beginPath();
    c.arc(128, 120, 86, 0, 7);
    c.stroke();
    c.textAlign = "center";
    c.textBaseline = "middle";
    if (glyph === "wa") drawIcon(c, WA_PATH, 128, 120, 104);
    else if (glyph === "phone") drawIcon(c, PHONE_PATH, 128, 122, 92);
    else if (glyph === "mail") drawIcon(c, MAIL_PATH, 128, 120, 100);
    else {
      c.fillStyle = "#ffffff";
      c.font = "800 92px Arial";
      c.fillText(glyph, 128, 126);
    }
    c.fillStyle = "rgba(255,255,255,0.96)";
    c.beginPath();
    c.roundRect(38, 246, 180, 52, 26);
    c.fill();
    c.fillStyle = "#0f3d22";
    c.font = "700 30px Arial";
    c.fillText(label, 128, 274);
  });
}

const BADGES = [
  { glyph: "@", label: "Email", a: "#22c55e", b: "#14532d", ph: 0 },
  { glyph: "phone", label: "Call", a: "#fbbf24", b: "#b45309", ph: 2.1 },
  { glyph: "wa", label: "WhatsApp", a: "#3ddc6f", b: "#128c4a", ph: 4.2 },
];

// badges sit still in a balanced arc: Email left, Call below, WhatsApp right (scene units)
const BADGE_POS: [number, number, number][] = [
  [-2.05, -0.3, 0.55],
  [0, -1.35, 0.8],
  [2.05, -0.3, 0.55],
];
const PHASE = [0, 0.36, 0.66]; // when each channel takes its turn, as a fraction of the 12 s loop

/** speech bubble / call card textures for the Call and WhatsApp moments */
function chipCard(lines: [string, string], accent: string, icon: string, tail: "left" | "right" | "none", fill = "#ffffff", ink = "#0f3d22") {
  return canvasTex(640, 220, (c) => {
    c.shadowColor = "rgba(10,60,30,0.25)";
    c.shadowBlur = 22;
    c.shadowOffsetY = 8;
    c.fillStyle = fill;
    c.beginPath();
    c.roundRect(16, 14, 608, 168, 46);
    if (tail === "left") {
      c.moveTo(70, 176);
      c.lineTo(52, 210);
      c.lineTo(110, 176);
    } else if (tail === "right") {
      c.moveTo(530, 176);
      c.lineTo(590, 210);
      c.lineTo(570, 176);
    }
    c.fill();
    c.shadowColor = "transparent";
    let x = 48;
    if (icon) {
      c.fillStyle = accent;
      c.beginPath();
      c.arc(96, 98, 48, 0, 7);
      c.fill();
      if (icon === "phone") drawIcon(c, PHONE_PATH, 96, 98, 52);
      else if (icon === "wa") drawIcon(c, WA_PATH, 96, 98, 58);
      x = 168;
    }
    c.textAlign = "left";
    c.textBaseline = "alphabetic";
    c.fillStyle = ink;
    // shrink the headline if it would run into the edge of the card
    let fs = 42;
    c.font = `800 ${fs}px Arial, 'Segoe UI Emoji'`;
    while (c.measureText(lines[0]).width > 600 - x && fs > 26) {
      fs -= 2;
      c.font = `800 ${fs}px Arial, 'Segoe UI Emoji'`;
    }
    c.fillText(lines[0], x, lines[1] ? 92 : 112);
    if (lines[1]) {
      c.fillStyle = "#3f6b52";
      c.font = "600 32px Arial, 'Segoe UI Emoji'";
      c.fillText(lines[1], x, 142);
    }
  });
}
const TRAIL = 46;
const sstep = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/** An airmail envelope that opens to let a letter rise out, a paper plane looping around it, contact badges in orbit. */
export function ContactScene({ palette, mobile = false }: { palette: RobotPalette; mobile?: boolean }) {
  const mx = mobile ? 0.72 : 1; // pull the badges and cards in towards the centre on phones
  const root = useRef<THREE.Group>(null!);
  const env = useRef<THREE.Group>(null!);
  const flap = useRef<THREE.Group>(null!);
  const letter = useRef<THREE.Group>(null!);
  const plane = useRef<THREE.Group>(null!);
  const badges = useRef<THREE.Group[]>([]);
  const faces = useRef<THREE.Mesh[]>([]);
  const ripples = useRef<THREE.Mesh[]>([]);
  const packets = useRef<THREE.Group[]>([]);
  const callCard = useRef<THREE.Mesh>(null!);
  const chatA = useRef<THREE.Mesh>(null!);
  const chatB = useRef<THREE.Mesh>(null!);
  const dots = useRef<THREE.Group>(null!);
  const cards = useMemo(
    () => ({
      call: chipCard(["Calling Netkathir…", "0413 2981038"], "#d97706", "phone", "left"),
      mine: chipCard(["Hi Netkathir 👋", "I need an AI chatbot"], "#16a34a", "", "right", "#dcfce7"),
      reply: chipCard(["Hello! 😊", "How can we help you?"], "#16a34a", "", "left"),
    }),
    []
  );
  const dotGlow = useMemo(
    () =>
      canvasTex(128, 128, (c) => {
        const g = c.createRadialGradient(64, 64, 2, 64, 64, 64);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.25, "rgba(255,255,255,0.75)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        c.fillStyle = g;
        c.fillRect(0, 0, 128, 128);
      }),
    []
  );
  const halo = useRef<THREE.Mesh>(null!);
  const mouse = useMouse();
  const envTex = useMemo(() => envelopeTexture(), []);
  const sealTex = useMemo(() => canvasTex(256, 256, (c) => drawSeal(c, null)), []);
  useEffect(() => {
    const emblem = new Image();
    emblem.onload = () => {
      drawEnvelopeFace((envTex.image as HTMLCanvasElement).getContext("2d")!, emblem);
      envTex.needsUpdate = true;
      drawSeal((sealTex.image as HTMLCanvasElement).getContext("2d")!, emblem);
      sealTex.needsUpdate = true;
    };
    emblem.src = "/images/brand/netkathir-emblem.png";
  }, [envTex, sealTex]);
  const letTex = useMemo(() => contactLetterTexture(), []);
  const badgeTex = useMemo(() => BADGES.map((b) => badgeTexture(b.glyph, b.label, b.a, b.b)), []);
  const glow = useMemo(
    () =>
      canvasTex(256, 256, (c) => {
        const g = c.createRadialGradient(128, 128, 8, 128, 128, 128);
        g.addColorStop(0, "rgba(250,214,120,0.55)");
        g.addColorStop(0.5, "rgba(74,222,128,0.18)");
        g.addColorStop(1, "rgba(74,222,128,0)");
        c.fillStyle = g;
        c.fillRect(0, 0, 256, 256);
      }),
    []
  );
  const shadowTex = useMemo(
    () =>
      canvasTex(256, 128, (c) => {
        const g = c.createRadialGradient(128, 64, 4, 128, 64, 120);
        g.addColorStop(0, "rgba(6,60,30,0.35)");
        g.addColorStop(1, "rgba(6,60,30,0)");
        c.fillStyle = g;
        c.save();
        c.scale(1, 0.5);
        c.fillRect(0, 0, 256, 256);
        c.restore();
      }),
    []
  );
  // folded paper plane: two wings and a keel (nose points +z)
  const planeGeo = useMemo(() => {
    const N = [0, 0, 0.5], L = [-0.36, 0.03, -0.36], R = [0.36, 0.03, -0.36], C = [0, 0, -0.36], K = [0, -0.13, -0.32];
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([...N, ...L, ...C, ...N, ...C, ...R, ...N, ...C, ...K], 3));
    g.computeVertexNormals();
    return g;
  }, []);
  const flapGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.1, 0);
    s.lineTo(1.1, 0);
    s.lineTo(0.1, -0.4);
    s.quadraticCurveTo(0, -0.45, -0.1, -0.4);
    s.closePath();
    return new THREE.ShapeGeometry(s, 8);
  }, []);
  const trail = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
    // fades from bright green at the plane to the page tint at the tail, like a contrail
    const col = new Float32Array(TRAIL * 3);
    const a = new THREE.Color("#16a34a");
    const b = new THREE.Color("#eefbf2");
    const c = new THREE.Color();
    for (let i = 0; i < TRAIL; i++) {
      c.copy(a).lerp(b, Math.pow(i / (TRAIL - 1), 0.8));
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);
    return g;
  }, []);
  const hist = useRef<THREE.Vector3[]>([]);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const path = (t: number, out: THREE.Vector3) => {
    const w = t * 0.62;
    return out.set(Math.cos(w) * 2.55, 0.35 + Math.sin(w * 2) * 0.45, Math.sin(w) * 1.25 + 0.2);
  };

  const live = useLive();
  useFrame((_, dt) => {
    if (!live.current) return;
    const t = palette.uTime.value;
    const d = Math.min(dt, 0.25);
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, mouse.current.x * 0.35, 4, d);
    root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, 0.06 - mouse.current.y * 0.1, 4, d);
    env.current.position.y = Math.sin(t * 1.1) * 0.06;
    const p = (t % 12) / 12;
    // the email lands in the envelope with a small bounce
    const ba = (p - 0.12) / 0.035;
    env.current.scale.setScalar(1 + (ba > 0 && ba < 1 ? 0.05 * Math.sin(ba * Math.PI) : 0));
    env.current.rotation.z = Math.sin(t * 0.7) * 0.03;
    env.current.rotation.y = Math.sin(t * 0.45) * 0.12;

    // 12 s loop, one channel at a time:
    //  Email: a message flies into the envelope, it opens and the reply letter rises
    //  Call: the phone badge rings and a "Calling Netkathir…" card pops beside it
    //  WhatsApp: a chat plays out above its badge (your message, typing, our reply)
    const open = sstep(0.12, 0.17, p) * (1 - sstep(0.29, 0.34, p));
    const rise = sstep(0.15, 0.21, p) * (1 - sstep(0.26, 0.32, p));
    // the flap swings up and folds back a little past upright, so the letter comes out in front of it
    flap.current.rotation.x = -open * (Math.PI + 0.36);
    letter.current.position.y = -0.05 + rise * 1.05;
    letter.current.rotation.z = Math.sin(t * 1.3) * 0.02 * rise;

    // paper plane on a looping orbit, nose along its path, banking into the turns
    path(t, plane.current.position);
    plane.current.lookAt(path(t + 0.06, tmp));
    plane.current.rotateZ(-Math.sin(t * 0.62) * 0.5);
    const h = hist.current;
    h.unshift(plane.current.position.clone());
    if (h.length > TRAIL) h.length = TRAIL;
    const arr = trail.attributes.position.array as Float32Array;
    for (let i = 0; i < TRAIL; i++) {
      const v = h[Math.min(i * 2, h.length - 1)] ?? plane.current.position;
      arr[i * 3] = v.x;
      arr[i * 3 + 1] = v.y;
      arr[i * 3 + 2] = v.z;
    }
    trail.attributes.position.needsUpdate = true;

    const pop = (x: number) => {
      if (x <= 0) return 0.001;
      const k = Math.min(x, 1) - 1;
      return Math.max(0.001, 1 + 2.2 * k * k * k + 1.2 * k * k);
    };
    const active = [
      sstep(0, 0.02, p) * (1 - sstep(0.07, 0.1, p)), // email sends
      sstep(0.36, 0.38, p) * (1 - sstep(0.58, 0.62, p)), // phone rings
      sstep(0.66, 0.69, p) * (1 - sstep(0.92, 0.96, p)), // chat open
    ];
    badges.current.forEach((g, i) => {
      if (!g) return;
      const [bx, by, bz] = BADGE_POS[i];
      g.position.set(bx * mx, by + Math.sin(t * 1.2 + BADGES[i].ph) * 0.06, bz);
      g.rotation.y = -root.current.rotation.y;
      const k = active[i];
      g.scale.setScalar((mobile ? 1.15 : 0.92) + 0.16 * k);
      const f = faces.current[i];
      // the phone shakes in short bursts, like a real ring
      if (f) f.rotation.z = i === 1 ? Math.sin(t * 42) * 0.22 * k * (Math.sin(t * 5) > 0 ? 1 : 0.15) : 0;
      // ripples: one for the email and chat, repeating waves while the phone rings
      const rp = ripples.current[i];
      if (rp) {
        const r = i === 1 ? (k > 0.05 ? ((p - 0.36) / 0.06) % 1 : -1) : (p - PHASE[i]) / 0.1;
        rp.visible = r > 0 && r < 1;
        rp.scale.setScalar(1 + r * 1.4);
        (rp.material as THREE.MeshBasicMaterial).opacity = (1 - r) * 0.7;
      }
    });

    // email: a glowing message arcs from the Email badge into the envelope
    const pk = packets.current[0];
    if (pk) {
      const u = (p - 0.03) / 0.09;
      pk.visible = u > 0 && u < 1;
      if (pk.visible) {
        const e = u * u * (3 - 2 * u);
        const sx = BADGE_POS[0][0] * mx, sy = BADGE_POS[0][1] + 0.1, sz = BADGE_POS[0][2] + 0.05;
        const ex = 0, ey = env.current.position.y, ez = 0.15;
        const cx = sx * 0.45, cy = Math.max(sy, ey) + 0.75, cz = 0.9;
        const w = 1 - e;
        pk.position.set(w * w * sx + 2 * w * e * cx + e * e * ex, w * w * sy + 2 * w * e * cy + e * e * ey, w * w * sz + 2 * w * e * cz + e * e * ez);
        pk.scale.setScalar(1 - 0.45 * e);
        pk.rotation.y = -root.current.rotation.y;
      }
    }

    // call: the "Calling Netkathir…" card pops out beside the ringing phone
    const callOut = 1 - sstep(0.58, 0.62, p);
    callCard.current.scale.setScalar(Math.max(0.001, pop((p - 0.38) / 0.05) * callOut));
    callCard.current.visible = p > 0.38 && callOut > 0.01;
    callCard.current.rotation.y = -root.current.rotation.y;

    // whatsapp: your message, typing dots, then our reply
    const chatOut = 1 - sstep(0.92, 0.96, p);
    chatA.current.scale.setScalar(Math.max(0.001, pop((p - 0.69) / 0.05) * chatOut));
    chatA.current.visible = p > 0.69 && chatOut > 0.01;
    chatA.current.rotation.y = -root.current.rotation.y;
    dots.current.visible = p > 0.73 && p < 0.79;
    dots.current.rotation.y = -root.current.rotation.y;
    dots.current.children.forEach((m, j) => m.scale.setScalar(0.6 + 0.4 * Math.max(0, Math.sin(t * 9 - j * 0.9))));
    chatB.current.scale.setScalar(Math.max(0.001, pop((p - 0.79) / 0.05) * chatOut));
    chatB.current.visible = p > 0.79 && chatOut > 0.01;
    chatB.current.rotation.y = -root.current.rotation.y;
    halo.current.scale.setScalar(4.2 + Math.sin(t * 1.4) * 0.15);
  });

  return (
    <group ref={root} scale={1.6}>
      <mesh ref={halo} position={[0, 0.2, -0.8]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>

      {/* soft shadow under the floating envelope */}
      <mesh position={[0, -1.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.6, 1.1]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} toneMapped={false} />
      </mesh>

      <group ref={env} position={[0, 0, 0]}>
        {/* the letter sits in the pocket (behind its front face) and rises out in front of the folded-back flap */}
        <group ref={letter} position={[0, -0.05, 0.042]}>
          <mesh>
            <planeGeometry args={[1.95, 1.22]} />
            <meshBasicMaterial map={letTex} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        </group>
        {/* envelope body: the flap side faces us, plain paper at the back */}
        <mesh position={[0, 0, 0.055]}>
          <planeGeometry args={[2.2, 1.375]} />
          <meshBasicMaterial map={envTex} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, -0.055]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[2.2, 1.375]} />
          <meshBasicMaterial color="#efe9d8" toneMapped={false} />
        </mesh>
        {/* paper edges */}
        {[-1, 1].map((sd) => (
          <mesh key={`v${sd}`} position={[sd * 1.1, 0, 0]}>
            <boxGeometry args={[0.012, 1.375, 0.11]} />
            <meshStandardMaterial color="#e8e2cf" roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, -0.6875, 0]}>
          <boxGeometry args={[2.2, 0.012, 0.11]} />
          <meshStandardMaterial color="#e8e2cf" roughness={0.8} />
        </mesh>
        {/* flap: hinged on the top edge of the face we see; it folds up and back, behind the rising letter */}
        <group ref={flap} position={[0, 0.6875, 0.06]}>
          <mesh geometry={flapGeo}>
            <meshBasicMaterial color="#f5efe0" side={THREE.FrontSide} toneMapped={false} />
          </mesh>
          {/* inside of the flap, seen once it is open */}
          <mesh geometry={flapGeo} position={[0, 0, -0.002]}>
            <meshBasicMaterial color="#fbf8ee" side={THREE.BackSide} toneMapped={false} />
          </mesh>
          {/* fold shadow along the flap edges */}
          <mesh geometry={flapGeo} position={[0, -0.012, -0.001]} scale={[1.01, 1.02, 1]}>
            <meshBasicMaterial color="#d9d0b8" side={THREE.FrontSide} toneMapped={false} transparent opacity={0.6} />
          </mesh>
          {/* wax seal with the Netkathir emblem on the flap tip */}
          <mesh position={[0, -0.36, 0.02]}>
            <circleGeometry args={[0.15, 40]} />
            <meshBasicMaterial map={sealTex} transparent toneMapped={false} />
          </mesh>
        </group>
      </group>

      {/* paper plane + dotted trail */}
      <group ref={plane} scale={0.62}>
        <mesh geometry={planeGeo}>
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.005, -0.3]}>
          <boxGeometry args={[0.7, 0.006, 0.05]} />
          <meshBasicMaterial color="#22c55e" toneMapped={false} />
        </mesh>
      </group>
      <points geometry={trail} frustumCulled={false}>
        <pointsMaterial vertexColors size={0.05} sizeAttenuation transparent opacity={0.9} depthWrite={false} />
      </points>

      {/* contact channels: each one sends its message into the envelope in turn */}
      {BADGES.map((b, i) => (
        <group
          key={b.label}
          ref={(g) => {
            if (g) badges.current[i] = g;
          }}
        >
          <mesh
            ref={(m) => {
              if (m) ripples.current[i] = m;
            }}
            position={[0, 0.094, -0.01]}
            visible={false}
          >
            <ringGeometry args={[0.2, 0.23, 48]} />
            <meshBasicMaterial color={b.a} transparent opacity={0} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh
            ref={(m) => {
              if (m) faces.current[i] = m;
            }}
          >
            <planeGeometry args={[0.6, 0.75]} />
            <meshBasicMaterial map={badgeTex[i]} transparent depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {BADGES.slice(0, 1).map((b, i) => (
        <group
          key={`pk${b.label}`}
          ref={(g) => {
            if (g) packets.current[i] = g;
          }}
          visible={false}
        >
          <mesh>
            <planeGeometry args={[0.5, 0.5]} />
            <meshBasicMaterial map={dotGlow} color={b.a} transparent opacity={0.95} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <circleGeometry args={[0.055, 24]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* call card beside the phone */}
      <mesh ref={callCard} position={[BADGE_POS[1][0] * mx + (mobile ? 0.95 : 1.25), BADGE_POS[1][1] + 0.3, BADGE_POS[1][2] + 0.1]} scale={0.001} visible={false}>
        <planeGeometry args={[1.6, 0.55]} />
        <meshBasicMaterial map={cards.call} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      {/* chat above the WhatsApp badge */}
      <mesh ref={chatA} position={[BADGE_POS[2][0] * mx - (mobile ? 0.55 : 0.15), BADGE_POS[2][1] + 1.35, BADGE_POS[2][2] + 0.1]} scale={0.001} visible={false}>
        <planeGeometry args={[1.6, 0.55]} />
        <meshBasicMaterial map={cards.mine} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={dots} position={[BADGE_POS[2][0] * mx - (mobile ? 0.95 : 0.55), BADGE_POS[2][1] + 0.78, BADGE_POS[2][2] + 0.1]} visible={false}>
        {[0, 1, 2].map((k) => (
          <mesh key={k} position={[k * 0.11, 0, 0]}>
            <circleGeometry args={[0.04, 16]} />
            <meshBasicMaterial color="#16a34a" toneMapped={false} />
          </mesh>
        ))}
      </group>
      <mesh ref={chatB} position={[BADGE_POS[2][0] * mx - (mobile ? 0.75 : 0.35), BADGE_POS[2][1] + 0.78, BADGE_POS[2][2] + 0.1]} scale={0.001} visible={false}>
        <planeGeometry args={[1.6, 0.55]} />
        <meshBasicMaterial map={cards.reply} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
