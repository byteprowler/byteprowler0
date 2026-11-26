import { useState } from "react";
import Image from "next/image";
import { profile } from "@/lib/profile";
import { siteSettings } from "@/lib/content/siteSettings";
import { CHARACTER_BRAND_ASSETS } from "@/lib/character";
import ResumeProtocol from "@/components/ui/ResumeProtocol";
import ViewCounter from "@/components/ui/ViewCounter";

export default function Footer() {
  const [isResumeProtocolOpen, setIsResumeProtocolOpen] = useState(false);

  return (
    <footer className="relative z-10 mx-auto w-full max-w-7xl border-t border-[#C5CAD6]/12 px-4 py-8 text-xs text-[#C5CAD6] md:px-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Image
            src={CHARACTER_BRAND_ASSETS.logoMark.src}
            alt={CHARACTER_BRAND_ASSETS.logoMark.alt}
            width={CHARACTER_BRAND_ASSETS.logoMark.width}
            height={CHARACTER_BRAND_ASSETS.logoMark.height}
            className="h-6 w-auto object-contain object-left"
          />
          <p className="text-xs text-[#C5CAD6]/85">
            {`Built by ${profile.realName} · ${siteSettings.businessName}`}
          </p>
          <p className="font-mono text-[11px] text-[#C5CAD6]/65">
            {`\u00A9 ${new Date().getFullYear()} ${siteSettings.footerText}`}
          </p>
          <span
            dir="rtl"
            aria-label="Blessed be YHWH"
            title="Blessed be YHWH"
            className="w-fit text-[12px] text-[#C5CAD6]/70"
          >
            {"\u05d1\u05e8\u05d5\u05da \u05d9\u05d4\u05d5\u05d4"}
          </span>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <nav aria-label="Footer links" className="flex flex-wrap items-center gap-2 sm:justify-end">
            {siteSettings.footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.label === "EMAIL" ? undefined : "_blank"}
                rel={link.label === "EMAIL" ? undefined : "noopener noreferrer"}
                onClick={(event) => {
                  if (link.label === "RESUME") {
                    event.preventDefault();
                    setIsResumeProtocolOpen(true);
                  }
                }}
                className="inline-flex min-h-9 items-center rounded-md border border-[#C5CAD6]/14 bg-[#101827]/60 px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wider text-[#C5CAD6] transition-colors hover:border-[#367BFF]/55 hover:text-[#F0F2F8] whitespace-nowrap shrink-0"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <ViewCounter />
        </div>
      </div>

      <ResumeProtocol
        isOpen={isResumeProtocolOpen}
        onClose={() => setIsResumeProtocolOpen(false)}
        source="footer"
        fallbackResumeUrl={siteSettings.resumeUrl}
      />
    </footer>
  );
}
