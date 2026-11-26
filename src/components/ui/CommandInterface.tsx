import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  Compass,
  Eye,
  FileText,
  Layers,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { MIDNIGHT_SECTIONS } from "../../lib/theme";
import { CHARACTER_EXPRESSIONS, CHARACTER_MASK_MODES } from "../../lib/character";
import { useMidnightRealm } from "../../context/MidnightRealmContext";
import { useReducedMotionSafe } from "../../hooks/useReducedMotionSafe";

interface CommandItem {
  id: string;
  group: "Sections" | "Pages" | "Character" | "Preferences";
  label: string;
  hint: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
}

function CommandDialogContent() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotionSafe();
  const {
    closeCommand,
    characterViewMode,
    expression,
    maskMode,
    motionPreference,
    setCharacterViewMode,
    selectExpression,
    selectMaskMode,
    toggleReducedMotion,
    openResume,
  } = useMidnightRealm();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<CommandItem[]>(() => {
    const navigateToSection = (href: string, id: string) => {
      closeCommand();
      if (router.pathname === "/") {
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth" });
          return;
        }
      }
      void router.push(href);
    };

    const sectionItems: CommandItem[] = MIDNIGHT_SECTIONS.map((section) => ({
      id: `section-${section.id}`,
      group: "Sections",
      label: `Jump to ${section.label.charAt(0)}${section.label.slice(1).toLowerCase()}`,
      hint: `Section ${section.code}`,
      keywords: `${section.label} ${section.id} section jump navigate`,
      icon: Compass,
      onSelect: () => navigateToSection(section.href, section.id),
    }));

    const pageItems: CommandItem[] = [
      {
        id: "page-projects",
        group: "Pages",
        label: "Open Projects Archive",
        hint: "/projects",
        keywords: "projects archive portfolio work case studies",
        icon: Layers,
        onSelect: () => {
          closeCommand();
          void router.push("/projects");
        },
      },
      {
        id: "page-arsenal",
        group: "Pages",
        label: "Open Tech Stack Directory",
        hint: "/tech-arsenal",
        keywords: "tech arsenal stack expertise skills tools",
        icon: ArrowUpRight,
        onSelect: () => {
          closeCommand();
          void router.push("/tech-arsenal");
        },
      },
      {
        id: "open-resume",
        group: "Pages",
        label: "Open Resume Protocol",
        hint: "Role-matched CV",
        keywords: "resume cv pdf frontend download",
        icon: FileText,
        onSelect: () => {
          closeCommand();
          openResume("hero");
        },
      },
    ];

    const characterItems: CommandItem[] = [
      {
        id: "char-halfbody",
        group: "Character",
        label: "Character View: Half-Body Portrait",
        hint: characterViewMode === "halfbody" ? "Active" : "Hero default",
        keywords: "character halfbody portrait reset hero",
        icon: Eye,
        onSelect: () => {
          setCharacterViewMode("halfbody");
          closeCommand();
        },
      },
      ...CHARACTER_MASK_MODES.map((mode) => ({
        id: `mask-${mode.id}`,
        group: "Character" as const,
        label: `Mask State: ${mode.label}`,
        hint: characterViewMode === "mask" && maskMode === mode.id ? "Active" : "Switch mask",
        keywords: `mask ${mode.label} ${mode.id} character`,
        icon: Eye,
        onSelect: () => {
          selectMaskMode(mode.id);
          closeCommand();
        },
      })),
      ...CHARACTER_EXPRESSIONS.map((expr) => ({
        id: `expr-${expr.id}`,
        group: "Character" as const,
        label: `Expression: ${expr.label}`,
        hint:
          characterViewMode === "expression" && expression === expr.id
            ? "Active"
            : expr.mood,
        keywords: `expression ${expr.label} ${expr.id} mood character`,
        icon: Sparkles,
        onSelect: () => {
          selectExpression(expr.id);
          closeCommand();
        },
      })),
    ];

    const preferenceItems: CommandItem[] = [
      {
        id: "pref-motion",
        group: "Preferences",
        label:
          motionPreference === "reduced"
            ? "Motion Preference: Restore Full Animations"
            : "Motion Preference: Enable Reduced Motion",
        hint: motionPreference === "reduced" ? "Reduced" : "System default",
        keywords: "motion animation reduced accessibility toggle",
        icon: SlidersHorizontal,
        onSelect: () => {
          toggleReducedMotion();
          closeCommand();
        },
      },
    ];

    return [...sectionItems, ...pageItems, ...characterItems, ...preferenceItems];
  }, [
    characterViewMode,
    closeCommand,
    expression,
    maskMode,
    motionPreference,
    openResume,
    router,
    selectExpression,
    selectMaskMode,
    setCharacterViewMode,
    shouldReduceMotion,
    toggleReducedMotion,
  ]);

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(trimmed) ||
        item.hint.toLowerCase().includes(trimmed) ||
        item.keywords.toLowerCase().includes(trimmed),
    );
  }, [items, query]);

  const clampedIndex =
    filteredItems.length === 0 ? 0 : Math.min(selectedIndex, filteredItems.length - 1);

  useEffect(() => {
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 20);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCommand();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) =>
          filteredItems.length === 0 ? 0 : (prev + 1) % filteredItems.length,
        );
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) =>
          filteredItems.length === 0
            ? 0
            : (prev - 1 + filteredItems.length) % filteredItems.length,
        );
        return;
      }
      if (event.key === "Enter" && filteredItems[clampedIndex]) {
        event.preventDefault();
        filteredItems[clampedIndex].onSelect();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clampedIndex, closeCommand, filteredItems]);

  return (
    <motion.div
      key="midnight-command-backdrop"
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0.01 : 0.18 }}
      className="fixed inset-0 z-[120] flex items-start justify-center bg-[#08090D]/80 px-4 pt-[10vh] backdrop-blur-md"
      onClick={closeCommand}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Command Navigation Interface"
        initial={shouldReduceMotion ? false : { opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: shouldReduceMotion ? 0.01 : 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-2xl overflow-hidden rounded-lg border border-[#C5CAD6]/20 bg-[#101827]/95 shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
      >
        <div className="flex items-center gap-3 border-b border-[#C5CAD6]/15 px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-[#367BFF]" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Jump to section, switch character mask/expression, or open resume..."
            aria-label="Filter commands"
            className="w-full bg-transparent text-sm text-[#F0F2F8] placeholder-[#C5CAD6]/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={closeCommand}
            aria-label="Close command interface"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#C5CAD6]/15 text-[#C5CAD6] transition-colors hover:border-[#367BFF]/50 hover:text-[#F0F2F8]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[58vh] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#C5CAD6]/75">
              No matching commands for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <ul role="listbox" aria-label="Available commands" className="space-y-1">
              {filteredItems.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === clampedIndex;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={item.onSelect}
                      className={`flex w-full items-center justify-between gap-3 rounded-md px-3.5 py-2.5 text-left transition-colors ${
                        isSelected
                          ? "bg-[#367BFF]/18 text-[#F0F2F8] ring-1 ring-[#367BFF]/45"
                          : "text-[#C5CAD6] hover:bg-[#08090D]/55 hover:text-[#F0F2F8]"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isSelected ? "text-[#367BFF]" : "text-[#C5CAD6]/70"
                          }`}
                          aria-hidden="true"
                        />
                        <span className="truncate text-sm font-medium">{item.label}</span>
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-[#C5CAD6]/70">
                        {item.group} · {item.hint}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#C5CAD6]/12 bg-[#08090D]/60 px-4 py-2.5 font-mono text-[11px] text-[#C5CAD6]/75">
          <span>Arrow keys to navigate · Enter to execute · Esc to close</span>
          <span>Ctrl+K / Cmd+K</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CommandInterface() {
  const { isCommandOpen } = useMidnightRealm();

  return <AnimatePresence>{isCommandOpen ? <CommandDialogContent /> : null}</AnimatePresence>;
}
