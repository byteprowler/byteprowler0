import React from "react";
import { useEyeTracking } from "../../hooks/useEyeTracking";
import { useReducedMotionSafe } from "../../hooks/useReducedMotionSafe";

export default function MidnightAtmosphere() {
  const shouldReduceMotion = useReducedMotionSafe();
  const pointer = useEyeTracking(!shouldReduceMotion);

  const blueShiftX = shouldReduceMotion ? 0 : pointer.x * 20;
  const blueShiftY = shouldReduceMotion ? 0 : pointer.y * 14;
  const violetShiftX = shouldReduceMotion ? 0 : pointer.x * -16;
  const violetShiftY = shouldReduceMotion ? 0 : pointer.y * -12;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#08090D]"
    >
      {/* Subtle diagonal midnight light plane (no grid lines, no concentric circles) */}
      <div
        className="absolute inset-0 opacity-45"
        style={{
          background:
            "linear-gradient(128deg, rgba(16, 24, 39, 0.55) 0%, rgba(8, 9, 13, 0) 48%, rgba(16, 24, 39, 0.42) 100%)",
        }}
      />

      {/* Cursor-reactive Electric Blue atmospheric depth */}
      <div
        className="absolute -right-[10%] -top-[14%] h-[34rem] w-[34rem] rounded-full opacity-28 blur-[120px] transition-transform duration-700 ease-out md:h-[44rem] md:w-[44rem]"
        style={{
          background: "radial-gradient(circle, rgba(54, 123, 255, 0.34) 0%, rgba(16, 24, 39, 0) 70%)",
          transform: `translate3d(${blueShiftX}px, ${blueShiftY}px, 0)`,
        }}
      />

      {/* Cursor-reactive Deep Violet atmospheric depth */}
      <div
        className="absolute -bottom-[16%] -left-[12%] h-[32rem] w-[32rem] rounded-full opacity-26 blur-[130px] transition-transform duration-700 ease-out md:h-[40rem] md:w-[40rem]"
        style={{
          background: "radial-gradient(circle, rgba(117, 71, 216, 0.3) 0%, rgba(16, 24, 39, 0) 72%)",
          transform: `translate3d(${violetShiftX}px, ${violetShiftY}px, 0)`,
        }}
      />

      {/* Edge vignette keeping obsidian framing deep and legible */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 55% 40%, rgba(16, 24, 39, 0) 30%, rgba(8, 9, 13, 0.78) 100%)",
        }}
      />
    </div>
  );
}
