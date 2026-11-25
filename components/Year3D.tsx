/* eslint-disable react-hooks/immutability, react-hooks/purity -- imperative three.js animation: meshes, materials and the shared intro state are mutated every frame on purpose */
"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { traceImageToShapes } from "@/lib/traceShape";
import type { IntroState } from "./IntroScene";

const WORD = "2027";
const SIZE = 8; // width of the canvas the word is traced from, in scene units
const CAM_Z = 14;

/** Draws a heavy, rounded "2027" and traces it into real vector outlines (the bevel then rounds the edges like polished metal). */
function traceWord() {
  const cv = document.createElement("canvas");
  cv.width = 1600;
  cv.height = 640;
  const c = cv.getContext("2d")!;
  const fs = 560;
  c.font = `900 ${fs}px 'Arial Rounded MT Bold', 'Arial Black', 'Helvetica Neue', Arial, sans-serif`;
  (c as unknown as { letterSpacing: string }).letterSpacing = `${0.07 * fs}px`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = "#000";
  c.lineJoin = "round";
  c.lineWidth = 14; // a touch of extra weight and rounder corners
  c.strokeStyle = "#000";
  c.fillText(WORD, 800, 330);
  c.strokeText(WORD, 800, 330);
  return traceImageToShapes(cv, 520, SIZE).shapes;
}

function glowTexture() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 256;
  const c = cv.getContext("2d")!;
  const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(250,204,21,0.85)");
  g.addColorStop(0.4, "rgba(34,197,94,0.45)");
  g.addColorStop(1, "rgba(34,197,94,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(cv);
}

function Year({ state }: { state: IntroState }) {
  const { invalidate } = useThree();
  const grp = useRef<THREE.Group>(null!);
  const mesh = useRef<THREE.Mesh>(null!);
  const glow = useRef<THREE.MeshBasicMaterial>(null!);

  const built = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(traceWord(), { depth: 0.34, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 10, curveSegments: 12 });
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const cx = (bb.min.x + bb.max.x) / 2;
    const cy = (bb.min.y + bb.max.y) / 2;
    geo.translate(-cx, -cy, -0.17);
    const w = bb.max.x - bb.min.x;
    // polished gold
    const mat = new THREE.MeshPhysicalMaterial({ color: "#f2b420", metalness: 1, roughness: 0.18, clearcoat: 0.7, clearcoatRoughness: 0.08, envMapIntensity: 1.9, transparent: true, opacity: 0, emissive: new THREE.Color("#a86d00"), emissiveIntensity: 0.1 });
    return { geo, mat, w, glowTex: glowTexture() };
  }, []);

  useEffect(() => {
    invalidate(); // draw once so the mesh is on the GPU before it is needed
    return () => {
      built.geo.dispose();
      built.mat.dispose();
    };
  }, [built, invalidate]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const dive = state.dive * state.dive;
    const fit = state.tw > 0 ? state.tw / built.w : 1; // matches the calendar's own year in size and position
    grp.current.visible = state.year > 0.002;
    grp.current.scale.setScalar(fit * (1 + 0.32 * state.pop) * (1 + dive * 9));
    grp.current.position.set(state.tx * (1 - state.pop * 0.35), state.ty * (1 - state.pop * 0.35) + Math.sin(t * 1.2) * 0.03 * state.pop, dive * 6 + state.pop * 0.6);
    grp.current.rotation.y = -0.3 * state.pop + 0.65 * THREE.MathUtils.smootherstep(state.turn, 0, 1) * state.pop + s.pointer.x * 0.08;
    grp.current.rotation.x = -0.1 * state.pop - s.pointer.y * 0.05;
    mesh.current.scale.z = Math.max(0.001, state.bump); // the flat year bumps out into depth
    built.mat.opacity = state.year * (1 - Math.min(1, state.dive * 1.4));
    built.mat.emissiveIntensity = 0.1 + 0.18 * state.glow * (0.75 + 0.25 * Math.sin(t * 3));
    if (glow.current) glow.current.opacity = state.glow * 0.8 * (1 - Math.min(1, state.dive * 1.3));
  });

  return (
    <>
      <mesh position={[0, 0, -2.5]} scale={[15, 8, 1]}>
        <planeGeometry />
        <meshBasicMaterial ref={glow} map={built.glowTex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <group ref={grp}>
        <mesh ref={mesh} geometry={built.geo} material={built.mat} />
      </group>
    </>
  );
}

export default function Year3D({ state, run }: { state: IntroState; run: boolean }) {
  const mobile = typeof window !== "undefined" && window.innerWidth < 800;
  return (
    <Canvas
      frameloop={run ? "always" : "demand"}
      dpr={[1, mobile ? 1.5 : 2]}
      camera={{ position: [0, 0, CAM_Z], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={1.0} />
      <directionalLight position={[4, 6, 7]} intensity={2.4} color="#fffaf0" />
      <directionalLight position={[-6, -1, 4]} intensity={0.9} color="#c9f3d2" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={4} position={[0, 5, 5]} scale={[12, 3, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={2.4} position={[0, -3, 5]} scale={[12, 2, 1]} color="#fff3c4" />
        <Lightformer form="ring" intensity={2} position={[0, 1, 7]} scale={4} color="#ffffff" />
        <Lightformer form="rect" intensity={3} position={[-7, 1, 3]} rotation-y={Math.PI / 2} scale={[7, 5, 1]} color="#fff1c1" />
        <Lightformer form="rect" intensity={1.8} position={[7, 0, 3]} rotation-y={-Math.PI / 2} scale={[7, 4, 1]} color="#fde68a" />
      </Environment>
      <Year state={state} />
      <Sparkles count={mobile ? 10 : 22} scale={[12, 6, 3]} size={3} speed={0.3} opacity={0.55} color="#f2c230" noise={0.5} />
    </Canvas>
  );
}
