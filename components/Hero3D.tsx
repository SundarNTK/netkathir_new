/* eslint-disable react-hooks/immutability -- imperative three.js animation: values are mutated per frame by design */
"use client";

import { useFrame } from "@react-three/fiber";
import { ContactShadows, Edges, RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { WORLD_DOTS } from "@/lib/worldDots";
export type RobotPalette = {
  uTime: { value: number };
  uA: { value: THREE.Color };
  uB: { value: THREE.Color };
  uC: { value: THREE.Color };
};

/** Scales a hero object in/out as the route changes, and hides it when it is gone. */
export function Presence({ active, children }: { active: boolean; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  const [mounted, setMounted] = useState(active);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount the scene object when its route becomes active
    if (active) setMounted(true);
  }, [active]);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const d = Math.min(dt, 0.25);
    const s = THREE.MathUtils.damp(g.scale.x, active ? 1 : 0, 6, d);
    g.scale.setScalar(Math.max(s, 0.0001));
    g.visible = s > 0.01;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, active ? 0 : 1.4, 5, d);
    if (!active && s < 0.012 && mounted) setMounted(false); // unmount: frees its textures, geometry and per-frame work
  });
  return (
    <group ref={ref} scale={0.0001}>
      {mounted && children}
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

  useFrame(() => {
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

  useFrame(() => {
    const t = palette.uTime.value;
    glow.color.copy(palette.uA.value).lerp(new THREE.Color("#eab308"), 0.4);
    if (dotMat.current) dotMat.current.color.copy(palette.uA.value);
    spin.current.rotation.y = -(CITIES[0].lon * Math.PI) / 180 + t * 0.12 + mouse.current.x * 0.4;
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
        {CITIES.map((c) => (
          <mesh key={c.n} position={ll(c.lat, c.lon, R + 0.02)} material={glow}>
            <sphereGeometry args={[c.n === "India" ? 0.09 : 0.06, 16, 16]} />
          </mesh>
        ))}
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

  useFrame(() => {
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
  useFrame((_, dt) => {
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

  useFrame(() => {
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

  useFrame(() => {
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

  useFrame(() => {
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


/* ------------------------- services: four disciplines (Services page) ------------------------- */

function labelTexture(text: string, accent: string) {
  return canvasTex(512, 112, (c) => {
    c.fillStyle = "rgba(255,255,255,0.96)";
    c.beginPath();
    c.roundRect(4, 8, 504, 96, 48);
    c.fill();
    c.strokeStyle = accent;
    c.lineWidth = 4;
    c.stroke();
    c.fillStyle = "#14532d";
    c.font = "700 44px Arial";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(text, 256, 60);
  });
}

const MODULES = [
  { name: "AI & GenAI", x: -2.4, z: -0.8, y: 0.35, accent: "#22a559" },
  { name: "Enterprise Software", x: 0.8, z: -0.8, y: 0.35, accent: "#16a34a" },
  { name: "Cloud & DevOps", x: -0.8, z: 0.8, y: -0.35, accent: "#eab308" },
  { name: "Digital Transformation", x: 2.4, z: 0.8, y: -0.35, accent: "#15803d" },
];

/** Polished platform every module stands on: dark glass disc, glowing edge ring, name plate on the front lip. */
function Pedestal({ label, accent, idx, rings }: { label: THREE.Texture; accent: string; idx: number; rings: { current: (THREE.MeshBasicMaterial | null)[] } }) {
  return (
    <group>
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.7, 0.74, 0.1, 64]} />
        <meshPhysicalMaterial color="#0d2a1a" metalness={0.85} roughness={0.2} clearcoat={1} clearcoatRoughness={0.05} envMapIntensity={1.4} />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.58, 0.61, 64]} />
        <meshBasicMaterial
          ref={(r) => {
            rings.current[idx] = r;
          }}
          color={accent} toneMapped={false} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, -0.04, 0.86]} rotation={[-0.2, 0, 0]}>
        <planeGeometry args={[1.3, 0.285]} />
        <meshBasicMaterial map={label} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Four studio-lit product renders — one per service discipline — each on its own pedestal, taking turns in the spotlight. */
export function ServicesScene({ palette }: { palette: RobotPalette }) {
  const root = useRef<THREE.Group>(null!);
  const mods = useRef<THREE.Group[]>([]);
  const rings = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const net = useRef<THREE.Group>(null!);
  const leds = useRef<THREE.Mesh[]>([]);
  const cloud = useRef<THREE.Group>(null!);
  const mouse = useMouse();
  const labels = useMemo(() => MODULES.map((m) => labelTexture(m.name, m.accent)), []);
  const screen = useMemo(() => dashboardTexture(), []);
  const m = useMemo(
    () => ({
      alu: new THREE.MeshPhysicalMaterial({ color: "#c9d2cf", metalness: 1, roughness: 0.22, envMapIntensity: 1.5 }),
      black: new THREE.MeshPhysicalMaterial({ color: "#0b0f0d", metalness: 0.6, roughness: 0.28, clearcoat: 1, envMapIntensity: 1.3 }),
      rack: new THREE.MeshPhysicalMaterial({ color: "#1a2420", metalness: 0.9, roughness: 0.3, envMapIntensity: 1.3 }),
      glass: new THREE.MeshPhysicalMaterial({ color: "#d9fbe5", metalness: 0, roughness: 0.04, clearcoat: 1, transparent: true, opacity: 0.32, envMapIntensity: 2 }),
      white: new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.3, clearcoat: 0.6, envMapIntensity: 1.1 }),
      brass: new THREE.MeshPhysicalMaterial({ color: "#f0c040", metalness: 0.75, roughness: 0.32, clearcoat: 0.5, envMapIntensity: 1.3 }),
      steel: new THREE.MeshPhysicalMaterial({ color: "#b4bfba", metalness: 0.8, roughness: 0.3, envMapIntensity: 1.3 }),
      ledG: new THREE.MeshBasicMaterial({ color: "#4ade80", toneMapped: false }),
      ledY: new THREE.MeshBasicMaterial({ color: "#facc15", toneMapped: false }),
    }),
    []
  );
  const graph = useMemo(() => {
    const nodes = Array.from({ length: 14 }, (_, i) => {
      const a = Math.acos(1 - (2 * (i + 0.5)) / 14);
      const b = Math.PI * (1 + Math.sqrt(5)) * i;
      return new THREE.Vector3(Math.sin(a) * Math.cos(b), Math.cos(a), Math.sin(a) * Math.sin(b)).multiplyScalar(0.32);
    });
    const pts: number[] = [];
    nodes.forEach((p, i) =>
      nodes.slice(i + 1).forEach((q) => {
        if (p.distanceTo(q) < 0.36) pts.push(p.x, p.y, p.z, q.x, q.y, q.z);
      })
    );
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return { lines: g, nodes };
  }, []);

  useFrame((_, dt) => {
    const t = palette.uTime.value;
    const d = Math.min(dt, 0.25);
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, -0.12 + mouse.current.x * 0.3, 4, d);
    root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, 0.22 - mouse.current.y * 0.1, 4, d);
    const active = Math.floor(t / 2.6) % 4;
    mods.current.forEach((g, i) => {
      if (!g) return;
      const on = i === active;
      g.position.y = THREE.MathUtils.damp(g.position.y, on ? 0.16 + Math.sin(t * 2) * 0.02 : 0.02, 5, d);
      const r = rings.current[i];
      if (r) r.opacity = THREE.MathUtils.damp(r.opacity, on ? 1 : 0.35, 6, d);
    });
    net.current.rotation.y = t * 0.5;
    leds.current.forEach((l, i) => {
      if (l) l.visible = Math.sin(t * 5 + i * 1.7) > -0.2;
    });
    cloud.current.position.y = 1.0 + Math.sin(t * 1.1) * 0.04;
  });


  return (
    <group ref={root} scale={0.95}>
      <ContactShadows position={[0, -0.12, 0.3]} opacity={0.4} scale={9} blur={2.4} far={2.2} color="#0b3b1f" resolution={512} frames={1} />

      {/* 1 — AI & GenAI: a glass sphere holding a living neural graph */}
      <group position={[MODULES[0].x, MODULES[0].y, MODULES[0].z]}>
        <Pedestal label={labels[0]} accent={MODULES[0].accent} idx={0} rings={rings} />
        <group
          ref={(g) => {
            if (g) mods.current[0] = g;
          }}
        >
          <group ref={net} position={[0, 0.62, 0]}>
            <lineSegments geometry={graph.lines}>
              <lineBasicMaterial color="#22c55e" transparent opacity={0.85} />
            </lineSegments>
            {graph.nodes.map((p, i) => (
              <mesh key={i} position={p} material={i % 4 === 0 ? m.ledY : m.ledG}>
                <sphereGeometry args={[i % 4 === 0 ? 0.038 : 0.026, 12, 12]} />
              </mesh>
            ))}
          </group>
          <mesh position={[0, 0.62, 0]} material={m.glass}>
            <sphereGeometry args={[0.5, 48, 48]} />
          </mesh>
          <mesh position={[0, 0.1, 0]} material={m.alu}>
            <cylinderGeometry args={[0.2, 0.28, 0.1, 32]} />
          </mesh>
        </group>
      </group>

      {/* 2 — Enterprise Software: a studio monitor showing a live dashboard */}
      <group position={[MODULES[1].x, MODULES[1].y, MODULES[1].z]}>
        <Pedestal label={labels[1]} accent={MODULES[1].accent} idx={1} rings={rings} />
        <group
          ref={(g) => {
            if (g) mods.current[1] = g;
          }}
        >
          <mesh position={[0, 0.07, 0.05]} material={m.alu}>
            <cylinderGeometry args={[0.3, 0.34, 0.05, 40]} />
          </mesh>
          <mesh position={[0, 0.34, 0]} material={m.alu}>
            <boxGeometry args={[0.06, 0.5, 0.05]} />
          </mesh>
          <group position={[0, 0.78, 0]} rotation={[0, 0.12, 0]}>
            <RoundedBox args={[1.2, 0.76, 0.06]} radius={0.04} smoothness={4} material={m.black} />
            <mesh position={[0, 0, 0.033]}>
              <planeGeometry args={[1.12, 0.68]} />
              <meshBasicMaterial map={screen} toneMapped={false} />
            </mesh>
          </group>
        </group>
      </group>

      {/* 3 — Cloud & DevOps: a server rack under a cloud */}
      <group position={[MODULES[2].x, MODULES[2].y, MODULES[2].z]}>
        <Pedestal label={labels[2]} accent={MODULES[2].accent} idx={2} rings={rings} />
        <group
          ref={(g) => {
            if (g) mods.current[2] = g;
          }}
        >
          {[0, 1, 2, 3].map((k) => (
            <group key={k} position={[0, 0.12 + k * 0.17, 0]}>
              <RoundedBox args={[0.78, 0.15, 0.5]} radius={0.015} smoothness={3} material={m.rack} />
              <mesh position={[-0.28, 0, 0.255]} material={m.steel}>
                <boxGeometry args={[0.2, 0.05, 0.005]} />
              </mesh>
              {[0, 1, 2].map((j) => (
                <mesh
                  key={j}
                  position={[0.1 + j * 0.1, 0, 0.256]}
                  material={(k + j) % 3 === 0 ? m.ledY : m.ledG}
                  ref={(l) => {
                    if (l) leds.current[k * 3 + j] = l;
                  }}
                >
                  <sphereGeometry args={[0.013, 10, 10]} />
                </mesh>
              ))}
            </group>
          ))}
          <group ref={cloud} position={[0, 1.0, 0]}>
            {[[-0.2, -0.02, 0.2], [0.02, 0.08, 0.27], [0.24, -0.02, 0.2], [0.02, -0.08, 0.22]].map((c, i) => (
              <mesh key={i} position={[c[0], c[1], 0]} material={m.white}>
                <sphereGeometry args={[c[2], 32, 32]} />
              </mesh>
            ))}
          </group>
        </group>
      </group>

      {/* 4 — Digital Transformation: meshing precision gears */}
      <group position={[MODULES[3].x, MODULES[3].y, MODULES[3].z]}>
        <Pedestal label={labels[3]} accent={MODULES[3].accent} idx={3} rings={rings} />
        <group
          position={[0, 0.5, 0]}
          rotation={[-0.35, 0, 0]}
          ref={(g) => {
            if (g) mods.current[3] = g;
          }}
        >
          <GearMesh r={0.4} teeth={12} speed={0.55} x={-0.28} y={0} mat={m.brass} />
          <GearMesh r={0.28} teeth={8} speed={-0.55 * (12 / 8)} x={0.32} y={-0.12} mat={m.steel} />
        </group>
      </group>
    </group>
  );
}

function GearMesh({ r, teeth, speed, x, y, mat }: { r: number; teeth: number; speed: number; x: number; y: number; mat: THREE.Material }) {
  const g = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    g.current.rotation.z += Math.min(dt, 0.1) * speed;
  });
  return (
    <group ref={g} position={[x, y, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={mat}>
        <cylinderGeometry args={[r, r, 0.14, 48]} />
      </mesh>
      {Array.from({ length: teeth }).map((_, i) => {
        const a = (i / teeth) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * (r + 0.05), Math.sin(a) * (r + 0.05), 0]} rotation={[0, 0, a]} material={mat}>
            <boxGeometry args={[0.13, 0.1, 0.14]} />
          </mesh>
        );
      })}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r * 0.3, r * 0.3, 0.18, 24]} />
        <meshStandardMaterial color="#0b0f0d" metalness={0.8} roughness={0.35} />
      </mesh>
    </group>
  );
}
