import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import type { CharacterExpressionId, CharacterMaskMode } from "../../lib/character";
import { BYTEPROWLER_3D_MODEL_CONFIG, type CharacterRigSource } from "../../lib/character3d";
import { disposeObject3D } from "../../lib/webgl";
import ProceduralMidnightCharacter from "./ProceduralMidnightCharacter";

interface VrmCharacterRigProps {
  modelUrl?: string | null;
  expression: CharacterExpressionId;
  maskMode: CharacterMaskMode;
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  scrollProgressRef: React.MutableRefObject<number>;
  reducedMotion: boolean;
  onCharacterClick?: () => void;
  onPointerHoverChange?: (hovering: boolean) => void;
  onRigSourceChange?: (source: CharacterRigSource) => void;
}

const VRM_EXPRESSION_MAP: Record<CharacterExpressionId, string> = {
  idle: "neutral",
  greeting: "happy",
  thinking: "relaxed",
  coding: "neutral",
  surprised: "surprised",
  confident: "happy",
};

const _lookTarget = new THREE.Vector3();

/**
 * Modular VRM / GLB character renderer powered by Three.js + @pixiv/three-vrm.
 * Supports rigged VRM avatars (blinking, lookAt eye tracking, expression manager,
 * SpringBone hair/cloth physics, humanoid bone posing, optional HalfMask node toggle)
 * and standard rigged GLB models. When no external model URL is supplied, renders
 * the articulated ProceduralMidnightCharacter placeholder rig.
 */
