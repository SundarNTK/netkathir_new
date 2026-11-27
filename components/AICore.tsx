/* eslint-disable react-hooks/immutability, react-hooks/purity -- imperative three.js animation: values are mutated per frame by design */
"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three-stdlib";
import { useLive } from "@/lib/live";
import { traceImageToShapes } from "@/lib/traceShape";
import type { RobotPalette } from "./Hero3D";

/* ============================ living holographic interfaces ============================ */

const TITLES = ["GARAGE BILL", "NETKATHIR · SERVICES", "HRMS", "NETKATHIR · 2015 — 2026", "OUR CLIENTS", "GLOBAL PRESENCE"];
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
  // frosted-glass window: pale blue glass, soft border, traffic-light dots, title bar
  const g = c.createLinearGradient(0, 0, PW, PH);
  g.addColorStop(0, "rgba(246,250,255,0.76)");
  g.addColorStop(1, "rgba(205,226,248,0.68)");
  c.fillStyle = g;
  c.beginPath();
  c.roundRect(0, 0, PW, PH, 26);
  c.fill();
  const sheen = c.createLinearGradient(0, 0, PW * 0.7, PH * 0.6);
  sheen.addColorStop(0, "rgba(255,255,255,0.55)");
  sheen.addColorStop(0.5, "rgba(255,255,255,0)");
  c.fillStyle = sheen;
  c.fill();
  const accent = variant ? "6,182,212" : "37,99,235";
  c.strokeStyle = "rgba(255,255,255,0.95)";
  c.lineWidth = 3;
  c.beginPath();
  c.roundRect(2, 2, PW - 4, PH - 4, 24);
  c.stroke();
  c.strokeStyle = `rgba(${accent},0.35)`;
  c.lineWidth = 1.5;
  c.beginPath();
  c.roundRect(5, 5, PW - 10, PH - 10, 22);
  c.stroke();
  ["#ff6b6b", "#fbbf24", "#34d399"].forEach((col, i) => {
    c.fillStyle = col;
    c.beginPath();
    c.arc(30 + i * 18, 30, 5.5, 0, 7);
    c.fill();
  });
  c.fillStyle = "#12306b";
  c.font = "700 20px Arial";
  c.textAlign = "left";
  c.fillText(TITLES[kind], 100, 37);
  c.fillStyle = `rgba(${accent},${0.55 + 0.45 * Math.sin(t * 4)})`;
  c.beginPath();
  c.arc(482, 30, 6, 0, 7);
  c.fill();
  c.strokeStyle = "rgba(37,99,235,0.2)";
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(22, 56);
  c.lineTo(490, 56);
  c.stroke();

  c.textBaseline = "alphabetic";
  const pill = (x: number, y: number, w: number, label: string, col: string, ink = "#ffffff") => {
    c.fillStyle = col;
    c.beginPath();
    c.roundRect(x, y, w, 24, 12);
    c.fill();
    c.fillStyle = ink;
    c.font = "700 14px Arial";
    c.textAlign = "center";
    c.fillText(label, x + w / 2, y + 17);
    c.textAlign = "left";
  };
  if (kind === 0) {
    // Garage Bill: live invoices
    const rows = [["INV-1042", "Toyota Innova", "₹8,450"], ["INV-1043", "Honda City", "₹3,200"], ["INV-1044", "Hyundai i20", "₹12,780"], ["INV-1045", "Maruti Swift", "₹5,640"]];
    const paid = Math.floor(t * 0.7 + variant) % 5;
    rows.forEach(([id, car, amt], i) => {
      const y = 70 + i * 48;
      c.fillStyle = "rgba(255,255,255,0.72)";
      c.beginPath();
      c.roundRect(20, y, 472, 40, 10);
      c.fill();
      c.fillStyle = "#1d4ed8";
      c.font = "600 15px monospace";
      c.fillText(id, 32, y + 25);
      c.fillStyle = "#1e3a5f";
      c.font = "600 18px Arial";
      c.fillText(car, 130, y + 26);
      c.font = "700 18px Arial";
      c.textAlign = "right";
      c.fillText(amt, 388, y + 26);
      c.textAlign = "left";
      const ok = i < paid;
      pill(400, y + 8, 80, ok ? "Paid" : "Pending", ok ? "#3b82f6" : "#f59e0b");
    });
    c.fillStyle = "rgba(29,78,216,0.8)";
    c.font = "600 15px Arial";
    c.fillText("Today", 24, 292);
    c.fillStyle = "#12306b";
    c.font = "700 30px Arial";
    c.fillText("₹" + (42300 + Math.floor(Math.sin(t) * 40 + 40) * 10).toLocaleString("en-IN"), 24, 322);
    c.fillStyle = "rgba(29,78,216,0.8)";
    c.font = "600 15px Arial";
    c.fillText("Job cards open: 12", 300, 322);
  } else if (kind === 1) {
    // Our services: four disciplines
    const areas = [["AI & GenAI", 7, "#3b82f6"], ["Enterprise Software", 6, "#f59e0b"], ["Cloud & DevOps", 2, "#38bdf8"], ["Digital Transformation", 4, "#22d3ee"]] as const;
    areas.forEach(([name, cnt, col], i) => {
      const y = 70 + i * 62;
      const on = Math.floor(t * 0.6 + variant) % 4 === i;
      c.fillStyle = on ? "rgba(245,158,11,0.16)" : "rgba(255,255,255,0.72)";
      c.beginPath();
      c.roundRect(20, y, 472, 54, 12);
      c.fill();
      c.fillStyle = col;
      c.beginPath();
      c.roundRect(32, y + 12, 30, 30, 8);
      c.fill();
      c.fillStyle = "#ffffff";
      c.font = "800 16px Arial";
      c.textAlign = "center";
      c.fillText("0" + (i + 1), 47, y + 33);
      c.textAlign = "left";
      c.fillStyle = "#1e3a5f";
      c.font = "700 21px Arial";
      c.fillText(name, 78, y + 34);
      c.fillStyle = on ? "#22d3ee" : "rgba(30,58,95,0.65)";
      c.font = "600 16px Arial";
      c.textAlign = "right";
      c.fillText(cnt + " services", 474, y + 33);
      c.textAlign = "left";
    });
    c.fillStyle = "rgba(29,78,216,0.85)";
    c.font = "600 15px Arial";
    c.fillText("20 capabilities · one team", 24, 328);
  } else if (kind === 2) {
    // HRMS: attendance + leave requests
    const present = 46 + Math.round(Math.sin(t * 0.8 + variant) * 2);
    c.lineWidth = 16;
    c.strokeStyle = "rgba(59,130,246,0.2)";
    c.beginPath();
    c.arc(100, 170, 56, 0, 7);
    c.stroke();
    c.strokeStyle = "#3b82f6";
    c.lineCap = "round";
    c.beginPath();
    c.arc(100, 170, 56, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (present / 50));
    c.stroke();
    c.lineCap = "butt";
    c.fillStyle = "#12306b";
    c.font = "700 34px Arial";
    c.textAlign = "center";
    c.fillText(String(present), 100, 182);
    c.font = "14px Arial";
    c.fillStyle = "rgba(30,58,95,0.75)";
    c.fillText("of 50 present", 100, 252);
    c.textAlign = "left";
    c.fillStyle = "rgba(29,78,216,0.85)";
    c.font = "600 15px Arial";
    c.fillText("Leave requests", 200, 82);
    [["Anitha", "2 days"], ["Karthik", "1 day"], ["Meena", "3 days"]].forEach(([n, d], i) => {
      const y = 96 + i * 50;
      c.fillStyle = "rgba(255,255,255,0.72)";
      c.beginPath();
      c.roundRect(200, y, 292, 42, 10);
      c.fill();
      c.fillStyle = "#f59e0b";
      c.beginPath();
      c.arc(222, y + 21, 12, 0, 7);
      c.fill();
      c.fillStyle = "#1e3a5f";
      c.font = "600 17px Arial";
      c.fillText(n, 244, y + 20);
      c.font = "13px Arial";
      c.fillStyle = "rgba(30,58,95,0.6)";
      c.fillText(d, 244, y + 36);
      const ok = Math.floor(t * 0.6 + i + variant) % 3 !== 0;
      pill(406, y + 9, 76, ok ? "Approved" : "Review", ok ? "#3b82f6" : "#22d3ee");
    });
    c.fillStyle = "rgba(29,78,216,0.75)";
    c.font = "15px Arial";
    c.fillText("Payroll · Leave · Attendance · Hiring", 24, 322);
  } else if (kind === 3) {
    // company facts
    const stats = [["11+", "Years of excellence"], ["50+", "Team members"], ["6", "Countries"], ["ISO", "27001 certified"]];
    stats.forEach(([big, label], i) => {
      const x = 24 + (i % 2) * 238;
      const y = 76 + Math.floor(i / 2) * 118;
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + i * 1.1 + variant);
      c.fillStyle = "rgba(255,255,255,0.72)";
      c.beginPath();
      c.roundRect(x, y, 226, 106, 14);
      c.fill();
      c.fillStyle = i % 2 ? "#22d3ee" : "#3b82f6";
      c.font = "800 46px Arial";
      c.fillText(big, x + 18, y + 56);
      c.fillStyle = "rgba(30,58,95,0.8)";
      c.font = "600 16px Arial";
      c.fillText(label, x + 18, y + 84);
      c.fillStyle = `rgba(59,130,246,${0.25 + 0.5 * pulse})`;
      c.beginPath();
      c.arc(x + 200, y + 22, 6, 0, 7);
      c.fill();
    });
    c.fillStyle = "rgba(29,78,216,0.8)";
    c.font = "600 15px Arial";
    c.fillText("Since 2015 · Puducherry, India", 24, 326);
  } else if (kind === 4) {
    // real client projects
    const cl = [["HEB", "Retail platform"], ["MedConnect AI", "Healthcare AI"], ["WhyScience", "Education"], ["APPGM", "Web portal"]];
    cl.forEach(([n, d], i) => {
      const y = 72 + i * 56;
      const v = clamp01(0.62 + Math.sin(t * 0.8 + i * 1.4 + variant) * 0.12 + i * 0.07);
      c.fillStyle = "rgba(255,255,255,0.72)";
      c.beginPath();
      c.roundRect(20, y, 472, 48, 10);
      c.fill();
      c.fillStyle = ["#3b82f6", "#f59e0b", "#38bdf8", "#22d3ee"][i];
      c.beginPath();
      c.arc(46, y + 24, 14, 0, 7);
      c.fill();
      c.fillStyle = "#ffffff";
      c.font = "800 15px Arial";
      c.textAlign = "center";
      c.fillText(n[0], 46, y + 30);
      c.textAlign = "left";
      c.fillStyle = "#1e3a5f";
      c.font = "700 19px Arial";
      c.fillText(n, 72, y + 22);
      c.font = "13px Arial";
      c.fillStyle = "rgba(30,58,95,0.6)";
      c.fillText(d, 72, y + 40);
      c.fillStyle = "rgba(37,99,235,0.13)";
      c.beginPath();
      c.roundRect(280, y + 18, 190, 12, 6);
      c.fill();
      c.fillStyle = "#3b82f6";
      c.beginPath();
      c.roundRect(280, y + 18, 190 * v, 12, 6);
      c.fill();
    });
  } else {
    // global presence
    const cs = [["India (HQ)", 0], ["Dubai", 1], ["USA", 2], ["Singapore", 3], ["Malaysia", 4], ["Australia", 5]] as const;
    const act = Math.floor(t * 0.7 + variant) % 6;
    cs.forEach(([name, i]) => {
      const x = 24 + (i % 2) * 238;
      const y = 76 + Math.floor(i / 2) * 76;
      const on = act === i;
      c.fillStyle = on ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.72)";
      c.beginPath();
      c.roundRect(x, y, 226, 64, 14);
      c.fill();
      c.fillStyle = on ? "#f59e0b" : "#3b82f6";
      c.beginPath();
      c.arc(x + 30, y + 32, on ? 11 : 8, 0, 7);
      c.fill();
      if (on) {
        c.strokeStyle = "rgba(245,158,11,0.6)";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(x + 30, y + 32, 11 + ((t * 14) % 12), 0, 7);
        c.stroke();
      }
      c.fillStyle = "#1e3a5f";
      c.font = "700 21px Arial";
      c.fillText(name, x + 56, y + 40);
    });
    c.fillStyle = "rgba(29,78,216,0.85)";
    c.font = "600 15px Arial";
    c.fillText("Six countries. One team.", 24, 326);
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
  { pos: [2.4, 2.75, 0.1], w: 1.45, kind: 0, ry: -0.45 },
  { pos: [-3.2, 2.85, 0.5], w: 1.72, kind: 1, ry: 0.45 },
  { pos: [2.35, 4.25, 0.1], w: 1.45, kind: 2, ry: -0.4 },
  { pos: [-3.15, 4.35, 0.3], w: 1.72, kind: 3, ry: 0.4 },
  { pos: [2.35, 1.25, 0.1], w: 1.45, kind: 4, ry: -0.45 },
  { pos: [-3.1, 1.35, 0.5], w: 1.72, kind: 5, ry: 0.45 },
];
const SEG = 14;
const DOWN = new THREE.Vector3(0, -1, 0);

