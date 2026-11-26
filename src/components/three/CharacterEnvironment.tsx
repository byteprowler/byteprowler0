import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { disposeObject3D } from "../../lib/webgl";

interface CharacterEnvironmentProps {
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  scrollProgressRef: React.MutableRefObject<number>;
  reducedMotion: boolean;
  particleCount: number;
}

const MONOLITH_SHARDS = [
  { pos: [1.55, 1.15, -1.65] as [number, number, number], rot: [0.08, -0.38, 0.14] as [number, number, number], size: [0.42, 2.35, 0.08] as [number, number, number], accent: "#367BFF" },
  { pos: [-1.75, 1.05, -2.25] as [number, number, number], rot: [-0.05, 0.42, -0.11] as [number, number, number], size: [0.36, 2.1, 0.07] as [number, number, number], accent: "#7547D8" },
  { pos: [0.92, 1.75, -2.65] as [number, number, number], rot: [0.12, -0.22, -0.06] as [number, number, number], size: [0.24, 1.45, 0.06] as [number, number, number], accent: "#C5CAD6" },
  { pos: [2.15, 0.65, -2.9] as [number, number, number], rot: [0.02, -0.52, 0.08] as [number, number, number], size: [0.55, 2.6, 0.09] as [number, number, number], accent: "#7547D8" },
  { pos: [-0.95, 0.55, -3.1] as [number, number, number], rot: [0.06, 0.26, 0.09] as [number, number, number], size: [0.48, 2.4, 0.08] as [number, number, number], accent: "#367BFF" },
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

export default function CharacterEnvironment({
  pointerRef,
  scrollProgressRef,
  reducedMotion,
  particleCount,
}: CharacterEnvironmentProps) {
  const shardsGroupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const lookTargetState = useRef({ x: -0.36, y: 1.24, z: 0 });
  const smoothedPointer = useRef({ x: 0, y: 0 });

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
      positions[i3 + 1] = 0.2 + deterministicUnit(i * 3 + 2) * 3.2;
      positions[i3 + 2] = -0.4 - deterministicUnit(i * 3 + 3) * 3.4;

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

    // Waist-up cinematic camera framing with restrained pointer & scroll movement
    const desiredCamX = (isDesktop ? 0.12 : 0) + px * (isDesktop ? 0.08 : 0.04) + scrollP * 0.14;
    const desiredCamY = (isDesktop ? 1.32 : 1.18) + py * 0.05 + scrollP * 0.1;
    const desiredCamZ = (isDesktop ? 1.95 : 2.35) - scrollP * 0.22;

    const cam = state.camera;
    cam.position.x = THREE.MathUtils.damp(cam.position.x, desiredCamX, 4.5, delta);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, desiredCamY, 4.5, delta);
    cam.position.z = THREE.MathUtils.damp(cam.position.z, desiredCamZ, 4.5, delta);

    const targetLookX = isDesktop ? -0.36 + px * 0.03 : 0;
    const targetLookY = isDesktop ? 1.24 + scrollP * 0.06 : 0.98 + scrollP * 0.06;
    lookTargetState.current.x = THREE.MathUtils.damp(lookTargetState.current.x, targetLookX, 4.5, delta);
    lookTargetState.current.y = THREE.MathUtils.damp(lookTargetState.current.y, targetLookY, 4.5, delta);
    _lookAtVec.set(lookTargetState.current.x, lookTargetState.current.y, lookTargetState.current.z);
    cam.lookAt(_lookAtVec);

    if (shardsGroupRef.current) {
      shardsGroupRef.current.position.x = THREE.MathUtils.damp(
        shardsGroupRef.current.position.x,
        -px * 0.14,
        4,
        delta,
      );
      shardsGroupRef.current.position.y = THREE.MathUtils.damp(
        shardsGroupRef.current.position.y,
        -py * 0.07 + scrollP * 0.2,
        4,
        delta,
      );
      if (!reducedMotion) {
        shardsGroupRef.current.rotation.y = Math.sin(t * 0.22) * 0.025;
      }
    }

    if (pointsRef.current && !reducedMotion && particleCount > 0) {
      pointsRef.current.rotation.y = t * 0.016 + px * 0.04;
      pointsRef.current.position.y = Math.sin(t * 0.35) * 0.05 + scrollP * 0.15;
    }
  });

  return (
    <>
      <color attach="background" args={["#08090D"]} />
      <fogExp2 attach="fog" args={["#08090D", 0.085]} />

      {plinthTexture ? (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[2.8, 2.8]} />
          <meshBasicMaterial map={plinthTexture} transparent opacity={0.8} depthWrite={false} />
        </mesh>
      ) : null}

      <group ref={shardsGroupRef}>
        {MONOLITH_SHARDS.map((shard, index) => (
          <group key={index} position={shard.pos} rotation={shard.rot}>
            <mesh>
              <boxGeometry args={shard.size} />
              <meshStandardMaterial color="#0D121E" roughness={0.32} metalness={0.78} />
            </mesh>
            <mesh position={[shard.size[0] * 0.51, 0, 0]}>
              <boxGeometry args={[0.012, shard.size[1] * 0.92, 0.015]} />
              <meshBasicMaterial color={shard.accent} transparent opacity={0.55} />
            </mesh>
          </group>
        ))}
      </group>

      {particleCount > 0 && particleTexture ? (
        <points ref={pointsRef} geometry={particleGeometry}>
          <pointsMaterial
            size={0.045}
            map={particleTexture}
            vertexColors
            transparent
            opacity={0.75}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </points>
      ) : null}
    </>
  );
}
