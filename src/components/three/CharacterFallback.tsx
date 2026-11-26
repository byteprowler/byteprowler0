import React from "react";
import Image from "next/image";
import { CHARACTER_BRAND_ASSETS } from "../../lib/character";
import type { CharacterModelDiagnostics } from "../../lib/character3d";

interface CharacterFallbackProps {
  mode: "loading" | "fallback";
  progressPercent?: number;
  loadedBytes?: number;
  totalBytes?: number | null;
  diagnostics?: CharacterModelDiagnostics | null;
  reasonLabel?: string;
}

function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CharacterFallback({
  mode,
  progressPercent = 0,
  loadedBytes = 0,
  totalBytes = null,
  diagnostics = null,
  reasonLabel,
}: CharacterFallbackProps) {
  const clampedPercent = Math.max(0, Math.min(100, Math.round(progressPercent)));

  if (mode === "loading") {
    return (
      <div
        data-testid="character-loading-overlay"
        aria-live="polite"
        className="pointer-events-none absolute inset-0 z-10 flex items-end justify-end p-5 sm:p-8"
      >
        <div className="w-64 rounded-lg border border-[#C5CAD6]/18 bg-[#08090D]/88 p-3.5 shadow-[0_14px_40px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#C5CAD6]">
            <span>Loading 3D Character</span>
            <span className="tabular-nums text-[#367BFF]">{clampedPercent}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#101827]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#367BFF] to-[#7547D8] transition-all duration-150"
              style={{ width: `${clampedPercent}%` }}
            />
          </div>
          {loadedBytes > 0 ? (
            <p className="mt-1.5 font-mono text-[10px] text-[#C5CAD6]/75 tabular-nums">
              {formatMegabytes(loadedBytes)}
              {totalBytes ? ` / ${formatMegabytes(totalBytes)}` : ""}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="hero-webgl-fallback"
      className="pointer-events-none relative h-full w-full overflow-hidden bg-[#08090D]"
    >
      <div
        aria-hidden="true"
        className="absolute right-[4%] top-[10%] h-[28rem] w-[28rem] rounded-full opacity-35 blur-[110px]"
        style={{
          background:
            "radial-gradient(circle, rgba(54,123,255,0.4) 0%, rgba(117,71,216,0.28) 45%, rgba(8,9,13,0) 75%)",
        }}
      />

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

      {reasonLabel || diagnostics?.loadError ? (
        <div className="absolute bottom-14 right-4 z-20 max-w-xs rounded-md border border-[#C5CAD6]/18 bg-[#08090D]/88 px-3 py-2 font-mono text-[11px] leading-relaxed text-[#C5CAD6]/85 md:bottom-6 md:right-8">
          <span className="block font-semibold text-[#367BFF]">Static Fallback Active</span>
          <span>{reasonLabel ?? diagnostics?.loadError}</span>
        </div>
      ) : null}
    </div>
  );
}
