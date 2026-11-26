import { useEffect, useRef } from "react";
import * as THREE from "three";

export interface CharacterTrackingRefs {
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  scrollProgressRef: React.MutableRefObject<number>;
}

export function useCharacterTracking(
  containerRef: React.RefObject<HTMLElement | null>,
  reducedMotion: boolean,
): CharacterTrackingRefs {
  const pointerRef = useRef({ x: 0, y: 0 });
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePointerMove = (event: PointerEvent) => {
      if (reducedMotion || event.pointerType === "touch") return;
      const nx = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      const ny = -((event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1);
      pointerRef.current.x = THREE.MathUtils.clamp(nx, -1, 1);
      pointerRef.current.y = THREE.MathUtils.clamp(ny, -1, 1);
    };

    const handlePointerLeave = () => {
      pointerRef.current.x = 0;
      pointerRef.current.y = 0;
    };

    const handleScroll = () => {
      const el = containerRef.current;
      if (!el) {
        scrollProgressRef.current = THREE.MathUtils.clamp(
          window.scrollY / Math.max(window.innerHeight, 1),
          0,
          1,
        );
        return;
      }
      const rect = el.getBoundingClientRect();
      scrollProgressRef.current = THREE.MathUtils.clamp(
        -rect.top / Math.max(rect.height, 1),
        0,
        1,
      );
    };

    handleScroll();
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", handlePointerLeave, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [containerRef, reducedMotion]);

  return { pointerRef, scrollProgressRef };
}