/* ================================ glowing 3D "AI" held in the hand ================================ */

/** Extruded 3D "AI" lettering in glowing blue, turning slowly above the palm with pulsing glow rings. */
function AIText({ palette }: { palette: RobotPalette; mobile: boolean }) {
  const sway = useRef<THREE.Group>(null!);
  const halo = useRef<THREE.Mesh>(null!);
  const chip = useRef<THREE.Mesh>(null!);
  const rings = useRef<THREE.Mesh[]>([]);

  // glowing AI chip with circuit traces running out from it (drawn once on a canvas)
  const chipTex = useMemo(() => {
    const S = 1024;
    const cv = document.createElement("canvas");
    cv.width = cv.height = S;
    const c = cv.getContext("2d")!;
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const mid = S / 2;
    const half = 170;
    c.lineCap = "round";
    c.shadowColor = "#22e6ff";
    c.shadowBlur = 12;
    // circuit traces: leave the chip at right angles, bend once or twice, end in a node
    for (let k = 0; k < 44; k++) {
      const side = k % 4; // 0 up, 1 right, 2 down, 3 left
      const off = (rnd() - 0.5) * (half * 1.7);
      let x = side === 1 ? mid + half : side === 3 ? mid - half : mid + off;
      let y = side === 0 ? mid - half : side === 2 ? mid + half : mid + off;
      let dx = side === 1 ? 1 : side === 3 ? -1 : 0;
      let dy = side === 0 ? -1 : side === 2 ? 1 : 0;
      c.strokeStyle = `rgba(20,150,235,${0.7 + rnd() * 0.3})`;
      c.lineWidth = 2 + rnd() * 2.5;
      c.beginPath();
      c.moveTo(x, y);
      const bends = 1 + Math.floor(rnd() * 2);
      for (let b = 0; b <= bends; b++) {
        const len = 60 + rnd() * 150;
        x += dx * len;
        y += dy * len;
        c.lineTo(x, y);
        if (b < bends) {
          const turn = rnd() > 0.5 ? 1 : -1;
          const ndx = dy * turn, ndy = -dx * turn;
          dx = ndx;
          dy = ndy;
        }
      }
      c.stroke();
      c.fillStyle = "rgba(30,170,255,1)";
      c.beginPath();
      c.arc(x, y, 6 + rnd() * 4, 0, 7);
      c.fill();
    }
    // the chip
    c.shadowBlur = 34;
    c.fillStyle = "rgba(3,22,64,0.97)";
    c.strokeStyle = "#7df6ff";
    c.lineWidth = 9;
    c.beginPath();
    c.roundRect(mid - half, mid - half, half * 2, half * 2, 34);
    c.fill();
    c.stroke();
    c.shadowBlur = 10;
    c.lineWidth = 3;
    c.strokeStyle = "rgba(120,245,255,0.7)";
    c.beginPath();
    c.roundRect(mid - half + 26, mid - half + 26, (half - 26) * 2, (half - 26) * 2, 22);
    c.stroke();
    for (let i = 0; i < 8; i++) {
      const p = mid - half + 40 + i * ((half * 2 - 80) / 7);
      c.lineWidth = 6;
      c.strokeStyle = "#5ff3ff";
      [[p, mid - half - 18, p, mid - half], [p, mid + half, p, mid + half + 18], [mid - half - 18, p, mid - half, p], [mid + half, p, mid + half + 18, p]].forEach(([a, b, d, e]) => {
        c.beginPath();
        c.moveTo(a, b);
        c.lineTo(d, e);
        c.stroke();
      });
    }
    // the AI letters
    c.font = "900 250px Arial, Helvetica, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.shadowColor = "#22e6ff";
    c.shadowBlur = 30;
    c.fillStyle = "#38e1ff";
    c.fillText("AI", mid, mid + 14);
    c.shadowBlur = 10;
    c.fillStyle = "#ffffff";
    c.fillText("AI", mid, mid + 14);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);

  const haloTex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const c = cv.getContext("2d")!;
    const g = c.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, "rgba(220,255,255,0.8)");
    g.addColorStop(0.3, "rgba(80,220,255,0.4)");
    g.addColorStop(0.6, "rgba(30,160,255,0.16)");
    g.addColorStop(1, "rgba(30,160,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(cv);
  }, []);

  const glass = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#7fd8ff", roughness: 0.02, metalness: 0, transparent: true, opacity: 0.32, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.4, depthWrite: false, depthTest: false }), []);
  const rim = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uC: { value: new THREE.Color("#46e8ff") } },
        vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
        fragmentShader: "uniform vec3 uC; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.6); gl_FragColor = vec4(uC, f * 0.9); }",
      }),
    []
  );
  const glintTex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 64;
    const c = cv.getContext("2d")!;
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
  }, []);

  const live = useLive();
  useFrame(() => {
    if (!live.current) return;
    const t = palette.uTime.value;
    sway.current.rotation.y = Math.sin(t * 0.8) * 0.22;
    sway.current.position.y = Math.sin(t * 1.6) * 0.04;
    chip.current.scale.setScalar(1 + 0.025 * Math.sin(t * 3));
    (halo.current.material as THREE.MeshBasicMaterial).opacity = 0.55 + 0.25 * Math.sin(t * 3);
    halo.current.scale.setScalar(2.3 + 0.2 * Math.sin(t * 3));
    rings.current.forEach((r, i) => {
      if (!r) return;
      const k = (t * 0.7 + i * 0.5) % 1;
      r.scale.setScalar(0.5 + k * 1.5);
      (r.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.7;
    });
  });

  return (
    <group>
      <mesh ref={halo} position={[0, 0, -0.2]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={haloTex} transparent depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* light on the palm */}
      <group position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {[0, 1].map((i) => (
          <mesh key={i} ref={(m) => { if (m) rings.current[i] = m; }}>
            <torusGeometry args={[0.6, 0.015, 8, 56]} />
            <meshBasicMaterial color="#38e1ff" transparent toneMapped={false} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <group ref={sway} position={[0, 0.02, 0.12]} scale={0.9}>
        {/* chip + circuits, seen through the glass */}
        <mesh ref={chip} position={[0, 0, -0.05]} renderOrder={11}>
          <planeGeometry args={[2.5, 2.5]} />
          <meshBasicMaterial map={chipTex} transparent toneMapped={false} depthWrite={false} depthTest={false} />
        </mesh>
        {/* the glass sphere */}
        <mesh material={glass} renderOrder={12}>
          <sphereGeometry args={[0.62, 48, 32]} />
        </mesh>
        <mesh material={rim} renderOrder={13} scale={1.02}>
          <sphereGeometry args={[0.62, 48, 32]} />
        </mesh>
        <mesh position={[-0.26, 0.3, 0.5]} renderOrder={14}>
          <planeGeometry args={[0.42, 0.26]} />
          <meshBasicMaterial map={glintTex} transparent toneMapped={false} depthWrite={false} depthTest={false} opacity={0.75} />
        </mesh>
      </group>
      <pointLight color="#36d8ff" intensity={6} distance={4} />
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

  const live = useLive();
  useFrame((_, dt) => {
    if (!live.current) return;
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
  const eyes = useRef<THREE.Group>(null!); // round glowing eyes
  const happy = useRef<THREE.Group>(null!); // ^ ^ eyes while waving
  const bubble = useRef<THREE.Mesh>(null!); // "Hii!" speech bubble
  const antenna = useRef<THREE.Group>(null!);
  const fingers = useRef<THREE.Group[][]>([[], []]); // [hold hand, wave hand] finger joints (curl)
  const handP = useRef<THREE.Group>(null!);
  const handR = useRef<THREE.Group>(null!);
  const upP = useRef<THREE.Group>(null!);
  const foP = useRef<THREE.Group>(null!);
  const upR = useRef<THREE.Group>(null!);
  const foR = useRef<THREE.Group>(null!);
  const brain = useRef<THREE.Group>(null!);
  const panels = useRef<THREE.Group[]>([]);
  const shots = useRef<THREE.MeshBasicMaterial[]>([]);
  const mouse = useRef({ x: 0, y: 0 });
  const scroll = useRef(0);
  const ndcV = useMemo(() => new THREE.Vector3(), []);
  const en = useRef(0); // seconds since the robot started entering
  const pinAt = useRef<number | null>(null);
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("robotAt");
    pinAt.current = v === null ? null : Number(v);
  }, []);
  const frames = useRef(0); // frames drawn since the scene woke (the entrance waits for the first ones to settle)
  const turn = useRef(0);
  const rings = useRef<THREE.Group[]>([]);
  const K = useMemo(() => ({ v1: new THREE.Vector3(), v2: new THREE.Vector3(), q: new THREE.Quaternion(), x: new THREE.Vector3(), y: new THREE.Vector3(), z: new THREE.Vector3(), m: new THREE.Matrix4(), S: new THREE.Vector3(), E: new THREE.Vector3(), W: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), pole: new THREE.Vector3(), t: new THREE.Vector3(), r: new THREE.Vector3(), u: new THREE.Vector3(), bp: new THREE.Vector3() }), []);
  const count = mobile ? 3 : PANELS.length;

  useEffect(() => {
    const wake = () => (frames.current = 0);
    window.addEventListener("nk:intro-done", wake);
    return () => window.removeEventListener("nk:intro-done", wake);
  }, []);

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
    img.src = "/images/brand/netkathir-emblem.png";
  }, []);

  const M = useMemo(() => {
    const ceramic = new THREE.MeshPhysicalMaterial({ color: "#f5f7f6", roughness: 0.2, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.15 });
    const ceramic2 = new THREE.MeshPhysicalMaterial({ color: "#e4ebe7", roughness: 0.26, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.12, envMapIntensity: 1.1 });
    const dark = new THREE.MeshPhysicalMaterial({ color: "#1b2420", roughness: 0.38, metalness: 0.85, clearcoat: 0.4, envMapIntensity: 1.15 });
    const glass = new THREE.MeshPhysicalMaterial({ color: "#050808", roughness: 0.04, metalness: 0.7, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.9 });
    const gold = new THREE.MeshPhysicalMaterial({ color: "#f2c230", roughness: 0.22, metalness: 1, clearcoat: 0.4, envMapIntensity: 1.5 });
    const led = new THREE.MeshBasicMaterial({ color: "#7dffb2", toneMapped: false });
    const ledY = new THREE.MeshBasicMaterial({ color: "#fde047", toneMapped: false });
    // eyes: bright cyan discs with a soft additive halo and a tiny glint
    const eye = new THREE.MeshBasicMaterial({ color: "#3fe3ff", toneMapped: false });
    const eyeGlint = new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false, transparent: true, opacity: 0.85 });
    const hc = document.createElement("canvas");
    hc.width = hc.height = 128;
    const hx = hc.getContext("2d")!;
    const hg = hx.createRadialGradient(64, 64, 10, 64, 64, 64);
    hg.addColorStop(0, "rgba(90,230,255,0.75)");
    hg.addColorStop(0.45, "rgba(40,190,255,0.22)");
    hg.addColorStop(1, "rgba(40,190,255,0)");
    hx.fillStyle = hg;
    hx.fillRect(0, 0, 128, 128);
    const eyeHalo = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(hc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const cheek = new THREE.MeshBasicMaterial({ color: "#ff9db5", transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false });
    return { ceramic, ceramic2, dark, glass, gold, led, ledY, eye, eyeGlint, eyeHalo, cheek };
  }, []);

  // "Hii!" greeting card: white glass bubble, green→gold rim, a welcome line, a tail pointing at the waving hand
  const hiTex = useMemo(() => {
    const W = 1000;
    const H = 640;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const c = cv.getContext("2d")!;
    const x = 40, y = 34, w = 920, h = 420, r = 150;
    const body = () => {
      c.beginPath();
      c.roundRect(x, y, w, h, r);
      // tail, curving down-right towards the hand
      c.moveTo(640, y + h - 4);
      c.quadraticCurveTo(700, y + h + 90, 800, y + h + 150);
      c.quadraticCurveTo(740, y + h + 70, 760, y + h - 4);
      c.closePath();
    };
    // soft drop shadow
    c.save();
    c.shadowColor = "rgba(6,60,30,0.28)";
    c.shadowBlur = 40;
    c.shadowOffsetY = 14;
    c.fillStyle = "#ffffff";
    body();
    c.fill();
    c.restore();
    // body fill: white to a whisper of mint
    const fill = c.createLinearGradient(0, y, 0, y + h);
    fill.addColorStop(0, "#ffffff");
    fill.addColorStop(1, "#eefcf3");
    c.fillStyle = fill;
    body();
    c.fill();
    // gradient rim
    const rim = c.createLinearGradient(x, 0, x + w, 0);
    rim.addColorStop(0, "#15803d");
    rim.addColorStop(0.6, "#22c55e");
    rim.addColorStop(1, "#eab308");
    c.lineWidth = 9;
    c.strokeStyle = rim;
    body();
    c.stroke();
    // glossy highlight along the top
    const gloss = c.createLinearGradient(0, y, 0, y + 150);
    gloss.addColorStop(0, "rgba(255,255,255,0.95)");
    gloss.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = gloss;
    c.beginPath();
    c.roundRect(x + 60, y + 14, w - 120, 120, 60);
    c.fill();
    // "Hii!" with a green gradient + the wave emoji
    const ink = c.createLinearGradient(150, 0, 600, 0);
    ink.addColorStop(0, "#14532d");
    ink.addColorStop(1, "#16a34a");
    c.fillStyle = ink;
    c.textAlign = "left";
    c.textBaseline = "alphabetic";
    c.font = "900 178px Arial, Helvetica, sans-serif";
    c.fillText("Hii!", 150, 248);
    c.font = "150px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";
    c.fillText("👋", 560, 238);
    // welcome line
    c.fillStyle = "#3f6b52";
    c.font = "600 56px Arial, Helvetica, sans-serif";
    c.fillText("Welcome to Netkathir", 154, 352);
    // little sparkle dots
    [[860, 120, 10, "#eab308"], [890, 170, 6, "#22c55e"], [835, 92, 5, "#22c55e"]].forEach(([px, py, pr, col]) => {
      c.fillStyle = col as string;
      c.beginPath();
      c.arc(px as number, py as number, pr as number, 0, 7);
      c.fill();
    });
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);

  const G = useMemo(
    () => ({
      sph: new THREE.SphereGeometry(1, 40, 32),
      cap: (r: number, l: number) => new THREE.CapsuleGeometry(r, l, 8, 24),
      ring: (r: number, t: number, arc = Math.PI * 2) => new THREE.TorusGeometry(r, t, 14, 56, arc),
      // rounded blocks for the body (width, height, depth, segments, corner radius)
      torso: new RoundedBoxGeometry(1.56, 1.32, 1.0, 5, 0.32),
      // flat rounded-rectangle outline (outer minus inner) used as a panel seam on the chest
      seam: (() => {
        const rr = (w: number, h: number, r: number, hole = false) => {
          const p = hole ? new THREE.Path() : new THREE.Shape();
          const x = -w / 2, y = -h / 2;
          p.moveTo(x + r, y);
          p.lineTo(x + w - r, y);
          p.quadraticCurveTo(x + w, y, x + w, y + r);
          p.lineTo(x + w, y + h - r);
          p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          p.lineTo(x + r, y + h);
          p.quadraticCurveTo(x, y + h, x, y + h - r);
          p.lineTo(x, y + r);
          p.quadraticCurveTo(x, y, x + r, y);
          return p;
        };
        const outer = rr(1.12, 1.06, 0.16) as THREE.Shape;
        outer.holes.push(rr(1.096, 1.036, 0.148, true) as THREE.Path);
        return new THREE.ShapeGeometry(outer, 12);
      })(),
      display: new RoundedBoxGeometry(0.28, 0.15, 0.04, 3, 0.02),
      pelvis: new RoundedBoxGeometry(1.14, 0.38, 0.84, 4, 0.16),
      thigh: new RoundedBoxGeometry(0.42, 0.34, 0.42, 4, 0.13),
      shin: new RoundedBoxGeometry(0.38, 0.34, 0.4, 4, 0.12),
      palm: new RoundedBoxGeometry(0.27, 0.25, 0.13, 4, 0.06),
    }),
    []
  );

  // ---- glass finish for the panels: curved glowing rim + a moving mirror reflection (all share one set of textures)
  const glass = useMemo(() => {
    const mk = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      draw(cv.getContext("2d")!);
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };
    const rim = mk(560, 374, (c) => {
      c.shadowColor = "#5eb0ff";
      c.shadowBlur = 26;
      c.strokeStyle = "rgba(150,205,255,0.95)";
      c.lineWidth = 4;
      c.beginPath();
      c.roundRect(24, 17, 512, 340, 26);
      c.stroke();
      c.shadowBlur = 0;
      const g = c.createLinearGradient(24, 17, 300, 200);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(0.5, "rgba(255,255,255,0.1)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.strokeStyle = g;
      c.lineWidth = 2.5;
      c.beginPath();
      c.roundRect(27, 20, 506, 334, 24);
      c.stroke();
    });
    const mask = mk(512, 340, (c) => {
      c.fillStyle = "#000";
      c.fillRect(0, 0, 512, 340);
      c.fillStyle = "#fff";
      c.beginPath();
      c.roundRect(0, 0, 512, 340, 26);
      c.fill();
    });
    const streak = mk(1024, 340, (c) => {
      const g = c.createLinearGradient(380, 0, 640, 0);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.5, "rgba(255,255,255,0.55)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(430, 0);
      c.lineTo(690, 0);
      c.lineTo(590, 340);
      c.lineTo(330, 340);
      c.closePath();
      c.fill();
    });
    streak.repeat.set(0.5, 1);
    const shine = PANELS.map(() => {
      const t = streak.clone();
      t.needsUpdate = true;
      t.repeat.set(0.5, 1);
      return t;
    });
    return { rim, mask, shine };
  }, []);

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

  const onStage = useLive();
  useFrame((s, dt) => {
    if (!onStage.current) return;
    const d = Math.min(dt, 0.25);
    const t = palette.uTime.value;
    const tNow = t;
    scroll.current = THREE.MathUtils.damp(scroll.current, clamp01(window.scrollY / (window.innerHeight * 1.05)), 5, d);
    const sc = scroll.current;
    const e = ease(sc);
    void s;
    const visible = count; // every panel is shown, no scroll gating
    // entrance: robot rises and turns in, raises its hand, the AI pops up, the wave opens, screens appear one by one
    frames.current += 1;
    // the very first frames after waking pay for uploads and shader work: hold the entrance until they settle
    if (pinAt.current !== null) en.current = pinAt.current; // dev aid: /?robotAt=3 freezes the entrance at 3 s
    else if (frames.current > 14 && (window as unknown as { __nkIntro?: string }).__nkIntro !== "playing") en.current += Math.min(d, 0.04);
    const E = en.current;
    const sg = (a: number, b: number) => ease(clamp01((E - a) / (b - a)));
    const back = (x: number) => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2);
    const rIn = sg(0.2, 1.7);
    // 1. "Hii!": the left hand rises and waves, eyes turn happy, the head tilts
    // the arm lifts with a small overshoot, waves with a swing that builds and settles, then lowers
    const backOut = (x: number) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);
    const wave = backOut(clamp01((E - 1.5) / 0.65)) * (1 - sg(3.95, 4.6));
    const waveW = clamp01(wave);
    const env = sg(1.85, 2.25) * (1 - sg(3.55, 3.95)); // how big the swing is
    const wph = E * 11; // just under 2 waves a second
    const happyK = sg(1.6, 1.95) * (1 - sg(3.9, 4.3));
    const bub = clamp01((E - 1.75) / 0.45);
    const bubOut = sg(3.85, 4.25);
    // 2. the right hand rises, palm up, and the AI appears on it (and stays)
    const armIn = sg(4.0, 4.85);
    const aiIn = clamp01((E - 4.85) / 0.9);

    // ---- where the cursor is relative to the robot itself (not the middle of the window), so it follows everywhere
    robot.current.updateWorldMatrix(true, false);
    ndcV.setFromMatrixPosition(robot.current.matrixWorld).project(s.camera);
    // while it says hello it looks straight at the visitor; the cursor takes over once the AI is in its hand
    const follow = sg(4.7, 5.7);
    const fx = THREE.MathUtils.clamp((mouse.current.x - ndcV.x) * 1.25, -1.2, 1.2) * follow;
    const fy = THREE.MathUtils.clamp((mouse.current.y - (ndcV.y + 0.35)) * 1.1, -1, 1) * follow;
    // ---- body: hover, breathing, turns with the cursor (and a little with scroll)
    robot.current.rotation.y = THREE.MathUtils.damp(robot.current.rotation.y, -0.05 + e * 0.3 + fx * 0.85 + (1 - rIn) * 3.0, 4.6, d);
    robot.current.rotation.x = THREE.MathUtils.damp(robot.current.rotation.x, -fy * 0.1, 4.6, d);
    robot.current.position.y = Math.sin(t * 1.6) * 0.04;
    torso.current.scale.set(1, 1 + Math.sin(t * 1.7) * 0.01, 1 + Math.sin(t * 1.7) * 0.012);
    antenna.current.rotation.z = Math.sin(t * 2.1) * 0.05;
    robot.current.updateWorldMatrix(true, true);

    // ---- arms: two-bone IK. Right arm (screen right) holds the AI on an open palm; left arm waves hello, then rests
    const bob = Math.sin(t * 1.4) * 0.04;
    for (let a = 0; a < 2; a++) {
      const side = a === 0 ? 1 : -1;
      const S = K.S.set(side * 0.98, 2.55 + (a === 1 ? 0.04 * waveW : 0), 0); // a little shrug as it waves
      let wrist: THREE.Vector3;
      if (a === 0) {
        // rests hanging at the side (nearly straight, elbow a touch back), then lifts the AI out in front
        wrist = K.t.set(1.0, 1.95 + bob, 0.92).lerp(K.r.set(1.1 + Math.sin(t * 1.1) * 0.015, 1.37 + Math.sin(t * 1.3) * 0.015, 0.1), 1 - armIn);
        K.pole.set(0.5, -0.9, -0.35).lerp(K.v2.set(0.25, 0, -1), 1 - armIn);
      } else {
        // arm down by the side: nearly straight, a slight bend at the elbow
        const rest = K.r.set(-1.1 - Math.sin(t * 1.1) * 0.015, 1.37 + Math.sin(t * 1.3) * 0.015, 0.1);
        // a real wave: the elbow stays put out to the side and the forearm swings from it like a pendulum
        // elbow a little below the shoulder and forward, as a person waves
        const elbow = K.v1.set(-0.7, -0.5, 0.5).normalize().multiplyScalar(0.62).add(S);
        const th = -0.18 + 0.32 * env * Math.sin(wph); // forearm angle from vertical (negative leans outward)
        const up = K.u.set(Math.sin(th), Math.cos(th), 0.18).normalize().multiplyScalar(0.615).add(elbow);
        wrist = K.t.copy(rest).lerp(up, wave);
        // aiming the elbow at that point makes the IK keep it exactly there while the forearm swings
        K.pole.set(-0.25, 0, -1).lerp(K.v2.copy(elbow).sub(S), waveW);
      }
      solveArm(S, wrist, K.pole, 0.62, 0.62, K.E, K.W, K.a, K.b);
      const upA = (a === 0 ? upP : upR).current;
      const fo = (a === 0 ? foP : foR).current;
      upA.position.copy(S);
      upA.quaternion.setFromUnitVectors(DOWN, K.a.copy(K.E).sub(S).normalize());
      fo.position.copy(K.E);
      // forearm frame built from the arm direction + where the palm should face (so a raised hand never flips round)
      K.y.copy(K.E).sub(K.W).normalize(); // local +y runs from the wrist back to the elbow
      // palms face in towards the legs at rest; up under the AI; towards the viewer while waving
      if (a === 0) K.z.set(-1, 0, 0.25).lerp(K.v2.set(0, 1, 0.35), armIn).normalize();
      else K.z.set(1, 0, 0.25).lerp(K.v2.set(0.15, 0, 1), waveW).normalize();
      K.x.crossVectors(K.y, K.z).normalize();
      K.z.crossVectors(K.x, K.y).normalize();
      K.m.makeBasis(K.x, K.y, K.z);
      fo.quaternion.setFromRotationMatrix(K.m);
      // fingers: relaxed curl at rest, open for the wave, cupped under the AI
      const curl = a === 0 ? THREE.MathUtils.lerp(0.5, 0.45, armIn) : THREE.MathUtils.lerp(0.5, 0.12, waveW); // relaxed, not a fist
      fingers.current[a].forEach((f, k) => {
        if (!f) return;
        // waving fingers stay loose: a light flutter that trails the swing
        const flutter = a === 1 ? 0.08 * env * Math.sin(wph - 0.9 - (k >> 1) * 0.35) : 0;
        // relaxed, not ramrod straight: the outer fingers bend a touch more, and they fan apart slightly
        const fi = k >> 1;
        const relax = a === 1 ? waveW * (0.16 + (fi === 1 ? 0 : 0.08)) : 0;
        f.rotation.x = -(curl + relax + flutter) * (k % 2 ? 0.9 : 1);
        if (k % 2 === 0) f.rotation.z = a === 1 ? (fi - 1) * 0.16 * waveW : 0;
      });
      const hand = (a === 0 ? handP : handR).current;
      // a loose wrist: the hand lags the forearm and flicks at each turn (follow-through)
      if (hand) {
        hand.rotation.z = a === 1 ? 0.3 * env * Math.cos(wph - 0.35) + 0.12 * waveW : 0;
        hand.rotation.x = a === 1 ? -0.12 * waveW : 0; // fingers tipped back a touch, palm open to the viewer
        hand.rotation.y = a === 1 ? 0.22 * env * Math.sin(wph - 0.6) - 0.18 * waveW : 0; // the palm turns a little with each swing
      }
      if (a === 0) {
        // the AI floats just above the open palm
        const u = K.u.copy(K.W).sub(K.E).normalize();
        K.bp.copy(K.W).addScaledVector(u, 0.16);
        K.bp.y += 0.8 + Math.sin(t * 1.8) * 0.05; // a little higher above the bigger glove
        K.bp.z += 0.12;
        brain.current.position.copy(K.bp);
        brain.current.scale.setScalar(0.64 * Math.max(0.001, back(aiIn)));
      }
    }

    // ---- "Hii!" bubble pops beside the waving hand
    if (bubble.current) {
      const k = Math.max(0.001, back(bub) * (1 - bubOut));
      bubble.current.scale.setScalar(k);
      bubble.current.visible = k > 0.01;
      bubble.current.position.set(-2.25, 4.75 + Math.sin(t * 2.4) * 0.04, 0.6);
      // always face the viewer: undo the robot's own turn, then take the camera's
      robot.current.getWorldQuaternion(K.q);
      bubble.current.quaternion.copy(K.q.invert().multiply(s.camera.quaternion));
      bubble.current.rotateZ(0.045 * env * Math.sin(wph - 1.2)); // a friendly wobble in time with the wave
    }

    // ---- head: friendly tilt while waving, otherwise follows the AI, then the cursor
    const bp = K.bp;
    const look = 1 - wave;
    const hy = (THREE.MathUtils.clamp(Math.atan2(bp.x, bp.z + 0.5) * 0.4, -0.45, 0.45) * look * follow - 0.06 * wave) + fx * 0.6;
    const hx = THREE.MathUtils.clamp(-Math.atan2(bp.y - 3.4, Math.hypot(bp.x, bp.z)) * 0.5, -0.3, 0.3) * look * follow - fy * 0.4;
    head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, hy, 8, d);
    head.current.rotation.x = THREE.MathUtils.damp(head.current.rotation.x, hx, 8, d);
    head.current.rotation.z = THREE.MathUtils.damp(head.current.rotation.z, 0.14 * waveW + 0.04 * env * Math.sin(wph - 0.8), 8, d);
    // the body sways a touch with the wave and leans into it
    robot.current.rotation.z = THREE.MathUtils.damp(robot.current.rotation.z, -0.035 * waveW + 0.018 * env * Math.sin(wph - 1.4), 8, d);
    const blink = Math.max(0, Math.sin(t * 1.3 + 0.7) * 18 - 17);
    eyes.current.scale.set(1 - happyK, Math.max(0.08, (1 - Math.min(blink, 1) * 0.9) * (1 - happyK)), 1);
    eyes.current.visible = happyK < 0.98;
    happy.current.scale.setScalar(Math.max(0.001, happyK));
    happy.current.visible = happyK > 0.02;

    // ---- interfaces: float, fan out with scroll, and run their own live content + page transitions
    turn.current += 1;
    glass.shine.forEach((t, i) => (t.offset.x = ((tNow * 0.13 + i * 0.21) % 2.4) - 0.9));
    PANELS.slice(0, count).forEach((p, i) => {
      const g = panels.current[i];
      if (!g) return;
      const appear = 1 * sg(6.4 + i * 0.35, 7.3 + i * 0.35);
      const spread = mobile ? 0.72 : 1 + e * 0.1;
      const ox = mobile ? 0.6 : 0;
      g.position.set(p.pos[0] * spread + ox, p.pos[1] + Math.sin(t * 1.2 + i * 1.3) * 0.07, p.pos[2]);
      g.rotation.y = p.ry + Math.sin(t * 0.5 + i) * 0.03;
      g.scale.setScalar(Math.max(0.001, 0.2 * (appear > 0.01 ? 1 : 0) + 0.8 * appear));
      g.visible = i < visible;
      const m = shots.current[i];
      if (m) m.opacity = appear;
      const L = live[i];
      if (g.visible && appear > 0.01 && turn.current % count === i && t - L.last > 0.09) {
        L.last = t;
        renderInterface(L.ctx, p.kind, i, t);
        L.tex.needsUpdate = true;
      }
    });

    rings.current.forEach((g, i) => {
      if (!g) return;
      const k = sg(5.6 + i * 0.35, 6.9 + i * 0.35);
      g.visible = k > 0.02; // a collapsed ring would show as a thin vertical dotted line
      g.scale.set(Math.max(0.001, k), 0.4 + 0.6 * k, Math.max(0.001, k));
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
        {/* ---- legs: sneakers, white shin and thigh blocks joined by a dark bellows knee with a yellow light ---- */}
        {[-1, 1].map((sd) => (
          <group key={sd} position={[sd * 0.38, 0, 0.02]}>
            {/* shoe: thin dark outsole, thick white midsole with a dark seam, rounded upper, toe lifted a touch */}
            <mesh material={M.dark} position={[0, 0.02, 0.08]} scale={[1, 1, 1.62]}>
              <cylinderGeometry args={[0.3, 0.3, 0.04, 40]} />
            </mesh>
            <mesh material={M.ceramic} position={[0, 0.085, 0.08]} scale={[1, 1, 1.6]}>
              <cylinderGeometry args={[0.3, 0.305, 0.1, 40]} />
            </mesh>
            <mesh geometry={G.ring(0.3, 0.01)} material={M.dark} position={[0, 0.137, 0.08]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1.6, 1]} />
            <mesh geometry={G.sph} material={M.ceramic} scale={[0.28, 0.17, 0.43]} position={[0, 0.17, 0.07]} />
            <mesh geometry={G.sph} material={M.ceramic2} scale={[0.22, 0.1, 0.15]} position={[0, 0.18, 0.38]} rotation={[-0.25, 0, 0]} />
            {/* ankle */}
            <mesh geometry={G.ring(0.14, 0.05)} material={M.dark} position={[0, 0.33, 0]} rotation={[Math.PI / 2, 0, 0]} />
            {/* shin block */}
            <mesh geometry={G.shin} material={M.ceramic} position={[0, 0.55, 0]} />
            {/* bellows knee with a yellow light line */}
            <mesh geometry={G.ring(0.185, 0.012)} material={M.ledY} position={[0, 0.735, 0]} rotation={[Math.PI / 2, 0, 0]} />
            {[0.78, 0.85, 0.92].map((y, i) => (
              <mesh key={i} geometry={G.ring(0.14, 0.055)} material={M.dark} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} />
            ))}
            {/* thigh block */}
            <mesh geometry={G.thigh} material={M.ceramic} position={[0, 1.12, 0]} />
          </group>
        ))}

        {/* ---- pelvis + bellows waist ---- */}
        <mesh geometry={G.pelvis} material={M.ceramic} position={[0, 1.42, 0]} />
        {[1.6, 1.66].map((y, i) => (
          <mesh key={i} geometry={G.ring(0.5, 0.045)} material={M.dark} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.62, 1]} />
        ))}

        <group ref={torso}>
          {/* torso: one solid rounded body with a flat front panel */}
          <mesh geometry={G.torso} material={M.ceramic} position={[0, 2.3, 0]} />
          {/* a thin seam line marks the chest panel flush with the body (no separate block, no bulging corners) */}
          <mesh geometry={G.seam} material={M.dark} position={[0, 2.26, 0.502]} />
          {/* the 3D Netkathir emblem on the chest (unchanged artwork) */}
          {logoGeo && <mesh geometry={logoGeo} material={logoMat} position={[0, 2.22, 0.56]} scale={0.6} />}
          {/* top of the panel: a yellow status bar and a small cyan display */}
          <mesh geometry={G.cap(0.03, 0.2)} material={M.ledY} position={[-0.24, 2.7, 0.515]} rotation={[0, 0, Math.PI / 2]} />
          <mesh geometry={G.display} material={M.dark} position={[0.26, 2.7, 0.505]} />
          {[0, 1, 2].map((r) => (
            <mesh key={r} material={M.eye} position={[0.26, 2.735 - r * 0.035, 0.527]}>
              <boxGeometry args={[0.2, 0.014, 0.004]} />
            </mesh>
          ))}
          {[-0.4, -0.33].map((x, i) => (
            <mesh key={i} geometry={G.sph} material={i ? M.eye : M.dark} scale={0.022} position={[x, 2.7, 0.505]} />
          ))}
          {/* speaker grille under the emblem */}
          {[0, 1].flatMap((r) =>
            [-3, -2, -1, 0, 1, 2, 3].map((c) => (
              <mesh key={`${r}${c}`} geometry={G.sph} material={M.dark} scale={0.016} position={[c * 0.06, 1.86 - r * 0.055, 0.505]} />
            ))
          )}
          {/* neck: a short, wide dark collar the head sits down onto, with a light rim at its base */}
          <mesh material={M.dark} position={[0, 3.04, 0]}>
            <cylinderGeometry args={[0.34, 0.4, 0.2, 48]} />
          </mesh>
          <mesh geometry={G.ring(0.4, 0.022)} material={M.ceramic2} position={[0, 2.95, 0]} rotation={[Math.PI / 2, 0, 0]} />
          <mesh geometry={G.ring(0.345, 0.01)} material={M.eye} position={[0, 3.13, 0]} rotation={[Math.PI / 2, 0, 0]} />
          {/* shoulders: dark ball joints */}
          {[-1, 1].map((sd) => (
            <mesh key={sd} geometry={G.sph} material={M.dark} scale={0.2} position={[sd * 0.98, 2.55, 0]} />
          ))}

          {/* ---- arms: thick bellows upper arm, chunky white gauntlet, big glove hand ---- */}
          {[0, 1].map((a) => {
            const sd = a === 0 ? 1 : -1;
            return (
              <group key={a}>
                <group ref={a === 0 ? upP : upR}>
                  <mesh material={M.dark} position={[0, -0.3, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.5, 16]} />
                  </mesh>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <mesh key={i} geometry={G.ring(0.1, 0.052)} material={M.dark} position={[0, -0.07 - i * 0.088, 0]} rotation={[Math.PI / 2, 0, 0]} />
                  ))}
                </group>
                <group ref={a === 0 ? foP : foR}>
                  <mesh geometry={G.sph} material={M.dark} scale={0.12} />
                  {/* gauntlet: widens towards the wrist */}
                  <mesh geometry={G.sph} material={M.ceramic} scale={[0.125, 0.09, 0.125]} position={[0, -0.12, 0]} />
                  <mesh material={M.ceramic} position={[0, -0.32, 0]}>
                    <cylinderGeometry args={[0.125, 0.16, 0.4, 32]} />
                  </mesh>
                  <mesh geometry={G.ring(0.158, 0.02)} material={M.ceramic2} position={[0, -0.52, 0]} rotation={[Math.PI / 2, 0, 0]} />
                  <mesh geometry={G.ring(0.142, 0.012)} material={a === 0 ? M.eye : M.ledY} position={[0, -0.22, 0]} rotation={[Math.PI / 2, 0, 0]} />
                  <mesh geometry={G.sph} material={M.dark} scale={0.024} position={[sd * 0.15, -0.4, 0]} />
                  <group ref={a === 0 ? handP : handR} position={[0, -0.56, 0]}>
                    {/* glove palm (palm faces +z) */}
                    <mesh geometry={G.palm} material={M.ceramic} position={[0, -0.12, 0]} />
                    <mesh geometry={G.sph} material={M.ceramic2} scale={[0.09, 0.08, 0.02]} position={[0, -0.12, 0.068]} />
                    {[-0.085, 0, 0.085].map((x, i) => (
                      <group key={i} position={[x, -0.245, 0]}>
                        <group ref={(g) => { if (g) fingers.current[a][i * 2] = g; }}>
                          <mesh geometry={G.cap(0.044, 0.07)} material={M.ceramic} position={[0, -0.06, 0]} />
                          <mesh geometry={G.sph} material={M.dark} scale={0.034} position={[0, -0.125, 0]} />
                          <group ref={(g) => { if (g) fingers.current[a][i * 2 + 1] = g; }} position={[0, -0.135, 0]}>
                            <mesh geometry={G.cap(0.041, 0.055)} material={M.ceramic} position={[0, -0.05, 0]} />
                          </group>
                        </group>
                      </group>
                    ))}
                    {/* thumb, on the inner side */}
                    <group position={[-sd * 0.155, -0.08, 0.04]} rotation={[0.3, 0, -sd * 1.05]}>
                      <mesh geometry={G.cap(0.047, 0.09)} material={M.ceramic} position={[0, -0.06, 0]} />
                      <mesh geometry={G.sph} material={M.dark} scale={0.03} position={[0, -0.005, 0]} />
                    </group>
                  </group>
                </group>
              </group>
            );
          })}

          {/* the AI, floating above the open hand */}
          <group ref={brain} scale={0.64}>
            <AIText palette={palette} mobile={mobile} />
          </group>

          {/* ---- head: ceramic helmet, glass visor face, round glowing eyes, smile, headphones ---- */}
          <group ref={head} position={[0, 3.78, 0]}>
            <mesh geometry={G.sph} material={M.ceramic} scale={[1.2, 1.05, 1.08]} />
            {/* helmet seam + forehead light */}
            <mesh geometry={G.ring(0.98, 0.012)} material={M.dark} position={[0, 0.52, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.17, 1, 1]} />
            <mesh geometry={G.sph} material={M.eye} scale={0.055} position={[0, 0.74, 0.76]} />
            {/* visor */}
            <mesh geometry={G.sph} material={M.dark} scale={[0.98, 0.7, 0.42]} position={[0, -0.06, 0.76]} />
            <mesh geometry={G.sph} material={M.glass} scale={[0.93, 0.65, 0.42]} position={[0, -0.06, 0.79]} />
            {/* round glowing eyes with a soft halo */}
            <group ref={eyes}>
              {[-1, 1].map((sd) => (
                <group key={sd} position={[sd * 0.33, 0.0, 1.2]} rotation={[0, sd * 0.26, 0]}>
                  <mesh material={M.eyeHalo} position={[0, 0, -0.005]}>
                    <planeGeometry args={[0.62, 0.62]} />
                  </mesh>
                  <mesh material={M.eye}>
                    <circleGeometry args={[0.15, 40]} />
                  </mesh>
                  <mesh material={M.eyeGlint} position={[-0.05, 0.05, 0.004]}>
                    <circleGeometry args={[0.035, 20]} />
                  </mesh>
                </group>
              ))}
            </group>
            {/* happy ^ ^ eyes (shown while waving) */}
            <group ref={happy} scale={0.001}>
              {[-1, 1].map((sd) => (
                <mesh key={sd} geometry={G.ring(0.13, 0.03, Math.PI)} material={M.eye} position={[sd * 0.33, -0.04, 1.2]} rotation={[0, sd * 0.26, 0]} />
              ))}
            </group>
            {/* little smile */}
            <mesh geometry={G.ring(0.12, 0.016, Math.PI)} material={M.eye} position={[0, -0.27, 1.17]} rotation={[0.25, 0, Math.PI]} />
            {/* headphones: ear cups + padded headband over the helmet */}
            {[-1, 1].map((sd) => (
              <group key={sd} position={[sd * 1.17, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
                <mesh material={M.dark}>
                  <cylinderGeometry args={[0.36, 0.36, 0.2, 40]} />
                </mesh>
                <mesh position={[0, sd * 0.13, 0]} material={M.ceramic}>
                  <cylinderGeometry args={[0.31, 0.31, 0.08, 40]} />
                </mesh>
                <mesh position={[0, sd * 0.18, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}>
                  <torusGeometry args={[0.17, 0.022, 12, 40]} />
                </mesh>
                <mesh position={[0, sd * 0.19, 0]} material={M.eye}>
                  <cylinderGeometry args={[0.06, 0.06, 0.02, 24]} />
                </mesh>
              </group>
            ))}
            <mesh geometry={G.ring(1.24, 0.07, Math.PI)} material={M.dark} position={[0, -0.02, -0.12]} rotation={[-0.22, 0, 0]} />
            {/* two antenna stalks rising from the headband, swaying gently */}
            <group ref={antenna}>
              {[-1, 1].map((sd) => (
                <group key={sd} position={[sd * 0.78, 0.92, -0.25]} rotation={[0, 0, -sd * 0.45]}>
                  <mesh material={M.dark} position={[0, 0.22, 0]}>
                    <cylinderGeometry args={[0.022, 0.03, 0.46, 12]} />
                  </mesh>
                  <mesh geometry={G.sph} material={M.eye} scale={0.06} position={[0, 0.47, 0]} />
                </group>
              ))}
            </group>
          </group>
        </group>

        {/* "Hii!" speech bubble */}
        <mesh ref={bubble} scale={0.001} renderOrder={20}>
          <planeGeometry args={[1.5, 0.96]} />
          <meshBasicMaterial map={hiTex} transparent depthWrite={false} depthTest={false} toneMapped={false} />
        </mesh>
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
              alphaMap={glass.mask}
              transparent
              side={THREE.DoubleSide}
              toneMapped={false}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, 0, -0.012]} renderOrder={-1}>
            <planeGeometry args={[p.w * 1.094, p.w * 0.664 * 1.1]} />
            <meshBasicMaterial map={glass.rim} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0, 0.006]}>
            <planeGeometry args={[p.w, p.w * 0.664]} />
            <meshBasicMaterial map={glass.shine[i]} alphaMap={glass.mask} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}


      {/* circular AI data wave wrapped around the robot */}
      <group ref={(g) => { if (g) rings.current[0] = g; }} position={[mobile ? 0 : -0.6, 0, 0]}>
        <AiWaveRing palette={palette} R={mobile ? 2.7 : 3.6} H={0.95} y={1.7} tilt={0.22} x={0} Nu={mobile ? 60 : 96} Nv={6} />
      </group>
      {!mobile && (
        <group ref={(g) => { if (g) rings.current[1] = g; }} position={[-0.6, 0, 0]}>
          <AiWaveRing palette={palette} R={2.9} H={0.6} y={3.7} tilt={-0.2} x={0} Nu={80} Nv={5} speed={1.3} />
        </group>
      )}

    </group>
  );
}
