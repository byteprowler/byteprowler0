import { useEffect, useRef, useState } from "react";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

export interface PointerOffset {
  x: number;
  y: number;
  active: boolean;
}

const NEUTRAL_OFFSET: PointerOffset = { x: 0, y: 0, active: false };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Tracks normalized pointer coordinates in [-1, 1] relative to the viewport
 * or an optional container ref, throttled via requestAnimationFrame.
 */
export function useEyeTracking(enabled = true) {
  const shouldReduceMotion = useReducedMotionSafe();
  const [offset, setOffset] = useState<PointerOffset>(NEUTRAL_OFFSET);
  const frameRef = useRef<number | null>(null);
  const latestRef = useRef<PointerOffset>(NEUTRAL_OFFSET);

  useEffect(() => {
    if (!enabled || shouldReduceMotion || typeof window === "undefined") {
      return;
    }

    const isCoarse =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    if (isCoarse) {
      return;
    }

    const commit = () => {
      frameRef.current = null;
      setOffset(latestRef.current);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;
      const nx = clamp((event.clientX / width) * 2 - 1, -1, 1);
      const ny = clamp((event.clientY / height) * 2 - 1, -1, 1);

      latestRef.current = { x: nx, y: ny, active: true };
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(commit);
      }
    };

    const handlePointerLeave = () => {
      latestRef.current = NEUTRAL_OFFSET;
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(commit);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", handlePointerLeave);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [enabled, shouldReduceMotion]);

  if (!enabled || shouldReduceMotion) {
    return NEUTRAL_OFFSET;
  }

  return offset;
}
