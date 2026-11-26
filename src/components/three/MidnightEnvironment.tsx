import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { disposeObject3D } from "../../lib/webgl";

interface MidnightEnvironmentProps {
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  scrollProgressRef: React.MutableRefObject<number>;
  reducedMotion: boolean;
  enableShadows: boolean;
  particleCount: number;
  interactionPulseRef: React.MutableRefObject<number>;
}

const MONOLITH_SHARDS = [
  { pos: [1.55, 0.35, -1.65] as [number, number, number], rot: [0.08, -0.38, 0.14] as [number, number, number], size: [0.42, 2.35, 0.08] as [number, number, number], accent: "#367BFF" },
  { pos: [-1.75, 0.25, -2.25] as [number, number, number], rot: [-0.05, 0.42, -0.11] as [number, number, number], size: [0.36, 2.1, 0.07] as [number, number, number], accent: "#7547D8" },
  { pos: [0.92, 0.95, -2.65] as [number, number, number], rot: [0.12, -0.22, -0.06] as [number, number, number], size: [0.24, 1.45, 0.06] as [number, number, number], accent: "#C5CAD6" },
  { pos: [2.15, -0.2, -2.9] as [number, number, number], rot: [0.02, -0.52, 0.08] as [number, number, number], size: [0.55, 2.6, 0.09] as [number, number, number], accent: "#7547D8" },
  { pos: [-0.95, -0.35, -3.1] as [number, number, number], rot: [0.06, 0.26, 0.09] as [number, number, number], size: [0.48, 2.4, 0.08] as [number, number, number], accent: "#367BFF" },
] as const;

const _lookAtVec = new THREE.Vector3();

