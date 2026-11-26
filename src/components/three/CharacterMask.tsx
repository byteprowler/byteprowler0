import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createPortal, useFrame } from "@react-three/fiber";
import type { CharacterMaskMode } from "../../lib/character";
import { disposeObject3D } from "../../lib/webgl";

interface CharacterMaskProps {
  headBone: THREE.Object3D | null;
  maskMode: CharacterMaskMode;
  enabled: boolean;
}

/**
 * Modular Three.js half-mask attachment targeting the VRM head bone.
 * Remains disabled until head mesh contour alignment is verified against a
 * valid loaded VRoid model so no unaligned geometry overlaps the face.
 */
export default function CharacterMask({ headBone, maskMode, enabled }: CharacterMaskProps) {
  const maskGroupRef = useRef<THREE.Group>(null);
  const shellMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const crestMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const accentMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const mixRef = useRef(maskMode === "unmasked" ? 0 : maskMode === "transition" ? 0.52 : 1);

  const geometries = useMemo(() => {
    const shell = new THREE.SphereGeometry(
      0.115,
      24,
      18,
      Math.PI * 0.45,
      Math.PI * 0.52,
      Math.PI * 0.22,
      Math.PI * 0.58,
    );
    const crest = new THREE.ConeGeometry(0.018, 0.08, 5);
    const rim = new THREE.TorusGeometry(0.022, 0.003, 8, 20, Math.PI * 1.1);
    return { shell, crest, rim };
  }, []);

  useEffect(() => {
    const group = maskGroupRef.current;
    return () => {
      geometries.shell.dispose();
      geometries.crest.dispose();
      geometries.rim.dispose();
      disposeObject3D(group);
    };
  }, [geometries]);

  useFrame((_, rawDelta) => {
    if (!enabled || !headBone) return;
    const delta = Math.min(rawDelta, 0.05);
    const target = maskMode === "masked" ? 1 : maskMode === "transition" ? 0.52 : 0;
    mixRef.current = THREE.MathUtils.damp(mixRef.current, target, 6.5, delta);
    const mix = mixRef.current;

    if (maskGroupRef.current) {
      maskGroupRef.current.visible = mix > 0.02;
      maskGroupRef.current.position.set(
        THREE.MathUtils.lerp(-0.04, 0, mix),
        0.04,
        THREE.MathUtils.lerp(0.05, 0.012, mix),
      );
      maskGroupRef.current.rotation.y = THREE.MathUtils.lerp(-0.45, 0, mix);
    }
    if (shellMatRef.current) shellMatRef.current.opacity = mix * 0.94;
    if (crestMatRef.current) crestMatRef.current.opacity = mix;
    if (accentMatRef.current) {
      accentMatRef.current.opacity = mix;
      accentMatRef.current.emissiveIntensity = 1.4 * mix;
    }
  });

  if (!enabled || !headBone) {
    return null;
  }

  return createPortal(
    <group ref={maskGroupRef} name="ByteProwler_ProceduralHalfMask">
      <mesh geometry={geometries.shell} rotation={[0, -Math.PI * 0.48, 0]}>
        <meshStandardMaterial
          ref={shellMatRef}
          color="#0C0F18"
          roughness={0.32}
          metalness={0.78}
          transparent
          opacity={0.94}
        />
      </mesh>
      <mesh geometry={geometries.crest} position={[-0.032, 0.058, 0.095]} rotation={[0.25, -0.2, 0.3]}>
        <meshStandardMaterial
          ref={crestMatRef}
          color="#C5CAD6"
          roughness={0.18}
          metalness={0.92}
          transparent
          opacity={1}
        />
      </mesh>
      <mesh geometry={geometries.rim} position={[-0.036, 0.008, 0.108]} rotation={[0, 0, 0.1]}>
        <meshStandardMaterial
          ref={accentMatRef}
          color="#367BFF"
          emissive="#367BFF"
          emissiveIntensity={1.4}
          roughness={0.15}
          metalness={0.2}
          transparent
          opacity={1}
        />
      </mesh>
    </group>,
    headBone,
  );
}
