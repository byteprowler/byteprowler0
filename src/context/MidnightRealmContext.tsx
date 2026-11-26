import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  CHARACTER_EXPRESSIONS,
  CHARACTER_MASK_MODES,
  type CharacterExpressionId,
  type CharacterMaskMode,
} from "../lib/character";
import type { GraphicsQualityPreference } from "../lib/character3d";
import { ReducedMotionOverrideContext } from "../hooks/useReducedMotionSafe";
import type { ResumeProtocolSource } from "../components/ui/ResumeProtocol";

export type CharacterViewMode = "halfbody" | "expression" | "mask";
export type MotionPreference = "system" | "reduced";

interface MidnightRealmContextValue {
  characterViewMode: CharacterViewMode;
  expression: CharacterExpressionId;
  maskMode: CharacterMaskMode;
  motionPreference: MotionPreference;
  graphicsQuality: GraphicsQualityPreference;
  isCommandOpen: boolean;
  isResumeOpen: boolean;
  resumeSource: ResumeProtocolSource;
  setCharacterViewMode: (mode: CharacterViewMode) => void;
  selectExpression: (expression: CharacterExpressionId) => void;
  selectMaskMode: (maskMode: CharacterMaskMode) => void;
  toggleMaskMode: () => void;
  cycleExpression: () => void;
  setMotionPreference: (preference: MotionPreference) => void;
  toggleReducedMotion: () => void;
  setGraphicsQuality: (quality: GraphicsQualityPreference) => void;
  openCommand: () => void;
  closeCommand: () => void;
  toggleCommand: () => void;
  openResume: (source?: ResumeProtocolSource) => void;
  closeResume: () => void;
}

const MOTION_PREF_STORAGE_KEY = "byteprowler_v3_motion_pref";
const MOTION_PREF_EVENT = "byteprowler:motion-pref-change";

function subscribeMotionPreference(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener(MOTION_PREF_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(MOTION_PREF_EVENT, handler);
  };
}

function getClientMotionPreference(): MotionPreference {
  if (typeof window === "undefined") return "system";
  try {
    const saved = window.localStorage.getItem(MOTION_PREF_STORAGE_KEY);
    return saved === "reduced" ? "reduced" : "system";
  } catch {
    return "system";
  }
}

function getServerMotionPreference(): MotionPreference {
  return "system";
}

const MidnightRealmContext = createContext<MidnightRealmContextValue | null>(null);

export function MidnightRealmProvider({ children }: { children: React.ReactNode }) {
  const [characterViewMode, setCharacterViewMode] = useState<CharacterViewMode>("halfbody");
  const [expression, setExpression] = useState<CharacterExpressionId>("idle");
  const [maskMode, setMaskMode] = useState<CharacterMaskMode>("masked");
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQualityPreference>("auto");
  const motionPreference = useSyncExternalStore(
    subscribeMotionPreference,
    getClientMotionPreference,
    getServerMotionPreference,
  );
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [resumeSource, setResumeSource] = useState<ResumeProtocolSource>("hero");

  const setMotionPreference = useCallback((preference: MotionPreference) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(MOTION_PREF_STORAGE_KEY, preference);
      window.dispatchEvent(new Event(MOTION_PREF_EVENT));
    } catch {
      // Storage may be disabled.
    }
  }, []);

  const toggleReducedMotion = useCallback(() => {
    const next: MotionPreference = motionPreference === "reduced" ? "system" : "reduced";
    setMotionPreference(next);
  }, [motionPreference, setMotionPreference]);

  const selectExpression = useCallback((nextExpression: CharacterExpressionId) => {
    setExpression(nextExpression);
    setCharacterViewMode("expression");
  }, []);

  const selectMaskMode = useCallback((nextMaskMode: CharacterMaskMode) => {
    setMaskMode(nextMaskMode);
    setCharacterViewMode("mask");
  }, []);

  const toggleMaskMode = useCallback(() => {
    const order = CHARACTER_MASK_MODES.map((m) => m.id);
    setMaskMode((current) => {
      const idx = order.indexOf(current);
      return order[(idx + 1) % order.length] ?? "masked";
    });
    setCharacterViewMode("mask");
  }, []);

  const cycleExpression = useCallback(() => {
    const order = CHARACTER_EXPRESSIONS.map((e) => e.id);
    setExpression((current) => {
      const idx = order.indexOf(current);
      return order[(idx + 1) % order.length] ?? "idle";
    });
    setCharacterViewMode("expression");
  }, []);

  const openCommand = useCallback(() => setIsCommandOpen(true), []);
  const closeCommand = useCallback(() => setIsCommandOpen(false), []);
  const toggleCommand = useCallback(() => setIsCommandOpen((prev) => !prev), []);

  const openResume = useCallback((source: ResumeProtocolSource = "hero") => {
    setResumeSource(source);
    setIsResumeOpen(true);
  }, []);

  const closeResume = useCallback(() => setIsResumeOpen(false), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const value = useMemo<MidnightRealmContextValue>(
    () => ({
      characterViewMode,
      expression,
      maskMode,
      motionPreference,
      graphicsQuality,
      isCommandOpen,
      isResumeOpen,
      resumeSource,
      setCharacterViewMode,
      selectExpression,
      selectMaskMode,
      toggleMaskMode,
      cycleExpression,
      setMotionPreference,
      toggleReducedMotion,
      setGraphicsQuality,
      openCommand,
      closeCommand,
      toggleCommand,
      openResume,
      closeResume,
    }),
    [
      characterViewMode,
      expression,
      maskMode,
      motionPreference,
      graphicsQuality,
      isCommandOpen,
      isResumeOpen,
      resumeSource,
      selectExpression,
      selectMaskMode,
      toggleMaskMode,
      cycleExpression,
      setMotionPreference,
      toggleReducedMotion,
      openCommand,
      closeCommand,
      toggleCommand,
      openResume,
      closeResume,
    ],
  );

  return (
    <ReducedMotionOverrideContext.Provider value={motionPreference === "reduced"}>
      <MidnightRealmContext.Provider value={value}>{children}</MidnightRealmContext.Provider>
    </ReducedMotionOverrideContext.Provider>
  );
}

export function useMidnightRealm(): MidnightRealmContextValue {
  const ctx = useContext(MidnightRealmContext);
  if (!ctx) {
    throw new Error("useMidnightRealm must be used inside MidnightRealmProvider");
  }
  return ctx;
}