function createRadialSpriteTexture(innerColor: string, midColor: string): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(0.38, midColor);
  gradient.addColorStop(1, "rgba(8, 9, 13, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function deterministicUnit(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export default function MidnightEnvironment({
  pointerRef,
  scrollProgressRef,
  reducedMotion,
  enableShadows,
  particleCount,
  interactionPulseRef,
}: MidnightEnvironmentProps) {
  const shardsGroupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const accentLightRef = useRef<THREE.PointLight>(null);
  const rimBlueRef = useRef<THREE.DirectionalLight>(null);
  const rimVioletRef = useRef<THREE.DirectionalLight>(null);

  const lookTargetState = useRef({ x: -0.58, y: 0.42, z: 0 });
  const smoothedPointer = useRef({ x: 0, y: 0 });

  // Procedural soft radial textures for atmospheric particles and grounded obsidian plinth shadow
  const { particleTexture, plinthTexture } = useMemo(() => {
    const pTex = createRadialSpriteTexture("rgba(240, 242, 248, 1)", "rgba(54, 123, 255, 0.5)");
    const gTex = createRadialSpriteTexture("rgba(54, 123, 255, 0.24)", "rgba(117, 71, 216, 0.12)");
    return { particleTexture: pTex, plinthTexture: gTex };
  }, []);

  useEffect(() => {
    return () => {
      particleTexture?.dispose();
      plinthTexture?.dispose();
    };
  }, [particleTexture, plinthTexture]);

  // Pre-allocated particle geometry
  const particleGeometry = useMemo(() => {
    const count = Math.max(particleCount, 1);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const blue = new THREE.Color("#367BFF");
    const violet = new THREE.Color("#7547D8");
    const silver = new THREE.Color("#C5CAD6");

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (deterministicUnit(i * 3 + 1) - 0.5) * 6.5;
      positions[i3 + 1] = (deterministicUnit(i * 3 + 2) - 0.35) * 3.8;
      positions[i3 + 2] = -0.4 - deterministicUnit(i * 3 + 3) * 3.6;

      const pick = deterministicUnit(i * 7 + 5);
      const col = pick < 0.45 ? blue : pick < 0.82 ? violet : silver;
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.computeBoundingSphere();
    return geometry;
  }, [particleCount]);

  useEffect(() => {
    const shards = shardsGroupRef.current;
    return () => {
      particleGeometry.dispose();
      disposeObject3D(shards);
    };
  }, [particleGeometry]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;
    const isDesktop = state.size.width >= 768;
    const scrollP = scrollProgressRef.current;

    const targetPx = reducedMotion ? 0 : pointerRef.current.x;
    const targetPy = reducedMotion ? 0 : pointerRef.current.y;
    smoothedPointer.current.x = THREE.MathUtils.damp(smoothedPointer.current.x, targetPx, 5.5, delta);
    smoothedPointer.current.y = THREE.MathUtils.damp(smoothedPointer.current.y, targetPy, 5.5, delta);
    const px = smoothedPointer.current.x;
    const py = smoothedPointer.current.y;

    if (interactionPulseRef.current > 0.001) {
      interactionPulseRef.current = THREE.MathUtils.damp(interactionPulseRef.current, 0, 5.5, delta);
    } else {
      interactionPulseRef.current = 0;
    }
    const pulse = interactionPulseRef.current;

    // Responsive Camera Framing + Pointer Micro-Parallax + Scroll Camera Evolution
    const desiredCamX = (isDesktop ? 0.14 : 0) + px * (isDesktop ? 0.14 : 0.06) + scrollP * 0.22;
    const desiredCamY = (isDesktop ? 0.48 : 0.24) + py * 0.08 + scrollP * 0.16;
    const desiredCamZ = (isDesktop ? 2.86 : 3.28) - scrollP * 0.36;

    const cam = state.camera;
    cam.position.x = THREE.MathUtils.damp(cam.position.x, desiredCamX, 4.5, delta);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, desiredCamY, 4.5, delta);
    cam.position.z = THREE.MathUtils.damp(cam.position.z, desiredCamZ, 4.5, delta);

    const targetLookX = isDesktop ? -0.58 + px * 0.06 : 0;
    const targetLookY = isDesktop ? 0.42 + scrollP * 0.08 : 0.08 + scrollP * 0.08;
    lookTargetState.current.x = THREE.MathUtils.damp(lookTargetState.current.x, targetLookX, 4.5, delta);
    lookTargetState.current.y = THREE.MathUtils.damp(lookTargetState.current.y, targetLookY, 4.5, delta);
    _lookAtVec.set(lookTargetState.current.x, lookTargetState.current.y, lookTargetState.current.z);
    cam.lookAt(_lookAtVec);

    // Dynamic Cursor & Impulse Lighting
    if (accentLightRef.current) {
      accentLightRef.current.position.x = THREE.MathUtils.damp(
        accentLightRef.current.position.x,
        px * 1.4,
        6,
        delta,
      );
      accentLightRef.current.position.y = THREE.MathUtils.damp(
        accentLightRef.current.position.y,
        0.75 + py * 0.8,
        6,
        delta,
      );
      accentLightRef.current.intensity = 2.4 + pulse * 2.4;
    }

    if (rimBlueRef.current) {
      rimBlueRef.current.intensity = 2.15 + pulse * 0.9 + scrollP * 0.4;
    }
    if (rimVioletRef.current) {
      rimVioletRef.current.intensity = 1.9 + pulse * 0.9;
    }

    // Architectural obsidian shards depth parallax
    if (shardsGroupRef.current) {
      shardsGroupRef.current.position.x = THREE.MathUtils.damp(
        shardsGroupRef.current.position.x,
        -px * 0.16,
        4,
        delta,
      );
      shardsGroupRef.current.position.y = THREE.MathUtils.damp(
        shardsGroupRef.current.position.y,
        -py * 0.09 + scrollP * 0.25,
        4,
        delta,
      );
      if (!reducedMotion) {
        shardsGroupRef.current.rotation.y = Math.sin(t * 0.22) * 0.03;
      }
    }

    // Subtle atmospheric particle drift
    if (pointsRef.current && !reducedMotion && particleCount > 0) {
      pointsRef.current.rotation.y = t * 0.018 + px * 0.06;
      pointsRef.current.position.y = Math.sin(t * 0.35) * 0.06 + scrollP * 0.18;
    }
  });

  return (
    <>
      <color attach="background" args={["#08090D"]} />
      <fogExp2 attach="fog" args={["#08090D", 0.085]} />

      {/* Three-Point Midnight Studio & Rim Lighting */}
      <hemisphereLight args={["#6482C8", "#08090D", 0.72]} />
      <directionalLight
        position={[0.45, 1.35, 3.2]}
        intensity={0.98}
        color="#F0F2F8"
      />
      <directionalLight
        ref={rimBlueRef}
        position={[2.45, 2.1, 2.3]}
        intensity={2.15}
        color="#367BFF"
        castShadow={enableShadows}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
      />
      <directionalLight
        ref={rimVioletRef}
        position={[-2.6, 1.5, -1.9]}
        intensity={1.9}
        color="#7547D8"
      />
      <pointLight
        ref={accentLightRef}
        position={[0, 0.75, 1.8]}
        intensity={2.4}
        distance={6.5}
        decay={2}
        color="#367BFF"
      />

      {/* Grounded obsidian shadow plinth anchoring the bust in 3D space */}
      {plinthTexture ? (
        <mesh position={[0, -0.58, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[3.2, 3.2]} />
          <meshBasicMaterial
            map={plinthTexture}
            transparent
            opacity={0.85}
            depthWrite={false}
          />
        </mesh>
      ) : null}

      {/* Architectural Obsidian Monolith Shards with Midnight Trim */}
      <group ref={shardsGroupRef}>
        {MONOLITH_SHARDS.map((shard, index) => (
          <group key={index} position={shard.pos} rotation={shard.rot}>
            <mesh>
              <boxGeometry args={shard.size} />
              <meshStandardMaterial
                color="#0D121E"
                roughness={0.32}
                metalness={0.78}
              />
            </mesh>
            <mesh position={[shard.size[0] * 0.51, 0, 0]}>
              <boxGeometry args={[0.012, shard.size[1] * 0.92, 0.015]} />
              <meshBasicMaterial color={shard.accent} transparent opacity={0.55} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Atmospheric Drifting Midnight Particles */}
      {particleCount > 0 && particleTexture ? (
        <points ref={pointsRef} geometry={particleGeometry}>
          <pointsMaterial
            size={0.048}
            map={particleTexture}
            vertexColors
            transparent
            opacity={0.78}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </points>
      ) : null}
    </>
  );
}
