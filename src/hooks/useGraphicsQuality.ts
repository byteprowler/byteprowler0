import { useEffect, useMemo, useState } from "react";
import { detectWebGLCapability, type WebGLCapabilityReport } from "../lib/webgl";
import type { GraphicsQualityPreference, GraphicsQualityPreset } from "../lib/character3d";

export interface GraphicsQualityConfig {
  preset: GraphicsQualityPreset;
  capability: WebGLCapabilityReport;
  dpr: number;
  enableShadows: boolean;
  enableAntialias: boolean;
  particleCount: number;
  isOffScreen: boolean;
  isTabHidden: boolean;
  shouldRenderLoop: boolean;
}

const PRESET_PROFILES: Record<
  GraphicsQualityPreset,
  { maxDpr: number; shadows: boolean; antialias: boolean; particles: number }
> = {
  low: { maxDpr: 1, shadows: false, antialias: false, particles: 36 },
  medium: { maxDpr: 1.5, shadows: true, antialias: true, particles: 78 },
  high: { maxDpr: 2, shadows: true, antialias: true, particles: 130 },
};

export function resolveGraphicsPreset(
  preference: GraphicsQualityPreference,
  capability: WebGLCapabilityReport,
): GraphicsQualityPreset {
  if (preference !== "auto") {
    return preference;
  }
  if (!capability.supported || capability.isSoftwareGl || capability.isMobile) {
    return "low";
  }
  return capability.webgl2 ? "high" : "medium";
}

export function useGraphicsQuality(
  preference: GraphicsQualityPreference,
  containerRef: React.RefObject<HTMLElement | null>,
  reducedMotion: boolean,
): GraphicsQualityConfig {
  const capability = useMemo(() => detectWebGLCapability(), []);
  const [isOffScreen, setIsOffScreen] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(
    () => typeof document !== "undefined" && document.visibilityState === "hidden",
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleVisibility = () => {
      setIsTabHidden(document.visibilityState === "hidden");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const target = containerRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsOffScreen(!entry.isIntersecting);
        }
      },
      { threshold: 0.02 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [containerRef]);

  return useMemo(() => {
    const preset = resolveGraphicsPreset(preference, capability);
    const profile = PRESET_PROFILES[preset];
    const deviceDpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    return {
      preset,
      capability,
      dpr: capability.isSoftwareGl ? 1 : Math.min(deviceDpr, profile.maxDpr),
      enableShadows: profile.shadows && !capability.isSoftwareGl && !capability.isMobile,
      enableAntialias: profile.antialias && !capability.isSoftwareGl,
      particleCount: reducedMotion
        ? 0
        : capability.isMobile
          ? Math.min(profile.particles, 56)
          : profile.particles,
      isOffScreen,
      isTabHidden,
      shouldRenderLoop: capability.supported && !isOffScreen && !isTabHidden,
    };
  }, [preference, capability, reducedMotion, isOffScreen, isTabHidden]);
}
