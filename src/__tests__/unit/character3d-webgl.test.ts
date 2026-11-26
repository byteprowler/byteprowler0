import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { detectWebGLCapability, disposeObject3D } from "../../lib/webgl";
import {
  BYTEPROWLER_3D_MODEL_CONFIG,
  CHARACTER_3D_CAPABILITY_MATRIX,
  CHARACTER_MODEL_SPEC,
} from "../../lib/character3d";

describe("Stage 3 WebGL Capability & 3D Character Specifications", () => {
  it("falls back safely when WebGL is unavailable in headless jsdom", () => {
    const capability = detectWebGLCapability();
    expect(capability.supported).toBe(false);
    expect(capability.particleCount).toBe(0);
    expect(capability.enableShadows).toBe(false);
    expect(capability.maxDpr).toBe(1);
  });

  it("defines authentic VRM 1.0 model specifications without faking an unbundled model URL", () => {
    expect(BYTEPROWLER_3D_MODEL_CONFIG.modelUrl).toBeNull();
    expect(BYTEPROWLER_3D_MODEL_CONFIG.preferredFormat).toBe("vrm");

    expect(CHARACTER_MODEL_SPEC.requiredHumanoidBones).toEqual(
      expect.arrayContaining(["head", "neck", "chest", "leftEye", "rightEye"]),
    );
    expect(CHARACTER_MODEL_SPEC.requiredExpressions).toEqual(
      expect.arrayContaining(["blink", "happy", "surprised"]),
    );
    expect(
      CHARACTER_MODEL_SPEC.requiredToggleableNodes.some((node) =>
        node.includes("HalfMask_Asymmetrical"),
      ),
    ).toBe(true);

    expect(CHARACTER_3D_CAPABILITY_MATRIX.workingNowOnProceduralRig.length).toBeGreaterThan(5);
    expect(CHARACTER_3D_CAPABILITY_MATRIX.awaitingCustomVrmAsset.length).toBeGreaterThan(2);
  });

  it("disposes Three.js mesh geometry and materials cleanly", () => {
    const group = new THREE.Group();
    const geom = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: "#367BFF" });
    const mesh = new THREE.Mesh(geom, mat);
    group.add(mesh);

    expect(() => disposeObject3D(group)).not.toThrow();
    expect(() => disposeObject3D(null)).not.toThrow();
  });
});
