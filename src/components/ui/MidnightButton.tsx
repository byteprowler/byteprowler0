import React from "react";

type MidnightVariant = "electric" | "violet" | "silver";

export interface MidnightButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: MidnightVariant;
  isLoading?: boolean;
}

const variantClasses: Record<MidnightVariant, string> = {
  electric:
    "border-[#367BFF]/60 bg-[#367BFF] text-[#F0F2F8] hover:bg-[#4988FF] shadow-[0_0_24px_rgba(54,123,255,0.22)]",
  violet:
    "border-[#7547D8]/60 bg-[#7547D8] text-[#F0F2F8] hover:bg-[#8459E0] shadow-[0_0_24px_rgba(117,71,216,0.22)]",
  silver:
    "border-[#C5CAD6]/25 bg-[#101827]/70 text-[#F0F2F8] hover:border-[#367BFF]/60 hover:bg-[#101827]",
};

export default function MidnightButton({
  variant = "electric",
  isLoading = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...props
}: MidnightButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-sm border px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.14em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#367BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090D] disabled:cursor-not-allowed disabled:opacity-55 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
