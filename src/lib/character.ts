export type CharacterExpressionId =
  | "idle"
  | "greeting"
  | "thinking"
  | "coding"
  | "surprised"
  | "confident";

export type CharacterMaskMode = "masked" | "unmasked" | "transition";

export interface CharacterExpressionAsset {
  id: CharacterExpressionId;
  label: string;
  src: string;
  mood: string;
  width: number;
  height: number;
}

export interface CharacterMaskAsset {
  id: CharacterMaskMode;
  label: string;
  src: string;
  description: string;
  width: number;
  height: number;
}

export const CHARACTER_BRAND_ASSETS = {
  logoMark: {
    src: "/character/byteprowler-logo.png",
    alt: "ByteProwler brand logo",
    width: 403,
    height: 133,
  },
  heroHalfBody: {
    src: "/character/hero-halfbody.png",
    alt: "ByteProwler V3 — The Midnight Developer half-body anime character wearing dark techwear and an asymmetrical half-mask",
    width: 860,
    height: 1024,
  },
  wolfCrest: {
    src: "/character/crest-wolf.png",
    alt: "ByteProwler wolf crest emblem",
    width: 100,
    height: 78,
  },
  wordmark: {
    src: "/character/byteprowler-wordmark.png",
    alt: "ByteProwler wordmark",
    width: 1040,
    height: 300,
  },
  ogBanner: {
    src: "/assets/aistudio/og-byteprowler_1917f1ea.jpg",
    alt: "ByteProwler signature graphic",
    width: 1080,
    height: 1203,
  },
} as const;

export const CHARACTER_EXPRESSIONS: CharacterExpressionAsset[] = [
  {
    id: "idle",
    label: "Idle",
    src: "/character/expressions/idle.png",
    mood: "Calm observation in Midnight standby",
    width: 190,
    height: 165,
  },
  {
    id: "greeting",
    label: "Greeting",
    src: "/character/expressions/greeting.png",
    mood: "Approachable welcome signal",
    width: 190,
    height: 165,
  },
  {
    id: "thinking",
    label: "Thinking",
    src: "/character/expressions/thinking.png",
    mood: "Analyzing architecture and UI flows",
    width: 190,
    height: 165,
  },
  {
    id: "coding",
    label: "Coding",
    src: "/character/expressions/coding.png",
    mood: "Deep-focus TypeScript & React build loop",
    width: 190,
    height: 165,
  },
  {
    id: "surprised",
    label: "Surprised",
    src: "/character/expressions/surprised.png",
    mood: "Unexpected runtime event detected",
    width: 190,
    height: 165,
  },
  {
    id: "confident",
    label: "Confident",
    src: "/character/expressions/confident.png",
    mood: "Production ship ready",
    width: 190,
    height: 165,
  },
];

export const CHARACTER_MASK_MODES: CharacterMaskAsset[] = [
  {
    id: "masked",
    label: "Masked (Default)",
    src: "/character/masks/masked.png",
    description: "Asymmetrical half-mask engaged with electric blue optical glow.",
    width: 168,
    height: 164,
  },
  {
    id: "unmasked",
    label: "Unmasked",
    src: "/character/masks/unmasked.png",
    description: "Full heterochromatic eyes visible — electric blue and deep violet.",
    width: 168,
    height: 164,
  },
  {
    id: "transition",
    label: "Transition",
    src: "/character/masks/transition.png",
    description: "Phase-shifting half-mask profile with violet particle dissipation.",
    width: 166,
    height: 164,
  },
];
