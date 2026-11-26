import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { CharacterExpressionId, CharacterMaskMode } from "../../lib/character";
import { disposeObject3D } from "../../lib/webgl";

interface ProceduralMidnightCharacterProps {
  expression: CharacterExpressionId;
  maskMode: CharacterMaskMode;
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  scrollProgressRef: React.MutableRefObject<number>;
  reducedMotion: boolean;
  onCharacterClick?: () => void;
  onPointerHoverChange?: (hovering: boolean) => void;
}

const EXPRESSION_POSES: Record<
  CharacterExpressionId,
  {
    headTiltZ: number;
    headNodX: number;
    browTilt: number;
    browLift: number;
    eyeSquint: number;
    opticIntensity: number;
  }
> = {
  idle: { headTiltZ: 0.02, headNodX: 0, browTilt: 0.04, browLift: 0, eyeSquint: 0, opticIntensity: 1.5 },
  greeting: { headTiltZ: -0.09, headNodX: -0.05, browTilt: -0.1, browLift: 0.025, eyeSquint: 0.35, opticIntensity: 1.9 },
  thinking: { headTiltZ: 0.14, headNodX: 0.08, browTilt: 0.14, browLift: -0.01, eyeSquint: 0.18, opticIntensity: 1.4 },
  coding: { headTiltZ: -0.03, headNodX: 0.12, browTilt: 0.16, browLift: -0.018, eyeSquint: 0.22, opticIntensity: 2.2 },
  surprised: { headTiltZ: -0.06, headNodX: -0.1, browTilt: -0.14, browLift: 0.048, eyeSquint: -0.15, opticIntensity: 2.5 },
  confident: { headTiltZ: 0.06, headNodX: -0.04, browTilt: 0.1, browLift: 0.01, eyeSquint: 0.12, opticIntensity: 2.0 },
};

const _targetColor = new THREE.Color();

/**
 * Clearly identified temporary articulated 3D placeholder rig for ByteProwler V3.
 * Demonstrates real blinking, independent eye tracking, head/neck rotation,
 * breathing, expression states, interactive half-mask phasing, and click impulses
 * until a custom VRM/GLB character model matching CHARACTER_MODEL_SPEC is loaded.
 */
