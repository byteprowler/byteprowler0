import * as THREE from "three";
import { VRMHumanBoneName, type VRM } from "@pixiv/three-vrm";
import type { CharacterExpressionId } from "../lib/character";

export interface CharacterAnimationState {
  blinkTimer: number;
  nextBlinkAt: number;
  blinkActive: boolean;
  blinkProgress: number;
  doubleBlinkQueued: boolean;
  clickImpulse: number;
  smoothedPx: number;
  smoothedPy: number;
}

export function createInitialAnimationState(): CharacterAnimationState {
  return {
    blinkTimer: 0,
    nextBlinkAt: 2.3 + Math.random() * 1.9,
    blinkActive: false,
    blinkProgress: 0,
    doubleBlinkQueued: false,
    clickImpulse: 0,
    smoothedPx: 0,
    smoothedPy: 0,
  };
}

/**
 * Applies a relaxed, slightly asymmetrical masculine standing pose on a VRM
 * humanoid skeleton so exported VRoid models never sit in a stiff T-pose.
 */
export function applyNaturalStandingPose(vrm: VRM): boolean {
  const humanoid = vrm.humanoid;
  if (!humanoid) return false;

  const setBoneEuler = (bone: VRMHumanBoneName, x: number, y: number, z: number) => {
    const node = humanoid.getNormalizedBoneNode(bone);
    if (node) {
      node.rotation.set(x, y, z);
      return true;
    }
    return false;
  };

  let posed = false;
  // Subtle weight shift through hips, spine, and chest
  posed = setBoneEuler(VRMHumanBoneName.Hips, 0, 0.07, -0.015) || posed;
  posed = setBoneEuler(VRMHumanBoneName.Spine, 0.025, -0.04, 0.015) || posed;
  posed = setBoneEuler(VRMHumanBoneName.Chest, 0.02, -0.03, -0.01) || posed;
  posed = setBoneEuler(VRMHumanBoneName.UpperChest, 0.01, -0.02, 0.01) || posed;

  // Confident asymmetrical shoulder & lowered arms posture
  setBoneEuler(VRMHumanBoneName.LeftShoulder, 0.02, 0.03, 0.07);
  setBoneEuler(VRMHumanBoneName.RightShoulder, 0.02, -0.04, -0.08);
  setBoneEuler(VRMHumanBoneName.LeftUpperArm, 0.08, 0.06, 1.18);
  setBoneEuler(VRMHumanBoneName.RightUpperArm, 0.12, -0.08, -1.24);
  setBoneEuler(VRMHumanBoneName.LeftLowerArm, -0.16, 0.14, 0.12);
  setBoneEuler(VRMHumanBoneName.RightLowerArm, -0.24, -0.18, -0.16);
  setBoneEuler(VRMHumanBoneName.LeftHand, 0.05, 0.04, 0.06);
  setBoneEuler(VRMHumanBoneName.RightHand, 0.08, -0.06, -0.08);

  // Relaxed finger curl so hands avoid rigid flat paddles
  const fingerCurlBones: Array<[VRMHumanBoneName, number]> = [
    [VRMHumanBoneName.LeftIndexProximal, 0.28],
    [VRMHumanBoneName.LeftMiddleProximal, 0.34],
    [VRMHumanBoneName.LeftRingProximal, 0.4],
    [VRMHumanBoneName.LeftLittleProximal, 0.45],
    [VRMHumanBoneName.RightIndexProximal, -0.32],
    [VRMHumanBoneName.RightMiddleProximal, -0.38],
    [VRMHumanBoneName.RightRingProximal, -0.44],
    [VRMHumanBoneName.RightLittleProximal, -0.5],
  ];
  for (const [bone, zRot] of fingerCurlBones) {
    setBoneEuler(bone, 0, 0, zRot);
  }

  // Slight confident head tilt & neck poise
  setBoneEuler(VRMHumanBoneName.Neck, 0.03, -0.04, 0.015);
  setBoneEuler(VRMHumanBoneName.Head, 0.02, -0.05, 0.045);

  return posed;
}

const PORTFOLIO_EXPRESSION_CANDIDATES: Record<CharacterExpressionId, readonly string[]> = {
  idle: ["neutral"],
  greeting: ["happy", "joy", "fun"],
  thinking: ["relaxed", "neutral"],
  coding: ["neutral", "relaxed"],
  surprised: ["surprised", "surprise"],
  confident: ["happy", "relaxed", "joy"],
};

export function resolveAvailableExpressionName(
  availableNames: readonly string[],
  expression: CharacterExpressionId,
): string | null {
  const candidates = PORTFOLIO_EXPRESSION_CANDIDATES[expression] ?? ["neutral"];
  for (const candidate of candidates) {
    const exact = availableNames.find((name) => name.toLowerCase() === candidate.toLowerCase());
    if (exact) return exact;
  }
  return availableNames.find((name) => name.toLowerCase() === "neutral") ?? null;
}

const _lookTarget = new THREE.Vector3();

