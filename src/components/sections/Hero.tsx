import React, { useRef } from "react";
import dynamic from "next/dynamic";
import { ChevronDown } from "lucide-react";
import HeroTypography from "../ui/HeroTypography";
import HeroStaticBackdrop from "../three/HeroStaticBackdrop";
import { useReducedMotionSafe } from "../../hooks/useReducedMotionSafe";

const MidnightHeroCanvas = dynamic(() => import("../three/MidnightHeroCanvas"), {
  ssr: false,
  loading: () => <HeroStaticBackdrop reason="loading" />,
});

export default function Hero() {
  const shouldReduceMotion = useReducedMotionSafe();
  const heroSectionRef = useRef<HTMLElement>(null);

  const handleScrollToAbout = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById("about");
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth" });
    }
  };

  return (
    <section
      ref={heroSectionRef}
      id="home"
      className="relative flex min-h-[100svh] w-full flex-col justify-end overflow-hidden bg-[#08090D]"
    >
      {/* Full-viewport Interactive 3D WebGL Scene (lazy-loaded client-side with static fallback) */}
      <div className="absolute inset-0 z-0">
        <MidnightHeroCanvas heroContainerRef={heroSectionRef} />
      </div>

      {/* Editorial contrast scrims (no backdrop-blur over WebGL) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 hidden md:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(8,9,13,0.92) 0%, rgba(8,9,13,0.72) 38%, rgba(8,9,13,0.18) 62%, rgba(8,9,13,0) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 md:hidden"
        style={{
          background:
            "linear-gradient(0deg, rgba(8,9,13,0.96) 0%, rgba(8,9,13,0.84) 40%, rgba(8,9,13,0.16) 68%, rgba(8,9,13,0) 100%)",
        }}
      />

      {/* Seamless obsidian dissolve into #about section */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24"
        style={{
          background: "linear-gradient(to bottom, rgba(8,9,13,0) 0%, rgba(8,9,13,1) 100%)",
        }}
      />

      {/* Semantic Foreground Composition (pointer-events-none wrapper preserves 3D canvas interactivity) */}
      <div className="pointer-events-none relative z-20 mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col justify-end px-4 pb-16 pt-24 md:justify-center md:px-8 md:pb-20 md:pt-28">
        <div className="w-full md:max-w-[54%] lg:max-w-[49%]">
          <HeroTypography />
        </div>
      </div>

      {/* Quiet Scroll Transition Cue */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center md:bottom-6">
        <a
          href="#about"
          onClick={handleScrollToAbout}
          className="pointer-events-auto inline-flex min-h-10 items-center gap-2 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-[#C5CAD6]/75 transition-colors hover:text-[#F0F2F8]"
        >
          <span>Scroll to explore</span>
          <ChevronDown
            className={`h-4 w-4 text-[#367BFF] ${shouldReduceMotion ? "" : "animate-bounce"}`}
            aria-hidden="true"
          />
        </a>
      </div>
    </section>
  );
}
