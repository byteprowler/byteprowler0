import React from "react";

type PanelAccent = "blue" | "violet" | "silver";

interface MidnightPanelProps {
  children: React.ReactNode;
  accent?: PanelAccent;
  className?: string;
  interactive?: boolean;
}

const accentBorders: Record<PanelAccent, string> = {
  blue: "border-[#C5CAD6]/14 hover:border-[#367BFF]/45",
  violet: "border-[#C5CAD6]/14 hover:border-[#7547D8]/45",
  silver: "border-[#C5CAD6]/16 hover:border-[#C5CAD6]/35",
};

const accentTopLines: Record<PanelAccent, string> = {
  blue: "from-transparent via-[#367BFF]/55 to-transparent",
  violet: "from-transparent via-[#7547D8]/55 to-transparent",
  silver: "from-transparent via-[#C5CAD6]/35 to-transparent",
};

export default function MidnightPanel({
  children,
  accent = "blue",
  className = "",
  interactive = true,
}: MidnightPanelProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-sm border bg-[#101827]/55 backdrop-blur-md transition-colors duration-300 ${
        interactive ? accentBorders[accent] : "border-[#C5CAD6]/14"
      } ${className}`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accentTopLines[accent]}`}
      />
      {children}
    </div>
  );
}
