/* eslint-disable react-hooks/immutability, react-hooks/purity -- imperative three.js animation: values are mutated per frame by design */
"use client";

import { useFrame } from "@react-three/fiber";
import { RoundedBox, Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { traceImageToShapes } from "@/lib/traceShape";
import type { RobotPalette } from "./Hero3D";

/* ============================ living holographic interfaces ============================ */

const TITLES = ["AI INSIGHTS", "NEURAL GRAPH", "MODEL.BIN", "SIGNAL RADAR", "ACCURACY", "AUTOMATION"];
const PW = 512;
const PH = 340;
const ease = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/** One full "page" of an interface, animated by time `t` (charts breathe, radar sweeps, toggles flip, binary scrolls...). */
function drawPage(c: CanvasRenderingContext2D, kind: number, variant: number, t: number) {
  const g = c.createLinearGradient(0, 0, PW, PH);
  g.addColorStop(0, "rgba(5,40,24,0.93)");
  g.addColorStop(1, "rgba(9,58,33,0.88)");
  c.fillStyle = g;
  c.fillRect(0, 0, PW, PH);
  const accent = variant ? "250,204,21" : "74,222,128";
  c.strokeStyle = `rgba(${accent},0.95)`;
  c.lineWidth = 3;
  c.strokeRect(6, 6, 500, 328);
  c.lineWidth = 5;
  [[6, 6, 1, 1], [506, 6, -1, 1], [6, 334, 1, -1], [506, 334, -1, -1]].forEach(([x, y, sx, sy]) => {
    c.beginPath();
    c.moveTo(x, y + sy * 26);
    c.lineTo(x, y);
    c.lineTo(x + sx * 26, y);
    c.stroke();
  });
  c.fillStyle = "#bef264";
  c.font = "600 22px Arial";
  c.textAlign = "left";
  c.fillText(TITLES[kind], 24, 40);
  c.fillStyle = `rgba(${accent},${0.5 + 0.5 * Math.sin(t * 4)})`;
  c.beginPath();
  c.arc(480, 32, 7, 0, 7);
  c.fill();
  c.strokeStyle = "rgba(74,222,128,0.45)";
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(24, 56);
  c.lineTo(488, 56);
  c.stroke();
  const rnd = seeded(11 + kind * 7 + variant * 31);

  if (kind === 0) {
    for (let i = 0; i < 16; i++) {
      const h = 30 + (Math.sin(t * 1.4 + i * 0.7 + variant * 2) * 0.5 + 0.5) * 165;
      const bg = c.createLinearGradient(0, 320 - h, 0, 320);
      bg.addColorStop(0, "#facc15");
      bg.addColorStop(1, "#16a34a");
      c.fillStyle = bg;
      c.fillRect(26 + i * 28, 320 - h, 18, h);
    }
    c.strokeStyle = "#d9f99d";
    c.lineWidth = 3;
    c.beginPath();
    for (let i = 0; i <= 24; i++) {
      const x = 28 + i * 19, y = 140 - Math.sin(i * 0.5 + t * 1.6 + variant) * 38 - Math.sin(i * 0.17 + t * 0.7) * 18;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.stroke();
  } else if (kind === 1) {
    const pts = Array.from({ length: 22 }, () => [40 + rnd() * 430, 78 + rnd() * 240]);
    c.strokeStyle = "rgba(190,242,100,0.45)";
    c.lineWidth = 1.5;
    const edges: [number, number][] = [];
    pts.forEach((p, i) =>
      pts.slice(i + 1, i + 4).forEach((q, k) => {
        edges.push([i, i + 1 + k]);
        c.beginPath();
        c.moveTo(p[0], p[1]);
        c.lineTo(q[0], q[1]);
        c.stroke();
      })
    );
    pts.forEach((p, i) => {
      const hot = i % 5 === variant;
      c.fillStyle = hot ? "#facc15" : "#4ade80";
      c.beginPath();
      c.arc(p[0], p[1], (hot ? 8 : 4.5) + Math.sin(t * 3 + i) * 1.6, 0, 7);
      c.fill();
    });
    // signals travelling along the connections
    for (let s = 0; s < 3; s++) {
      const e = edges[(Math.floor(t * 2 + s * 7) * 5) % edges.length];
      const f = (t * 2 + s * 0.33) % 1;
      const a = pts[e[0]], b = pts[e[1]];
      c.fillStyle = "#ffffff";
      c.beginPath();
      c.arc(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, 5, 0, 7);
      c.fill();
    }
  } else if (kind === 2) {
    c.font = "18px monospace";
    const off = Math.floor(t * 4);
    for (let r = 0; r < 9; r++) {
      const rr = seeded(1000 + r + off + variant * 77);
      let line = "";
      for (let k = 0; k < 26; k++) line += rr() > 0.5 ? "1" : "0";
      c.fillStyle = r % 4 === (variant ? 2 : 1) ? "#facc15" : "#86efac";
      c.fillText(line, 24, 84 + r * 22);
    }
    const p = (t * 0.09 + variant * 0.4) % 1;
    c.fillStyle = "rgba(255,255,255,0.15)";
    c.fillRect(24, 296, 464, 16);
    c.fillStyle = "#4ade80";
    c.fillRect(24, 296, 464 * p, 16);
    c.fillStyle = "#e7f8e8";
    c.font = "600 16px Arial";
    c.fillText(`TRAINING ${(p * 100).toFixed(0)}%`, 24, 288);
  } else if (kind === 3) {
    c.save();
    c.translate(256, 205);
    for (let r = 1; r <= 4; r++) {
      c.strokeStyle = `rgba(74,222,128,${0.2 + r * 0.12})`;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, r * 36, 0, 7);
      c.stroke();
    }
    const ang = (t * 2.2 + variant) % (Math.PI * 2);
    const sw = c.createLinearGradient(0, 0, Math.cos(ang) * 150, Math.sin(ang) * 150);
    sw.addColorStop(0, "rgba(250,204,21,0.9)");
    sw.addColorStop(1, "rgba(250,204,21,0)");
    c.strokeStyle = sw;
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(Math.cos(ang) * 150, Math.sin(ang) * 150);
    c.stroke();
    for (let i = 0; i < 9; i++) {
      const bx = (rnd() - 0.5) * 250, by = (rnd() - 0.5) * 150;
      const da = (((Math.atan2(by, bx) - ang) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      c.fillStyle = `rgba(217,249,157,${Math.max(0.15, 1 - da / 3)})`;
      c.beginPath();
      c.arc(bx, by, 5, 0, 7);
      c.fill();
    }
    c.restore();
  } else if (kind === 4) {
    const pct = 0.9 + 0.09 * (Math.sin(t * 0.9 + variant * 2) * 0.5 + 0.5);
    c.lineWidth = 26;
    c.strokeStyle = "rgba(74,222,128,0.2)";
    c.beginPath();
    c.arc(256, 195, 82, 0, 7);
    c.stroke();
    c.strokeStyle = variant ? "#facc15" : "#4ade80";
    c.lineCap = "round";
    c.beginPath();
    c.arc(256, 195, 82, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
    c.stroke();
    c.lineCap = "butt";
    c.fillStyle = "#ffffff";
    c.font = "700 50px Arial";
    c.textAlign = "center";
    c.fillText((pct * 100).toFixed(1) + "%", 256, 212);
    c.textAlign = "left";
    c.strokeStyle = "#bef264";
    c.lineWidth = 2.5;
    c.beginPath();
    for (let i = 0; i <= 30; i++) {
      const x = 40 + i * 14.5, y = 312 - (Math.sin(i * 0.4 + t * 2) * 0.5 + 0.5) * 18;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.stroke();
  } else {
    const labels = ["Chatbot", "RAG Search", "Agents", "Auto-reply"];
    labels.forEach((label, i) => {
      const phase = t * 0.8 + i * 0.9 + variant;
      const on = Math.sin(phase) > -0.2;
      const k = ease(clamp01(Math.sin(phase) * 2.2 + 0.5));
      c.fillStyle = "#e7f8e8";
      c.font = "26px Arial";
      c.fillText(label, 28, 108 + i * 52);
      c.fillStyle = on ? "#16a34a" : "rgba(255,255,255,0.18)";
      c.beginPath();
      c.roundRect(390, 84 + i * 52, 88, 38, 19);
      c.fill();
      c.fillStyle = on ? "#facc15" : "#9aa8a0";
      c.beginPath();
      c.arc(409 + 50 * k, 103 + i * 52, 14, 0, 7);
      c.fill();
    });
    c.fillStyle = "#bef264";
    c.font = "600 16px Arial";
    c.fillText("Processing" + ".".repeat(1 + (Math.floor(t * 3) % 3)), 28, 318);
  }
}

/** Renders the interface, sliding to its next page every few seconds (no interaction needed). */
function renderInterface(c: CanvasRenderingContext2D, kind: number, i: number, t: number) {
  const cyc = t / 7 + i * 0.31;
  const idx = Math.floor(cyc);
  const ph = cyc - idx;
  const k = ph > 0.92 ? ease((ph - 0.92) / 0.08) : 0;
  c.clearRect(0, 0, PW, PH);
  c.save();
  c.translate(-PW * k, 0);
  drawPage(c, kind, idx % 2, t);
  c.restore();
  if (k > 0) {
    c.save();
    c.translate(PW * (1 - k), 0);
    drawPage(c, kind, (idx + 1) % 2, t);
    c.restore();
  }
}

// stage coordinates (robot stands at x = -0.6): a symmetric arc of interfaces
const PANELS: { pos: [number, number, number]; w: number; kind: number; ry: number }[] = [
  { pos: [2.35, 2.95, 0.1], w: 1.6, kind: 0, ry: -0.5 },
  { pos: [-2.75, 2.45, 0.6], w: 1.75, kind: 4, ry: 0.45 },
  { pos: [1.25, 3.95, 0.1], w: 1.5, kind: 1, ry: -0.35 },
  { pos: [-2.45, 3.95, 0.2], w: 1.5, kind: 3, ry: 0.35 },
  { pos: [2.5, 1.2, 0.1], w: 1.4, kind: 5, ry: -0.5 },
  { pos: [-2.95, 1.1, 0.4], w: 1.4, kind: 2, ry: 0.5 },
];
const SEG = 14;
const DOWN = new THREE.Vector3(0, -1, 0);

/* ================================ glowing 3D "AI" held in the hand ================================ */

/** Extruded 3D "AI" lettering in glowing blue, turning slowly above the palm with pulsing glow rings. */
function AIText({ palette, mobile }: { palette: RobotPalette; mobile: boolean }) {
  const spin = useRef<THREE.Group>(null!);
  const halo = useRef<THREE.Mesh>(null!);
  const rings = useRef<THREE.Mesh[]>([]);
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(null);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0a2a9c", emissive: new THREE.Color("#1d4ed8"), emissiveIntensity: 0.6, metalness: 0.2, roughness: 0.35 }), []);
  const haloTex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const c = cv.getContext("2d")!;
    const g = c.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,0.85)");
    g.addColorStop(0.3, "rgba(120,170,255,0.45)");
    g.addColorStop(0.6, "rgba(40,90,255,0.18)");
    g.addColorStop(1, "rgba(40,120,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(cv);
  }, []);
  useEffect(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 200;
    const c = cv.getContext("2d")!;
    c.fillStyle = "#fff";
    c.font = "400 150px Arial, Helvetica, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("AI", 100, 108);
    const { shapes } = traceImageToShapes(cv, 200, 1);
    if (!shapes.length) return;
    const g = new THREE.ExtrudeGeometry(shapes, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.012, bevelSegments: 2, curveSegments: 2 });
    g.center();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- geometry is built from a canvas, client only
    setGeo(g);
  }, []);
  useFrame((_, dt) => {
    const t = palette.uTime.value;
    spin.current.rotation.y += Math.min(dt, 0.1) * 1.1;
    spin.current.position.y = Math.sin(t * 1.6) * 0.04;
    mat.emissiveIntensity = 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(t * 3));
    (halo.current.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.3 * Math.sin(t * 3);
    halo.current.scale.setScalar(2.1 + 0.25 * Math.sin(t * 3));
    rings.current.forEach((r, i) => {
      if (!r) return;
      const k = (t * 0.7 + i * 0.5) % 1;
      r.scale.setScalar(0.5 + k * 1.5);
      (r.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.7;
    });
  });
  return (
    <group>
      <mesh ref={halo}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={haloTex} transparent depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <group position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {[0, 1].map((i) => (
          <mesh key={i} ref={(m) => { if (m) rings.current[i] = m; }}>
            <torusGeometry args={[0.6, 0.015, 8, 56]} />
            <meshBasicMaterial color="#38bdf8" transparent toneMapped={false} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <group ref={spin}>{geo && (
          <group scale={1.3}>
            <mesh geometry={geo} material={mat} />
            <lineSegments>
              <edgesGeometry args={[geo, 25]} />
              <lineBasicMaterial color="#ffffff" toneMapped={false} />
            </lineSegments>
          </group>
        )}</group>
      <pointLight color="#3aa0ff" intensity={6} distance={4} />
      <Sparkles count={mobile ? 12 : 28} scale={[2.2, 2.2, 2.2]} size={mobile ? 4 : 5} speed={0.6} opacity={0.95} color="#38bdf8" noise={0.8} />
    </group>
  );
}

/* ================================ circular AI wave (mesh + particles) ================================ */

const dotTex = (() => {
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const c = cv.getContext("2d")!;
  const g = c.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.7)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
})();

/** A flowing wire-mesh band wrapped around the robot in a circle, studded with glowing particles. */
function AiWaveRing({ palette, R, H, y, tilt, x = -0.6, Nu = 120, Nv = 9, speed = 1 }: { palette: RobotPalette; R: number; H: number; y: number; tilt: number; x?: number; Nu?: number; Nv?: number; speed?: number }) {
  const grp = useRef<THREE.Group>(null!);
  const nodes = useMemo(() => new Float32Array(Nu * Nv * 3), [Nu, Nv]);
  const { seg, pts } = useMemo(() => {
    const seg = new THREE.BufferGeometry();
    seg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(Nu * Nv * 4 * 3), 3));
    seg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);
    const pts = new THREE.BufferGeometry();
    pts.setAttribute("position", new THREE.BufferAttribute(nodes, 3));
    const col = new Float32Array(Nu * Nv * 3);
    const palette4 = ["#22d3ee", "#3b82f6", "#ffffff", "#22d3ee", "#60a5fa", "#4ade80", "#facc15"];
    const c = new THREE.Color();
    for (let i = 0; i < Nu * Nv; i++) {
      const r = Math.random();
      c.set(palette4[r < 0.9 ? Math.floor(Math.random() * 5) : 5 + Math.floor(Math.random() * 2)]);
      col.set([c.r, c.g, c.b], i * 3);
    }
    pts.setAttribute("color", new THREE.BufferAttribute(col, 3));
    pts.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);
    return { seg, pts };
  }, [Nu, Nv, nodes]);

  useFrame((_, dt) => {
    const t = palette.uTime.value * speed;
    grp.current.rotation.y += Math.min(dt, 0.1) * 0.12 * speed;
    for (let v = 0; v < Nv; v++) {
      const vv = v / (Nv - 1) - 0.5;
      for (let u = 0; u < Nu; u++) {
        const th = (u / Nu) * Math.PI * 2;
        const w = Math.sin(3 * th + t * 1.1 + vv * 3) * 0.3 + Math.sin(5 * th - t * 0.8) * 0.14;
        const r = R + w * (1 - Math.abs(vv) * 0.5);
        const i = (v * Nu + u) * 3;
        nodes[i] = Math.cos(th) * r;
        nodes[i + 1] = y + vv * H * (1 + 0.35 * Math.sin(2 * th + t)) + Math.sin(2 * th + t * 0.9) * 0.34 + Math.sin(4 * th - t * 1.3) * 0.12;
        nodes[i + 2] = Math.sin(th) * r * 0.82;
      }
    }
    const sp = seg.attributes.position.array as Float32Array;
    let o = 0;
    const put = (a: number, b: number) => {
      sp[o++] = nodes[a]; sp[o++] = nodes[a + 1]; sp[o++] = nodes[a + 2];
      sp[o++] = nodes[b]; sp[o++] = nodes[b + 1]; sp[o++] = nodes[b + 2];
    };
    for (let v = 0; v < Nv; v++)
      for (let u = 0; u < Nu; u++) {
        const a = (v * Nu + u) * 3;
        put(a, (v * Nu + ((u + 1) % Nu)) * 3);
        if (v < Nv - 1) put(a, ((v + 1) * Nu + u) * 3);
        else put(a, a);
      }
    seg.attributes.position.needsUpdate = true;
    pts.attributes.position.needsUpdate = true;
  });

  return (
    <group position={[x, 0, 0]} rotation={[tilt, 0, tilt * 0.4]}>
      <group ref={grp}>
        <lineSegments geometry={seg} frustumCulled={false}>
          <lineBasicMaterial color="#2f6bff" transparent opacity={0.3} depthWrite={false} />
        </lineSegments>
        <points geometry={pts} frustumCulled={false}>
          <pointsMaterial size={0.13} sizeAttenuation vertexColors transparent depthWrite={false} map={dotTex ?? undefined} alphaTest={0.02} opacity={0.95} />
        </points>
      </group>
    </group>
  );
}

