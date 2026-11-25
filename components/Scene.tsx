/* eslint-disable react-hooks/purity, react-hooks/immutability -- imperative three.js scene: values are mutated per frame by design */
"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import AICore from "./AICore";
import { Articles, Chip, Devices, Globe, ContactScene, Presence, Workbench } from "./Hero3D";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type Stage = { x: number; y: number; s: number; pal: [string, string, string] };

/** Per-route stage: the AI core slides, scales and re-colours as you navigate. */
const STAGES: Record<string, Stage> = {
  "/": { x: 3.2, y: -0.05, s: 0.95, pal: ["#14532d", "#16a34a", "#eab308"] },
  "/services": { x: 2.7, y: -0.1, s: 1.0, pal: ["#166534", "#22c55e", "#facc15"] },
  "/products": { x: 3.4, y: 0.0, s: 0.85, pal: ["#15803d", "#84cc16", "#ca8a04"] },
  "/projects": { x: 3.4, y: 0.1, s: 0.85, pal: ["#a16207", "#16a34a", "#84cc16"] },
  "/blogs": { x: 3.4, y: 0.1, s: 0.8, pal: ["#166534", "#4ade80", "#eab308"] },
  "/about": { x: 3.3, y: 0.35, s: 0.62, pal: ["#14532d", "#22c55e", "#facc15"] },
  "/contact": { x: 2.9, y: 0.55, s: 0.7, pal: ["#15803d", "#16a34a", "#eab308"] },
};

const VARIANT: Record<string, "core" | "services" | "none" | "chip" | "globe" | "devices" | "work" | "articles" | "mail"> = {
  "/": "core",
  "/services": "none",
  "/projects": "none",
  "/products": "none",
  "/blogs": "none",
  "/about": "globe",
  "/contact": "mail",
};

type Shared = {
  uTime: { value: number };
  uDim: { value: number };
  uPx: { value: number };
  uA: { value: THREE.Color };
  uB: { value: THREE.Color };
  uC: { value: THREE.Color };
};

/* --------------------------------- lights -------------------------------- */

function Studio({ shared }: { shared: Shared }) {
  const l1 = useRef<THREE.PointLight>(null!);
  const l2 = useRef<THREE.PointLight>(null!);
  useFrame(() => {
    l1.current.color.copy(shared.uB.value);
    l2.current.color.copy(shared.uC.value);
  });
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 5, 5]} intensity={2.4} />
      <pointLight ref={l1} position={[-4, 1, 3]} intensity={38} distance={14} />
      <pointLight ref={l2} position={[4, 2, -2]} intensity={46} distance={14} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3.2} position={[0, 5, 4]} scale={[10, 3, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={2} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} color="#a5b4fc" />
        <Lightformer form="rect" intensity={2} position={[5, 0, 2]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} color="#bbf7d0" />
        <Lightformer form="ring" intensity={1.5} position={[0, -3, 3]} scale={5} color="#f9a8d4" />
      </Environment>
    </>
  );
}

/* ----------------------------- neural network ---------------------------- */

const NODE_VERT = /* glsl */ `
uniform float uTime; uniform float uPx;
attribute float aR;
varying float vTw;
void main(){
  vTw = 0.55 + 0.45 * sin(uTime * 1.6 + aR * 40.0);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = (14.0 + aR * 16.0) * uPx * (1.0 / -mv.z) * 3.2;
  gl_Position = projectionMatrix * mv;
}`;
const NODE_FRAG = /* glsl */ `
uniform vec3 uB; uniform vec3 uC; uniform float uDim;
varying float vTw;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a = pow(a, 1.6);
  gl_FragColor = vec4(mix(uB, uC, vTw), a * (0.55 + vTw * 0.45) * uDim);
}`;

const EDGE_VERT = /* glsl */ `
uniform float uTime;
attribute float aT; attribute float aR;
varying float vT; varying float vP;
void main(){
  vT = aT;
  vP = fract(uTime * (0.16 + aR * 0.18) + aR * 7.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const EDGE_FRAG = /* glsl */ `
uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform float uDim;
varying float vT; varying float vP;
void main(){
  float pulse = smoothstep(0.16, 0.0, abs(vT - vP));
  vec3 base = mix(uA, uB, vT);
  vec3 col = mix(base, uC, pulse);
  gl_FragColor = vec4(col, (0.20 + pulse * 0.75) * uDim);
}`;

function Network({ shared, count }: { shared: Shared; count: number }) {
  const { nodes, edges } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = golden * i;
      const rad = 2.0 + Math.random() * 1.5;
      pts.push(new THREE.Vector3(Math.cos(t) * r * rad, y * rad, Math.sin(t) * r * rad));
    }
    const pos = new Float32Array(count * 3);
    const rnd = new Float32Array(count);
    pts.forEach((p, i) => {
      pos.set([p.x, p.y, p.z], i * 3);
      rnd[i] = Math.random();
    });

    const seen = new Set<string>();
    const ep: number[] = [];
    const et: number[] = [];
    const er: number[] = [];
    pts.forEach((p, i) => {
      const near = pts
        .map((q, j) => ({ j, d: p.distanceToSquared(q) }))
        .filter((o) => o.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 3);
      near.forEach(({ j }) => {
        const k = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(k)) return;
        seen.add(k);
        const q = pts[j];
        const r = Math.random();
        ep.push(p.x, p.y, p.z, q.x, q.y, q.z);
        et.push(0, 1);
        er.push(r, r);
      });
    });

    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    nodeGeo.setAttribute("aR", new THREE.BufferAttribute(rnd, 1));
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(ep, 3));
    edgeGeo.setAttribute("aT", new THREE.Float32BufferAttribute(et, 1));
    edgeGeo.setAttribute("aR", new THREE.Float32BufferAttribute(er, 1));
    return { nodes: nodeGeo, edges: edgeGeo };
  }, [count]);

  return (
    <group>
      <lineSegments geometry={edges}>
        <shaderMaterial
          vertexShader={EDGE_VERT}
          fragmentShader={EDGE_FRAG}
          uniforms={shared}
          transparent
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </lineSegments>
      <points geometry={nodes}>
        <shaderMaterial
          vertexShader={NODE_VERT}
          fragmentShader={NODE_FRAG}
          uniforms={shared}
          transparent
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>
    </group>
  );
}

/* --------------------------------- rings --------------------------------- */

function Rings({ shared }: { shared: Shared }) {
  const refs = useRef<THREE.Mesh[]>([]);
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);
  useFrame((_, d) => {
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.rotation.z += d * (0.12 + i * 0.07) * (i % 2 ? -1 : 1);
    });
    mats.current[0]?.color.copy(shared.uB.value);
    mats.current[1]?.color.copy(shared.uC.value);
    mats.current[2]?.color.copy(shared.uA.value).lerp(shared.uB.value, 0.5);
  });
  const cfg = [
    { r: 2.1, rx: 1.2, ry: 0.2 },
    { r: 2.6, rx: 0.5, ry: 0.9 },
    { r: 3.15, rx: 1.0, ry: -0.7 },
  ];
  return (
    <group>
      {cfg.map((c, i) => (
        <mesh
          key={i}
          ref={(m) => {
            if (m) refs.current[i] = m;
          }}
          rotation={[c.rx, c.ry, 0]}
        >
          <torusGeometry args={[c.r, 0.007, 8, 220]} />
          <meshBasicMaterial
            ref={(m) => {
              if (m) mats.current[i] = m;
            }}
            transparent
            opacity={0.55}
            toneMapped={false}
            blending={THREE.NormalBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------------------------- dust --------------------------------- */

const DUST_VERT = /* glsl */ `
uniform float uTime; uniform float uPx;
attribute float aR;
varying float vTw;
void main(){
  vec3 p = position;
  p.y += sin(uTime * 0.2 + aR * 30.0) * 0.25;
  p.x += cos(uTime * 0.17 + aR * 20.0) * 0.25;
  vTw = 0.55 + 0.45 * sin(uTime * (0.8 + aR) + aR * 60.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = (2.0 + aR * 4.0) * uPx * (8.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const DUST_FRAG = /* glsl */ `
uniform vec3 uA; uniform vec3 uB; uniform float uDim;
varying float vTw;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d);
  gl_FragColor = vec4(uA, a * vTw * 0.45);
}`;

function Dust({ shared, count }: { shared: Shared; count: number }) {
  const ref = useRef<THREE.Points>(null!);
  const geo = useMemo(() => {
    const p = new Float32Array(count * 3);
    const r = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 30;
      p[i * 3 + 1] = (Math.random() - 0.5) * 30;
      p[i * 3 + 2] = -14 + Math.random() * 20;
      r[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("aR", new THREE.BufferAttribute(r, 1));
    return g;
  }, [count]);
  useFrame((_, d) => {
    ref.current.rotation.y += d * 0.01;
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, window.scrollY * 0.0022, 0.06);
  });
  return (
    <points ref={ref} geometry={geo}>
      <shaderMaterial
        vertexShader={DUST_VERT}
        fragmentShader={DUST_FRAG}
        uniforms={shared}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

/* --------------------------------- world --------------------------------- */

function World({ mobile, reduced }: { mobile: boolean; reduced: boolean }) {
  const path = usePathname();
  const stage = STAGES[path] ?? STAGES["/"];
  const variant = VARIANT[path] ?? "core";
  const group = useRef<THREE.Group>(null!);
  const spin = useRef<THREE.Group>(null!);
  const mouse = useRef({ x: 0, y: 0 });
  const tmp = useRef([new THREE.Color(), new THREE.Color(), new THREE.Color()]);
  const snap = useRef(true);

  const shared = useMemo<Shared>(
    () => ({
      uTime: { value: 0 },
      uDim: { value: 1 },
      uPx: { value: 1 },
      uA: { value: new THREE.Color(STAGES["/"].pal[0]) },
      uB: { value: new THREE.Color(STAGES["/"].pal[1]) },
      uC: { value: new THREE.Color(STAGES["/"].pal[2]) },
    }),
    []
  );

  useEffect(() => {
    const m = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", m);
    return () => window.removeEventListener("mousemove", m);
  }, []);

  // Land on the new route's pose immediately. Damping from the previous page
  // leaves the model sitting on top of whatever section is now in view.
  useEffect(() => {
    snap.current = true;
  }, [path]);

  const frames = useRef(0);
  useFrame((state, d) => {
    if (frames.current < 4 && ++frames.current === 4) {
      (window as unknown as { __nkSceneReady?: boolean }).__nkSceneReady = true;
      window.dispatchEvent(new Event("nk:scene-ready")); // the loader waits for this, so the site never stutters while it first renders
    }
    const dt = Math.min(d, 0.25);
    shared.uTime.value += dt;
    shared.uPx.value = state.gl.getPixelRatio();

    const p = window.scrollY / window.innerHeight; // scroll progress in viewports
    const pc = Math.min(p, 3);
    const core = variant === "core";
    const out = Math.max(0, p - 1.5); // the home hero is pinned for ~1.5 screens while the head transforms; then it leaves
    const tx = core ? (mobile ? 0 : stage.x * (1 - 0.06 * Math.min(p / 1.05, 1))) : mobile ? 0 : stage.x * Math.max(0, Math.cos(Math.min(p, 1.3) * 1.2));
    const ty = core ? (mobile ? -0.72 + p * 7.04 : stage.y + out * 4.8) : (mobile ? 0.35 : stage.y) + Math.min(p, 2.5) * 4.8;
    const ts = core ? stage.s * (mobile ? 0.5 : 1) * (1 - Math.min(out, 1) * 0.2) : stage.s * (mobile ? 0.46 : 1) * (1 - Math.min(pc, 2) * 0.16);
    const g = group.current;
    if (snap.current) {
      g.position.set(tx, ty, -pc * 0.9);
      g.scale.setScalar(Math.max(ts, 0.0001));
      snap.current = false;
    } else {
      g.position.x = THREE.MathUtils.damp(g.position.x, tx, 5, dt);
      g.position.y = THREE.MathUtils.damp(g.position.y, ty, 6, dt);
      g.position.z = THREE.MathUtils.damp(g.position.z, -pc * 0.9, 4, dt);
      g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, ts, 4, dt));
    }
    // only the surrounding network / orbit rings turn; the robot always faces the viewer
    const sp = spin.current;
    if (sp) {
    sp.rotation.y += dt * (reduced ? 0.02 : 0.1);
    sp.rotation.x = THREE.MathUtils.lerp(sp.rotation.x, mouse.current.y * 0.25, 0.1);
    sp.rotation.z = THREE.MathUtils.lerp(sp.rotation.z, mouse.current.x * 0.12, 0.1);
    }

    const dim = 1 - Math.min(pc / 1.4, 1) * 0.5;
    shared.uDim.value = THREE.MathUtils.lerp(shared.uDim.value, dim, 0.06);

    // palette morph
    const cols = [shared.uA.value, shared.uB.value, shared.uC.value];
    cols.forEach((c, i) => c.lerp(tmp.current[i].set(stage.pal[i]), 1 - Math.exp(-4 * dt)));

    // camera parallax
    const drift = reduced || mobile ? 0 : 1;
    const aimX = mobile ? 0 : mouse.current.x * 0.8 + Math.sin(shared.uTime.value * 0.25) * 0.35 * drift;
    const aimY = mobile ? 0 : mouse.current.y * 0.5 + Math.cos(shared.uTime.value * 0.2) * 0.15 * drift;
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, aimX, mobile ? 0.2 : 0.1);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, aimY, mobile ? 0.2 : 0.1);
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <>
      {variant !== "core" && <Dust shared={shared} count={mobile ? 250 : 650} />}
      <group ref={group}>
        <Presence active={variant === "core"}>
          <AICore palette={shared} mobile={mobile} />
        </Presence>
        <Presence active={variant === "chip"}>
          <Chip palette={shared} />
        </Presence>
        <Presence active={variant === "globe"}>
          <Globe palette={shared} />
        </Presence>
        <Presence active={variant === "devices"}>
          <Devices palette={shared} />
        </Presence>
        <Presence active={variant === "work"}>
          <Workbench palette={shared} />
        </Presence>
        <Presence active={variant === "articles"}>
          <Articles palette={shared} />
        </Presence>
        <Presence active={variant === "mail"}>
          <ContactScene palette={shared} />
        </Presence>
        <Presence active={variant !== "none" && variant !== "core" && variant !== "services"}>
          <group ref={spin} scale={variant === "core" ? 0.8 : variant === "globe" ? 0.5 : 1}>
            <Network shared={shared} count={mobile ? 30 : 46} />
            <Rings shared={shared} />
          </group>
        </Presence>
      </group>
      <Studio shared={shared} />
    </>
  );
}

export default function Scene() {
  const path = usePathname();
  const variant = VARIANT[path] ?? "core";
  const mobile = typeof window !== "undefined" && window.innerWidth < 800;
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // pause the GPU entirely when the tab is hidden or the hero has scrolled away
  const [active, setActive] = useState(true);
  useEffect(() => {
    // The home hero stays pinned for a little over one screen. After that the
    // model must be gone, or it paints through the sections underneath.
    const limit = () => window.innerHeight * (path === "/" ? 1.15 : 0.95);
    const f = () => setActive(!document.hidden && window.scrollY < limit());
    f();
    window.addEventListener("scroll", f, { passive: true });
    document.addEventListener("visibilitychange", f);
    return () => {
      window.removeEventListener("scroll", f);
      document.removeEventListener("visibilitychange", f);
    };
  }, [path]);
  if (variant === "none") return null;
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, mobile ? 1.25 : 1.5]}
      camera={{ position: [0, 0, 8.5], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0, opacity: active ? 1 : 0, transition: "opacity .5s" }}
    >
      <World mobile={mobile} reduced={reduced} />
    </Canvas>
  );
}


