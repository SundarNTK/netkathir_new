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

/** Draws a clean bold "2027" and traces it into real vector outlines. */
function traceWord() {
  const cv = document.createElement("canvas");
  cv.width = 1600;
  cv.height = 640;
  const c = cv.getContext("2d")!;
  const fs = 540;
  c.font = `700 ${fs}px Arial, 'Helvetica Neue', Helvetica, sans-serif`;
  (c as unknown as { letterSpacing: string }).letterSpacing = `${0.015 * fs}px`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = "#000";
  c.fillText(WORD, 800, 330);
  return traceImageToShapes(cv, 560, SIZE).shapes;
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
    const geo = new THREE.ExtrudeGeometry(traceWord(), { depth: 0.62, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 5, curveSegments: 14 });
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const cx = (bb.min.x + bb.max.x) / 2;
    const cy = (bb.min.y + bb.max.y) / 2;
    geo.translate(-cx, -cy, -0.31);
    const w = bb.max.x - bb.min.x;
    // polished gold
    const mat = new THREE.MeshPhysicalMaterial({ color: "#ffc233", metalness: 1, roughness: 0.07, clearcoat: 0.7, clearcoatRoughness: 0.08, envMapIntensity: 2.1, transparent: true, opacity: 0, emissive: new THREE.Color("#e0a419"), emissiveIntensity: 0.05 });
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
    grp.current.rotation.y = (-0.62 + 0.2 * THREE.MathUtils.smootherstep(state.turn, 0, 1)) * state.pop + s.pointer.x * 0.08;
    grp.current.rotation.x = -0.04 * state.pop - s.pointer.y * 0.05;
    mesh.current.scale.z = Math.max(0.001, state.bump); // the flat year bumps out into depth
    built.mat.opacity = state.year * (1 - Math.min(1, state.dive * 1.4));
    built.mat.emissiveIntensity = 0.05 + 0.16 * state.glow * (0.75 + 0.25 * Math.sin(t * 3));
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
      {/* a gold-photography studio: deep amber base, big soft boxes and thin bright streaks, so the metal shows real gradients */}
      <Environment resolution={512} frames={1}>
        <color attach="background" args={["#4a2a02"]} />
        <Lightformer form="rect" intensity={6} position={[0, 6, 4]} scale={[18, 3, 1]} color="#fff4cf" />
        <Lightformer form="rect" intensity={4.5} position={[-9, 1, 2]} rotation-y={Math.PI / 2} scale={[4, 9, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={4} position={[9, 0, 2]} rotation-y={-Math.PI / 2} scale={[4, 9, 1]} color="#ffe28a" />
        <Lightformer form="rect" intensity={3} position={[0, -4, 4]} scale={[16, 2, 1]} color="#ffb21f" />
        <Lightformer form="rect" intensity={2.2} position={[0, 0, -8]} scale={[20, 9, 1]} color="#e08a10" />
        <Lightformer form="rect" intensity={7} position={[-2.2, 0, 8]} scale={[0.5, 9, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={6} position={[2.6, 0, 8]} scale={[0.7, 9, 1]} color="#fff0b0" />
        <Lightformer form="rect" intensity={3} position={[5, 3, 6]} scale={[1.2, 5, 1]} color="#ffcc55" />
      </Environment>
      <Year state={state} />
      <Sparkles count={mobile ? 10 : 22} scale={[12, 6, 3]} size={3} speed={0.3} opacity={0.55} color="#f2c230" noise={0.5} />
    </Canvas>
  );
}
