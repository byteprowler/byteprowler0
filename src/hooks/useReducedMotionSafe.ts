import { createContext, useContext, useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

export const ReducedMotionOverrideContext = createContext<boolean>(false);

export function useReducedMotionSafe(): boolean {
  const motionPref = useReducedMotion();
  const overrideReduced = useContext(ReducedMotionOverrideContext);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return Boolean(overrideReduced || motionPref || prefersReduced);
}