export function updateVrmCharacterFrame(params: {
  vrm: VRM;
  state: CharacterAnimationState;
  lookTargetObject: THREE.Object3D;
  availableExpressions: readonly string[];
  expression: CharacterExpressionId;
  pointerX: number;
  pointerY: number;
  scrollProgress: number;
  reducedMotion: boolean;
  elapsedTime: number;
  delta: number;
}) {
  const {
    vrm,
    state,
    lookTargetObject,
    availableExpressions,
    expression,
    pointerX,
    pointerY,
    scrollProgress,
    reducedMotion,
    elapsedTime,
    delta,
  } = params;

  const targetPx = reducedMotion ? 0 : pointerX;
  const targetPy = reducedMotion ? 0 : pointerY;
  const dampSpeed = reducedMotion ? 16 : 6.2;

  state.smoothedPx = THREE.MathUtils.damp(state.smoothedPx, targetPx, dampSpeed, delta);
  state.smoothedPy = THREE.MathUtils.damp(state.smoothedPy, targetPy, dampSpeed, delta);

  if (state.clickImpulse > 0.001) {
    state.clickImpulse = THREE.MathUtils.damp(state.clickImpulse, 0, 5.5, delta);
  } else {
    state.clickImpulse = 0;
  }

  const px = state.smoothedPx;
  const py = state.smoothedPy;
  const impulse = state.clickImpulse;

  // 1. Independent eye tracking via VRM lookAt + safe eye-bone fallback
  _lookTarget.set(px * 1.35, 1.44 + py * 0.62, 2.35);
  lookTargetObject.position.lerp(_lookTarget, Math.min(1, delta * 9));

  if (!vrm.lookAt) {
    const leftEye = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.LeftEye);
    const rightEye = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.RightEye);
    const eyeYaw = THREE.MathUtils.clamp(px * 0.24, -0.24, 0.24);
    const eyePitch = THREE.MathUtils.clamp(-py * 0.15, -0.15, 0.15);
    if (leftEye) {
      leftEye.rotation.y = THREE.MathUtils.damp(leftEye.rotation.y, eyeYaw, 12, delta);
      leftEye.rotation.x = THREE.MathUtils.damp(leftEye.rotation.x, eyePitch, 12, delta);
    }
    if (rightEye) {
      rightEye.rotation.y = THREE.MathUtils.damp(rightEye.rotation.y, eyeYaw, 12, delta);
      rightEye.rotation.x = THREE.MathUtils.damp(rightEye.rotation.x, eyePitch, 12, delta);
    }
  }

  // 2. Head & neck damped pointer tracking layered atop natural poise
  const neck = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Neck);
  const head = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Head);

  if (neck) {
    neck.rotation.y = THREE.MathUtils.damp(neck.rotation.y, -0.04 + px * 0.12, 5.5, delta);
    neck.rotation.x = THREE.MathUtils.damp(neck.rotation.x, 0.03 - py * 0.07, 5.5, delta);
  }

  if (head) {
    const idleSway = reducedMotion ? 0 : Math.sin(elapsedTime * 0.85) * 0.018;
    head.rotation.y = THREE.MathUtils.damp(
      head.rotation.y,
      -0.05 + px * 0.24 + idleSway - scrollProgress * 0.08,
      6.5,
      delta,
    );
    head.rotation.x = THREE.MathUtils.damp(
      head.rotation.x,
      0.02 - py * 0.15 + impulse * 0.14,
      6.5,
      delta,
    );
    head.rotation.z = THREE.MathUtils.damp(
      head.rotation.z,
      0.045 - px * 0.045,
      5.5,
      delta,
    );
  }

  // 3. Idle breathing across chest, spine, and shoulders
  if (!reducedMotion) {
    const breath = Math.sin(elapsedTime * 1.45);
    const chest = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Chest);
    const spine = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Spine);
    const leftShoulder = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.LeftShoulder);
    const rightShoulder = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.RightShoulder);

    if (chest) chest.rotation.x = 0.02 + breath * 0.016;
    if (spine) spine.rotation.x = 0.025 + breath * 0.008;
    if (leftShoulder) leftShoulder.rotation.z = 0.07 + breath * 0.014;
    if (rightShoulder) rightShoulder.rotation.z = -0.08 - breath * 0.014;
  }

  // 4. Varied-interval natural blinking & verified facial expressions
  const em = vrm.expressionManager;
  if (em) {
    let blinkWeight = 0;
    if (!reducedMotion) {
      if (!state.blinkActive && elapsedTime >= state.nextBlinkAt) {
        state.blinkActive = true;
        state.blinkProgress = 0;
      }
      if (state.blinkActive) {
        state.blinkProgress += delta * 7.8;
        if (state.blinkProgress >= Math.PI) {
          state.blinkActive = false;
          state.blinkProgress = 0;
          if (!state.doubleBlinkQueued && Math.random() < 0.18) {
            state.doubleBlinkQueued = true;
            state.nextBlinkAt = elapsedTime + 0.14;
          } else {
            state.doubleBlinkQueued = false;
            state.nextBlinkAt = elapsedTime + 2.4 + Math.random() * 3.4;
          }
        } else {
          blinkWeight = Math.sin(state.blinkProgress);
        }
      }
    }

    const activeExprName = resolveAvailableExpressionName(availableExpressions, expression);
    for (const name of availableExpressions) {
      if (name === "blink" || name === "blinkLeft" || name === "blinkRight") continue;
      const targetWeight = activeExprName && name === activeExprName
        ? Math.min(1, 0.72 + impulse * 0.25)
        : 0;
      const current = em.getValue(name) ?? 0;
      em.setValue(name, THREE.MathUtils.damp(current, targetWeight, 8, delta));
    }

    if (availableExpressions.includes("blink")) {
      em.setValue("blink", blinkWeight);
    } else {
      if (availableExpressions.includes("blinkLeft")) em.setValue("blinkLeft", blinkWeight);
      if (availableExpressions.includes("blinkRight")) em.setValue("blinkRight", blinkWeight);
    }
  }

  // 5. Advance VRM core, lookAt, expressions, and VRMSpringBoneManager hair physics
  vrm.update(delta);
}
