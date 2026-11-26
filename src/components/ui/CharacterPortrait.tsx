import React from "react";
import Image from "next/image";

interface CharacterPortraitProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  label?: string;
  active?: boolean;
  priority?: boolean;
  className?: string;
}

export default function CharacterPortrait({
  src,
  alt,
  width,
  height,
  label,
  active = false,
  priority = false,
  className = "",
}: CharacterPortraitProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-sm border bg-[#08090D] transition-all duration-200 ${
        active
          ? "border-[#367BFF] shadow-[0_0_20px_rgba(54,123,255,0.24)]"
          : "border-[#C5CAD6]/18 hover:border-[#7547D8]/60"
      } ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="block h-auto w-full object-cover"
      />
      {label ? (
        <div className="border-t border-[#C5CAD6]/12 bg-[#101827]/90 px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F0F2F8]">
          {label}
        </div>
      ) : null}
    </div>
  );
}
