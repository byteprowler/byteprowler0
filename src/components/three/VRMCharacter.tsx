import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRM, VRMHumanBoneName, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import type { CharacterExpressionId, CharacterMaskMode } from "../../lib/character";
import {
  BYTEPROWLER_3D_MODEL_CONFIG,
  inspectGlbBinary,
  type CharacterModelDiagnostics,
} from "../../lib/character3d";
import { disposeObject3D } from "../../lib/webgl";
import {
  applyNaturalStandingPose,
  createInitialAnimationState,
  updateVrmCharacterFrame,
} from "../../hooks/useCharacterAnimation";
import CharacterMask from "./CharacterMask";

export interface DownloadProgressInfo {
  percent: number;
  loadedBytes: number;
  totalBytes: number | null;
}

interface VRMCharacterProps {
  candidateUrls?: readonly string[];
  expression: CharacterExpressionId;
  maskMode: CharacterMaskMode;
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  scrollProgressRef: React.MutableRefObject<number>;
  reducedMotion: boolean;
  enableShadows: boolean;
  onDownloadProgress?: (progress: DownloadProgressInfo) => void;
  onDiagnosticsChange?: (diagnostics: CharacterModelDiagnostics) => void;
  onCharacterClick?: () => void;
  onPointerHoverChange?: (hovering: boolean) => void;
}

