import React, { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useMidnightRealm } from "../../context/MidnightRealmContext";
import { useReducedMotionSafe } from "../../hooks/useReducedMotionSafe";
import { detectWebGLCapability } from "../../lib/webgl";
import type { CharacterRigSource } from "../../lib/character3d";
import MidnightEnvironment from "./MidnightEnvironment";
import VrmCharacterRig from "./VrmCharacterRig";
import HeroStaticBackdrop from "./HeroStaticBackdrop";

interface CanvasErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface CanvasErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<CanvasErrorBoundaryProps, CanvasErrorBoundaryState> {
  state: CanvasErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface MidnightHeroCanvasProps {
  heroContainerRef: React.RefObject<HTMLElement | null>;
}

export default function MidnightHeroCanvas({ heroContainerRef }: MidnightHeroCanvasProps) {
  const { expression, maskMode, toggleMaskMode } = useMidnightRealm();
  const reducedMotion = useReducedMotionSafe();

  const capability = useMemo(() => detectWebGLCapability(), []);
  const [contextLost, setContextLost] = useState(false);
  const [isHoveringCharacter, setIsHoveringCharacter] = useState(false);
  const [, setRigSource] = useState<CharacterRigSource>("procedural-standin");

  const pointerRef = useRef({ x: 0, y: 0 });
  const scrollProgressRef = useRef(0);
  const interactionPulseRef = useRef(0);
  const cleanupContextListenersRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePointerMove = (event: PointerEvent) => {
      if (reducedMotion || event.pointerType === "touch") return;
      const nx = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      const ny = -((event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1);
      pointerRef.current.x = THREE.MathUtils.clamp(nx, -1, 1);
      pointerRef.current.y = THREE.MathUtils.clamp(ny, -1, 1);
    };

    const handlePointerLeave = () => {
      pointerRef.current.x = 0;
      pointerRef.current.y = 0;
    };

    const handleScroll = () => {
      const container = heroContainerRef.current;
      if (!container) {
        scrollProgressRef.current = THREE.MathUtils.clamp(
          window.scrollY / Math.max(window.innerHeight, 1),
          0,
          1,
        );
        return;
      }
      const rect = container.getBoundingClientRect();
      const raw = -rect.top / Math.max(rect.height, 1);
      scrollProgressRef.current = THREE.MathUtils.clamp(raw, 0, 1);
    };

    handleScroll();
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", handlePointerLeave, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [heroContainerRef, reducedMotion]);

  useEffect(() => {
    return () => {
      cleanupContextListenersRef.current?.();
      cleanupContextListenersRef.current = null;
    };
  }, []);

  const handleCharacterClick = useCallback(() => {
    interactionPulseRef.current = 1;
    toggleMaskMode();
  }, [toggleMaskMode]);

  const handleCreated = useCallback(
    ({ gl, scene }: { gl: THREE.WebGLRenderer; scene: THREE.Scene }) => {
      cleanupContextListenersRef.current?.();
      const domElement = gl.domElement;

      const pmremGenerator = new THREE.PMREMGenerator(gl);
      pmremGenerator.compileEquirectangularShader();
      const roomEnv = new RoomEnvironment();
      const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
      const previousEnv = scene.environment;
      scene.environment = envTarget.texture;
      roomEnv.dispose();

      const onContextLost = (event: Event) => {
        event.preventDefault();
        setContextLost(true);
      };

      const onContextRestored = () => {
        setContextLost(false);
      };

      domElement.addEventListener("webglcontextlost", onContextLost);
      domElement.addEventListener("webglcontextrestored", onContextRestored);

      cleanupContextListenersRef.current = () => {
        domElement.removeEventListener("webglcontextlost", onContextLost);
        domElement.removeEventListener("webglcontextrestored", onContextRestored);
        scene.environment = previousEnv;
        envTarget.dispose();
        pmremGenerator.dispose();
      };
    },
    [],
  );

  if (!capability.supported || contextLost) {
    return <HeroStaticBackdrop reason="fallback" />;
  }

  return (
    <CanvasErrorBoundary fallback={<HeroStaticBackdrop reason="fallback" />}>
      <div
        data-testid="hero-webgl-canvas"
        className={`relative h-full w-full ${isHoveringCharacter ? "cursor-pointer" : "cursor-default"}`}
      >
        <Canvas
          dpr={capability.maxDpr}
          shadows={capability.enableShadows}
          camera={{ fov: 40, near: 0.1, far: 40, position: [0.14, 0.48, 2.86] }}
          gl={{
            antialias: capability.enableAntialias,
            alpha: false,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.12,
          }}
          onCreated={handleCreated}
        >
          <MidnightEnvironment
            pointerRef={pointerRef}
            scrollProgressRef={scrollProgressRef}
            reducedMotion={reducedMotion}
            enableShadows={capability.enableShadows}
            particleCount={capability.particleCount}
            interactionPulseRef={interactionPulseRef}
          />
          <VrmCharacterRig
            expression={expression}
            maskMode={maskMode}
            pointerRef={pointerRef}
            scrollProgressRef={scrollProgressRef}
            reducedMotion={reducedMotion}
            onCharacterClick={handleCharacterClick}
            onPointerHoverChange={setIsHoveringCharacter}
            onRigSourceChange={setRigSource}
          />
        </Canvas>
      </div>
    </CanvasErrorBoundary>
  );
}
