import type { Transition, Variants } from "motion/react";

export const MIDNIGHT_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const MIDNIGHT_SPRING: Transition = {
  type: "spring",
  stiffness: 240,
  damping: 26,
  mass: 0.9,
};

export const MIDNIGHT_VIEWPORT = {
  once: true,
  margin: "-60px",
} as const;

export function getRevealUp(reducedMotion: boolean, distance = 18, delay = 0): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.01 } },
    };
  }

  return {
    hidden: { opacity: 0, y: distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay, ease: MIDNIGHT_EASE },
    },
  };
}

export function getStaggerContainer(reducedMotion: boolean, stagger = 0.07): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1 },
      visible: { opacity: 1 },
    };
  }

  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: 0.05,
      },
    },
  };
}

export function getPanelTransition(reducedMotion: boolean): Transition {
  return reducedMotion ? { duration: 0.01 } : { duration: 0.32, ease: MIDNIGHT_EASE };
}
