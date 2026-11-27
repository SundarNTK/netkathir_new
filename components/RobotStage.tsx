/* eslint-disable react-hooks/immutability, react-hooks/purity -- imperative three.js animation: values are mutated per frame by design */
"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three-stdlib";
import { useLive } from "@/lib/live";
import { WORLD_DOTS } from "@/lib/worldDots";
import type { RobotPalette } from "./Hero3D";

/**
 * Everything that surrounds the home-page robot: three live glass cards beside it, and a grand animated backdrop
 * (a pale studio disc, a faint world map, light swooshes, glass bubbles and rising sparkles). All coordinates are in the robot stage; `cx` is where the robot stands.
 */

const ease = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const sstep = (a: number, b: number, x: number) => ease(clamp01((x - a) / (b - a)));
const back = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2));

type Ref<T> = { current: T };

function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* ============================ glass interfaces ============================ */

const TITLES = ["Project Growth", "Our Services", "Global Presence"];
const PW = 512;
const PH = 340;
const RES = 2; // texture pixels per layout pixel

/** One glass card, animated by time `t` (bars breathe, markers pulse, rings ripple...). */
function drawPage(c: CanvasRenderingContext2D, kind: number, t: number) {
  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    c.beginPath();
    c.roundRect(x, y, w, h, r);
  };
  const row = (x: number, y: number, w: number, h: number, r: number, fill = "rgba(255,255,255,0.8)") => {
    c.fillStyle = fill;
    rr(x, y, w, h, r);
    c.fill();
  };

  // frosted glass: translucent white-blue body, a glossy top highlight, a bright rim
  const g = c.createLinearGradient(0, 0, PW, PH);
  g.addColorStop(0, "rgba(255,255,255,0.88)");
  g.addColorStop(0.55, "rgba(236,250,241,0.76)");
  g.addColorStop(1, "rgba(200,238,214,0.68)");
  c.fillStyle = g;
  rr(0, 0, PW, PH, 28);
  c.fill();
  const gloss = c.createLinearGradient(0, 0, 0, PH * 0.55);
  gloss.addColorStop(0, "rgba(255,255,255,0.7)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = gloss;
  rr(0, 0, PW, PH, 28);
  c.fill();
  c.strokeStyle = "rgba(255,255,255,1)";
  c.lineWidth = 4;
  rr(2, 2, PW - 4, PH - 4, 26);
  c.stroke();
  c.strokeStyle = "rgba(110,205,150,0.65)";
  c.lineWidth = 1.5;
  rr(0.75, 0.75, PW - 1.5, PH - 1.5, 27.5);
  c.stroke();

  // header: icon chip + title + live dot
  const chip = c.createLinearGradient(20, 18, 58, 56);
  chip.addColorStop(0, "#4ade80");
  chip.addColorStop(1, "#16a34a");
  c.fillStyle = chip;
  rr(22, 20, 38, 38, 12);
  c.fill();
  c.fillStyle = "#ffffff";
  c.strokeStyle = "#ffffff";
  c.lineWidth = 2.5;
  if (kind === 0) {
    [0, 1, 2].forEach((i) => {
      c.beginPath();
      c.roundRect(31 + i * 7, 46 - (i + 1) * 6, 5, (i + 1) * 6 + 2, 1.5);
      c.fill();
    });
  } else if (kind === 1) {
    [0, 1, 2, 3].forEach((i) => {
      c.beginPath();
      c.roundRect(31 + (i % 2) * 11, 30 + Math.floor(i / 2) * 11, 8.5, 8.5, 2.5);
      c.fill();
    });
  } else {
    c.beginPath();
    c.arc(41, 39, 11, 0, 7);
    c.stroke();
    c.beginPath();
    c.ellipse(41, 39, 5, 11, 0, 0, 7);
    c.stroke();
    c.beginPath();
    c.moveTo(30, 39);
    c.lineTo(52, 39);
    c.stroke();
  }
  c.fillStyle = "#12402a";
  c.font = "800 29px Arial";
  c.textAlign = "left";
  c.textBaseline = "alphabetic";
  c.fillText(TITLES[kind], 72, 49);
  c.fillStyle = `rgba(34,197,94,${0.5 + 0.5 * Math.sin(t * 3)})`;
  c.beginPath();
  c.arc(484, 38, 7, 0, 7);
  c.fill();

  if (kind === 0) {
    // growth: rising bars with a trend arrow, and the headline number
    const N = 9;
    const base = 296;
    c.strokeStyle = "rgba(34,197,94,0.14)";
    c.lineWidth = 1.5;
    for (let k = 0; k < 4; k++) {
      c.beginPath();
      c.moveTo(28, base - k * 56);
      c.lineTo(306, base - k * 56);
      c.stroke();
    }
    const tops: [number, number][] = [];
    for (let i = 0; i < N; i++) {
      const x = 32 + i * 30.5;
      const h = (0.16 + 0.84 * Math.pow(i / (N - 1), 1.35)) * 180 * (0.96 + 0.04 * Math.sin(t * 1.3 + i * 0.8));
      const last = i === N - 1;
      const bg = c.createLinearGradient(0, base - h, 0, base);
      bg.addColorStop(0, last ? "#bef264" : "#5eead4");
      bg.addColorStop(1, last ? "#65a30d" : "#16a34a");
      c.fillStyle = bg;
      c.beginPath();
      c.roundRect(x, base - h, 23, h, [7, 7, 3, 3]);
      c.fill();
      tops.push([x + 11.5, base - h]);
    }
    c.strokeStyle = "#16a34a";
    c.lineWidth = 4.5;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    tops.forEach(([x, y], i) => (i ? c.lineTo(x, y - 14) : c.moveTo(x, y - 14)));
    c.stroke();
    const [ex, ey] = tops[N - 1];
    c.fillStyle = "#16a34a";
    c.beginPath();
    c.moveTo(ex + 12, ey - 24);
    c.lineTo(ex - 8, ey - 26);
    c.lineTo(ex + 2, ey - 6);
    c.closePath();
    c.fill();
    c.fillStyle = "#15803d";
    c.font = "700 19px Arial";
    c.fillText("2015", 28, base + 26);
    c.textAlign = "right";
    c.fillText("2026", 306, base + 26);
    c.textAlign = "left";
    // headline
    c.fillStyle = "#16a34a";
    c.font = "800 72px Arial";
    c.fillText("11+", 334, 160);
    c.fillStyle = "#12402a";
    c.font = "700 25px Arial";
    c.fillText("Years of", 336, 196);
    c.fillText("excellence", 336, 226);
    row(334, 246, 148, 38, 19, "rgba(22,163,74,0.14)");
    c.fillStyle = "#15803d";
    c.font = "700 19px Arial";
    c.fillText("Since 2015", 352, 272);
  } else if (kind === 1) {
    // services: the four disciplines, one highlighted in turn
    const areas: [string, string, string][] = [["AI & GenAI", "7 services", "#16a34a"], ["Enterprise Software", "6 services", "#f59e0b"], ["Cloud & DevOps", "2 services", "#0d9488"], ["Digital Transformation", "4 services", "#22c55e"]];
    const on = Math.floor(t * 0.6) % 4;
    areas.forEach(([name, cnt, col], i) => {
      const y = 78 + i * 58;
      row(22, y, 468, 50, 25, on === i ? "rgba(245,158,11,0.22)" : "rgba(255,255,255,0.86)");
      c.fillStyle = col;
      c.beginPath();
      c.arc(50, y + 25, 18, 0, 7);
      c.fill();
      c.fillStyle = "#ffffff";
      c.font = "800 17px Arial";
      c.textAlign = "center";
      c.fillText("0" + (i + 1), 50, y + 31);
      c.textAlign = "left";
      c.fillStyle = "#12402a";
      c.font = "800 24px Arial";
      c.fillText(name, 80, y + 32);
      c.fillStyle = on === i ? "#b45309" : "rgba(20,70,42,0.85)";
      c.font = "700 19px Arial";
      c.textAlign = "right";
      c.fillText(cnt, 474, y + 31);
      c.textAlign = "left";
    });
  } else {
    // global presence: dotted world map with pulsing offices, then the country chips
    c.fillStyle = "rgba(22,163,74,0.6)";
    for (let i = 0; i < WORLD_DOTS.length; i++) {
      const [lon, lat] = WORLD_DOTS[i];
      if (lat > 76 || lat < -56) continue;
      c.fillRect(24 + ((lon + 180) / 360) * 464, 68 + ((76 - lat) / 132) * 164, 2.6, 2.6);
    }
    const cities: [string, number, number][] = [["India (HQ)", 78, 21], ["Dubai", 55, 25], ["USA", -98, 38], ["Singapore", 104, 1.3], ["Malaysia", 102, 4.5], ["Australia", 134, -25]];
    const act = Math.floor(t * 0.7) % 6;
    cities.forEach(([, lon, lat], i) => {
      const x = 24 + ((lon + 180) / 360) * 464 + 1.3;
      const y = 68 + ((76 - lat) / 132) * 164 + 1.3;
      const on = act === i;
      c.fillStyle = on ? "#f59e0b" : "#06b6d4";
      c.beginPath();
      c.arc(x, y, on ? 7 : 5, 0, 7);
      c.fill();
      c.strokeStyle = on ? "rgba(245,158,11,0.75)" : "rgba(6,182,212,0.55)";
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(x, y, 8 + ((t * 10 + i * 4) % 15), 0, 7);
      c.stroke();
    });
    cities.forEach(([name], i) => {
      const x = 24 + (i % 3) * 158;
      const y = 244 + Math.floor(i / 3) * 44;
      const on = act === i;
      row(x, y, 150, 38, 19, on ? "rgba(245,158,11,0.24)" : "rgba(255,255,255,0.85)");
      c.fillStyle = on ? "#f59e0b" : "#16a34a";
      c.beginPath();
      c.arc(x + 20, y + 19, 6.5, 0, 7);
      c.fill();
      c.fillStyle = "#12402a";
      c.font = "700 19px Arial";
      c.fillText(name, x + 35, y + 26);
    });
  }
}

