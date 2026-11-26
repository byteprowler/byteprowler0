import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { VRMHumanBoneName, type VRM } from "@pixiv/three-vrm";
import { detectWebGLCapability, disposeObject3D } from "../../lib/webgl";
import {
  BYTEPROWLER_3D_MODEL_CONFIG,
  CHARACTER_MODEL_SPEC,
  inspectGlbBinary,
} from "../../lib/character3d";
import { resolveGraphicsPreset } from "../../hooks/useGraphicsQuality";
import {
  applyNaturalStandingPose,
  resolveAvailableExpressionName,
} from "../../hooks/useCharacterAnimation";

function createSyntheticGlbHeader(jsonPayload: Record<string, unknown>): ArrayBuffer {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(jsonPayload));
  const paddedLen = Math.ceil(jsonBytes.length / 4) * 4;
  const totalLen = 20 + paddedLen;
  const buffer = new ArrayBuffer(totalLen);
  const view = new DataView(buffer);
  view.setUint32(0, 0x46546c67, true); // "glTF"
  view.setUint32(4, 2, true); // version 2
  view.setUint32(8, totalLen, true);
  view.setUint32(12, paddedLen, true);
  view.setUint32(16, 0x4e4f534a, true); // "JSON"
  const out = new Uint8Array(buffer, 20, paddedLen);
  out.fill(0x20);
  out.set(jsonBytes);
  return buffer;
}

describe("Stage 3.1 Real-Time 3D VRM Pipeline & Quality Presets", () => {
  it("falls back safely when WebGL is unavailable in headless jsdom", () => {
    const capability = detectWebGLCapability();
    expect(capability.supported).toBe(false);
    expect(capability.particleCount).toBe(0);
    expect(capability.enableShadows).toBe(false);
    expect(capability.maxDpr).toBe(1);
  });

  it("rejects truncated 2-byte CRLF files and accepts valid glTF2/VRM headers", () => {
    const crlf = new Uint8Array([0x0d, 0x0a]).buffer;
    const truncated = inspectGlbBinary(crlf);
    expect(truncated.valid).toBe(false);
    expect(truncated.byteLength).toBe(2);
    expect(truncated.reason).toContain("2 bytes");

    const vrm1Buffer = createSyntheticGlbHeader({
      asset: { version: "2.0" },
      extensionsUsed: ["VRMC_vrm", "VRMC_springBone"],
      extensions: { VRMC_vrm: { specVersion: "1.0" }, VRMC_springBone: { springs: [{}] } },
    });
    const validResult = inspectGlbBinary(vrm1Buffer);
    expect(validResult.valid).toBe(true);
    expect(validResult.hasVrm1).toBe(true);
    expect(validResult.hasSpringBone).toBe(true);
  });

  it("configures candidate VRoid paths and disables unverified procedural mask overlay by default", () => {
    expect(BYTEPROWLER_3D_MODEL_CONFIG.candidateUrls[0]).toBe(
      "/character/ByteProwler%20-%20Midnight.vrm",
    );
    expect(BYTEPROWLER_3D_MODEL_CONFIG.candidateUrls).toContain(
      "/character/ByteProwler%20-%20Midnight.glb",
    );
    expect(BYTEPROWLER_3D_MODEL_CONFIG.maskOverlayEnabled).toBe(false);
    expect(CHARACTER_MODEL_SPEC.requiredHumanoidBones).toContain("head");
    expect(CHARACTER_MODEL_SPEC.requiredHumanoidBones).toContain("leftUpperArm");
  });

  it("resolves Low/Medium/High graphics presets adaptively", () => {
    const desktopCap = {
      supported: true,
      webgl2: true,
      isSoftwareGl: false,
      isMobile: false,
      maxDpr: 2,
      enableShadows: true,
      enableAntialias: true,
      particleCount: 130,
      rendererName: "ANGLE",
    };
    const mobileCap = { ...desktopCap, isMobile: true, maxDpr: 1.5, enableShadows: false };

    expect(resolveGraphicsPreset("auto", desktopCap)).toBe("high");
    expect(resolveGraphicsPreset("auto", mobileCap)).toBe("low");
    expect(resolveGraphicsPreset("medium", desktopCap)).toBe("medium");
  });

  it("applies a relaxed non-T-pose standing posture and resolves only model-supported expressions", () => {
    const bones = new Map<string, THREE.Object3D>();
    for (const boneName of Object.values(VRMHumanBoneName)) {
      bones.set(boneName, new THREE.Object3D());
    }
    const mockVrm = {
      humanoid: {
        getNormalizedBoneNode: (name: VRMHumanBoneName) => bones.get(name) ?? null,
      },
    } as unknown as VRM;

    expect(applyNaturalStandingPose(mockVrm)).toBe(true);
    expect(Math.abs(bones.get(VRMHumanBoneName.LeftUpperArm)!.rotation.z)).toBeGreaterThan(1.0);
    expect(Math.abs(bones.get(VRMHumanBoneName.RightUpperArm)!.rotation.z)).toBeGreaterThan(1.0);
    expect(bones.get(VRMHumanBoneName.Head)!.rotation.z).not.toBe(0);

    expect(resolveAvailableExpressionName(["neutral", "happy", "blink"], "greeting")).toBe("happy");
    expect(resolveAvailableExpressionName(["neutral", "happy", "blink"], "surprised")).toBe(
      "neutral",
    );
    expect(resolveAvailableExpressionName([], "idle")).toBeNull();
  });

  it("disposes Three.js mesh geometry and materials cleanly", () => {
    const group = new THREE.Group();
    group.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: "#367BFF" }),
      ),
    );
    expect(() => disposeObject3D(group)).not.toThrow();
    expect(() => disposeObject3D(null)).not.toThrow();
  });
});
