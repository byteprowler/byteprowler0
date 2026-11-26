export type CharacterRigSource = "procedural-standin" | "vrm" | "glb";

export interface CharacterModelConfig {
  /**
   * Optional URL to a commissioned ByteProwler V3 VRM or GLB character model
   * (for example `/models/byteprowler-v3.vrm`). Remains null until a custom
   * model matching CHARACTER_MODEL_SPEC is supplied.
   */
  modelUrl: string | null;
  preferredFormat: "vrm" | "glb";
}

export const BYTEPROWLER_3D_MODEL_CONFIG: CharacterModelConfig = {
  modelUrl: null,
  preferredFormat: "vrm",
};

export const CHARACTER_MODEL_SPEC = {
  format: "VRM 1.0 (or rigged GLB with humanoid bones + morph targets)",
  targetPolyBudget: "25k–55k triangles (LOD-friendly for mobile WebGL)",
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
    "rightShoulder",
    "rightUpperArm",
  ],
  requiredExpressions: [
    "blink",
    "blinkLeft",
    "blinkRight",
    "happy",
    "relaxed",
    "surprised",
    "angry",
    "sad",
  ],
  requiredSpringBoneChains: [
    "Messy black hair bangs & crown strands",
    "Hoodie cords / techwear collar straps",
  ],
  requiredToggleableNodes: [
    "HalfMask_Asymmetrical (black + silver filigree mask mesh with electric-blue eye cutout)",
    "Headphones_Midnight (optional neck-mounted headphones)",
  ],
  materialSpecs: {
    leftEye: "Electric Blue (#367BFF) iris with subtle emissive rim",
    rightEye: "Deep Violet (#7547D8) iris with subtle emissive rim",
    techwear: "Matte obsidian charcoal fabric with subtle silver hardware accents",
  },
} as const;

export const CHARACTER_3D_CAPABILITY_MATRIX = {
  workingNowOnProceduralRig: [
    "Articulated multi-part 3D bust silhouette (torso, techwear collar, headphones, layered hair blades, head, eyelids, heterochromatic irises, asymmetrical half-mask)",
    "Natural randomized eyelid blinking",
    "Independent 3D eye-tracking following pointer position within anatomical bounds",
    "Smooth exponential-damped head, neck, and upper-torso pointer rotation",
    "Continuous chest breathing idle motion",
    "3D facial expression posture/brow/optic states (Idle, Greeting, Thinking, Coding, Surprised, Confident)",
    "Interactive 3D half-mask slide/phase toggle (Masked, Unmasked, Transition)",
    "Click interaction impulse on the 3D character mesh",
    "Dynamic Midnight Blue / Electric Blue / Deep Violet environmental lighting + RoomEnvironment IBL",
  ],
  awaitingCustomVrmAsset: [
    "High-poly anime hair/skin/fabric topology matching the ByteProwler V3 concept sheet",
    "Full-body skeletal walk/idle animation clips and SpringBone secondary hair/cloth physics",
    "Anatomical lip-sync and sculpted VRM blendshape deformation",
  ],
} as const;
