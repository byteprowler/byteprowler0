import React from "react";
import Image from "next/image";
import { CHARACTER_BRAND_ASSETS } from "../../lib/character";

interface HeroStaticBackdropProps {
  reason?: "loading" | "fallback";
}

export default function HeroStaticBackdrop({ reason = "loading" }: HeroStaticBackdropProps) {
  return (
    <div
      data-testid={reason === "fallback" ? "hero-webgl-fallback" : "hero-webgl-loading"}
      className="pointer-events-none relative h-full w-full overflow-hidden bg-[#08090D]"
    >
      {/* Subtle atmospheric glow behind fallback portrait */}
      <div
        aria-hidden="true"
        className="absolute right-[4%] top-[10%] h-[28rem] w-[28rem] rounded-full opacity-35 blur-[110px]"
        style={{
          background:
            "radial-gradient(circle, rgba(54,123,255,0.4) 0%, rgba(117,71,216,0.28) 45%, rgba(8,9,13,0) 75%)",
        }}
      />

      {reason === "fallback" ? (
        <div className="absolute inset-y-0 right-0 flex w-full items-center justify-center md:w-[58%] md:justify-end md:pr-[4%]">
          <div className="relative h-[78%] w-[86%] max-w-[34rem] opacity-85">
            <Image
              src={CHARACTER_BRAND_ASSETS.heroHalfBody.src}
              alt={CHARACTER_BRAND_ASSETS.heroHalfBody.alt}
              fill
              priority
              referrerPolicy="no-referrer"
              sizes="(max-width: 768px) 86vw, 540px"
              className="object-contain object-top drop-shadow-[0_18px_45px_rgba(54,123,255,0.22)]"
              style={{
                maskImage: "radial-gradient(ellipse 76% 80% at 50% 42%, black 52%, transparent 96%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 76% 80% at 50% 42%, black 52%, transparent 96%)",
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
