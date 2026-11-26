import React, { useCallback, useRef } from "react";
import { useMidnightRealm } from "../../context/MidnightRealmContext";
import type { CharacterModelDiagnostics } from "../../lib/character3d";
import CharacterEnvironment from "./CharacterEnvironment";
import CharacterLighting from "./CharacterLighting";
import VRMCharacter, { type DownloadProgressInfo } from "./VRMCharacter";

interface CharacterControllerProps {
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  scrollProgressRef: React.MutableRefObject<number>;
  reducedMotion: boolean;
  enableShadows: boolean;
  particleCount: number;
  onDownloadProgress: (progress: DownloadProgressInfo) => void;
  onDiagnosticsChange: (diagnostics: CharacterModelDiagnostics) => void;
  onPointerHoverChange: (hovering: boolean) => void;
}

export default function CharacterController({
  pointerRef,
  scrollProgressRef,
  reducedMotion,
  enableShadows,
  particleCount,
  onDownloadProgress,
  onDiagnosticsChange,
  onPointerHoverChange,
}: CharacterControllerProps) {
  const { expression, maskMode, cycleExpression } = useMidnightRealm();
  const interactionPulseRef = useRef(0);

  const handleCharacterClick = useCallback(() => {
    interactionPulseRef.current = 1;
    cycleExpression();
  }, [cycleExpression]);

  return (
    <>
      <CharacterEnvironment
        pointerRef={pointerRef}
        scrollProgressRef={scrollProgressRef}
        reducedMotion={reducedMotion}
        particleCount={particleCount}
      />
      <CharacterLighting
        pointerRef={pointerRef}
        scrollProgressRef={scrollProgressRef}
        interactionPulseRef={interactionPulseRef}
        reducedMotion={reducedMotion}
        enableShadows={enableShadows}
      />
      <VRMCharacter
        expression={expression}
        maskMode={maskMode}
        pointerRef={pointerRef}
        scrollProgressRef={scrollProgressRef}
        reducedMotion={reducedMotion}
        enableShadows={enableShadows}
        onDownloadProgress={onDownloadProgress}
        onDiagnosticsChange={onDiagnosticsChange}
        onCharacterClick={handleCharacterClick}
        onPointerHoverChange={onPointerHoverChange}
      />
    </>
  );
}