async function fetchBinaryWithProgress(
  url: string,
  signal: AbortSignal,
  onProgress?: (progress: DownloadProgressInfo) => void,
): Promise<ArrayBuffer> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} (${url})`);
  }

  const contentLengthHeader = response.headers.get("content-length");
  const totalBytes = contentLengthHeader ? Number(contentLengthHeader) : null;

  if (!response.body) {
    const buf = await response.arrayBuffer();
    onProgress?.({ percent: 100, loadedBytes: buf.byteLength, totalBytes: buf.byteLength });
    return buf;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loadedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loadedBytes += value.byteLength;
      const percent =
        totalBytes && totalBytes > 0 ? Math.min(99, (loadedBytes / totalBytes) * 100) : 50;
      onProgress?.({ percent, loadedBytes, totalBytes });
    }
  }

  const merged = new Uint8Array(loadedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  onProgress?.({ percent: 100, loadedBytes, totalBytes: totalBytes ?? loadedBytes });
  return merged.buffer;
}

function countSceneTextures(root: THREE.Object3D): number {
  const seen = new Set<string>();
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats) {
        if (!mat) continue;
        for (const value of Object.values(mat as unknown as Record<string, unknown>)) {
          if (value instanceof THREE.Texture) {
            seen.add(value.uuid);
          }
        }
      }
    }
  });
  return seen.size;
}

export default function VRMCharacter({
  candidateUrls = BYTEPROWLER_3D_MODEL_CONFIG.candidateUrls,
  expression,
  maskMode,
  pointerRef,
  scrollProgressRef,
  reducedMotion,
  enableShadows,
  onDownloadProgress,
  onDiagnosticsChange,
  onCharacterClick,
  onPointerHoverChange,
}: VRMCharacterProps) {
  const [vrmInstance, setVrmInstance] = useState<VRM | null>(null);
  const [glbScene, setGlbScene] = useState<THREE.Object3D | null>(null);
  const [headBone, setHeadBone] = useState<THREE.Object3D | null>(null);

  const activeVrmRef = useRef<VRM | null>(null);
  const activeGlbRef = useRef<THREE.Object3D | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const lookTargetObjRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const animationStateRef = useRef(createInitialAnimationState());
  const availableExpressionsRef = useRef<string[]>([]);
  const rigGroupRef = useRef<THREE.Group>(null);

  const progressCbRef = useRef(onDownloadProgress);
  const diagnosticsCbRef = useRef(onDiagnosticsChange);
  useEffect(() => {
    progressCbRef.current = onDownloadProgress;
    diagnosticsCbRef.current = onDiagnosticsChange;
  }, [onDownloadProgress, onDiagnosticsChange]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const loadFirstValidAsset = async () => {
      const failureReasons: string[] = [];

      for (const url of candidateUrls) {
        if (cancelled) return;
        try {
          const buffer = await fetchBinaryWithProgress(url, controller.signal, (p) => {
            if (!cancelled) progressCbRef.current?.(p);
          });

          const check = inspectGlbBinary(buffer);
          if (!check.valid) {
            failureReasons.push(`${decodeURIComponent(url)}: ${check.reason}`);
            continue;
          }

          const loader = new GLTFLoader();
          loader.register((parser) => new VRMLoaderPlugin(parser));

          const gltf = await new Promise<GLTF>((resolve, reject) => {
            const basePath = url.slice(0, url.lastIndexOf("/") + 1);
            loader.parse(buffer, basePath, resolve, reject);
          });

          if (cancelled) {
            disposeObject3D(gltf.scene);
            return;
          }

          const loadedVrm = gltf.userData.vrm as VRM | undefined;
          if (loadedVrm) {
            VRMUtils.rotateVRM0(loadedVrm);
            VRMUtils.combineSkeletons(gltf.scene);
            loadedVrm.scene.traverse((obj) => {
              obj.frustumCulled = false;
              if (obj instanceof THREE.Mesh) {
                obj.castShadow = enableShadows;
                obj.receiveShadow = enableShadows;
              }
            });

            if (loadedVrm.lookAt) {
              loadedVrm.lookAt.target = lookTargetObjRef.current;
            }

            const posed = applyNaturalStandingPose(loadedVrm);
            const expressionNames = loadedVrm.expressionManager
              ? Object.keys(loadedVrm.expressionManager.expressionMap)
              : [];
            availableExpressionsRef.current = expressionNames;

            const humanoidBoneCount = loadedVrm.humanoid
              ? Object.values(VRMHumanBoneName).filter((name) =>
                  Boolean(loadedVrm.humanoid.getNormalizedBoneNode(name)),
                ).length
              : 0;
            const springBoneCount = loadedVrm.springBoneManager?.joints.size ?? 0;
            const detectedHead =
              loadedVrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Head) ?? null;

            activeVrmRef.current = loadedVrm;
            activeGlbRef.current = null;
            setVrmInstance(loadedVrm);
            setGlbScene(null);
            setHeadBone(detectedHead);

            diagnosticsCbRef.current?.({
              sourceUrl: url,
              rigSource: "vrm",
              byteLength: check.byteLength,
              vrmVersion: check.hasVrm1 ? "1.0" : check.hasVrm0 ? "0.x" : null,
              texturesCount: countSceneTextures(loadedVrm.scene),
              humanoidBoneCount,
              springBoneCount,
              availableExpressions: expressionNames,
              hasLookAt: Boolean(loadedVrm.lookAt),
              naturalPoseApplied: posed,
              loadError: null,
            });
            return;
          }

          // Standard rigged GLB fallback if model lacks VRM extensions
          const root = gltf.scene;
          root.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
              obj.castShadow = enableShadows;
              obj.receiveShadow = enableShadows;
            }
          });
          if (gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(root);
            mixer.clipAction(gltf.animations[0]).play();
            mixerRef.current = mixer;
          }
          availableExpressionsRef.current = [];
          activeGlbRef.current = root;
          activeVrmRef.current = null;
          setGlbScene(root);
          setVrmInstance(null);
          setHeadBone(null);

          diagnosticsCbRef.current?.({
            sourceUrl: url,
            rigSource: "glb",
            byteLength: check.byteLength,
            vrmVersion: null,
            texturesCount: countSceneTextures(root),
            humanoidBoneCount: 0,
            springBoneCount: 0,
            availableExpressions: [],
            hasLookAt: false,
            naturalPoseApplied: false,
            loadError: null,
          });
          return;
        } catch (err) {
          if (controller.signal.aborted || cancelled) return;
          const message = err instanceof Error ? err.message : "Unknown load error";
          failureReasons.push(`${decodeURIComponent(url)}: ${message}`);
        }
      }

      if (!cancelled) {
        diagnosticsCbRef.current?.({
          sourceUrl: null,
          rigSource: "none",
          byteLength: 0,
          vrmVersion: null,
          texturesCount: 0,
          humanoidBoneCount: 0,
          springBoneCount: 0,
          availableExpressions: [],
          hasLookAt: false,
          naturalPoseApplied: false,
          loadError:
            failureReasons[failureReasons.length - 1] ??
            "No valid ByteProwler VRM/GLB asset found.",
        });
      }
    };

    void loadFirstValidAsset();

    return () => {
      cancelled = true;
      controller.abort();
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
  }, [candidateUrls, enableShadows]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;
    const px = pointerRef.current.x;
    const py = pointerRef.current.y;

    if (vrmInstance) {
      updateVrmCharacterFrame({
        vrm: vrmInstance,
        state: animationStateRef.current,
        lookTargetObject: lookTargetObjRef.current,
        availableExpressions: availableExpressionsRef.current,
        expression,
        pointerX: px,
        pointerY: py,
        scrollProgress: scrollProgressRef.current,
        reducedMotion,
        elapsedTime: t,
        delta,
      });
    } else if (glbScene) {
      mixerRef.current?.update(delta);
      if (rigGroupRef.current) {
        rigGroupRef.current.rotation.y = THREE.MathUtils.damp(
          rigGroupRef.current.rotation.y,
          (reducedMotion ? 0 : px) * 0.22 - scrollProgressRef.current * 0.2,
          5,
          delta,
        );
      }
    }
  });

  const handleInteractionClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    animationStateRef.current.clickImpulse = 1;
    onCharacterClick?.();
  };

  if (vrmInstance) {
    return (
      <group
        ref={rigGroupRef}
        onClick={handleInteractionClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerHoverChange?.(true);
        }}
        onPointerOut={() => onPointerHoverChange?.(false)}
      >
        <primitive object={vrmInstance.scene} />
        <CharacterMask
          headBone={headBone}
          maskMode={maskMode}
          enabled={BYTEPROWLER_3D_MODEL_CONFIG.maskOverlayEnabled}
        />
      </group>
    );
  }

  if (glbScene) {
    return (
      <group
        ref={rigGroupRef}
        onClick={handleInteractionClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerHoverChange?.(true);
        }}
        onPointerOut={() => onPointerHoverChange?.(false)}
      >
        <primitive object={glbScene} />
      </group>
    );
  }

  return null;
}