/** Redraws one card (charts breathe, markers pulse; no interaction needed). */
function renderInterface(c: CanvasRenderingContext2D, kind: number, t: number) {
  c.setTransform(RES, 0, 0, RES, 0, 0);
  c.clearRect(0, 0, PW, PH);
  drawPage(c, kind, t);
}

// stage coordinates, like the concept art: growth and services stacked on the right of the robot, global presence at
// the lower left under the globe (which floats over the robot's right hand, on the viewer's left)
const PANELS: { pos: [number, number, number]; w: number; kind: number; ry: number }[] = [
  { pos: [1.6, 4.5, 0.1], w: 1.75, kind: 0, ry: -0.34 }, // project growth
  { pos: [1.62, 2.85, 0.1], w: 1.75, kind: 1, ry: -0.38 }, // our services
  { pos: [-2.95, 1.0, 0.2], w: 1.85, kind: 2, ry: 0.34 }, // global presence
];

export function HoloPanels({ palette, en, cx }: { palette: RobotPalette; en: Ref<number>; cx: number }) {
  const panels = useRef<THREE.Group[]>([]);
  const mats = useRef<THREE.Material[][]>([]);
  const turn = useRef(0);

  // 3D glass: a thin reflective slab behind each card, a soft drop shadow, and a moving mirror glint
  const glass = useMemo(() => {
    const mask = canvasTex(512, 340, (c) => {
      c.fillStyle = "#000";
      c.fillRect(0, 0, 512, 340);
      c.fillStyle = "#fff";
      c.beginPath();
      c.roundRect(0, 0, 512, 340, 28);
      c.fill();
    });
    const streak = canvasTex(1024, 340, (c) => {
      const g = c.createLinearGradient(380, 0, 640, 0);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.5, "rgba(255,255,255,0.7)");
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
    streak.wrapS = THREE.RepeatWrapping;
    const shine = PANELS.map(() => {
      const t = streak.clone();
      t.needsUpdate = true;
      t.repeat.set(0.5, 1);
      return t;
    });
    const shadow = canvasTex(560, 400, (c) => {
      c.shadowColor = "rgba(20,110,60,0.5)";
      c.shadowBlur = 36;
      c.fillStyle = "rgba(20,110,60,0.55)";
      c.beginPath();
      c.roundRect(40, 40, 480, 320, 40);
      c.fill();
    });
    const slabs = PANELS.map((p) => new RoundedBoxGeometry(p.w, (p.w * PH) / PW, 0.08, 5, p.w * 0.052));
    return { mask, shine, shadow, slabs };
  }, []);

  // live canvases (redrawn ~10x/s while visible)
  const live = useMemo(
    () =>
      PANELS.map((p, i) => {
        const cv = document.createElement("canvas");
        cv.width = PW * RES;
        cv.height = PH * RES;
        const ctx = cv.getContext("2d")!;
        const tex = new THREE.CanvasTexture(cv);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        renderInterface(ctx, p.kind, i * 0.9);
        return { ctx, tex, last: -1 };
      }),
    []
  );

  const onStage = useLive();
  useFrame((s) => {
    if (!onStage.current) return;
    const t = palette.uTime.value;
    const E = en.current;
    turn.current += 1;
    // narrower windows pull the cards in towards the robot so none run off the edge
    const fit = THREE.MathUtils.clamp(s.size.width / s.size.height / 1.65, 0.62, 1);
    glass.shine.forEach((tx, i) => (tx.offset.x = ((t * 0.13 + i * 0.21) % 2.4) - 0.9));
    PANELS.forEach((p, i) => {
      const g = panels.current[i];
      if (!g) return;
      const appear = sstep(5.3 + i * 0.3, 6.2 + i * 0.3, E);
      g.position.set(cx + (p.pos[0] - cx) * fit, p.pos[1] + Math.sin(t * 1.2 + i * 1.3) * 0.07, p.pos[2]);
      g.rotation.set(Math.sin(t * 0.6 + i) * 0.015, p.ry + Math.sin(t * 0.5 + i) * 0.03, 0);
      g.scale.setScalar(Math.max(0.001, back(appear)));
      g.visible = appear > 0.01;
      mats.current[i]?.forEach((m) => {
        const base = (m.userData.base as number) ?? 1;
        m.opacity = base * appear;
      });
      const L = live[i];
      if (g.visible && turn.current % PANELS.length === i && t - L.last > 0.09) {
        L.last = t;
        renderInterface(L.ctx, p.kind, t);
        L.tex.needsUpdate = true;
      }
    });
  });

  const reg = (i: number, k: number, base: number) => (m: THREE.Material | null) => {
    if (!m) return;
    (mats.current[i] ??= [])[k] = m;
    m.userData.base = base;
  };

  return (
    <>
      {PANELS.map((p, i) => {
        const h = (p.w * PH) / PW;
        return (
          <group key={i} ref={(g) => { if (g) panels.current[i] = g; }} position={p.pos} visible={false}>
            {/* soft shadow under the glass */}
            <mesh position={[0.05, -0.1, -0.2]} renderOrder={-2}>
              <planeGeometry args={[p.w * 1.18, h * 1.24]} />
              <meshBasicMaterial ref={reg(i, 0, 0.55)} map={glass.shadow} transparent depthWrite={false} toneMapped={false} />
            </mesh>
            {/* glass slab: gives the card real thickness and picks up the studio reflections */}
            <mesh geometry={glass.slabs[i]} position={[0, 0, -0.05]}>
              <meshPhysicalMaterial ref={reg(i, 1, 0.5)} color="#d6f2e1" transparent roughness={0.1} metalness={0} clearcoat={1} clearcoatRoughness={0.08} envMapIntensity={1.4} depthWrite={false} />
            </mesh>
            {/* the interface itself */}
            <mesh>
              <planeGeometry args={[p.w, h]} />
              <meshBasicMaterial ref={reg(i, 2, 1)} map={live[i].tex} transparent side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
            </mesh>
            {/* sliding glint */}
            <mesh position={[0, 0, 0.006]}>
              <planeGeometry args={[p.w, h]} />
              <meshBasicMaterial ref={reg(i, 3, 0.4)} map={glass.shine[i]} alphaMap={glass.mask} transparent depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

/* ================================== soft, bright stage backdrop ================================== */

/** a big pale disc of light: it cleans up the page behind the robot and gives it a bright "studio" feel */
function discTexture() {
  return canvasTex(512, 512, (c) => {
    const g = c.createRadialGradient(256, 256, 0, 256, 256, 256);
    g.addColorStop(0, "rgba(255,255,255,0.92)");
    g.addColorStop(0.42, "rgba(226,246,232,0.72)");
    g.addColorStop(0.72, "rgba(190,232,205,0.34)");
    g.addColorStop(1, "rgba(170,225,190,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 512, 512);
  });
}

/** soft blue glow behind the head */
function glowTexture() {
  return canvasTex(512, 512, (c) => {
    const g = c.createRadialGradient(256, 256, 8, 256, 256, 256);
    g.addColorStop(0, "rgba(110,220,160,0.5)");
    g.addColorStop(0.35, "rgba(70,190,120,0.22)");
    g.addColorStop(1, "rgba(70,190,120,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 512, 512);
  });
}

/** a faint dotted world map that fades out at its edges */
function mapTexture() {
  return canvasTex(1024, 512, (c) => {
    c.fillStyle = "rgba(22,140,80,0.75)";
    for (let i = 0; i < WORLD_DOTS.length; i++) {
      const [lon, lat] = WORLD_DOTS[i];
      c.beginPath();
      c.arc(((lon + 180) / 360) * 1024, ((90 - lat) / 180) * 512, 3.1, 0, 7);
      c.fill();
    }
    c.globalCompositeOperation = "destination-in";
    const g = c.createRadialGradient(512, 256, 0, 512, 256, 512);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.5, "rgba(0,0,0,0.8)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 1024, 512);
  });
}

/** graceful light swooshes (tilted orbits) that pass behind the robot */
function swooshTexture() {
  return canvasTex(1024, 1024, (c) => {
    c.translate(512, 512);
    c.lineCap = "round";
    const rings = [
      { rx: 470, ry: 150, rot: -0.5, w: 5 },
      { rx: 430, ry: 110, rot: 0.38, w: 3.2 },
      { rx: 495, ry: 215, rot: -0.1, w: 2.4 },
    ];
    rings.forEach((r) => {
      c.save();
      c.rotate(r.rot);
      const g = c.createLinearGradient(-r.rx, 0, r.rx, 0);
      g.addColorStop(0, "rgba(90,200,140,0)");
      g.addColorStop(0.3, "rgba(90,200,140,0.75)");
      g.addColorStop(0.5, "rgba(255,255,255,1)");
      g.addColorStop(0.7, "rgba(90,200,140,0.75)");
      g.addColorStop(1, "rgba(90,200,140,0)");
      c.strokeStyle = g;
      c.lineWidth = r.w;
      c.shadowColor = "rgba(60,180,110,0.9)";
      c.shadowBlur = 16;
      c.beginPath();
      c.ellipse(0, 0, r.rx, r.ry, 0, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    });
  });
}

/** a glossy glass bubble */
function orbTexture() {
  return canvasTex(128, 128, (c) => {
    const g = c.createRadialGradient(46, 40, 4, 64, 64, 60);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.2, "rgba(200,245,215,0.8)");
    g.addColorStop(0.62, "rgba(70,200,130,0.7)");
    g.addColorStop(1, "rgba(22,140,80,0.85)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(64, 64, 60, 0, 7);
    c.fill();
    const rim = c.createRadialGradient(64, 64, 40, 64, 64, 60);
    rim.addColorStop(0, "rgba(255,255,255,0)");
    rim.addColorStop(1, "rgba(255,255,255,0.45)");
    c.fillStyle = rim;
    c.fill();
    c.fillStyle = "rgba(255,255,255,0.85)";
    c.beginPath();
    c.ellipse(44, 34, 15, 8, -0.6, 0, 7);
    c.fill();
  });
}

const SPARK_V = /* glsl */ `
uniform float uTime; uniform float uPx;
attribute float aS; attribute vec3 aC;
varying vec3 vC; varying float vA;
void main(){
  vec3 p = position;
  float sp = 0.16 + aS * 0.34;
  p.y = mod(p.y + uTime * sp, 7.5) - 0.8;
  p.x += sin(uTime * 0.5 + aS * 40.0) * 0.3;
  p.z += cos(uTime * 0.4 + aS * 30.0) * 0.3;
  float life = (p.y + 0.8) / 7.5;
  vA = smoothstep(0.0, 0.1, life) * (1.0 - smoothstep(0.72, 1.0, life)) * (0.55 + 0.45 * sin(uTime * (1.5 + aS * 2.0) + aS * 50.0));
  vC = aC;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = (8.0 + aS * 16.0) * uPx * (1.0 / -mv.z) * 3.4;
  gl_Position = projectionMatrix * mv;
}`;
const SPARK_F = /* glsl */ `
varying vec3 vC; varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vC, a * a * vA);
}`;

/** glowing sparks that drift up through the whole scene */
function Sparks({ palette, count, en }: { palette: RobotPalette; count: number; en: Ref<number> }) {
  const geo = useMemo(() => {
    const p = new Float32Array(count * 3);
    const s = new Float32Array(count);
    const c = new Float32Array(count * 3);
    const cols = ["#5aa9ff", "#22c55e", "#7dd3fc", "#ffffff", "#2dd4bf"].map((h) => new THREE.Color(h));
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 11;
      p[i * 3 + 1] = Math.random() * 7.5;
      p[i * 3 + 2] = -2.5 + Math.random() * 3.5;
      s[i] = Math.random();
      const col = cols[Math.floor(Math.random() * cols.length)];
      c.set([col.r, col.g, col.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("aS", new THREE.BufferAttribute(s, 1));
    g.setAttribute("aC", new THREE.BufferAttribute(c, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 3, 0), 40);
    return g;
  }, [count]);
  const uni = useMemo(() => ({ uTime: palette.uTime, uPx: { value: 1 } }), [palette]);
  const pts = useRef<THREE.Points>(null!);
  useFrame((s) => {
    uni.uPx.value = s.gl.getPixelRatio();
    pts.current.visible = en.current > 1.2;
  });
  return (
    <points ref={pts} geometry={geo} frustumCulled={false}>
      <shaderMaterial vertexShader={SPARK_V} fragmentShader={SPARK_F} uniforms={uni} transparent depthWrite={false} />
    </points>
  );
}

// glass bubbles floating around the stage (relative to the robot)
const ORBS: { p: [number, number, number]; s: number; ph: number }[] = [
  { p: [-3.0, 5.9, -1.4], s: 0.5, ph: 0 },
  { p: [2.9, 6.0, -1.6], s: 0.36, ph: 1.3 },
  { p: [3.25, 0.5, -0.7], s: 0.68, ph: 2.1 },
  { p: [-3.3, 0.35, -0.9], s: 0.42, ph: 3.4 },
  { p: [-0.9, 6.5, -2.2], s: 0.28, ph: 4.2 },
  { p: [3.7, 3.4, -2.2], s: 0.3, ph: 5.1 },
];

export function Backdrop({ palette, en, cx, mouse, mobile }: { palette: RobotPalette; en: Ref<number>; cx: number; mouse: Ref<{ x: number; y: number }>; mobile: boolean }) {
  const root = useRef<THREE.Group>(null!);
  const disc = useRef<THREE.Mesh>(null!);
  const map = useRef<THREE.Mesh>(null!);
  const aura = useRef<THREE.Mesh>(null!);
  const swoosh = useRef<THREE.Mesh[]>([]);
  const orbs = useRef<THREE.Mesh[]>([]);
  const tex = useMemo(() => ({ disc: discTexture(), glow: glowTexture(), map: mapTexture(), swoosh: swooshTexture(), orb: orbTexture() }), []);
  const live = useLive();

  useFrame((_, dt) => {
    if (!live.current) return;
    const d = Math.min(dt, 0.1);
    const t = palette.uTime.value;
    const E = en.current;
    // a gentle parallax with the cursor gives the backdrop depth
    root.current.position.x = THREE.MathUtils.damp(root.current.position.x, cx + mouse.current.x * 0.22, 3, d);
    root.current.position.y = THREE.MathUtils.damp(root.current.position.y, mouse.current.y * 0.08, 3, d);
    const aIn = sstep(0.2, 2.0, E);
    disc.current.scale.setScalar((mobile ? 7.5 : 12) * (0.98 + 0.02 * Math.sin(t * 0.7)) * (0.8 + 0.2 * aIn));
    (disc.current.material as THREE.MeshBasicMaterial).opacity = aIn;
    map.current.scale.set(mobile ? 8 : 12.5, mobile ? 4 : 6.25, 1);
    map.current.position.x = Math.sin(t * 0.12) * 0.35;
    (map.current.material as THREE.MeshBasicMaterial).opacity = aIn * (0.34 + 0.05 * Math.sin(t * 0.9));
    aura.current.scale.setScalar((mobile ? 4.5 : 6.6) * (0.95 + 0.05 * Math.sin(t * 1.1)));
    (aura.current.material as THREE.MeshBasicMaterial).opacity = aIn;
    swoosh.current.forEach((m, i) => {
      if (!m) return;
      const k = sstep(1.2 + i * 0.5, 2.8 + i * 0.5, E);
      m.rotation.z = (i ? 0.2 : -0.12) + Math.sin(t * 0.25 + i * 2) * 0.07;
      m.scale.setScalar((mobile ? 0.62 : 1) * (i ? 9.5 : 12.5) * (0.85 + 0.15 * k));
      (m.material as THREE.MeshBasicMaterial).opacity = k * (i ? 0.55 : 0.7);
    });
    orbs.current.forEach((m, i) => {
      if (!m) return;
      const o = ORBS[i];
      const k = sstep(1.8 + i * 0.25, 3 + i * 0.25, E);
      m.position.set(o.p[0], o.p[1] + Math.sin(t * 0.9 + o.ph) * 0.18, o.p[2]);
      m.scale.setScalar(o.s * Math.max(0.001, k));
      m.visible = k > 0.01 && !(mobile && i > 3);
    });
  });

  return (
    <group ref={root} position={[cx, 0, 0]}>
      <mesh ref={disc} position={[0, 2.9, -3.4]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={tex.disc} transparent depthWrite={false} toneMapped={false} opacity={0} />
      </mesh>
      <mesh ref={map} position={[0, 3.2, -3.2]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={tex.map} transparent depthWrite={false} toneMapped={false} opacity={0} />
      </mesh>
      <mesh ref={aura} position={[0, 3.2, -2.6]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={tex.glow} transparent depthWrite={false} toneMapped={false} opacity={0} />
      </mesh>
      {[0, 1].map((i) => (
        <mesh key={i} ref={(m) => { if (m) swoosh.current[i] = m; }} position={[0, 2.8, -2.0 + i * 0.3]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={tex.swoosh} transparent depthWrite={false} toneMapped={false} opacity={0} />
        </mesh>
      ))}
      {ORBS.map((o, i) => (
        <mesh key={i} ref={(m) => { if (m) orbs.current[i] = m; }} position={o.p} visible={false}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={tex.orb} transparent depthWrite={false} toneMapped={false} opacity={0.9} />
        </mesh>
      ))}
      <Sparks palette={palette} count={mobile ? 60 : 130} en={en} />
    </group>
  );
}
