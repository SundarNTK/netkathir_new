/* eslint-disable react-hooks/immutability -- imperative three.js animation: values are mutated per frame by design */
"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three-stdlib";
import { useLive } from "@/lib/live";
import { traceImageToShapes } from "@/lib/traceShape";
import { WORLD_DOTS } from "@/lib/worldDots";
import type { RobotPalette } from "./Hero3D";
import { Backdrop, HoloPanels } from "./RobotStage";

/* ===================================== helpers ===================================== */

const ease = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const sstep = (a: number, b: number, x: number) => ease(clamp01((x - a) / (b - a)));
const back = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2));
const DOWN = new THREE.Vector3(0, -1, 0);

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

/* ============================ the face screen (expressions) ============================ */

export type Expr = "normal" | "happy" | "focus" | "wink" | "surprised" | "love" | "stars" | "dizzy";
const FW = 512;
const FH = 320; // matches the visor patch (about 1.6 : 1) so the eyes stay round on screen
// eyes and mouth follow the mascot sheet: two big round eyes, set wide, with a small smile below
// (placed in texture space so that, once wrapped round the curved visor, they land where the sheet has them)
const EYE = { l: [161, 150], r: [351, 150] } as const;
const EYE_R = 41;
const MOUTH = [256, 222] as const;

function heartPath(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.beginPath();
  c.moveTo(x, y + s * 0.35);
  c.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.55, y - s * 1.15, x, y - s * 0.5);
  c.bezierCurveTo(x + s * 0.55, y - s * 1.15, x + s * 1.1, y - s * 0.35, x, y + s * 0.35);
  c.closePath();
}
function starPath(c: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    c[i ? "lineTo" : "moveTo"](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
}

/** draws the glowing eyes + mouth for an expression on a transparent canvas */
function drawFace(c: CanvasRenderingContext2D, expr: Expr, blink: number, t: number) {
  c.clearRect(0, 0, FW, FH);
  const cyan = "#2ad2ff";
  c.lineCap = "round";
  c.lineJoin = "round";
  const glow = (col: string, b = 30) => {
    c.shadowColor = col;
    c.shadowBlur = b;
  };
  // the mascot's big round eyes: bright cyan discs with a lighter core and a soft electric-blue halo
  const eyeDisc = (x: number, y: number, rx: number, ry: number) => {
    const h = Math.max(ry, 4);
    const g = c.createRadialGradient(x, y - h * 0.15, 3, x, y, Math.max(rx, h));
    g.addColorStop(0, "#a8f7ff");
    g.addColorStop(0.5, "#2fd6ff");
    g.addColorStop(1, "#0b9eff");
    c.save();
    c.shadowColor = "#1b98ff";
    c.shadowBlur = 46;
    c.fillStyle = g;
    for (let k = 0; k < 2; k++) {
      c.beginPath();
      c.ellipse(x, y, rx, h, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  };
  const arcEye = (x: number, y: number) => {
    c.beginPath();
    c.arc(x, y + 22, 40, Math.PI * 1.12, Math.PI * 1.88);
    c.stroke();
  };
  const [lx, ly] = EYE.l;
  const [rx, ry] = EYE.r;
  const R = EYE_R;
  const open = 1 - blink * 0.92;
  glow(cyan, 34);
  c.fillStyle = cyan;
  c.strokeStyle = cyan;
  c.lineWidth = 17;
  if (expr === "normal") {
    eyeDisc(lx, ly, R, R * open);
    eyeDisc(rx, ry, R, R * open);
  } else if (expr === "happy") {
    arcEye(lx, ly);
    arcEye(rx, ry);
  } else if (expr === "focus") {
    eyeDisc(lx, ly + 10, R, 25 * open);
    eyeDisc(rx, ry + 10, R, 25 * open);
  } else if (expr === "wink") {
    arcEye(lx, ly);
    eyeDisc(rx, ry, R, R);
  } else if (expr === "surprised") {
    c.lineWidth = 14;
    [lx, rx].forEach((x) => {
      c.beginPath();
      c.arc(x, ly, 42 + Math.sin(t * 18) * 2.5, 0, Math.PI * 2);
      c.stroke();
    });
  } else if (expr === "love") {
    glow("#ff4d7d", 32);
    c.fillStyle = "#ff5c8a";
    const p = 1 + Math.sin(t * 9) * 0.08;
    heartPath(c, lx, ly + 8, 52 * p);
    c.fill();
    heartPath(c, rx, ry + 8, 52 * p);
    c.fill();
  } else if (expr === "stars") {
    glow("#ffd23f", 32);
    c.fillStyle = "#ffd84d";
    starPath(c, lx, ly, 56, t * 2);
    c.fill();
    starPath(c, rx, ry, 56, -t * 2);
    c.fill();
  } else if (expr === "dizzy") {
    c.lineWidth = 9;
    [lx, rx].forEach((x, k) => {
      c.beginPath();
      for (let i = 0; i <= 60; i++) {
        const a = (i / 60) * Math.PI * 5 + t * (k ? -6 : 6);
        const r = (i / 60) * 42;
        c[i ? "lineTo" : "moveTo"](x + Math.cos(a) * r, ly + Math.sin(a) * r);
      }
      c.stroke();
    });
  }
  // mouth: the small smile (a shallow arc), wider for the happy moods
  glow(cyan, 20);
  c.strokeStyle = cyan;
  c.fillStyle = cyan;
  c.lineWidth = 9;
  const smile = (halfW: number, depth: number, base: number) => {
    const rr = (halfW * halfW + depth * depth) / (2 * depth);
    const th = Math.asin(Math.min(1, halfW / rr));
    c.beginPath();
    c.arc(MOUTH[0], base - rr, rr, Math.PI / 2 - th, Math.PI / 2 + th);
    c.stroke();
  };
  if (expr === "surprised") {
    c.beginPath();
    c.arc(MOUTH[0], MOUTH[1], 17, 0, Math.PI * 2);
    c.stroke();
  } else if (expr === "dizzy") {
    c.beginPath();
    for (let x = MOUTH[0] - 36; x <= MOUTH[0] + 36; x += 4) c[x === MOUTH[0] - 36 ? "moveTo" : "lineTo"](x, MOUTH[1] + Math.sin(x / 7 + t * 8) * 5);
    c.stroke();
  } else {
    const wide = expr === "happy" || expr === "love" || expr === "stars" || expr === "wink";
    if (wide) smile(54, 30, MOUTH[1] + 10);
    else smile(40, 15, MOUTH[1] + 4);
  }
  c.shadowBlur = 0;
  // glass gloss: broad soft reflections across the visor, like the studio shine on the mascot sheet
  const gl = c.createLinearGradient(0, 10, 0, 92);
  gl.addColorStop(0, "rgba(255,255,255,0.30)");
  gl.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = gl;
  c.beginPath();
  c.ellipse(190, 44, 160, 30, -0.07, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(190,225,255,0.14)";
  c.beginPath();
  c.ellipse(430, 70, 30, 11, -0.55, 0, Math.PI * 2);
  c.fill();
  const rim = c.createLinearGradient(0, FH - 70, 0, FH);
  rim.addColorStop(0, "rgba(80,170,255,0)");
  rim.addColorStop(1, "rgba(80,170,255,0.18)");
  c.fillStyle = rim;
  c.fillRect(0, FH - 70, FW, 70);
}

/* ================================== holographic globe ================================== */

function HoloGlobe({ palette }: { palette: RobotPalette }) {
  const spin = useRef<THREE.Group>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const ring2 = useRef<THREE.Mesh>(null!);
  const dots = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(WORLD_DOTS.length * 3);
    WORLD_DOTS.forEach(([lon, lat], i) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const th = (lon + 180) * (Math.PI / 180);
      p.set([-Math.sin(phi) * Math.cos(th) * 0.6, Math.cos(phi) * 0.6, Math.sin(phi) * Math.sin(th) * 0.6], i * 3);
    });
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  const halo = useMemo(
    () =>
      canvasTex(128, 128, (c) => {
        const g = c.createRadialGradient(64, 64, 8, 64, 64, 64);
        g.addColorStop(0, "rgba(130,240,180,0.6)");
        g.addColorStop(0.5, "rgba(70,200,130,0.22)");
        g.addColorStop(1, "rgba(70,200,130,0)");
        c.fillStyle = g;
        c.fillRect(0, 0, 128, 128);
      }),
    []
  );
  const live = useLive();
  useFrame(() => {
    if (!live.current) return;
    const t = palette.uTime.value;
    spin.current.rotation.y = t * 0.45;
    ring.current.rotation.z = t * 0.7;
    ring2.current.rotation.z = -t * 0.5;
  });
  return (
    <group>
      <mesh position={[0, 0, -0.3]}>
        <planeGeometry args={[2.6, 2.6]} />
        <meshBasicMaterial map={halo} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      {/* light pooling on the open palm */}
      <mesh position={[0, -0.78, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.3, 1.3]} />
        <meshBasicMaterial map={halo} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <group ref={spin} rotation={[0.35, 0, 0.15]}>
        <mesh>
          <sphereGeometry args={[0.58, 40, 28]} />
          <meshBasicMaterial color="#1fb86a" transparent opacity={0.5} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.6, 24, 16]} />
          <meshBasicMaterial color="#dcffe9" wireframe transparent opacity={0.3} depthWrite={false} toneMapped={false} />
        </mesh>
        <points geometry={dots}>
          <pointsMaterial color="#f4fff7" size={0.05} sizeAttenuation transparent opacity={0.98} depthWrite={false} toneMapped={false} />
        </points>
      </group>
      <mesh ref={ring} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[0.82, 0.014, 8, 90]} />
        <meshBasicMaterial color="#6fe6a4" transparent opacity={0.9} toneMapped={false} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 1.7, 0.4, 0]}>
        <torusGeometry args={[0.95, 0.008, 8, 90]} />
        <meshBasicMaterial color="#bff5d4" transparent opacity={0.7} toneMapped={false} />
      </mesh>
      <pointLight color="#3fe08f" intensity={5} distance={3.5} />
    </group>
  );
}

