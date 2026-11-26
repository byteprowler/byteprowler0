import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface CharacterLightingProps {
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  scrollProgressRef: React.MutableRefObject<number>;
  interactionPulseRef: React.MutableRefObject<number>;
  reducedMotion: boolean;
  enableShadows: boolean;
}

export default function CharacterLighting({
  pointerRef,
  scrollProgressRef,
  interactionPulseRef,
  reducedMotion,
  enableShadows,
}: CharacterLightingProps) {
  const accentLightRef = useRef<THREE.PointLight>(null);
  const rimBlueRef = useRef<THREE.DirectionalLight>(null);
  const rimVioletRef = useRef<THREE.DirectionalLight>(null);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const px = reducedMotion ? 0 : pointerRef.current.x;
    const py = reducedMotion ? 0 : pointerRef.current.y;
    const scrollP = scrollProgressRef.current;

    if (interactionPulseRef.current > 0.001) {
      interactionPulseRef.current = THREE.MathUtils.damp(interactionPulseRef.current, 0, 5.5, delta);
    } else {
      interactionPulseRef.current = 0;
    }
    const pulse = interactionPulseRef.current;

    if (accentLightRef.current) {
      accentLightRef.current.position.x = THREE.MathUtils.damp(
        accentLightRef.current.position.x,
        px * 1.1,
        5.5,
        delta,
      );
      accentLightRef.current.position.y = THREE.MathUtils.damp(
        accentLightRef.current.position.y,
        1.35 + py * 0.45,
        5.5,
        delta,
      );
      accentLightRef.current.intensity = 1.6 + pulse * 1.4;
    }

    if (rimBlueRef.current) {
      rimBlueRef.current.intensity = 2.0 + pulse * 0.65 + scrollP * 0.35;
    }
    if (rimVioletRef.current) {
      rimVioletRef.current.intensity = 1.7 + pulse * 0.65;
    }
  });

  return (
    <>
      {/* Subtle cool obsidian ambient fill */}
      <hemisphereLight args={["#6482C8", "#08090D", 0.68]} />

      {/* Soft Key Lighting */}
      <directionalLight
        position={[0.55, 1.95, 2.8]}
        intensity={1.08}
        color="#F0F2F8"
        castShadow={enableShadows}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
      />

      {/* Electric-Blue Primary Rim Lighting */}
      <directionalLight
        ref={rimBlueRef}
        position={[2.2, 2.1, -1.35]}
        intensity={2.0}
        color="#367BFF"
      />

      {/* Deep Violet Secondary Rim Lighting */}
      <directionalLight
        ref={rimVioletRef}
        position={[-2.4, 1.6, -1.65]}
        intensity={1.7}
        color="#7547D8"
      />

      {/* Restrained Cursor-Reactive Rim Accent */}
      <pointLight
        ref={accentLightRef}
        position={[0, 1.35, 1.5]}
        intensity={1.6}
        distance={5.5}
        decay={2}
        color="#367BFF"
      />
    </>
  );
}
