"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Sparkles } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/** logo: reveal 0→1, burst: exit 0→1. */
export type IntroState = { logo: number; burst: number };

const LOGO_URL = "/images/brand/netkathir-logo-hd.png";
const W = 8; // logo width in scene units

const GLINT_V = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const GLINT_F = /* glsl */ `
uniform sampler2D map; uniform float uT;
varying vec2 vUv;
void main(){
  float a = texture2D(map, vUv).a;
  float band = smoothstep(0.1, 0.0, abs(vUv.x - uT + vUv.y * 0.25));
  gl_FragColor = vec4(vec3(1.0, 1.0, 0.92), a * band * 0.26);
}`;

/**
 * The real Netkathir logo as a physical slab: the original artwork is stacked in depth layers, so the front face is the
 * exact logo (pixel-accurate, crisp edges) and its sides are shaded walls that appear as it turns. A soft light sweep
 * crosses the front face. No tracing, so nothing can distort the artwork.
 */
function Logo({ state, onReady, lite }: { state: IntroState; onReady?: () => void; lite: boolean }) {
  const { viewport, gl, invalidate } = useThree();
  const grp = useRef<THREE.Group>(null!);
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);
  const glint = useRef<THREE.ShaderMaterial>(null!);
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const N = lite ? 12 : 22;
  const DEPTH = 0.34;
  const aspect = 984 / 2400;

  useEffect(() => {
    let alive = true;
    new THREE.TextureLoader().load(
      LOGO_URL,
      (t) => {
        if (!alive) return;
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());
        t.generateMipmaps = true;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.needsUpdate = true;
        setTex(t);
        invalidate(); // draw one frame now, so the texture is uploaded to the GPU before the animation needs it
        requestAnimationFrame(() => requestAnimationFrame(() => onReady?.()));
      },
      undefined,
      () => onReady?.()
    );
    return () => {
      alive = false;
    };
  }, [onReady, gl]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const fit = Math.min(1, (viewport.width * (viewport.width < 9 ? 0.74 : 0.8)) / W, (viewport.height * (viewport.width < 9 ? 0.26 : 0.34)) / (W * aspect));
    const k = THREE.MathUtils.smootherstep(state.logo, 0, 1);
    const out = state.burst * state.burst;
    grp.current.scale.setScalar(fit * (0.92 + 0.08 * k + out * 0.18));
    grp.current.position.y = viewport.height * 0.22 + (1 - k) * -0.35 + Math.sin(t * 0.8) * 0.04;
    grp.current.rotation.y = (1 - k) * -0.6 + Math.sin(t * 0.55) * 0.2 + s.pointer.x * 0.12;
    grp.current.rotation.x = Math.sin(t * 0.42) * 0.05 - s.pointer.y * 0.06;
    const op = k * (1 - Math.min(1, state.burst * 1.4));
    mats.current.forEach((m) => m && (m.opacity = op));
    if (glint.current) {
      glint.current.uniforms.uT.value = ((t * 0.22) % 1.6) - 0.3;
      glint.current.visible = op > 0.9;
    }
  });

  return (
    <group ref={grp}>
      {tex &&
        Array.from({ length: N }, (_, i) => {
          const f = i / (N - 1); // 0 = front face, 1 = back
          const shade = i === 0 ? 1 : 0.5 + 0.22 * (1 - f); // side walls: a deeper green, lighter near the front
          return (
            <mesh key={i} position={[0, 0, -f * DEPTH]} renderOrder={N - i}>
              <planeGeometry args={[W, W * aspect]} />
              <meshBasicMaterial
                ref={(m) => {
                  if (m) mats.current[i] = m;
                }}
                map={tex}
                color={new THREE.Color(shade, shade, shade)}
                alphaToCoverage
                opacity={0}
                toneMapped={false}
              />
            </mesh>
          );
        })}
      {tex && (
        <mesh position={[0, 0, 0.012]} renderOrder={N + 1}>
          <planeGeometry args={[W, W * aspect]} />
          <shaderMaterial ref={glint} transparent depthWrite={false} blending={THREE.AdditiveBlending} uniforms={{ map: { value: tex }, uT: { value: -0.3 } }} vertexShader={GLINT_V} fragmentShader={GLINT_F} />
        </mesh>
      )}
    </group>
  );
}

export default function IntroScene({ state, onReady, run }: { state: IntroState; onReady?: () => void; run: boolean }) {
  const mobile = typeof window !== "undefined" && window.innerWidth < 800;
  const lite = mobile || (typeof navigator !== "undefined" && (navigator.hardwareConcurrency ?? 8) <= 4);
  return (
    <Canvas
      frameloop={run ? "always" : "demand"}
      dpr={[1, lite ? 1.5 : 2]}
      camera={{ position: [0, 0, 13], fov: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 6]} intensity={2.2} color="#fffaf0" />
      <directionalLight position={[-5, -1, 3]} intensity={0.8} color="#c9f3d2" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 5, 5]} scale={[10, 3, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.6} position={[-6, 1, 3]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} color="#bbf7d0" />
        <Lightformer form="rect" intensity={1.4} position={[6, 0, 3]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} color="#fde68a" />
      </Environment>
      <Logo state={state} onReady={onReady} lite={lite} />
      <Sparkles count={mobile ? 8 : 16} scale={[11, 6, 3]} size={2.5} speed={0.15} opacity={0.4} color="#d9b96a" noise={0.4} />
    </Canvas>
  );
}