export default function VrmCharacterRig({
  modelUrl = BYTEPROWLER_3D_MODEL_CONFIG.modelUrl,
  expression,
  maskMode,
  pointerRef,
  scrollProgressRef,
  reducedMotion,
  onCharacterClick,
  onPointerHoverChange,
  onRigSourceChange,
}: VrmCharacterRigProps) {
  const [vrmInstance, setVrmInstance] = useState<VRM | null>(null);
  const [glbScene, setGlbScene] = useState<THREE.Object3D | null>(null);
  const activeVrmRef = useRef<VRM | null>(null);
  const activeGlbRef = useRef<THREE.Object3D | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const lookTargetObjRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const rigGroupRef = useRef<THREE.Group>(null);
  const blinkRef = useRef({ nextBlinkAt: 2.6, progress: 0, active: false });
  const clickImpulseRef = useRef(0);

  useEffect(() => {
    if (!modelUrl) {
      onRigSourceChange?.("procedural-standin");
      return;
    }

    let cancelled = false;
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      modelUrl,
      (gltf) => {
        if (cancelled) {
          disposeObject3D(gltf.scene);
          return;
        }

        const loadedVrm = gltf.userData.vrm as VRM | undefined;
        if (loadedVrm) {
          VRMUtils.removeUnnecessaryVertices(gltf.scene);
          VRMUtils.combineSkeletons(gltf.scene);
          loadedVrm.scene.traverse((obj) => {
            obj.frustumCulled = false;
          });
          if (loadedVrm.lookAt) {
            loadedVrm.lookAt.target = lookTargetObjRef.current;
          }
          activeVrmRef.current = loadedVrm;
          activeGlbRef.current = null;
          setVrmInstance(loadedVrm);
          setGlbScene(null);
          onRigSourceChange?.("vrm");
          return;
        }

        const root = gltf.scene;
        if (gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(root);
          mixer.clipAction(gltf.animations[0]).play();
          mixerRef.current = mixer;
        }
        activeGlbRef.current = root;
        activeVrmRef.current = null;
        setGlbScene(root);
        setVrmInstance(null);
        onRigSourceChange?.("glb");
      },
      undefined,
      () => {
        if (!cancelled) {
          activeVrmRef.current = null;
          activeGlbRef.current = null;
          setVrmInstance(null);
          setGlbScene(null);
          onRigSourceChange?.("procedural-standin");
        }
      },
    );

    return () => {
      cancelled = true;
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
      if (activeVrmRef.current) {
        VRMUtils.deepDispose(activeVrmRef.current.scene);
        activeVrmRef.current = null;
      }
      if (activeGlbRef.current) {
        disposeObject3D(activeGlbRef.current);
        activeGlbRef.current = null;
      }
    };
  }, [modelUrl, onRigSourceChange]);

  // Sync optional half-mask mesh visibility on VRM/GLB if node exists
  useEffect(() => {
    const activeScene = vrmInstance?.scene ?? glbScene;
    if (!activeScene) return;
    const maskNode = activeScene.getObjectByName("HalfMask_Asymmetrical");
    if (maskNode) {
      maskNode.visible = maskMode !== "unmasked";
    }
  }, [vrmInstance, glbScene, maskMode]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;
    const px = reducedMotion ? 0 : pointerRef.current.x;
    const py = reducedMotion ? 0 : pointerRef.current.y;

    if (clickImpulseRef.current > 0.001) {
      clickImpulseRef.current = THREE.MathUtils.damp(clickImpulseRef.current, 0, 6, delta);
    } else {
      clickImpulseRef.current = 0;
    }

    if (vrmInstance) {
      // Update VRM lookAt target in 3D space
      _lookTarget.set(px * 1.4, 1.35 + py * 0.65, 2.5);
      lookTargetObjRef.current.position.lerp(_lookTarget, Math.min(1, delta * 8));

      // Head & chest pointer + breathing animation on humanoid bones
      const head = vrmInstance.humanoid?.getNormalizedBoneNode("head");
      const chest = vrmInstance.humanoid?.getNormalizedBoneNode("chest");
      if (head) {
        head.rotation.y = THREE.MathUtils.damp(head.rotation.y, px * 0.25, 6, delta);
        head.rotation.x = THREE.MathUtils.damp(
          head.rotation.x,
          -py * 0.16 + clickImpulseRef.current * 0.14,
          6,
          delta,
        );
      }
      if (chest && !reducedMotion) {
        chest.rotation.x = Math.sin(t * 1.4) * 0.015;
      }

      // Natural blinking & VRM facial expressions
      const em = vrmInstance.expressionManager;
      if (em) {
        for (const preset of ["neutral", "happy", "relaxed", "surprised", "angry", "sad"]) {
          em.setValue(preset, preset === VRM_EXPRESSION_MAP[expression] ? 0.85 : 0);
        }

        let blinkValue = 0;
        if (!reducedMotion) {
          const b = blinkRef.current;
          if (!b.active && t >= b.nextBlinkAt) {
            b.active = true;
            b.progress = 0;
          }
          if (b.active) {
            b.progress += delta * 7.2;
            if (b.progress >= Math.PI) {
              b.active = false;
              b.progress = 0;
              b.nextBlinkAt = t + 3.4;
            } else {
              blinkValue = Math.sin(b.progress);
            }
          }
        }
        em.setValue("blink", blinkValue);
      }

      vrmInstance.update(delta);
    } else if (glbScene) {
      mixerRef.current?.update(delta);
      if (rigGroupRef.current) {
        rigGroupRef.current.rotation.y = THREE.MathUtils.damp(
          rigGroupRef.current.rotation.y,
          px * 0.2 - scrollProgressRef.current * 0.3,
          5,
          delta,
        );
      }
    }
  });

  if (vrmInstance) {
    return (
      <group
        ref={rigGroupRef}
        position={[0, -0.78, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          clickImpulseRef.current = 1;
          onCharacterClick?.();
        }}
        onPointerOver={() => onPointerHoverChange?.(true)}
        onPointerOut={() => onPointerHoverChange?.(false)}
      >
        <primitive object={vrmInstance.scene} />
      </group>
    );
  }

  if (glbScene) {
    return (
      <group
        ref={rigGroupRef}
        position={[0, -0.78, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          clickImpulseRef.current = 1;
          onCharacterClick?.();
        }}
        onPointerOver={() => onPointerHoverChange?.(true)}
        onPointerOut={() => onPointerHoverChange?.(false)}
      >
        <primitive object={glbScene} />
      </group>
    );
  }

  return (
    <ProceduralMidnightCharacter
      expression={expression}
      maskMode={maskMode}
      pointerRef={pointerRef}
      scrollProgressRef={scrollProgressRef}
      reducedMotion={reducedMotion}
      onCharacterClick={onCharacterClick}
      onPointerHoverChange={onPointerHoverChange}
    />
  );
}