/* ======================================== shaders ======================================== */

const STREAM_V = /* glsl */ `
uniform float uTime;
attribute float aT; attribute float aR;
varying float vT; varying float vP;
void main(){
  vT = aT;
  vP = fract(uTime * 0.4 + aR * 3.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const STREAM_F = /* glsl */ `
varying float vT; varying float vP;
void main(){
  float pulse = smoothstep(0.2, 0.0, abs(vT - vP));
  vec3 col = mix(vec3(0.09, 0.64, 0.29), vec3(0.98, 0.8, 0.08), pulse);
  gl_FragColor = vec4(col, 0.26 + pulse * 0.7);
}`;

/** Two-bone IK: shoulder S, wrist target T, arm lengths L1/L2, elbow bends towards `pole`. */
function solveArm(S: THREE.Vector3, T: THREE.Vector3, pole: THREE.Vector3, L1: number, L2: number, E: THREE.Vector3, W: THREE.Vector3, tmp: THREE.Vector3, tmp2: THREE.Vector3) {
  const dir = tmp.copy(T).sub(S);
  let dist = dir.length();
  dir.normalize();
  dist = THREE.MathUtils.clamp(dist, 0.2, L1 + L2 - 0.003);
  W.copy(S).addScaledVector(dir, dist);
  const a = Math.acos(THREE.MathUtils.clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1));
  const b = tmp2.copy(pole).addScaledVector(dir, -pole.dot(dir)).normalize();
  E.copy(S).addScaledVector(dir, Math.cos(a) * L1).addScaledVector(b, Math.sin(a) * L1);
}

/**
 * Netkathir AI assistant: glossy ceramic robot, glass visor, the 3D Netkathir emblem on its chest, a rotating
 * blue wireframe AI brain held in its hand, ringed by a circular AI data wave and living holographic interfaces.
 */
export default function AICore({ palette, mobile }: { palette: RobotPalette; mobile: boolean }) {
  const stage = useRef<THREE.Group>(null!);
  const robot = useRef<THREE.Group>(null!);
  const torso = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const eyes = useRef<THREE.Group>(null!);
  const antenna = useRef<THREE.Mesh>(null!);
  const upP = useRef<THREE.Group>(null!);
  const foP = useRef<THREE.Group>(null!);
  const upR = useRef<THREE.Group>(null!);
  const foR = useRef<THREE.Group>(null!);
  const brain = useRef<THREE.Group>(null!);
  const panels = useRef<THREE.Group[]>([]);
  const shots = useRef<THREE.MeshBasicMaterial[]>([]);
  const mouse = useRef({ x: 0, y: 0 });
  const scroll = useRef(0);
  const K = useMemo(() => ({ S: new THREE.Vector3(), E: new THREE.Vector3(), W: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), pole: new THREE.Vector3(), t: new THREE.Vector3(), u: new THREE.Vector3(), bp: new THREE.Vector3() }), []);
  const count = mobile ? 3 : PANELS.length;

  useEffect(() => {
    const f = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", f, { passive: true });
    return () => window.removeEventListener("mousemove", f);
  }, []);

  // ---- real 3D Netkathir emblem traced from the icon: exact brand colours, unlit so lighting can't wash it out
  const [logoGeo, setLogoGeo] = useState<THREE.BufferGeometry | null>(null);
  const logoMat = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }), []);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      try {
        const { shapes, sample } = traceImageToShapes(img, 200, 1);
        if (!shapes.length) return;
        const geo = new THREE.ExtrudeGeometry(shapes, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.008, bevelSegments: 2, curveSegments: 1 });
        const pos = geo.attributes.position;
        const nor = geo.attributes.normal;
        const col = new Float32Array(pos.count * 3);
        const c = new THREE.Color();
        for (let i = 0; i < pos.count; i++) {
          const [r, g, b] = sample(pos.getX(i), pos.getY(i));
          c.setRGB(r, g, b, THREE.SRGBColorSpace); // sRGB -> linear so the colour matches the brand exactly
          const side = 0.62 + 0.38 * Math.min(1, Math.abs(nor.getZ(i)) * 1.6); // faces full colour, sides a touch deeper (reads as depth)
          col[i * 3] = c.r * side;
          col[i * 3 + 1] = c.g * side;
          col[i * 3 + 2] = c.b * side;
        }
        geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
        geo.center();
        setLogoGeo(geo);
      } catch (err) {
        console.warn("[AICore] 3D logo trace failed", err);
      }
    };
    img.src = "/images/brand/netkathir-icon.png";
  }, []);

  const M = useMemo(() => {
    const ceramic = new THREE.MeshPhysicalMaterial({ color: "#f5f7f6", roughness: 0.2, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.15 });
    const ceramic2 = new THREE.MeshPhysicalMaterial({ color: "#e4ebe7", roughness: 0.26, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.12, envMapIntensity: 1.1 });
    const dark = new THREE.MeshPhysicalMaterial({ color: "#1b2420", roughness: 0.38, metalness: 0.85, clearcoat: 0.4, envMapIntensity: 1.15 });
    const glass = new THREE.MeshPhysicalMaterial({ color: "#050808", roughness: 0.04, metalness: 0.7, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.9 });
    const gold = new THREE.MeshPhysicalMaterial({ color: "#f2c230", roughness: 0.22, metalness: 1, clearcoat: 0.4, envMapIntensity: 1.5 });
    const led = new THREE.MeshBasicMaterial({ color: "#7dffb2", toneMapped: false });
    const ledY = new THREE.MeshBasicMaterial({ color: "#fde047", toneMapped: false });
    return { ceramic, ceramic2, dark, glass, gold, led, ledY };
  }, []);

  const G = useMemo(
    () => ({
      sph: new THREE.SphereGeometry(1, 40, 32),
      cap: (r: number, l: number) => new THREE.CapsuleGeometry(r, l, 8, 24),
      ring: (r: number, t: number, arc = Math.PI * 2) => new THREE.TorusGeometry(r, t, 14, 56, arc),
    }),
    []
  );

  // ---- live interface canvases (redrawn ~10x/s while visible)
  const live = useMemo(
    () =>
      PANELS.map((p, i) => {
        const cv = document.createElement("canvas");
        cv.width = PW;
        cv.height = PH;
        const ctx = cv.getContext("2d")!;
        const tex = new THREE.CanvasTexture(cv);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        renderInterface(ctx, p.kind, i, i * 0.9);
        return { ctx, tex, last: -1 };
      }),
    []
  );

  const stageShadow = useMemo(
    () => ({
      v: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      f: "varying vec2 vUv; void main(){ float d = length(vUv-0.5)*2.0; float a = smoothstep(1.0,0.0,d); gl_FragColor = vec4(0.02,0.25,0.12, a*a*0.42); }",
    }),
    []
  );
  const streamGeo = useMemo(() => {
    const n = PANELS.length * SEG * 2;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const aT = new Float32Array(n);
    const aR = new Float32Array(n);
    for (let i = 0; i < PANELS.length; i++)
      for (let k = 0; k < SEG; k++)
        for (let e = 0; e < 2; e++) {
          const idx = (i * SEG + k) * 2 + e;
          aT[idx] = (k + e) / SEG;
          aR[idx] = (i * 0.37) % 1;
        }
    g.setAttribute("aT", new THREE.BufferAttribute(aT, 1));
    g.setAttribute("aR", new THREE.BufferAttribute(aR, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50);
    return g;
  }, []);
  const streamU = useMemo(() => ({ uTime: palette.uTime }), [palette]);

  useFrame((s, dt) => {
    const d = Math.min(dt, 0.25);
    const t = palette.uTime.value;
    scroll.current = THREE.MathUtils.damp(scroll.current, clamp01(window.scrollY / (window.innerHeight * 1.05)), 5, d);
    const sc = scroll.current;
    const e = ease(sc);
    void s;
    const visible = mobile ? 3 : 3 + Math.min(3, Math.floor(sc * 3.2));

    // ---- body: hover, breathing, turns with the cursor (and a little with scroll)
    robot.current.rotation.y = THREE.MathUtils.damp(robot.current.rotation.y, -0.05 + e * 0.3 + mouse.current.x * 0.75, 3.2, d);
    robot.current.rotation.x = THREE.MathUtils.damp(robot.current.rotation.x, -mouse.current.y * 0.07, 3.2, d);
    robot.current.position.y = Math.sin(t * 1.6) * 0.04;
    torso.current.scale.set(1, 1 + Math.sin(t * 1.7) * 0.01, 1 + Math.sin(t * 1.7) * 0.012);
    antenna.current.rotation.z = 0.28 + Math.sin(t * 2.1) * 0.06;
    robot.current.updateWorldMatrix(true, true);

    // ---- right arm holds the brain out in an open hand; left arm rests
    const bob = Math.sin(t * 1.4) * 0.04;
    for (let a = 0; a < 2; a++) {
      const side = a === 0 ? 1 : -1;
      const S = K.S.set(side * 0.98, 2.55, 0);
      const pole = K.pole.set(side * 0.5, -0.9, -0.35);
      const wrist = a === 0 ? K.t.set(1.0, 1.95 + bob, 0.92) : K.t.set(-1.0 + Math.sin(t * 1.1) * 0.03, 1.72 + Math.sin(t * 1.3) * 0.03, 0.3);
      solveArm(S, wrist, pole, 0.62, 0.62, K.E, K.W, K.a, K.b);
      const up = (a === 0 ? upP : upR).current;
      const fo = (a === 0 ? foP : foR).current;
      up.position.copy(S);
      up.quaternion.setFromUnitVectors(DOWN, K.a.copy(K.E).sub(S).normalize());
      fo.position.copy(K.E);
      fo.quaternion.setFromUnitVectors(DOWN, K.a.copy(K.W).sub(K.E).normalize());
      if (a === 0) {
        // the brain floats just above the open palm
        const u = K.u.copy(K.W).sub(K.E).normalize();
        K.bp.copy(K.W).addScaledVector(u, 0.16);
        K.bp.y += 0.72 + Math.sin(t * 1.8) * 0.05;
        K.bp.z += 0.12;
        brain.current.position.copy(K.bp);
      }
    }

    // ---- head follows the brain, then the cursor
    const bp = K.bp;
    const hy = THREE.MathUtils.clamp(Math.atan2(bp.x, bp.z + 0.5) * 0.4, -0.45, 0.45) + mouse.current.x * 0.32;
    const hx = THREE.MathUtils.clamp(-Math.atan2(bp.y - 3.4, Math.hypot(bp.x, bp.z)) * 0.5, -0.3, 0.3) - mouse.current.y * 0.22;
    head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, hy, 6, d);
    head.current.rotation.x = THREE.MathUtils.damp(head.current.rotation.x, hx, 6, d);
    const b = Math.max(0, Math.sin(t * 1.3 + 0.7) * 18 - 17);
    eyes.current.scale.y = THREE.MathUtils.clamp(1 - Math.min(b, 1) * 0.9, 0.1, 1);

    // ---- interfaces: float, fan out with scroll, and run their own live content + page transitions
    PANELS.slice(0, count).forEach((p, i) => {
      const g = panels.current[i];
      if (!g) return;
      const appear = i < 3 || mobile ? 1 : ease(clamp01((sc - (i - 3) * 0.2) / 0.3 + 0.05));
      const spread = mobile ? 0.72 : 1 + e * 0.1;
      const ox = mobile ? 0.6 : 0;
      g.position.set(p.pos[0] * spread + ox, p.pos[1] + Math.sin(t * 1.2 + i * 1.3) * 0.07, p.pos[2]);
      g.rotation.y = p.ry + Math.sin(t * 0.5 + i) * 0.03;
      g.scale.setScalar(0.2 + 0.8 * appear);
      g.visible = appear > 0.01 && i < visible;
      const m = shots.current[i];
      if (m) m.opacity = appear;
      const L = live[i];
      if (g.visible && t - L.last > 0.1) {
        L.last = t;
        renderInterface(L.ctx, p.kind, i, t);
        L.tex.needsUpdate = true;
      }
    });

    // ---- data streams from the chest into every active interface
    const sp = streamGeo.attributes.position.array as Float32Array;
    const c0x = -0.6, c0y = 2.3, c0z = 0.8;
    let vi = 0;
    for (let i = 0; i < PANELS.length; i++) {
      const g = panels.current[i];
      const on = !!g && i < count && g.visible && g.scale.x > 0.55;
      const w = PANELS[i].w;
      const p2x = on ? g.position.x + (g.position.x > c0x ? -1 : 1) * w * 0.46 : c0x;
      const p2y = on ? g.position.y : c0y;
      const p2z = on ? g.position.z : c0z;
      const mx = (c0x + p2x) / 2, my = Math.max(c0y, p2y) + 0.55, mz = Math.max(c0z, p2z) + 0.55;
      for (let k = 0; k < SEG; k++)
        for (let e2 = 0; e2 < 2; e2++) {
          const tt = on ? (k + e2) / SEG : 0;
          const u = 1 - tt;
          sp[vi++] = u * u * c0x + 2 * u * tt * mx + tt * tt * p2x;
          sp[vi++] = u * u * c0y + 2 * u * tt * my + tt * tt * p2y;
          sp[vi++] = u * u * c0z + 2 * u * tt * mz + tt * tt * p2z;
        }
    }
    streamGeo.attributes.position.needsUpdate = true; // (streams are no longer drawn)
  });

  return (
    <group ref={stage} position={[0, -2.35, 0]} scale={0.9}>
      {/* floor: soft contact shadow */}
      <mesh position={[mobile ? 0 : -0.6, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.2, 48]} />
        <shaderMaterial transparent depthWrite={false} vertexShader={stageShadow.v} fragmentShader={stageShadow.f} />
      </mesh>

      {/* ================================ ROBOT ================================ */}
      <group ref={robot} position={[mobile ? 0 : -0.6, 0, 0]}>
        {/* boots + legs */}
        {[-1, 1].map((sd) => (
          <group key={sd} position={[sd * 0.4, 0, 0.02]}>
            <mesh geometry={G.sph} material={M.ceramic} scale={[0.32, 0.23, 0.46]} position={[0, 0.23, 0.08]} />
            <mesh geometry={G.sph} material={M.dark} scale={[0.325, 0.07, 0.47]} position={[0, 0.06, 0.08]} />
            <mesh geometry={G.ring(0.2, 0.03)} material={M.gold} position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} />
            <mesh geometry={G.cap(0.13, 0.4)} material={M.ceramic} position={[0, 0.78, 0]} />
            <mesh geometry={G.sph} material={M.dark} scale={0.17} position={[0, 1.07, 0]} />
            <mesh geometry={G.cap(0.16, 0.26)} material={M.ceramic} position={[0, 1.3, 0]} />
          </group>
        ))}
        {/* belly */}
        <mesh geometry={G.sph} material={M.ceramic} scale={[0.66, 0.46, 0.52]} position={[0, 1.65, 0]} />
        <mesh geometry={G.ring(0.6, 0.035)} material={M.dark} position={[0, 1.82, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.8, 1]} />

        <group ref={torso}>
          {/* chest + the 3D Netkathir emblem (no plate, no glow) */}
          <mesh geometry={G.sph} material={M.ceramic} scale={[0.9, 0.86, 0.68]} position={[0, 2.28, 0]} />
          {logoGeo && <mesh geometry={logoGeo} material={logoMat} position={[0, 2.3, 0.715]} rotation={[-0.08, 0, 0]} scale={0.72} />}
          <mesh geometry={G.sph} material={M.ceramic2} scale={[0.5, 0.12, 0.42]} position={[0, 2.9, 0]} />
          {/* neck + shoulders */}
          <mesh position={[0, 3.0, 0]} material={M.dark}>
            <cylinderGeometry args={[0.16, 0.2, 0.22, 24]} />
          </mesh>
          {[-1, 1].map((sd) => (
            <group key={sd} position={[sd * 0.98, 2.55, 0]}>
              <mesh geometry={G.sph} material={M.dark} scale={0.19} />
              <mesh geometry={G.sph} material={M.ceramic} scale={[0.25, 0.2, 0.24]} position={[sd * 0.04, 0.08, 0]} />
              <mesh geometry={G.ring(0.2, 0.014)} material={M.ledY} position={[sd * 0.04, 0.04, 0]} rotation={[0, Math.PI / 2, 0]} />
            </group>
          ))}

          {/* ---- holding arm (screen right): open cupped hand under the brain ---- */}
          <group ref={upP}>
            <mesh geometry={G.cap(0.105, 0.42)} material={M.ceramic} position={[0, -0.31, 0]} />
            <mesh geometry={G.ring(0.11, 0.012)} material={M.dark} position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]} />
          </group>
          <group ref={foP}>
            <mesh geometry={G.sph} material={M.dark} scale={0.115} />
            <mesh geometry={G.cap(0.088, 0.38)} material={M.ceramic} position={[0, -0.31, 0]} />
            <mesh geometry={G.ring(0.092, 0.01)} material={M.led} position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]} />
            <group position={[0, -0.62, 0]}>
              <mesh geometry={G.ring(0.075, 0.016)} material={M.dark} rotation={[Math.PI / 2, 0, 0]} />
              <mesh geometry={G.sph} material={M.ceramic} scale={[0.125, 0.105, 0.05]} position={[0, -0.1, 0]} />
              {[-0.075, -0.027, 0.027, 0.075].map((x, i) => (
                <group key={i} position={[x, -0.18, 0.01]} rotation={[-0.55, 0, 0]}>
                  <mesh geometry={G.cap(0.027, 0.07)} material={M.ceramic} position={[0, -0.06, 0]} />
                  <group position={[0, -0.13, 0]} rotation={[-0.7, 0, 0]}>
                    <mesh geometry={G.cap(0.023, 0.05)} material={M.ceramic2} position={[0, -0.045, 0]} />
                  </group>
                </group>
              ))}
              <group position={[-0.14, -0.09, 0.02]} rotation={[0, 0, 0.9]}>
                <mesh geometry={G.cap(0.03, 0.07)} material={M.ceramic} position={[0, -0.05, 0]} />
              </group>
            </group>
          </group>

          {/* ---- resting arm (screen left) ---- */}
          <group ref={upR}>
            <mesh geometry={G.cap(0.105, 0.42)} material={M.ceramic} position={[0, -0.31, 0]} />
            <mesh geometry={G.ring(0.11, 0.012)} material={M.dark} position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]} />
          </group>
          <group ref={foR}>
            <mesh geometry={G.sph} material={M.dark} scale={0.115} />
            <mesh geometry={G.cap(0.088, 0.38)} material={M.ceramic} position={[0, -0.31, 0]} />
            <mesh geometry={G.ring(0.092, 0.01)} material={M.ledY} position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]} />
            <group position={[0, -0.62, 0]}>
              <mesh geometry={G.ring(0.075, 0.016)} material={M.dark} rotation={[Math.PI / 2, 0, 0]} />
              <mesh geometry={G.sph} material={M.ceramic} scale={[0.115, 0.125, 0.105]} position={[0, -0.12, 0]} />
              {[-0.06, -0.02, 0.02, 0.06].map((x, i) => (
                <mesh key={i} geometry={G.sph} material={M.ceramic2} scale={0.04} position={[x, -0.2, 0.06]} />
              ))}
            </group>
          </group>

          {/* the brain, rotating above the open hand */}
          <group ref={brain} scale={0.64}>
            <AIText palette={palette} mobile={mobile} />
          </group>

          {/* ---- head ---- */}
          <group ref={head} position={[0, 3.78, 0]}>
            <mesh geometry={G.sph} material={M.ceramic} scale={[1.22, 1.0, 1.06]} />
            <mesh geometry={G.ring(0.98, 0.012)} material={M.dark} position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.17, 1, 1]} />
            <mesh geometry={G.sph} material={M.dark} scale={[0.97, 0.7, 0.4]} position={[0, -0.04, 0.76]} />
            <mesh geometry={G.sph} material={M.glass} scale={[0.92, 0.65, 0.42]} position={[0, -0.04, 0.78]} />
            <group ref={eyes}>
              {[-1, 1].map((sd) => (
                <mesh key={sd} geometry={G.ring(0.15, 0.034, Math.PI)} material={M.led} position={[sd * 0.32, -0.02, 1.185]} rotation={[0, sd * 0.28, 0]} />
              ))}
            </group>
            {[-1, 1].map((sd) => (
              <mesh key={sd} geometry={G.sph} material={M.ledY} scale={0.03} position={[sd * 0.62, -0.28, 1.05]} />
            ))}
            {[-1, 1].map((sd) => (
              <group key={sd} position={[sd * 1.2, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
                <mesh material={M.ceramic}>
                  <cylinderGeometry args={[0.31, 0.31, 0.26, 40]} />
                </mesh>
                <mesh position={[0, sd * 0.14, 0]} material={M.dark}>
                  <cylinderGeometry args={[0.22, 0.22, 0.04, 40]} />
                </mesh>
                <mesh position={[0, sd * 0.17, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}>
                  <torusGeometry args={[0.15, 0.022, 12, 40]} />
                </mesh>
              </group>
            ))}
            <mesh ref={antenna} position={[-0.62, 1.05, 0.1]} rotation={[0, 0, 0.28]} material={M.dark}>
              <cylinderGeometry args={[0.02, 0.03, 0.55, 12]} />
              <mesh position={[0, 0.3, 0]} material={M.ledY}>
                <sphereGeometry args={[0.06, 20, 20]} />
              </mesh>
            </mesh>
          </group>
        </group>
      </group>

      {/* ============================ LIVE HOLOGRAPHIC UI ============================ */}
      {PANELS.slice(0, count).map((p, i) => (
        <group
          key={i}
          ref={(g) => {
            if (g) panels.current[i] = g;
          }}
          position={p.pos}
        >
          <mesh>
            <planeGeometry args={[p.w, p.w * 0.664]} />
            <meshBasicMaterial
              ref={(m) => {
                if (m) shots.current[i] = m;
              }}
              map={live[i].tex}
              transparent
              side={THREE.DoubleSide}
              toneMapped={false}
              depthWrite={false}
            />
          </mesh>
          <RoundedBox args={[p.w + 0.05, p.w * 0.664 + 0.05, 0.012]} radius={0.03} position={[0, 0, -0.012]}>
            <meshBasicMaterial color="#4ade80" transparent opacity={0.35} toneMapped={false} />
          </RoundedBox>
        </group>
      ))}


      {/* circular AI data wave wrapped around the robot */}
      <AiWaveRing palette={palette} R={mobile ? 2.7 : 3.6} H={0.95} y={1.7} tilt={0.22} x={mobile ? 0 : -0.6} Nu={mobile ? 60 : 96} Nv={6} />
      {!mobile && <AiWaveRing palette={palette} R={2.9} H={0.6} y={3.7} tilt={-0.2} Nu={80} Nv={5} speed={1.3} />}

      <Sparkles count={mobile ? 18 : 40} scale={mobile ? [4.2, 4.2, 2] : [7, 6, 3]} position={[mobile ? 0 : 1.2, 2.2, 0]} size={mobile ? 3 : 4} speed={0.3} opacity={0.75} color="#16a34a" noise={0.6} />
    </group>
  );
}
