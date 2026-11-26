import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "motion/react";
import { Command, FileText, Menu, SlidersHorizontal, X } from "lucide-react";
import { MIDNIGHT_SECTIONS } from "../../lib/theme";
import { CHARACTER_BRAND_ASSETS } from "../../lib/character";
import { useActiveSection } from "../../hooks/useActiveSection";
import { useReducedMotionSafe } from "../../hooks/useReducedMotionSafe";
import { useMidnightRealm } from "../../context/MidnightRealmContext";

const SECTION_LABELS: Record<string, string> = {
  home: "Home",
  about: "About",
  expertise: "Expertise",
  projects: "Projects",
  experience: "Experience",
  playground: "Playground",
  contact: "Contact",
};

export default function Navbar() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotionSafe();
  const activeSection = useActiveSection();
  const { openCommand, openResume, motionPreference, toggleReducedMotion } = useMidnightRealm();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuId = "midnight-mobile-nav";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleNavClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    id: string,
    href: string,
  ) => {
    closeMobileMenu();
    if (router.pathname === "/") {
      const target = document.getElementById(id);
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth" });
        return;
      }
    }
    if (href.startsWith("/")) {
      event.preventDefault();
      void router.push(href);
    }
  };

  return (
    <header
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          closeMobileMenu();
        }
      }}
      className="fixed inset-x-0 top-0 z-90 px-3 pt-2.5 sm:px-6 sm:pt-3.5"
    >
      <div
        className={`mx-auto flex w-full max-w-7xl items-center justify-between gap-6 rounded-xl px-4 py-2.5 transition-all duration-300 lg:gap-8 lg:px-6 ${
          isScrolled
            ? "border border-[#C5CAD6]/16 bg-[#08090D]/88 shadow-[0_14px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl"
            : "border border-transparent bg-[#08090D]/45 backdrop-blur-md"
        }`}
      >
        {/* Zone 1: Preserved ByteProwler Wordmark Logo */}
        <Link
          href="/"
          aria-label="ByteProwler Home"
          className="flex shrink-0 items-center whitespace-nowrap rounded-md py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#367BFF]"
        >
          <Image
            src={CHARACTER_BRAND_ASSETS.logoMark.src}
            alt={CHARACTER_BRAND_ASSETS.logoMark.alt}
            width={CHARACTER_BRAND_ASSETS.logoMark.width}
            height={CHARACTER_BRAND_ASSETS.logoMark.height}
            priority
            className="h-7 w-auto object-contain sm:h-8"
          />
        </Link>

        {/* Zone 2: Clean Single-Line Section Navigation */}
        <nav
          aria-label="Primary sections"
          className="hidden items-center gap-5 lg:flex xl:gap-7"
        >
          {MIDNIGHT_SECTIONS.map((item) => {
            const label = SECTION_LABELS[item.id] ?? item.label;
            const isActive = router.pathname === "/" && activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.id, item.href)}
                aria-current={isActive ? "page" : undefined}
                className={`relative py-1.5 text-sm font-medium transition-colors duration-200 whitespace-nowrap shrink-0 ${
                  isActive ? "text-[#F0F2F8]" : "text-[#C5CAD6]/80 hover:text-[#F0F2F8]"
                }`}
              >
                <span>{label}</span>
                {isActive ? (
                  <motion.span
                    layoutId="midnight-nav-indicator"
                    transition={{
                      duration: shouldReduceMotion ? 0.01 : 0.25,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-[#367BFF] to-[#7547D8]"
                  />
                ) : null}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Command Trigger + Mobile Menu Button */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={openCommand}
            aria-label="Open command interface (Ctrl+K)"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#C5CAD6]/20 bg-[#101827]/80 px-3.5 py-2 text-xs font-medium text-[#F0F2F8] transition-colors duration-200 hover:border-[#367BFF]/65 hover:bg-[#101827] whitespace-nowrap shrink-0"
          >
            <Command className="h-3.5 w-3.5 text-[#367BFF]" aria-hidden="true" />
            <span>Command</span>
            <kbd className="hidden rounded border border-[#C5CAD6]/20 bg-[#08090D]/80 px-1.5 py-0.5 font-mono text-[10px] text-[#C5CAD6] sm:inline-block">
              Ctrl+K
            </kbd>
          </button>

          <button
            type="button"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls={mobileMenuId}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#C5CAD6]/20 bg-[#101827]/85 text-[#F0F2F8] transition-colors hover:border-[#367BFF]/60 lg:hidden"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen ? (
          <motion.nav
            id={mobileMenuId}
            aria-label="Mobile navigation"
            initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.18 }}
            className="mx-auto mt-2 max-h-[calc(100svh-5.5rem)] w-full max-w-7xl overflow-y-auto rounded-xl border border-[#C5CAD6]/18 bg-[#08090D]/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.75)] backdrop-blur-xl lg:hidden"
          >
            <div className="grid grid-cols-1 gap-1.5">
              {MIDNIGHT_SECTIONS.map((item) => {
                const label = SECTION_LABELS[item.id] ?? item.label;
                const isActive = router.pathname === "/" && activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.id, item.href)}
                    className={`flex min-h-11 items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#367BFF]/18 text-[#F0F2F8] ring-1 ring-[#367BFF]/40"
                        : "text-[#C5CAD6] hover:bg-[#101827]/80 hover:text-[#F0F2F8]"
                    }`}
                  >
                    <span>{label}</span>
                    <span className="font-mono text-xs text-[#C5CAD6]/60 tabular-nums">
                      {item.code}
                    </span>
                  </a>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#C5CAD6]/12 pt-3">
              <button
                type="button"
                onClick={() => {
                  closeMobileMenu();
                  openResume("hero");
                }}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-[#C5CAD6]/20 bg-[#101827] px-3.5 py-2 text-xs font-medium text-[#F0F2F8] whitespace-nowrap"
              >
                <FileText className="h-4 w-4 text-[#367BFF]" aria-hidden="true" />
                <span>Resume</span>
              </button>
              <button
                type="button"
                onClick={toggleReducedMotion}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-[#C5CAD6]/20 bg-[#101827] px-3.5 py-2 text-xs font-medium text-[#C5CAD6] whitespace-nowrap"
              >
                <SlidersHorizontal className="h-4 w-4 text-[#7547D8]" aria-hidden="true" />
                <span>
                  {motionPreference === "reduced" ? "Motion: Reduced" : "Motion: Full"}
                </span>
              </button>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