/* ================================== particles for reactions ================================== */

type FX = { kind: "heart" | "star" | "bang" | "spark"; life: number; max: number; x: number; y: number; vx: number; vy: number; s: number };
function fxTexture(kind: FX["kind"]) {
  return canvasTex(128, 128, (c) => {
    if (kind === "heart") {
      c.shadowColor = "#ff4d7d";
      c.shadowBlur = 16;
      c.fillStyle = "#ff5c8a";
      heartPath(c, 64, 70, 44);
      c.fill();
    } else if (kind === "star" || kind === "spark") {
      c.shadowColor = "#ffcf33";
      c.shadowBlur = 16;
      c.fillStyle = kind === "star" ? "#ffd84d" : "#ffffff";
      starPath(c, 64, 64, 46, 0);
      c.fill();
    } else {
      c.fillStyle = "#ef4444";
      c.font = "900 96px Arial";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("!", 64, 66);
    }
  });
}

/* ================================== IK ================================== */

/**
 * A rounded-rectangle patch lying on an ellipsoid (rx, ry, rz): the big visor that covers the whole face, like the
 * mascot sheet. `skirt` adds an edge that tucks back into the helmet so the visor reads as an inset glass panel.
 * UVs span the patch, so the face texture fills the visor exactly.
 */
function visorGeometry(rx: number, ry: number, rz: number, halfAz: number, halfEl: number, elC: number, k: number, skirt = 0, n = 5) {
  const R = 18, S = 96;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const put = (u: number, v: number, kk: number) => {
    const az = u * halfAz, el = elC + v * halfEl;
    pos.push(Math.sin(az) * Math.cos(el) * rx * kk, Math.sin(el) * ry * kk, Math.cos(az) * Math.cos(el) * rz * kk);
    uv.push((u + 1) / 2, (v + 1) / 2);
  };
  const edge = (sI: number) => {
    const a = (sI / S) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
    return [Math.sign(c) * Math.abs(c) ** (2 / n), Math.sign(sn) * Math.abs(sn) ** (2 / n)];
  };
  put(0, 0, k);
  for (let r = 1; r <= R; r++)
    for (let i = 0; i < S; i++) {
      const [u, v] = edge(i);
      put((u * r) / R, (v * r) / R, k);
    }
  const rings = skirt ? R + 1 : R;
  if (skirt)
    for (let i = 0; i < S; i++) {
      const [u, v] = edge(i);
      put(u, v, skirt);
    }
  for (let i = 0; i < S; i++) idx.push(0, 1 + i, 1 + ((i + 1) % S));
  for (let r = 1; r < rings; r++) {
    const a = 1 + (r - 1) * S, b = 1 + r * S;
    for (let i = 0; i < S; i++) {
      const j = (i + 1) % S;
      idx.push(a + i, b + i, b + j, a + i, b + j, a + j);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/**
 * The black accordion tubes the mascot has for upper arms and knees: a lathe whose radius swells into rounded
 * ridges separated by narrow grooves. Runs from y = 0 down to y = -len.
 */
function ribbedGeometry(radius: number, len: number, ribs: number) {
  const pts: THREE.Vector2[] = [];
  const N = ribs * 10;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const ridge = Math.pow(Math.abs(Math.sin(u * ribs * Math.PI)), 0.45);
    pts.push(new THREE.Vector2(radius * (0.76 + 0.24 * ridge), -len + u * len));
  }
  return new THREE.LatheGeometry(pts, 32);
}

/** A rounded box that narrows towards its bottom (the mascot's chest plate is wider at the shoulders). */
function taperedBox(w: number, h: number, d: number, seg: number, rad: number, bottomX: number, bottomZ = 1) {
  const g = new RoundedBoxGeometry(w, h, d, seg, rad);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const k = THREE.MathUtils.clamp((pos.getY(i) + h / 2) / h, 0, 1); // 0 at the bottom, 1 at the top
    pos.setX(i, pos.getX(i) * THREE.MathUtils.lerp(bottomX, 1, k));
    pos.setZ(i, pos.getZ(i) * THREE.MathUtils.lerp(bottomZ, 1, k));
  }
  pos.needsUpdate = true;
  return g;
}

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

/* ================================== layout ================================== */

/**
 * Layout of the mascot, in robot space (y up, soles on y = 0), measured off the reference sheet: a big round head on a
 * long body, long legs with chunky boots, and long arms with black ribbed upper arms.
 */
const L = {
  hip: 1.75, // hip pivot height when standing
  upperLeg: 0.5,
  lowerLeg: 0.85,
  ankle: 0.44, // ankle pivot height when standing
  hipX: 0.52,
  ankleX: 0.7,
  shoulderX: 1.1,
  shoulderY: 3.3,
  upperArm: 0.82,
  foreArm: 0.72,
  head: 4.82, // head centre
  scale: 0.83, // the whole figure is taller than before, so scale it to keep the hero composition
};

/**
 * Netkathir AI mascot on a glowing pedestal: white helmet, black visor with an expressive face screen, headphones,
 * antennas, the Netkathir emblem on the chest. It waves hello, holds a holographic globe, then sits and works on a
 * laptop, and back again. Hovering makes it smile; clicking it pokes it (surprise, hearts, stars, dizzy, giggle).
 */
export default function AICore({ palette, mobile }: { palette: RobotPalette; mobile: boolean }) {
  const robot = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const torso = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const antenna = useRef<THREE.Group[]>([]);
  const hips = useRef<THREE.Group[]>([]);
  const knees = useRef<THREE.Group[]>([]);
  const ankles = useRef<THREE.Group[]>([]);
  const upP = useRef<THREE.Group>(null!);
  const foP = useRef<THREE.Group>(null!);
  const upR = useRef<THREE.Group>(null!);
  const foR = useRef<THREE.Group>(null!);
  const handP = useRef<THREE.Group>(null!);
  const handR = useRef<THREE.Group>(null!);
  const fingers = useRef<THREE.Group[][]>([[], []]);
  const globe = useRef<THREE.Group>(null!);
  const bubble = useRef<THREE.Mesh>(null!);
  const pedRing = useRef<THREE.Mesh[]>([]);
  const fxMeshes = useRef<THREE.Mesh[]>([]);
  const colliders = useRef<THREE.Mesh[]>([]);
  const mouse = useRef({ x: 0, y: 0, inside: false });
  const click = useRef<{ x: number; y: number } | null>(null);
  const react = useRef<{ kind: string; t0: number; part: string } | null>(null);
  const pokes = useRef(0);
  const hovered = useRef(0);
  const fx = useRef<FX[]>([]);
  const en = useRef(0);
  const frames = useRef(0);
  const scroll = useRef(0);
  const pinAt = useRef<number | null>(null);
  const faceState = useRef({ expr: "" as Expr | "", blink: -1, t: -1 });
  const K = useMemo(
    () => ({ v1: new THREE.Vector3(), v2: new THREE.Vector3(), q: new THREE.Quaternion(), x: new THREE.Vector3(), y: new THREE.Vector3(), z: new THREE.Vector3(), m: new THREE.Matrix4(), S: new THREE.Vector3(), E: new THREE.Vector3(), W: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), pole: new THREE.Vector3(), t: new THREE.Vector3(), r: new THREE.Vector3(), u: new THREE.Vector3(), bp: new THREE.Vector3(), q1: new THREE.Quaternion(), q2: new THREE.Quaternion(), q3: new THREE.Quaternion(), front: new THREE.Vector3(), ndc: new THREE.Vector2(), ray: new THREE.Raycaster(), hw: new THREE.Vector3() }),
    []
  );
  const RX = mobile ? 0 : -1.0; // where the robot stands in the stage

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("robotAt");
    pinAt.current = v === null ? null : Number(v);
    const wake = () => (frames.current = 0);
    window.addEventListener("nk:intro-done", wake);
    const mv = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
      mouse.current.inside = true;
    };
    const out = (e: MouseEvent) => {
      if (!e.relatedTarget) mouse.current.inside = false;
    };
    // the canvas sits behind the page, so clicks are caught on the window and tested against the robot
    const down = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("a,button,input,textarea,select,label,header,[role=combobox]")) return;
      click.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: -((e.clientY / window.innerHeight) * 2 - 1) };
    };
    window.addEventListener("mousemove", mv, { passive: true });
    document.addEventListener("mouseout", out);
    window.addEventListener("pointerdown", down);
    return () => {
      window.removeEventListener("nk:intro-done", wake);
      window.removeEventListener("mousemove", mv);
      document.removeEventListener("mouseout", out);
      window.removeEventListener("pointerdown", down);
    };
  }, []);

  // ---- the real 3D Netkathir emblem for the chest (traced from the icon, exact brand colours)
  const [logoGeo, setLogoGeo] = useState<THREE.BufferGeometry | null>(null);
  const logoMat = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }), []);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      try {
        const { shapes, sample } = traceImageToShapes(img, 200, 1);
        if (shapes.length) {
          const geo = new THREE.ExtrudeGeometry(shapes, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.007, bevelSegments: 2, curveSegments: 1 });
          const pos = geo.attributes.position;
          const nor = geo.attributes.normal;
          const col = new Float32Array(pos.count * 3);
          const c = new THREE.Color();
          for (let i = 0; i < pos.count; i++) {
            const [r, g, b] = sample(pos.getX(i), pos.getY(i));
            c.setRGB(r, g, b, THREE.SRGBColorSpace);
            const side = 0.62 + 0.38 * Math.min(1, Math.abs(nor.getZ(i)) * 1.6);
            col.set([c.r * side, c.g * side, c.b * side], i * 3);
          }
          geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
          geo.center();
          setLogoGeo(geo);
        }
      } catch (err) {
        console.warn("[AICore] 3D logo trace failed", err);
      }
    };
    img.src = "/images/brand/netkathir-emblem.png";
  }, []);

  const M = useMemo(() => {
    const shell = new THREE.MeshPhysicalMaterial({ color: "#f6f8f9", roughness: 0.18, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.15 });
    const shell2 = new THREE.MeshPhysicalMaterial({ color: "#e6ecef", roughness: 0.24, metalness: 0.08, clearcoat: 0.8, clearcoatRoughness: 0.12, envMapIntensity: 1.1 });
    const black = new THREE.MeshPhysicalMaterial({ color: "#15191d", roughness: 0.32, metalness: 0.7, clearcoat: 0.6, envMapIntensity: 1.2 });
    const visor = new THREE.MeshPhysicalMaterial({ color: "#03060b", roughness: 0.06, metalness: 0, ior: 1.7, clearcoat: 0.8, clearcoatRoughness: 0.04, envMapIntensity: 0.6, side: THREE.DoubleSide });
    const glow = new THREE.MeshBasicMaterial({ color: "#2fd3ff", toneMapped: false });
    const blue = new THREE.MeshBasicMaterial({ color: "#2f8cff", toneMapped: false });
    // headband + ear-cup trim: deep navy, like the mascot's headphones
    const navy = new THREE.MeshPhysicalMaterial({ color: "#1a2547", roughness: 0.3, metalness: 0.55, clearcoat: 0.9, clearcoatRoughness: 0.1, envMapIntensity: 1.2 });
    // the glossy blue balls on the antennas
    const ball = new THREE.MeshPhysicalMaterial({ color: "#1f7bff", emissive: "#1257ff", emissiveIntensity: 0.75, roughness: 0.1, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.4 });
    const yellow = new THREE.MeshBasicMaterial({ color: "#fde047", toneMapped: false });
    const silver = new THREE.MeshPhysicalMaterial({ color: "#eef2f6", roughness: 0.22, metalness: 0.35, clearcoat: 1, envMapIntensity: 1.3 });
    return { shell, shell2, black, visor, glow, blue, navy, ball, yellow, silver };
  }, []);

  const G = useMemo(() => {
    // the visor is a big rounded-rectangle glass panel set into the helmet; the face screen lies just above it
    const HR = [1.3, 1.1, 1.16] as const;
    const visorG = visorGeometry(HR[0], HR[1], HR[2], 1.05, 0.72, -0.24, 1.03, 0.96, 3.4);
    const face = visorGeometry(HR[0], HR[1], HR[2], 1.05, 0.72, -0.24, 1.036, 0, 3.4);
    return {
      visorG,
      sph: new THREE.SphereGeometry(1, 40, 32),
      cap: (r: number, l: number) => new THREE.CapsuleGeometry(r, l, 8, 24),
      ring: (r: number, t: number, arc = Math.PI * 2) => new THREE.TorusGeometry(r, t, 14, 56, arc),
      face,
      torso: taperedBox(1.8, 1.3, 1.04, 5, 0.3, 0.78, 0.9),
      lightBay: new RoundedBoxGeometry(0.42, 0.11, 0.06, 3, 0.04),
      pelvis: new RoundedBoxGeometry(1.5, 0.55, 0.9, 5, 0.22),
      thigh: new RoundedBoxGeometry(0.58, 0.4, 0.56, 4, 0.18),
      shin: new RoundedBoxGeometry(0.72, 0.56, 0.6, 5, 0.2),
      forearm: new RoundedBoxGeometry(0.54, 0.6, 0.5, 5, 0.17),
      armRib: ribbedGeometry(0.23, L.upperArm - 0.06, 7),
      kneeRib: ribbedGeometry(0.27, 0.34, 4),
      palm: new RoundedBoxGeometry(0.26, 0.24, 0.13, 4, 0.06),
      display: new RoundedBoxGeometry(0.3, 0.16, 0.04, 3, 0.02),
    };
  }, []);

  // the cyan light slits sit flush on the helmet's surface: one on the crown, one on each upper side
  const SL = useMemo(() => {
    const HR = [1.3, 1.1, 1.16] as const;
    const at = (az: number, el: number, len: number) => {
      const pos = new THREE.Vector3(Math.sin(az) * Math.cos(el) * HR[0], Math.sin(el) * HR[1], Math.cos(az) * Math.cos(el) * HR[2]);
      const n = new THREE.Vector3(pos.x / (HR[0] * HR[0]), pos.y / (HR[1] * HR[1]), pos.z / (HR[2] * HR[2])).normalize();
      pos.addScaledVector(n, 0.004);
      return { pos, quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n), len };
    };
    return [at(0, 0.75, 0.34), at(-1.07, 0.42, 0.22), at(1.07, 0.42, 0.22)];
  }, []);

  // face screen texture
  const faceTex = useMemo(() => canvasTex(FW, FH, (c) => drawFace(c, "normal", 0, 0)), []);
  const chestTex = useMemo(
    () =>
      canvasTex(512, 160, (c) => {
        c.textAlign = "center";
        c.fillStyle = "#166534";
        c.font = "800 70px Arial, Helvetica, sans-serif";
        c.fillText("Netkathir", 256, 74);
        c.fillStyle = "#4b6b58";
        c.font = "600 40px Arial, Helvetica, sans-serif";
        c.fillText("Technologies", 256, 134);
      }),
    []
  );
  const fxTex = useMemo(() => ({ heart: fxTexture("heart"), star: fxTexture("star"), bang: fxTexture("bang"), spark: fxTexture("spark") }), []);
  const halo = useMemo(
    () =>
      canvasTex(256, 256, (c) => {
        const g = c.createRadialGradient(128, 128, 6, 128, 128, 128);
        g.addColorStop(0, "rgba(95,230,255,0.7)");
        g.addColorStop(0.4, "rgba(34,197,94,0.18)");
        g.addColorStop(1, "rgba(34,197,94,0)");
        c.fillStyle = g;
        c.fillRect(0, 0, 256, 256);
      }),
    []
  );
  const hiTex = useMemo(
    () =>
      canvasTex(1000, 640, (c) => {
        const x = 40, y = 34, w = 920, h = 420;
        const body0 = () => {
          c.beginPath();
          c.roundRect(x, y, w, h, 150);
          c.moveTo(360, y + h - 4);
          c.quadraticCurveTo(300, y + h + 90, 200, y + h + 150);
          c.quadraticCurveTo(260, y + h + 70, 240, y + h - 4);
          c.closePath();
        };
        c.save();
        c.shadowColor = "rgba(6,60,30,0.28)";
        c.shadowBlur = 40;
        c.shadowOffsetY = 14;
        c.fillStyle = "#ffffff";
        body0();
        c.fill();
        c.restore();
        const rim = c.createLinearGradient(x, 0, x + w, 0);
        rim.addColorStop(0, "#15803d");
        rim.addColorStop(0.6, "#22c55e");
        rim.addColorStop(1, "#38bdf8");
        c.lineWidth = 9;
        c.strokeStyle = rim;
        body0();
        c.stroke();
        const ink = c.createLinearGradient(150, 0, 600, 0);
        ink.addColorStop(0, "#14532d");
        ink.addColorStop(1, "#16a34a");
        c.fillStyle = ink;
        c.font = "900 178px Arial, Helvetica, sans-serif";
        c.fillText("Hii!", 150, 248);
        c.font = "150px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";
        c.fillText("👋", 560, 238);
        c.fillStyle = "#3f6b52";
        c.font = "600 56px Arial, Helvetica, sans-serif";
        c.fillText("Welcome to Netkathir", 154, 352);
      }),
    []
  );

  const live = useLive();
  useFrame((s, dt) => {
    if (!live.current) return;
    const d = Math.min(dt, 0.25);
    const t = palette.uTime.value;
    scroll.current = THREE.MathUtils.damp(scroll.current, clamp01(window.scrollY / (window.innerHeight * 1.05)), 5, d);
    const e = ease(scroll.current);

    // ---- entrance clock (held while the intro plays; /?robotAt=N freezes it for checking poses)
    frames.current += 1;
    if (pinAt.current !== null) en.current = pinAt.current;
    else if (frames.current > 14 && (window as unknown as { __nkIntro?: string }).__nkIntro !== "playing") en.current += Math.min(d, 0.04);
    const E = en.current;
    const sg = (a: number, b: number) => sstep(a, b, E);

    // ---- story: turn in, wave "Hii!", raise the globe and keep it in hand (standing)
    const rIn = sg(0.2, 1.7);
    const wave = back(clamp01((E - 1.5) / 0.65)) * (1 - sg(3.95, 4.6));
    const waveW = clamp01(wave);
    const env = sg(1.85, 2.25) * (1 - sg(3.55, 3.95));
    const wph = E * 11;
    const hold = sg(4.0, 4.85);
    const gl = clamp01((E - 4.85) / 0.9);
    const follow = sg(4.7, 5.7);

    // ---- pokes and hover: ray from the camera through the mouse into the robot's hit-boxes
    robot.current.updateWorldMatrix(true, true);
    const now = t;
    const ray = K.ray;
    const hitParts = (x: number, y: number) => {
      ray.setFromCamera(K.ndc.set(x, y), s.camera);
      const hit = ray.intersectObjects(colliders.current, false)[0];
      return hit ? (hit.object.userData.part as string) : null;
    };
    if (click.current) {
      const part = hitParts(click.current.x, click.current.y);
      click.current = null;
      if (part && E > 2) {
        pokes.current += 1;
        const seq = ["bonk", "love", "stars", "dizzy"];
        const kind = part === "body" ? "giggle" : seq[(pokes.current - 1) % seq.length];
        react.current = { kind, t0: now, part };
        // burst of reaction particles from the head
        const n = kind === "love" ? 7 : kind === "stars" ? 9 : kind === "bonk" ? 1 : kind === "giggle" ? 4 : 0;
        for (let i = 0; i < n; i++) {
          fx.current.push({
            kind: kind === "love" ? "heart" : kind === "bonk" ? "bang" : kind === "giggle" ? "heart" : i % 3 ? "spark" : "star",
            life: 0,
            max: 1.4 + Math.random() * 0.6,
            x: (Math.random() - 0.5) * (kind === "bonk" ? 0 : 1.6),
            y: kind === "bonk" ? 1.35 : 0.9 + Math.random() * 0.3,
            vx: (Math.random() - 0.5) * (kind === "stars" ? 2.4 : 0.6),
            vy: kind === "stars" ? 0.8 + Math.random() * 1.2 : 0.7 + Math.random() * 0.5,
            s: 0.22 + Math.random() * 0.16,
          });
        }
      }
    }
    const hov = mouse.current.inside && E > 5 && !!hitParts(mouse.current.x, mouse.current.y);
    hovered.current = THREE.MathUtils.damp(hovered.current, hov ? 1 : 0, 8, d);
    const R = react.current;
    const ra = R ? now - R.t0 : 99;
    if (R && ra > (R.kind === "dizzy" ? 2.2 : 1.7)) react.current = null;
    const rk = R ? R.kind : "";

    // ---- cursor relative to the robot
    K.v1.setFromMatrixPosition(robot.current.matrixWorld).project(s.camera);
    const fx0 = THREE.MathUtils.clamp((mouse.current.x - K.v1.x) * 1.25, -1.2, 1.2) * follow;
    const fy0 = THREE.MathUtils.clamp((mouse.current.y - (K.v1.y + 0.35)) * 1.1, -1, 1) * follow;

    // ---- body: turn in, follow the cursor, giggle shake
    const shake = rk === "giggle" ? Math.sin(ra * 40) * 0.06 * (1 - ra / 1.7) : 0;
    robot.current.rotation.y = THREE.MathUtils.damp(robot.current.rotation.y, -0.05 + e * 0.3 + fx0 * 0.75 + (1 - rIn) * 3.0, 4.6, d) + shake;
    robot.current.rotation.x = THREE.MathUtils.damp(robot.current.rotation.x, -fy0 * 0.08, 4.6, d);
    robot.current.rotation.z = THREE.MathUtils.damp(robot.current.rotation.z, 0.035 * waveW + 0.018 * env * Math.sin(wph - 1.4), 8, d);
    // standing: the body only breathes a little
    const bodyY = 0;
    body.current.position.set(0, Math.sin(t * 1.6) * 0.025, 0);
    torso.current.scale.set(1, 1 + Math.sin(t * 1.7) * 0.006, 1 + Math.sin(t * 1.7) * 0.008);
    antenna.current.forEach((a, i) => {
      if (!a) return;
      const wob = rk === "bonk" ? Math.sin(ra * 30) * 0.35 * Math.exp(-ra * 3) : 0;
      a.rotation.z = (i ? -1 : 1) * 0.55 + Math.sin(t * 2.1 + i) * 0.045 + wob;
    });

    // ---- legs: planted under the hips, knees pointing forward
    const limbQ = (from: THREE.Vector3, to: THREE.Vector3, front: THREE.Vector3, out: THREE.Quaternion) => {
      K.y.copy(from).sub(to).normalize(); // the limb runs down its local -y
      K.z.copy(front).addScaledVector(K.y, -front.dot(K.y)).normalize();
      K.x.crossVectors(K.y, K.z).normalize();
      out.setFromRotationMatrix(K.m.makeBasis(K.x, K.y, K.z));
    };
    for (let i = 0; i < 2; i++) {
      const h = hips.current[i], k = knees.current[i], a = ankles.current[i];
      if (!h || !k || !a) continue;
      const sd = i ? -1 : 1;
      const H = K.S.set(sd * L.hipX, L.hip, 0.02);
      h.position.copy(H);
      K.t.set(sd * L.ankleX, L.ankle, 0.02);
      K.front.set(0, 0, 1);
      solveArm(H, K.t, K.front, L.upperLeg, L.lowerLeg, K.E, K.W, K.a, K.b);
      limbQ(H, K.E, K.front, K.q1);
      limbQ(K.E, K.W, K.front, K.q2);
      // foot: flat on the pedestal, toes forward
      K.z.set(0, 0, 1);
      K.y.set(0, 1, 0);
      K.x.crossVectors(K.y, K.z).normalize();
      K.q3.setFromRotationMatrix(K.m.makeBasis(K.x, K.y, K.z));
      h.quaternion.copy(K.q1);
      k.quaternion.copy(K.q1).invert().multiply(K.q2);
      a.quaternion.copy(K.q2).invert().multiply(K.q3);
    }

    // ---- arms (two-bone IK in torso space). The globe rides on the robot's right hand (the viewer's left); the left hand waves.
    const bob = Math.sin(t * 1.4) * 0.04;
    for (let a = 0; a < 2; a++) {
      const side = a === 0 ? 1 : -1;
      const isG = a === 1; // the globe arm
      const S = K.S.set(side * L.shoulderX, L.shoulderY + (!isG ? 0.04 * waveW : 0), 0);
      // targets are in body space (shoulders at L.shoulderY); the arms hang a little out from the sides, like the sheet
      let wrist: THREE.Vector3;
      if (isG) {
        wrist = K.t.set(-1.95, 2.55 + bob, 0.55).lerp(K.r.set(-1.5 - Math.sin(t * 1.1) * 0.015, 1.9 + Math.sin(t * 1.3) * 0.015, 0.1), 1 - hold);
        K.pole.set(-0.35, -1, -0.45).lerp(K.v2.set(-0.25, 0, -1), 1 - hold);
      } else {
        const rest = K.r.set(1.5 + Math.sin(t * 1.1) * 0.015, 1.9 + Math.sin(t * 1.3) * 0.015, 0.1);
        const elbow = K.v1.set(0.7, -0.5, 0.5).normalize().multiplyScalar(L.upperArm).add(S);
        const th = -0.18 + 0.32 * env * Math.sin(wph);
        const up = K.u.set(-Math.sin(th), Math.cos(th), 0.18).normalize().multiplyScalar(L.foreArm).add(elbow);
        wrist = K.t.copy(rest).lerp(up, wave);
        K.pole.set(0.25, 0, -1).lerp(K.v2.copy(elbow).sub(S), waveW);
      }
      solveArm(S, wrist, K.pole, L.upperArm, L.foreArm, K.E, K.W, K.a, K.b);
      if (!isG) K.hw.copy(K.W); // the waving hand: the speech bubble hangs next to it
      const upA = (a === 0 ? upP : upR).current;
      const fo = (a === 0 ? foP : foR).current;
      upA.position.copy(S);
      upA.quaternion.setFromUnitVectors(DOWN, K.a.copy(K.E).sub(S).normalize());
      fo.position.copy(K.E);
      K.y.copy(K.E).sub(K.W).normalize();
      if (isG) K.z.set(1, 0, 0.25).lerp(K.v2.set(0.05, 1, 0.62), hold);
      else K.z.set(-1, 0, 0.25).lerp(K.v2.set(-0.15, 0, 1), waveW);
      K.z.normalize();
      K.x.crossVectors(K.y, K.z).normalize();
      K.z.crossVectors(K.x, K.y).normalize();
      K.m.makeBasis(K.x, K.y, K.z);
      fo.quaternion.setFromRotationMatrix(K.m);
      const curl = isG ? THREE.MathUtils.lerp(0.5, 0.16, hold) : THREE.MathUtils.lerp(0.5, 0.12, waveW);
      fingers.current[a].forEach((f, k) => {
        if (!f) return;
        const fi = k >> 1;
        const flutter = !isG ? 0.08 * env * Math.sin(wph - 0.9 - fi * 0.35) : 0;
        const relax = !isG ? waveW * (0.16 + (fi === 1 ? 0 : 0.08)) : 0;
        f.rotation.x = -(curl + relax + flutter) * (k % 2 ? 0.9 : 1);
        if (k % 2 === 0) f.rotation.z = !isG ? -(fi - 1) * 0.16 * waveW : (fi - 1) * 0.14 * hold;
      });
      const hand = (a === 0 ? handP : handR).current;
      if (hand) {
        hand.rotation.z = !isG ? -(0.3 * env * Math.cos(wph - 0.35) + 0.12 * waveW) : 0;
        hand.rotation.x = !isG ? -0.12 * waveW : 0;
        hand.rotation.y = !isG ? -(0.22 * env * Math.sin(wph - 0.6) - 0.18 * waveW) : 0;
      }
      if (isG) {
        const u = K.u.copy(K.W).sub(K.E).normalize();
        K.bp.copy(K.W).addScaledVector(u, 0.16);
        K.bp.y += 0.96 + Math.sin(t * 1.8) * 0.05;
        K.bp.x -= 0.02;
        K.bp.z += 0.04;
        globe.current.position.copy(K.bp);
        globe.current.scale.setScalar(1.28 * Math.max(0.001, back(gl)));
        globe.current.visible = gl > 0.01;
      }
    }

    // ---- "Hii!" bubble
    if (bubble.current) {
      const k = Math.max(0.001, back(clamp01((E - 1.75) / 0.45)) * (1 - sg(3.85, 4.25)));
      bubble.current.scale.setScalar(k);
      bubble.current.visible = k > 0.01;
      // the bubble's tail tip (at its lower left) sits just above the waving hand; it eases along with the wave
      const bx = K.hw.x + 0.12 + 0.54 * k;
      const by = K.hw.y + 0.5 + 0.51 * k + Math.sin(t * 2.4) * 0.04;
      const bz = K.hw.z + 0.5;
      if (k < 0.05) bubble.current.position.set(bx, by, bz);
      else bubble.current.position.set(THREE.MathUtils.damp(bubble.current.position.x, bx, 6, d), THREE.MathUtils.damp(bubble.current.position.y, by, 6, d), bz);
      robot.current.getWorldQuaternion(K.q);
      bubble.current.quaternion.copy(K.q.invert().multiply(s.camera.quaternion));
      bubble.current.rotateZ(-0.045 * env * Math.sin(wph - 1.2));
    }

    // ---- head: looks at the visitor, the globe or the cursor; reacts to pokes
    const bp = K.bp;
    const look = (1 - wave) * follow;
    let hy = THREE.MathUtils.clamp(Math.atan2(bp.x, bp.z + 0.5) * 0.4, -0.45, 0.45) * look * gl + 0.06 * wave + fx0 * 0.6;
    let hx = THREE.MathUtils.clamp(-Math.atan2(bp.y - (L.head - 0.4), Math.hypot(bp.x, bp.z)) * 0.5, -0.3, 0.3) * look * gl - fy0 * 0.4;
    let hz = -0.14 * waveW + 0.04 * env * Math.sin(wph - 0.8);
    let squash = 0;
    if (rk === "bonk") {
      squash = Math.sin(Math.min(ra, 0.5) * Math.PI * 2) * 0.12 * Math.exp(-ra * 4);
      hz += Math.sin(ra * 22) * 0.18 * Math.exp(-ra * 3.5);
    } else if (rk === "dizzy") {
      hz += Math.sin(ra * 5) * 0.2;
      hx += Math.cos(ra * 5) * 0.12;
    } else if (rk === "love" || rk === "stars") {
      hz += Math.sin(ra * 6) * 0.08;
    }
    hy += hovered.current * fx0 * 0.15;
    head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, hy, 8, d);
    head.current.rotation.x = THREE.MathUtils.damp(head.current.rotation.x, hx, 8, d);
    head.current.rotation.z = THREE.MathUtils.damp(head.current.rotation.z, hz, 10, d);
    head.current.scale.set(1 + squash * 0.6, 1 - squash, 1 + squash * 0.6);

    // ---- face expression (reaction > greeting > typing > hover > normal, with blinks)
    let expr: Expr = "normal";
    if (rk === "bonk") expr = ra < 0.75 ? "surprised" : "happy";
    else if (rk === "love") expr = "love";
    else if (rk === "stars") expr = "stars";
    else if (rk === "dizzy") expr = "dizzy";
    else if (rk === "giggle") expr = "wink";
    else if (sg(1.6, 1.95) * (1 - sg(3.9, 4.3)) > 0.5) expr = "happy";
    else if (hovered.current > 0.5) expr = "happy";
    const bl = Math.max(0, Math.sin(t * 1.3 + 0.7) * 18 - 17);
    const blink = expr === "normal" ? Math.round(Math.min(bl, 1) * 4) / 4 : 0;
    const animated = expr === "love" || expr === "stars" || expr === "dizzy" || expr === "surprised";
    const fs = faceState.current;
    if (fs.expr !== expr || fs.blink !== blink || (animated && now - fs.t > 1 / 30)) {
      drawFace((faceTex.image as HTMLCanvasElement).getContext("2d")!, expr, blink, now);
      faceTex.needsUpdate = true;
      fs.expr = expr;
      fs.blink = blink;
      fs.t = now;
    }

    // ---- reaction particles (hearts, stars, sparks, "!")
    const list = fx.current;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life += d;
      if (p.life > p.max) list.splice(i, 1);
      else {
        p.x += p.vx * d;
        p.y += p.vy * d;
        p.vy -= (p.kind === "spark" || p.kind === "star" ? 1.6 : 0.2) * d;
      }
    }
    fxMeshes.current.forEach((m, i) => {
      const p = list[i];
      if (!m) return;
      m.visible = !!p;
      if (!p) return;
      const k = p.life / p.max;
      (m.material as THREE.MeshBasicMaterial).map = fxTex[p.kind];
      (m.material as THREE.MeshBasicMaterial).opacity = k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.6) / 0.4);
      m.position.set(p.x, L.head + bodyY + p.y, 1.3);
      m.scale.setScalar(p.s * (p.kind === "bang" ? 1 + Math.sin(Math.min(k * 8, Math.PI)) * 0.4 : 1));
      m.rotation.z = p.kind === "heart" ? Math.sin(p.life * 6) * 0.25 : p.life * 3;
    });

    // ---- pedestal glow rings pulse
    pedRing.current.forEach((r, i) => {
      if (!r) return;
      const k = (t * 0.35 + i * 0.5) % 1;
      r.scale.setScalar(1 + k * 0.7);
      (r.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.55;
    });

  });

  return (
    <group position={[0, -2.35, 0]} scale={0.9}>
      {/* ---------- grand animated backdrop ---------- */}
      <Backdrop palette={palette} en={en} cx={RX} mouse={mouse} mobile={mobile} />

      {/* ---------- glowing pedestal ---------- */}
      <group position={[RX, 0, 0.05]}>
        <mesh position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6, 6]} />
          <meshBasicMaterial map={halo} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.3, 0]} material={M.silver}>
          <cylinderGeometry args={[1.85, 1.95, 0.2, 72]} />
        </mesh>
        <mesh position={[0, -0.19, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.glow}>
          <torusGeometry args={[1.86, 0.028, 10, 96]} />
        </mesh>
        <mesh position={[0, -0.1, 0]} material={M.shell}>
          <cylinderGeometry args={[1.5, 1.58, 0.2, 72]} />
        </mesh>
        <mesh position={[0, 0.005, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.glow}>
          <torusGeometry args={[1.5, 0.03, 10, 96]} />
        </mesh>
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.0, 72]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.35} toneMapped={false} />
        </mesh>
        {[0, 1].map((i) => (
          <mesh key={i} ref={(m) => { if (m) pedRing.current[i] = m; }} position={[0, -0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.9, 1.95, 96]} />
            <meshBasicMaterial color="#5fe6ff" transparent opacity={0.4} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* ================================ ROBOT ================================ */}
      <group ref={robot} position={[RX, 0, 0]} scale={L.scale}>

        {/* ---- legs: white thigh sleeve, black ribbed knee, boxy white shin with cyan pills, chunky boot ---- */}
        {[0, 1].map((i) => {
          const sd = i ? -1 : 1;
          return (
            <group key={i} ref={(g) => { if (g) hips.current[i] = g; }} position={[sd * L.hipX, L.hip, 0.02]}>
              <mesh geometry={G.sph} material={M.black} scale={0.2} />
              <mesh geometry={G.thigh} material={M.shell} position={[0, -0.2, 0]} />
              <group ref={(g) => { if (g) knees.current[i] = g; }} position={[0, -L.upperLeg, 0]}>
                <mesh geometry={G.kneeRib} material={M.black} position={[0, 0.17, 0]} />
                <mesh geometry={G.shin} material={M.shell} position={[0, -0.43, 0]} />
                {[-1, 1].map((side) => (
                  <mesh key={side} geometry={G.cap(0.02, 0.1)} material={M.glow} position={[side * 0.366, -0.43, 0.06]} />
                ))}
                <group ref={(g) => { if (g) ankles.current[i] = g; }} position={[0, -L.lowerLeg, 0]}>
                  <mesh geometry={G.ring(0.31, 0.04)} material={M.black} position={[0, 0.16, 0.04]} rotation={[Math.PI / 2, 0, 0]} />
                  {/* boot: white upper + toe cap, white midsole, black sole line, cyan glow underneath */}
                  <mesh material={M.black} position={[0, -0.405, 0.1]} scale={[1, 1, 1.36]}>
                    <cylinderGeometry args={[0.49, 0.49, 0.06, 56]} />
                  </mesh>
                  <mesh material={M.shell} position={[0, -0.345, 0.1]} scale={[1, 1, 1.34]}>
                    <cylinderGeometry args={[0.49, 0.5, 0.08, 56]} />
                  </mesh>
                  <mesh geometry={G.ring(0.48, 0.012)} material={M.glow} position={[0, -0.437, 0.1]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1.36, 1]} />
                  <mesh geometry={G.sph} material={M.shell} scale={[0.46, 0.34, 0.6]} position={[0, -0.12, 0.1]} />
                  <mesh geometry={G.sph} material={M.shell2} scale={[0.38, 0.2, 0.28]} position={[0, -0.2, 0.52]} rotation={[-0.2, 0, 0]} />
                </group>
              </group>
            </group>
          );
        })}

        <group ref={body}>
          {/* invisible hit-boxes for hover and pokes */}
          <mesh ref={(m) => { if (m) colliders.current[0] = m; }} userData={{ part: "head" }} position={[0, L.head, 0]} visible={false}>
            <sphereGeometry args={[1.4, 16, 12]} />
          </mesh>
          <mesh ref={(m) => { if (m) colliders.current[1] = m; }} userData={{ part: "body" }} position={[0, 2.5, 0]} visible={false}>
            <boxGeometry args={[2.1, 2.8, 1.2]} />
          </mesh>
          {/* pelvis with the cyan hip lights, and the black waist band with its light bar */}
          <mesh geometry={G.pelvis} material={M.shell} position={[0, 1.85, 0]} />
          {[-1, 1].map((sd) => (
            <mesh key={sd} geometry={G.sph} material={M.glow} scale={[0.04, 0.1, 0.075]} position={[sd * 0.745, 1.78, 0.2]} />
          ))}
          <mesh material={M.black} position={[0, 2.2, 0]} scale={[1, 1, 0.82]}>
            <cylinderGeometry args={[0.72, 0.64, 0.22, 56]} />
          </mesh>
          <mesh material={M.glow} position={[0, 2.2, 0.572]}>
            <boxGeometry args={[0.42, 0.035, 0.012]} />
          </mesh>

          <group ref={torso}>
            {/* torso: wide at the shoulders, narrowing to the waist, with the chest plate, two light bays and the emblem */}
            <mesh geometry={G.torso} material={M.shell} position={[0, 2.95, 0]} />
            <mesh geometry={G.lightBay} material={M.black} position={[-0.4, 3.5, 0.475]} />
            <mesh material={M.yellow} position={[-0.4, 3.5, 0.508]}>
              <boxGeometry args={[0.3, 0.045, 0.01]} />
            </mesh>
            <mesh geometry={G.lightBay} material={M.black} position={[0.4, 3.5, 0.475]} />
            <mesh material={M.blue} position={[0.4, 3.5, 0.508]}>
              <boxGeometry args={[0.34, 0.055, 0.01]} />
            </mesh>
            {logoGeo && <mesh geometry={logoGeo} material={logoMat} position={[0, 3.08, 0.55]} scale={0.7} />}
            <mesh position={[0, 2.54, 0.535]}>
              <planeGeometry args={[0.8, 0.25]} />
              <meshBasicMaterial map={chestTex} transparent toneMapped={false} />
            </mesh>
            {/* neck */}
            <mesh material={M.black} position={[0, 3.68, 0]}>
              <cylinderGeometry args={[0.3, 0.36, 0.26, 48]} />
            </mesh>
            {/* shoulders: round black joints with a cyan glow crescent on the outer edge */}
            {[-1, 1].map((sd) => (
              <group key={sd} position={[sd * L.shoulderX, L.shoulderY, 0]}>
                <mesh geometry={G.sph} material={M.black} scale={0.3} />
                <mesh geometry={G.ring(0.288, 0.024, Math.PI * 0.9)} material={M.glow} position={[0, 0, 0.12]} rotation={[0, 0, -0.3 * Math.PI]} scale={[sd, 1, 1]} />
              </group>
            ))}

            {/* ---- arms: black ribbed upper arm, white armoured forearm with cyan pills, white glove hand ---- */}
            {[0, 1].map((a) => {
              const sd = a === 0 ? 1 : -1;
              return (
                <group key={a}>
                  <group ref={a === 0 ? upP : upR}>
                    <mesh geometry={G.armRib} material={M.black} position={[0, -0.03, 0]} />
                  </group>
                  <group ref={a === 0 ? foP : foR}>
                    <mesh geometry={G.sph} material={M.black} scale={0.235} />
                    <mesh geometry={G.forearm} material={M.shell} position={[0, -0.43, 0]} />
                    {[-0.3, -0.56].map((y) => (
                      <mesh key={y} geometry={G.cap(0.02, 0.1)} material={M.glow} position={[0, y, -0.254]} />
                    ))}
                    <mesh geometry={G.ring(0.14, 0.05)} material={M.black} position={[0, -L.foreArm, 0]} rotation={[Math.PI / 2, 0, 0]} />
                    <group ref={a === 0 ? handP : handR} position={[0, -L.foreArm - 0.02, 0]} scale={1.12}>
                      <mesh geometry={G.palm} material={M.shell} position={[0, -0.11, 0]} />
                      <mesh geometry={G.sph} material={M.black} scale={[0.08, 0.07, 0.015]} position={[0, -0.11, 0.066]} />
                      {[-0.085, 0, 0.085].map((x, i) => (
                        <group key={i} position={[x, -0.235, 0]}>
                          <group ref={(g) => { if (g) fingers.current[a][i * 2] = g; }}>
                            <mesh geometry={G.sph} material={M.black} scale={0.034} />
                            <mesh geometry={G.cap(0.038, 0.065)} material={M.shell} position={[0, -0.065, 0]} />
                            <mesh geometry={G.sph} material={M.black} scale={0.03} position={[0, -0.125, 0]} />
                            <group ref={(g) => { if (g) fingers.current[a][i * 2 + 1] = g; }} position={[0, -0.135, 0]}>
                              <mesh geometry={G.cap(0.035, 0.05)} material={M.shell} position={[0, -0.05, 0]} />
                            </group>
                          </group>
                        </group>
                      ))}
                      <group position={[0.155, a === 0 ? -0.08 : -0.12, 0.04]} rotation={a === 0 ? [0.3, 0, 1.05] : [0.1, 0, 0.55]}>
                        <mesh geometry={G.sph} material={M.black} scale={0.032} />
                        <mesh geometry={G.cap(0.04, 0.085)} material={M.shell} position={[0, -0.07, 0]} />
                      </group>
                    </group>
                  </group>
                </group>
              );
            })}

            {/* holographic globe above the open hand */}
            <group ref={globe} visible={false}>
              <HoloGlobe palette={palette} />
            </group>

            {/* ---- head: glossy white helmet, big black visor with the face, headphones, headband, antennas ---- */}
            <group ref={head} position={[0, L.head, 0]}>
              <mesh geometry={G.sph} material={M.shell} scale={[1.3, 1.1, 1.16]} />
              {/* the little cyan light slits on the crown and the upper sides of the helmet */}
              {SL.map((s, i) => (
                <mesh key={i} position={s.pos} quaternion={s.quat} material={M.glow}>
                  <boxGeometry args={[s.len, 0.045, 0.05]} />
                </mesh>
              ))}
              {/* visor: one big glossy black glass panel across the face */}
              <mesh geometry={G.visorG} material={M.visor} />
              {/* the face: eyes + mouth drawn live on the visor */}
              <mesh geometry={G.face} renderOrder={5}>
                <meshBasicMaterial map={faceTex} transparent depthWrite={false} toneMapped={false} />
              </mesh>

              {/* headphones: dark ear cups with a glowing cyan ring on the outer face, turned a little to the front */}
              {[-1, 1].map((sd) => (
                <group key={sd} position={[sd * 1.42, -0.2, -0.04]} rotation={[0, -sd * 0.14, 0]}>
                  <group rotation={[0, 0, -sd * Math.PI / 2]}>
                    <mesh material={M.black}>
                      <cylinderGeometry args={[0.46, 0.46, 0.3, 56]} />
                    </mesh>
                    <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.navy}>
                      <torusGeometry args={[0.45, 0.035, 14, 56]} />
                    </mesh>
                    <mesh position={[0, 0.158, 0]} material={M.navy}>
                      <cylinderGeometry args={[0.36, 0.36, 0.02, 56]} />
                    </mesh>
                    <mesh position={[0, 0.172, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.glow}>
                      <torusGeometry args={[0.385, 0.034, 12, 64]} />
                    </mesh>
                    <mesh position={[0, 0.17, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.blue}>
                      <torusGeometry args={[0.2, 0.014, 10, 48]} />
                    </mesh>
                  </group>
                </group>
              ))}
              {/* headband: a slim navy arc standing just off the crown */}
              <mesh geometry={G.ring(1.42, 0.05, Math.PI)} material={M.navy} position={[0, -0.02, 0]} scale={[1, 0.86, 1]} />
              {/* antennas: black stalks angled outwards, glossy blue balls */}
              {[-1, 1].map((sd, i) => (
                <group key={sd} ref={(g) => { if (g) antenna.current[i] = g; }} position={[sd * 0.92, 0.8, 0]}>
                  <mesh geometry={G.sph} material={M.black} scale={[0.1, 0.08, 0.1]} />
                  <mesh material={M.black} position={[0, 0.3, 0]}>
                    <cylinderGeometry args={[0.04, 0.052, 0.6, 16]} />
                  </mesh>
                  <mesh geometry={G.sph} material={M.ball} scale={0.15} position={[0, 0.68, 0]} />
                  <mesh position={[0, 0.68, 0]}>
                    <planeGeometry args={[0.7, 0.7]} />
                    <meshBasicMaterial map={halo} transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
                  </mesh>
                </group>
              ))}
            </group>
          </group>
        </group>

        {/* reaction particles */}
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} ref={(m) => { if (m) fxMeshes.current[i] = m; }} visible={false} renderOrder={21}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={fxTex.heart} transparent depthWrite={false} depthTest={false} toneMapped={false} />
          </mesh>
        ))}

        {/* "Hii!" speech bubble */}
        <mesh ref={bubble} scale={0.001} renderOrder={20}>
          <planeGeometry args={[1.8, 1.15]} />
          <meshBasicMaterial map={hiTex} transparent depthWrite={false} depthTest={false} toneMapped={false} />
        </mesh>
      </group>

      {/* ---------- live glass interfaces around the robot ---------- */}
      {!mobile && (
        <>
          <HoloPanels palette={palette} en={en} cx={RX} />
        </>
      )}
    </group>
  );
}
