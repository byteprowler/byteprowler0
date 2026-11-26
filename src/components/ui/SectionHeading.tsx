import React from "react";

interface SectionHeadingProps {
  index: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  japaneseTag?: string;
  accent?: "blue" | "violet";
}

export default function SectionHeading({
  index,
  eyebrow,
  title,
  subtitle,
  japaneseTag,
  accent = "blue",
}: SectionHeadingProps) {
  const accentColor = accent === "violet" ? "text-[#7547D8]" : "text-[#367BFF]";
  const lineColor = accent === "violet" ? "bg-[#7547D8]/25" : "bg-[#367BFF]/25";

  return (
    <div className="mb-10 flex flex-col gap-3">
      <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-[#C5CAD6]">
        <span className={`font-bold ${accentColor}`}>{`// ${index}`}</span>
        <span>{eyebrow}</span>
        <span className={`h-px flex-1 ${lineColor}`} aria-hidden="true" />
        {japaneseTag ? (
          <span lang="ja" className="text-[11px] font-medium tracking-widest text-[#C5CAD6]/75">
            {japaneseTag}
          </span>
        ) : null}
      </div>

      <h2 className="text-3xl font-bold tracking-tight text-[#F0F2F8] sm:text-4xl lg:text-5xl">
        {title}
      </h2>

      {subtitle ? (
        <p className="max-w-2xl text-sm leading-relaxed text-[#C5CAD6] sm:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
