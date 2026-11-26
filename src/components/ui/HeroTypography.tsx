import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowDownRight, Command, FileText, Mail, User } from "lucide-react";
import { profile } from "../../lib/profile";
import { getDevUptimeStats } from "../../lib/devStats";
import { MIDNIGHT_EASE } from "../../lib/animations";
import { useReducedMotionSafe } from "../../hooks/useReducedMotionSafe";
import { useMidnightRealm } from "../../context/MidnightRealmContext";

export default function HeroTypography() {
  const shouldReduceMotion = useReducedMotionSafe();
  const { openCommand, openResume } = useMidnightRealm();
  const devStats = getDevUptimeStats();
  const [isGlitching, setIsGlitching] = useState(false);
  const glitchTimerRef = useRef<number | null>(null);

  const triggerControlledGlitch = useCallback(() => {
    if (shouldReduceMotion) return;
    setIsGlitching(true);
    if (glitchTimerRef.current !== null) {
      window.clearTimeout(glitchTimerRef.current);
    }
    glitchTimerRef.current = window.setTimeout(() => {
      setIsGlitching(false);
      glitchTimerRef.current = null;
    }, 420);
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = window.setInterval(triggerControlledGlitch, 11000);
    return () => {
      window.clearInterval(interval);
      if (glitchTimerRef.current !== null) {
        window.clearTimeout(glitchTimerRef.current);
      }
    };
  }, [shouldReduceMotion, triggerControlledGlitch]);

  const scrollToSection = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth" });
    }
  };

  const reveal = (delay = 0) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay, ease: MIDNIGHT_EASE },
        };

  return (
    <div className="pointer-events-auto relative z-20 flex w-full flex-col justify-center gap-5 sm:gap-6">
      {/* Japanese Katakana signature & editorial metadata */}
      <motion.div {...reveal(0)} className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[#C5CAD6]">
          <span lang="ja" className="font-mono tracking-[0.22em] text-[#367BFF]">
            バイトプロウラー
          </span>
          <span aria-hidden="true" className="text-[#C5CAD6]/40">
            ·
          </span>
          <span>{profile.realName}</span>
          <span aria-hidden="true" className="text-[#C5CAD6]/40">
            ·
          </span>
          <span>{profile.role}</span>
        </div>

        {/* Oversized Editorial Display Headline with controlled Midnight chromatic glitch */}
        <h1
          onMouseEnter={triggerControlledGlitch}
          onFocus={triggerControlledGlitch}
          className="font-display text-[clamp(2.5rem,6.2vw,5.1rem)] font-extrabold leading-[0.96] tracking-tight text-[#F0F2F8] [text-wrap:balance]"
        >
          <span className="relative inline-block">
            <span className="midnight-glitch-hover relative z-10 inline-block transition-all duration-200">
              ByteProwler
            </span>
            {isGlitching && !shouldReduceMotion ? (
              <>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -translate-x-0.5 text-[#367BFF]/75 mix-blend-screen"
                >
                  ByteProwler
                </span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 translate-x-0.5 text-[#7547D8]/75 mix-blend-screen"
                >
                  ByteProwler
                </span>
              </>
            ) : null}
          </span>
          <span className="mt-2 block text-[clamp(1.2rem,2.5vw,2.05rem)] font-semibold tracking-tight text-[#C5CAD6]">
            The Midnight Developer
          </span>
        </h1>
      </motion.div>

      {/* Concise authentic narrative */}
      <motion.div {...reveal(0.08)} className="flex max-w-lg flex-col gap-2.5">
        <p className="text-[15px] leading-relaxed text-[#C5CAD6] sm:text-base md:text-lg">
          {profile.shortBio}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-[#C5CAD6]/80">
          <span>{profile.currentArc}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">Building since {devStats.startYear}</span>
          <span aria-hidden="true">·</span>
          <span>Remote / UK</span>
        </div>
      </motion.div>

      {/* Primary CTA + clean editorial links (avoiding heavy button box clutter) */}
      <motion.div {...reveal(0.16)} className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-1">
        <a
          href="#projects"
          onClick={(e) => scrollToSection(e, "projects")}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#367BFF] px-5 py-2.5 text-sm font-semibold text-[#F0F2F8] shadow-[0_10px_30px_rgba(54,123,255,0.28)] transition-all duration-200 hover:bg-[#4988FF] whitespace-nowrap shrink-0"
        >
          <span>Explore Projects</span>
          <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
        </a>

        <a
          href="#about"
          onClick={(e) => scrollToSection(e, "about")}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#C5CAD6]/25 bg-[#08090D]/80 px-4 py-2.5 text-sm font-medium text-[#F0F2F8] transition-colors duration-200 hover:border-[#367BFF]/65 hover:bg-[#101827] whitespace-nowrap shrink-0"
        >
          <User className="h-4 w-4 text-[#C5CAD6]" aria-hidden="true" />
          <span>About Me</span>
        </a>

        <button
          type="button"
          onClick={() => openResume("hero")}
          className="inline-flex min-h-11 items-center gap-2 px-2 py-2.5 text-sm font-medium text-[#C5CAD6] transition-colors duration-200 hover:text-[#F0F2F8] whitespace-nowrap shrink-0"
        >
          <FileText className="h-4 w-4 text-[#7547D8]" aria-hidden="true" />
          <span>Resume</span>
        </button>

        <a
          href="#contact"
          onClick={(e) => scrollToSection(e, "contact")}
          className="inline-flex min-h-11 items-center gap-2 px-2 py-2.5 text-sm font-medium text-[#C5CAD6] transition-colors duration-200 hover:text-[#F0F2F8] whitespace-nowrap shrink-0"
        >
          <Mail className="h-4 w-4 text-[#367BFF]" aria-hidden="true" />
          <span>Contact</span>
        </a>
      </motion.div>

      {/* Discreet 3D interaction & Command Navigation cue */}
      <motion.div {...reveal(0.22)} className="pt-0.5">
        <button
          type="button"
          onClick={openCommand}
          className="group inline-flex min-h-11 items-center gap-2.5 text-left text-xs text-[#C5CAD6]/80 transition-colors hover:text-[#F0F2F8]"
        >
          <span className="inline-flex items-center gap-1 rounded border border-[#C5CAD6]/20 bg-[#08090D]/85 px-2 py-0.5 font-mono text-[11px] text-[#F0F2F8] transition-colors group-hover:border-[#367BFF]/60">
            <Command className="h-3 w-3 text-[#367BFF]" aria-hidden="true" />
            <span>Ctrl+K</span>
          </span>
          <span>Move pointer · Click character · Open command palette</span>
        </button>
      </motion.div>
    </div>
  );
}