export default function ProceduralMidnightCharacter({
  expression,
  maskMode,
  pointerRef,
  scrollProgressRef,
  reducedMotion,
  onCharacterClick,
  onPointerHoverChange,
}: ProceduralMidnightCharacterProps) {
  const rootRef = useRef<THREE.Group>(null);
  const chestRef = useRef<THREE.Group>(null);
  const neckRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const hairCrownRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);
  const leftLidTopRef = useRef<THREE.Mesh>(null);
  const rightLidTopRef = useRef<THREE.Mesh>(null);
  const leftBrowRef = useRef<THREE.Mesh>(null);
  const rightBrowRef = useRef<THREE.Mesh>(null);
  const maskGroupRef = useRef<THREE.Group>(null);
  const maskCrestMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const maskShellMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const maskOpticMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const headphoneRingMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const irisBlueMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const irisVioletMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const [hovered, setHovered] = useState(false);

  // Blink & click reaction timers (kept out of React state for zero-GC 60fps updates)
  const blinkStateRef = useRef({
    nextBlinkAt: 2.4,
    progress: 0,
    blinking: false,
  });
  const clickImpulseRef = useRef(0);
  const smoothedPointerRef = useRef({ x: 0, y: 0 });
  const maskMixRef = useRef(maskMode === "unmasked" ? 0 : maskMode === "transition" ? 0.52 : 1);

  const geometries = useMemo(() => {
    const jacketBody = new THREE.CylinderGeometry(0.42, 0.56, 0.92, 24);
    const jacketCollar = new THREE.CylinderGeometry(0.32, 0.4, 0.34, 24, 1, true, Math.PI * 0.18, Math.PI * 1.64);
    const shoulderPad = new THREE.CapsuleGeometry(0.14, 0.28, 8, 16);
    const strap = new THREE.BoxGeometry(0.055, 0.68, 0.04);
    const buckle = new THREE.BoxGeometry(0.08, 0.06, 0.055);
    const neck = new THREE.CylinderGeometry(0.105, 0.125, 0.24, 18);
    const headBase = new THREE.SphereGeometry(0.31, 28, 24);
    const jaw = new THREE.ConeGeometry(0.24, 0.26, 20);
    const hairSpike = new THREE.ConeGeometry(0.075, 0.34, 6);
    const hairBack = new THREE.SphereGeometry(0.335, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.68);
    const sclera = new THREE.SphereGeometry(0.056, 16, 16);
    const iris = new THREE.SphereGeometry(0.036, 16, 16);
    const pupil = new THREE.SphereGeometry(0.019, 12, 12);
    const eyelid = new THREE.SphereGeometry(0.061, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const brow = new THREE.BoxGeometry(0.11, 0.016, 0.024);
    const headphoneBand = new THREE.TorusGeometry(0.23, 0.022, 12, 32, Math.PI * 1.25);
    const headphoneCup = new THREE.CylinderGeometry(0.085, 0.085, 0.05, 20);
    const headphoneRing = new THREE.TorusGeometry(0.065, 0.008, 10, 24);

    // Sculpted asymmetrical half-mask shell covering character's right side (viewer's left, -X)
    const maskShell = new THREE.SphereGeometry(0.325, 24, 20, Math.PI * 0.48, Math.PI * 0.52, Math.PI * 0.18, Math.PI * 0.62);
    const maskCrest = new THREE.ConeGeometry(0.055, 0.24, 5);
    const maskSlit = new THREE.BoxGeometry(0.082, 0.022, 0.03);

    return {
      jacketBody,
      jacketCollar,
      shoulderPad,
      strap,
      buckle,
      neck,
      headBase,
      jaw,
      hairSpike,
      hairBack,
      sclera,
      iris,
      pupil,
      eyelid,
      brow,
      headphoneBand,
      headphoneCup,
      headphoneRing,
      maskShell,
      maskCrest,
      maskSlit,
    };
  }, []);

  const materials = useMemo(() => {
    const techwearMatte = new THREE.MeshStandardMaterial({
      color: "#111521",
      roughness: 0.84,
      metalness: 0.08,
    });
    const innerTurtleneck = new THREE.MeshStandardMaterial({
      color: "#090B11",
      roughness: 0.9,
      metalness: 0.04,
    });
    const silverTrim = new THREE.MeshStandardMaterial({
      color: "#C5CAD6",
      roughness: 0.22,
      metalness: 0.88,
    });
    const skin = new THREE.MeshStandardMaterial({
      color: "#D8C2B8",
      roughness: 0.56,
      metalness: 0.02,
    });
    const hair = new THREE.MeshStandardMaterial({
      color: "#12131B",
      roughness: 0.72,
      metalness: 0.14,
    });
    const sclera = new THREE.MeshStandardMaterial({
      color: "#EEF1F8",
      roughness: 0.3,
      metalness: 0.02,
    });
    const pupil = new THREE.MeshStandardMaterial({
      color: "#05060A",
      roughness: 0.15,
      metalness: 0.2,
    });
    const phoneBody = new THREE.MeshStandardMaterial({
      color: "#141824",
      roughness: 0.35,
      metalness: 0.65,
    });
    const collarEdge = new THREE.MeshStandardMaterial({
      color: "#101827",
      roughness: 0.78,
      metalness: 0.12,
      side: THREE.DoubleSide,
    });

    return {
      techwearMatte,
      innerTurtleneck,
      silverTrim,
      skin,
      hair,
      sclera,
      pupil,
      phoneBody,
      collarEdge,
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    return () => {
      disposeObject3D(root);
    };
  }, []);

  const hairBlades = useMemo(
    () => [
      { pos: [0, 0.29, 0.14] as [number, number, number], rot: [0.65, 0, 0.12] as [number, number, number], scale: 1.1 },
      { pos: [-0.14, 0.27, 0.15] as [number, number, number], rot: [0.58, -0.35, 0.42] as [number, number, number], scale: 1.0 },
      { pos: [0.15, 0.27, 0.14] as [number, number, number], rot: [0.6, 0.32, -0.4] as [number, number, number], scale: 1.05 },
      { pos: [-0.24, 0.18, 0.08] as [number, number, number], rot: [0.35, -0.6, 0.78] as [number, number, number], scale: 0.95 },
      { pos: [0.24, 0.18, 0.08] as [number, number, number], rot: [0.35, 0.6, -0.78] as [number, number, number], scale: 0.95 },
      { pos: [0.06, 0.22, 0.23] as [number, number, number], rot: [1.15, 0.18, -0.25] as [number, number, number], scale: 0.88 },
      { pos: [-0.08, 0.24, 0.22] as [number, number, number], rot: [1.08, -0.22, 0.28] as [number, number, number], scale: 0.92 },
      { pos: [0, 0.34, -0.02] as [number, number, number], rot: [-0.2, 0, 0] as [number, number, number], scale: 1.18 },
      { pos: [-0.17, 0.31, -0.05] as [number, number, number], rot: [-0.25, -0.3, 0.45] as [number, number, number], scale: 1.05 },
      { pos: [0.18, 0.31, -0.05] as [number, number, number], rot: [-0.25, 0.3, -0.45] as [number, number, number], scale: 1.05 },
    ],
    [],
  );

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;
    const pose = EXPRESSION_POSES[expression];

    // Smooth pointer coordinates
    const targetPx = reducedMotion ? 0 : pointerRef.current.x;
    const targetPy = reducedMotion ? 0 : pointerRef.current.y;
    const dampSpeed = reducedMotion ? 16 : 6.5;
    smoothedPointerRef.current.x = THREE.MathUtils.damp(
      smoothedPointerRef.current.x,
      targetPx,
      dampSpeed,
      delta,
    );
    smoothedPointerRef.current.y = THREE.MathUtils.damp(
      smoothedPointerRef.current.y,
      targetPy,
      dampSpeed,
      delta,
    );

    const px = smoothedPointerRef.current.x;
    const py = smoothedPointerRef.current.y;
    const scrollP = scrollProgressRef.current;

    // Click reaction spring decay
    if (clickImpulseRef.current > 0.001) {
      clickImpulseRef.current = THREE.MathUtils.damp(clickImpulseRef.current, 0, 6.0, delta);
    } else {
      clickImpulseRef.current = 0;
    }
    const impulse = clickImpulseRef.current;

    // Root subtle scroll shift & idle hover aura
    if (rootRef.current) {
      const targetRotY = -0.18 + px * 0.14 - scrollP * 0.32;
      rootRef.current.rotation.y = THREE.MathUtils.damp(rootRef.current.rotation.y, targetRotY, 5, delta);
      rootRef.current.position.y = THREE.MathUtils.damp(
        rootRef.current.position.y,
        -0.55 + impulse * 0.035,
        6,
        delta,
      );
    }

    // Idle breathing (chest scale & lift)
    if (chestRef.current) {
      const breath = reducedMotion ? 0 : Math.sin(t * 1.45) * 0.012;
      chestRef.current.position.y = 0.46 + breath;
      chestRef.current.scale.set(1 + breath * 0.55, 1, 1 + breath * 0.85);
      chestRef.current.rotation.x = THREE.MathUtils.damp(
        chestRef.current.rotation.x,
        py * -0.05 + scrollP * 0.08,
        5,
        delta,
      );
    }

    // Neck & Head pointer-responsive rotation + expression tilt + click nod
    if (neckRef.current) {
      neckRef.current.rotation.y = THREE.MathUtils.damp(neckRef.current.rotation.y, px * 0.16, 6, delta);
      neckRef.current.rotation.x = THREE.MathUtils.damp(
        neckRef.current.rotation.x,
        py * -0.09 + pose.headNodX * 0.4,
        6,
        delta,
      );
    }

    if (headRef.current) {
      const idleSway = reducedMotion ? 0 : Math.sin(t * 0.9) * 0.022;
      headRef.current.rotation.y = THREE.MathUtils.damp(
        headRef.current.rotation.y,
        px * 0.28 + idleSway,
        7,
        delta,
      );
      headRef.current.rotation.x = THREE.MathUtils.damp(
        headRef.current.rotation.x,
        py * -0.18 + pose.headNodX + impulse * 0.16,
        7,
        delta,
      );
      headRef.current.rotation.z = THREE.MathUtils.damp(
        headRef.current.rotation.z,
        pose.headTiltZ + px * -0.06,
        6,
        delta,
      );
    }

    // Subtle secondary hair crown sway
    if (hairCrownRef.current && !reducedMotion) {
      hairCrownRef.current.rotation.z = Math.sin(t * 1.8) * 0.018 - px * 0.035;
      hairCrownRef.current.rotation.x = Math.cos(t * 1.3) * 0.014 + py * 0.025;
    }

    // Independent eye tracking (anatomical range)
    const eyeYaw = THREE.MathUtils.clamp(px * 0.34, -0.34, 0.34);
    const eyePitch = THREE.MathUtils.clamp(-py * 0.22, -0.22, 0.22);
    if (leftEyeRef.current) {
      leftEyeRef.current.rotation.y = THREE.MathUtils.damp(leftEyeRef.current.rotation.y, eyeYaw, 14, delta);
      leftEyeRef.current.rotation.x = THREE.MathUtils.damp(leftEyeRef.current.rotation.x, eyePitch, 14, delta);
    }
    if (rightEyeRef.current) {
      rightEyeRef.current.rotation.y = THREE.MathUtils.damp(rightEyeRef.current.rotation.y, eyeYaw, 14, delta);
      rightEyeRef.current.rotation.x = THREE.MathUtils.damp(rightEyeRef.current.rotation.x, eyePitch, 14, delta);
    }

    // Natural randomized blinking
    let blinkClose = 0;
    if (!reducedMotion) {
      const b = blinkStateRef.current;
      if (!b.blinking && t >= b.nextBlinkAt) {
        b.blinking = true;
        b.progress = 0;
      }
      if (b.blinking) {
        b.progress += delta * 7.2;
        if (b.progress >= Math.PI) {
          b.blinking = false;
          b.progress = 0;
          b.nextBlinkAt = t + 3.0 + ((Math.sin(t * 13.7) + 1) * 1.25);
        } else {
          blinkClose = Math.sin(b.progress);
        }
      }
    }

    const lidCloseFactor = THREE.MathUtils.clamp(
      Math.max(blinkClose, pose.eyeSquint > 0 ? pose.eyeSquint : 0),
      0,
      1,
    );
    const lidRotX = THREE.MathUtils.lerp(-0.92, 0.14, lidCloseFactor);
    if (leftLidTopRef.current) leftLidTopRef.current.rotation.x = lidRotX;
    if (rightLidTopRef.current) rightLidTopRef.current.rotation.x = lidRotX;

    // Eyebrows expression posture
    if (leftBrowRef.current) {
      leftBrowRef.current.position.y = THREE.MathUtils.damp(
        leftBrowRef.current.position.y,
        0.105 + pose.browLift,
        8,
        delta,
      );
      leftBrowRef.current.rotation.z = THREE.MathUtils.damp(
        leftBrowRef.current.rotation.z,
        -pose.browTilt,
        8,
        delta,
      );
    }
    if (rightBrowRef.current) {
      rightBrowRef.current.position.y = THREE.MathUtils.damp(
        rightBrowRef.current.position.y,
        0.105 + pose.browLift,
        8,
        delta,
      );
      rightBrowRef.current.rotation.z = THREE.MathUtils.damp(
        rightBrowRef.current.rotation.z,
        pose.browTilt,
        8,
        delta,
      );
    }

    // Dynamic heterochromatic eye intensity + hover/click glow
    const targetIrisEmissive = pose.opticIntensity + (hovered ? 0.5 : 0) + impulse * 1.4;
    if (irisBlueMatRef.current) {
      irisBlueMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        irisBlueMatRef.current.emissiveIntensity,
        targetIrisEmissive,
        8,
        delta,
      );
    }
    if (irisVioletMatRef.current) {
      irisVioletMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        irisVioletMatRef.current.emissiveIntensity,
        targetIrisEmissive,
        8,
        delta,
      );
    }

    if (headphoneRingMatRef.current) {
      _targetColor.set(hovered || impulse > 0.2 ? "#367BFF" : "#7547D8");
      headphoneRingMatRef.current.emissive.lerp(_targetColor, delta * 5);
      headphoneRingMatRef.current.emissiveIntensity = 1.25 + impulse * 1.5;
    }

    // Interactive half-mask phase transition (masked = 1, transition = 0.52, unmasked = 0)
    const targetMaskMix = maskMode === "masked" ? 1 : maskMode === "transition" ? 0.52 : 0;
    maskMixRef.current = THREE.MathUtils.damp(maskMixRef.current, targetMaskMix, 6, delta);
    const mix = maskMixRef.current;

    if (maskGroupRef.current) {
      maskGroupRef.current.visible = mix > 0.03;
      maskGroupRef.current.position.x = THREE.MathUtils.lerp(-0.16, 0, mix);
      maskGroupRef.current.position.z = THREE.MathUtils.lerp(0.14, 0, mix);
      maskGroupRef.current.rotation.y = THREE.MathUtils.lerp(-0.55, 0, mix);
      maskGroupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.84, 1, mix));
    }
    if (maskShellMatRef.current) {
      maskShellMatRef.current.opacity = mix;
    }
    if (maskCrestMatRef.current) {
      maskCrestMatRef.current.opacity = mix;
    }
    if (maskOpticMatRef.current) {
      maskOpticMatRef.current.opacity = mix;
      maskOpticMatRef.current.emissiveIntensity = (1.8 + impulse * 1.6) * mix;
    }
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    clickImpulseRef.current = 1;
    onCharacterClick?.();
  };

  return (
    <group
      ref={rootRef}
      position={[0, -0.55, 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onPointerHoverChange?.(true);
      }}
      onPointerOut={() => {
        setHovered(false);
        onPointerHoverChange?.(false);
      }}
    >
      {/* Torso / Dark Techwear Jacket Bust */}
      <group ref={chestRef} position={[0, 0.46, 0]}>
        <mesh geometry={geometries.jacketBody} material={materials.techwearMatte} castShadow receiveShadow />

        {/* Inner dark turtleneck */}
        <mesh
          geometry={geometries.neck}
          material={materials.innerTurtleneck}
          position={[0, 0.46, 0]}
          scale={[1.18, 0.8, 1.18]}
        />

        {/* High sculptural hoodie collar */}
        <mesh
          geometry={geometries.jacketCollar}
          material={materials.collarEdge}
          position={[0, 0.46, -0.02]}
          rotation={[0.08, Math.PI * 0.9, 0]}
          castShadow
        />

        {/* Shoulders */}
        <mesh
          geometry={geometries.shoulderPad}
          material={materials.techwearMatte}
          position={[-0.44, 0.28, -0.02]}
          rotation={[0, 0, 0.42]}
          castShadow
        />
        <mesh
          geometry={geometries.shoulderPad}
          material={materials.techwearMatte}
          position={[0.44, 0.28, -0.02]}
          rotation={[0, 0, -0.42]}
          castShadow
        />

        {/* Techwear shoulder straps & silver buckles */}
        <mesh
          geometry={geometries.strap}
          material={materials.innerTurtleneck}
          position={[-0.25, 0.14, 0.41]}
          rotation={[0.08, 0, -0.06]}
        />
        <mesh
          geometry={geometries.buckle}
          material={materials.silverTrim}
          position={[-0.25, 0.22, 0.435]}
        />
        <mesh
          geometry={geometries.strap}
          material={materials.innerTurtleneck}
          position={[0.25, 0.14, 0.41]}
          rotation={[0.08, 0, 0.06]}
        />
        <mesh
          geometry={geometries.buckle}
          material={materials.silverTrim}
          position={[0.25, 0.22, 0.435]}
        />

        {/* Around-neck studio headphones */}
        <group position={[0, 0.42, 0.06]} rotation={[0.42, 0, 0]}>
          <mesh
            geometry={geometries.headphoneBand}
            material={materials.phoneBody}
            rotation={[Math.PI / 2, 0, -Math.PI * 0.12]}
          />
          <group position={[-0.24, -0.04, 0.16]} rotation={[0.2, 0.4, 0.25]}>
            <mesh geometry={geometries.headphoneCup} material={materials.phoneBody} rotation={[0, 0, Math.PI / 2]} />
            <mesh geometry={geometries.headphoneRing} position={[-0.028, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <meshStandardMaterial
                ref={headphoneRingMatRef}
                color="#7547D8"
                emissive="#7547D8"
                emissiveIntensity={1.25}
                roughness={0.2}
                metalness={0.4}
              />
            </mesh>
          </group>
          <group position={[0.24, -0.04, 0.16]} rotation={[0.2, -0.4, -0.25]}>
            <mesh geometry={geometries.headphoneCup} material={materials.phoneBody} rotation={[0, 0, Math.PI / 2]} />
            <mesh geometry={geometries.headphoneRing} position={[0.028, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <meshStandardMaterial
                color="#367BFF"
                emissive="#367BFF"
                emissiveIntensity={1.25}
                roughness={0.2}
                metalness={0.4}
              />
            </mesh>
          </group>
        </group>

        {/* Neck */}
        <group ref={neckRef} position={[0, 0.56, 0]}>
          <mesh geometry={geometries.neck} material={materials.skin} position={[0, 0.08, 0]} castShadow />

          {/* Articulated Head */}
          <group ref={headRef} position={[0, 0.34, 0.02]}>
            {/* Cranium & sculpted jawline */}
            <mesh geometry={geometries.headBase} material={materials.skin} scale={[0.94, 1.06, 0.96]} castShadow />
            <mesh
              geometry={geometries.jaw}
              material={materials.skin}
              position={[0, -0.15, 0.05]}
              rotation={[Math.PI, 0, 0]}
              scale={[0.96, 0.92, 0.85]}
              castShadow
            />

            {/* Independent Left Eye (viewer's left / character's right, -X) — Electric Blue */}
            <group position={[-0.105, 0.02, 0.255]}>
              <group ref={leftEyeRef}>
                <mesh geometry={geometries.sclera} material={materials.sclera} scale={[1, 0.9, 0.7]} />
                <mesh geometry={geometries.iris} position={[0, 0, 0.026]} scale={[1, 1, 0.55]}>
                  <meshStandardMaterial
                    ref={irisBlueMatRef}
                    color="#367BFF"
                    emissive="#367BFF"
                    emissiveIntensity={1.5}
                    roughness={0.18}
                    metalness={0.1}
                  />
                </mesh>
                <mesh geometry={geometries.pupil} material={materials.pupil} position={[0, 0, 0.039]} scale={[1, 1, 0.5]} />
              </group>
              <mesh
                ref={leftLidTopRef}
                geometry={geometries.eyelid}
                material={materials.skin}
                rotation={[-0.92, 0, 0]}
              />
            </group>

            {/* Independent Right Eye (viewer's right / character's left, +X) — Deep Violet */}
            <group position={[0.105, 0.02, 0.255]}>
              <group ref={rightEyeRef}>
                <mesh geometry={geometries.sclera} material={materials.sclera} scale={[1, 0.9, 0.7]} />
                <mesh geometry={geometries.iris} position={[0, 0, 0.026]} scale={[1, 1, 0.55]}>
                  <meshStandardMaterial
                    ref={irisVioletMatRef}
                    color="#7547D8"
                    emissive="#7547D8"
                    emissiveIntensity={1.5}
                    roughness={0.18}
                    metalness={0.1}
                  />
                </mesh>
                <mesh geometry={geometries.pupil} material={materials.pupil} position={[0, 0, 0.039]} scale={[1, 1, 0.5]} />
              </group>
              <mesh
                ref={rightLidTopRef}
                geometry={geometries.eyelid}
                material={materials.skin}
                rotation={[-0.92, 0, 0]}
              />
            </group>

            {/* Expressive Eyebrows */}
            <mesh ref={leftBrowRef} geometry={geometries.brow} material={materials.hair} position={[-0.105, 0.105, 0.285]} />
            <mesh ref={rightBrowRef} geometry={geometries.brow} material={materials.hair} position={[0.105, 0.105, 0.285]} />

            {/* Layered Messy Black Anime Hair Volume & Strands */}
            <group ref={hairCrownRef}>
              <mesh geometry={geometries.hairBack} material={materials.hair} position={[0, 0.05, -0.04]} castShadow />
              {hairBlades.map((blade, idx) => (
                <mesh
                  key={idx}
                  geometry={geometries.hairSpike}
                  material={materials.hair}
                  position={blade.pos}
                  rotation={blade.rot}
                  scale={blade.scale}
                  castShadow
                />
              ))}
            </group>

            {/* Interactive Asymmetrical Black & Silver Half-Mask */}
            <group ref={maskGroupRef}>
              <mesh
                geometry={geometries.maskShell}
                rotation={[0, -Math.PI * 0.46, 0]}
                scale={[0.98, 1.06, 0.98]}
                castShadow
              >
                <meshStandardMaterial
                  ref={maskShellMatRef}
                  color="#0D1018"
                  roughness={0.34}
                  metalness={0.76}
                  transparent
                  opacity={1}
                />
              </mesh>
              {/* Silver ornate crest */}
              <mesh
                geometry={geometries.maskCrest}
                position={[-0.08, 0.15, 0.27]}
                rotation={[0.24, -0.25, 0.34]}
              >
                <meshStandardMaterial
                  ref={maskCrestMatRef}
                  color="#C5CAD6"
                  roughness={0.18}
                  metalness={0.92}
                  transparent
                  opacity={1}
                />
              </mesh>
              {/* Glowing Electric Blue mask optic slit */}
              <mesh geometry={geometries.maskSlit} position={[-0.11, 0.02, 0.298]}>
                <meshStandardMaterial
                  ref={maskOpticMatRef}
                  color="#367BFF"
                  emissive="#367BFF"
                  emissiveIntensity={1.8}
                  roughness={0.1}
                  metalness={0.2}
                  transparent
                  opacity={1}
                />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
