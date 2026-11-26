export type CharacterRigSource = "none" | "vrm" | "glb";
export type GraphicsQualityPreset = "low" | "medium" | "high";
export type GraphicsQualityPreference = "auto" | GraphicsQualityPreset;

export interface CharacterModelConfig {
  candidateUrls: readonly string[];
  preferredFormat: "vrm" | "glb";
  maskOverlayEnabled: boolean;
}

export const BYTEPROWLER_3D_MODEL_CONFIG: CharacterModelConfig = {
  candidateUrls: [
    "/character/models/byteprowler%20-%20midnight.vrm",
    "/character/models/byteprowler%20-%20midnight.glb",
    "/character/ByteProwler%20-%20Midnight.glb",
  ],
  preferredFormat: "vrm",
  /**
   * CharacterMask stays disabled until head-bone alignment can be visually
   * verified against a valid rendered ByteProwler VRM/GLB mesh.
   */
  maskOverlayEnabled: false,
};

export interface CharacterModelDiagnostics {
  sourceUrl: string | null;
  rigSource: CharacterRigSource;
  byteLength: number;
  vrmVersion: string | null;
  texturesCount: number;
  humanoidBoneCount: number;
  springBoneCount: number;
  availableExpressions: string[];
  hasLookAt: boolean;
  naturalPoseApplied: boolean;
  loadError: string | null;
}

export interface GlbBinaryValidation {
  valid: boolean;
  byteLength: number;
  hasVrm1: boolean;
  hasVrm0: boolean;
  hasSpringBone: boolean;
  reason: string | null;
}

const GLTF_BINARY_MAGIC = 0x46546c67; // "glTF" little-endian
const GLTF_JSON_CHUNK_TYPE = 0x4e4f534a; // "JSON" little-endian

export function inspectGlbBinary(buffer: ArrayBuffer): GlbBinaryValidation {
  const byteLength = buffer.byteLength;
  if (byteLength < 20) {
    return {
      valid: false,
      byteLength,
      hasVrm1: false,
      hasVrm0: false,
      hasSpringBone: false,
      reason: `Model file is ${byteLength} bytes (incomplete or empty binary; valid glTF/VRM GLB header requires >= 20 bytes).`,
    };
  }

  const view = new DataView(buffer);
  const magic = view.getUint32(0, true);
  if (magic !== GLTF_BINARY_MAGIC) {
    return {
      valid: false,
      byteLength,
      hasVrm1: false,
      hasVrm0: false,
      hasSpringBone: false,
      reason: "File does not begin with a valid glTF/VRM binary magic header.",
    };
  }

  const version = view.getUint32(4, true);
  if (version !== 2) {
    return {
      valid: false,
      byteLength,
      hasVrm1: false,
      hasVrm0: false,
      hasSpringBone: false,
      reason: `Unsupported glTF binary version ${version}.`,
    };
  }

  const chunkLength = view.getUint32(12, true);
  const chunkType = view.getUint32(16, true);
  if (chunkType !== GLTF_JSON_CHUNK_TYPE || 20 + chunkLength > byteLength) {
    return {
      valid: false,
      byteLength,
      hasVrm1: false,
      hasVrm0: false,
      hasSpringBone: false,
      reason: "Corrupt glTF JSON chunk boundary.",
    };
  }

  try {
    const jsonBytes = new Uint8Array(buffer, 20, chunkLength);
    const jsonText = new TextDecoder("utf-8").decode(jsonBytes);
    const gltf = JSON.parse(jsonText) as {
      extensions?: Record<string, unknown>;
      extensionsUsed?: string[];
    };
    const used = gltf.extensionsUsed ?? [];
    const ext = gltf.extensions ?? {};
    const hasVrm1 = Boolean(ext.VRMC_vrm || used.includes("VRMC_vrm"));
    const hasVrm0 = Boolean(ext.VRM || used.includes("VRM"));
    const hasSpringBone = Boolean(
      ext.VRMC_springBone ||
        used.includes("VRMC_springBone") ||
        (hasVrm0 && Boolean((ext.VRM as Record<string, unknown> | undefined)?.secondaryAnimation)),
    );

    return {
      valid: true,
      byteLength,
      hasVrm1,
      hasVrm0,
      hasSpringBone,
      reason: null,
    };
  } catch {
    return {
      valid: false,
      byteLength,
      hasVrm1: false,
      hasVrm0: false,
      hasSpringBone: false,
      reason: "Failed to parse embedded glTF JSON header.",
    };
  }
}

export const CHARACTER_MODEL_SPEC = {
  format: "VRM 1.0 or VRM 0.x (VRoid Studio .vrm / .glb export)",
  expectedPaths: [
    "/character/models/byteprowler - midnight.vrm",
    "/character/models/byteprowler - midnight.glb",
    "/character/ByteProwler - Midnight.glb",
  ],
  expectedApproxSize: "~19.7 MB",
  requiredHumanoidBones: [
    "hips",
    "spine",
    "chest",
    "upperChest",
    "neck",
    "head",
    "leftEye",
    "rightEye",
    "leftShoulder",
    "leftUpperArm",
    "leftLowerArm",
    "rightShoulder",
    "rightUpperArm",
    "rightLowerArm",
  ],
  recommendedExpressions: [
    "neutral",
    "happy",
    "relaxed",
    "surprised",
    "angry",
    "sad",
    "blink",
    "blinkLeft",
    "blinkRight",
  ],
} as const;
