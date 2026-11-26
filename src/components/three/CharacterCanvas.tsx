import React, { Component, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useMidnightRealm } from "../../context/MidnightRealmContext";
import { useReducedMotionSafe } from "../../hooks/useReducedMotionSafe";
import { useGraphicsQuality } from "../../hooks/useGraphicsQuality";
import { useCharacterTracking } from "../../hooks/useCharacterTracking";
import type { CharacterModelDiagnostics } from "../../lib/character3d";
import CharacterController from "./CharacterController";
import CharacterFallback from "./CharacterFallback";
import type { DownloadProgressInfo } from "./VRMCharacter";

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

interface CharacterCanvasProps {
  heroContainerRef: React.RefObject<HTMLElement | null>;
}

export default function CharacterCanvas({ heroContainerRef }: CharacterCanvasProps) {
  const { graphicsQuality } = useMidnightRealm();
  const reducedMotion = useReducedMotionSafe();
  const quality = useGraphicsQuality(graphicsQuality, heroContainerRef, reducedMotion);
  const { pointerRef, scrollProgressRef } = useCharacterTracking(heroContainerRef, reducedMotion);

  const [contextLost, setContextLost] = useState(false);
  const [isHoveringCharacter, setIsHoveringCharacter] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgressInfo>({
    percent: 0,
    loadedBytes: 0,
    totalBytes: null,
  });
  const [diagnostics, setDiagnostics] = useState<CharacterModelDiagnostics | null>(null);
  const cleanupContextListenersRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      cleanupContextListenersRef.current?.();
      cleanupContextListenersRef.current = null;
    };
  }, []);

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

  if (!quality.capability.supported || contextLost) {
    return (
      <CharacterFallback
        mode="fallback"
        reasonLabel={contextLost ? "WebGL context lost — showing static portrait." : undefined}
      />
    );
  }

  if (diagnostics && diagnostics.rigSource === "none" && diagnostics.loadError) {
    return <CharacterFallback mode="fallback" diagnostics={diagnostics} />;
  }

  const isLoading = !diagnostics;

  return (
    <CanvasErrorBoundary fallback={<CharacterFallback mode="fallback" />}>
      <div
        data-testid="hero-webgl-canvas"
        className={`relative h-full w-full ${isHoveringCharacter ? "cursor-pointer" : "cursor-default"}`}
      >
        <Canvas
          dpr={quality.dpr}
          shadows={quality.enableShadows}
          frameloop={quality.shouldRenderLoop ? "always" : "never"}
          camera={{ fov: 34, near: 0.1, far: 40, position: [0.12, 1.32, 1.95] }}
          gl={{
            antialias: quality.enableAntialias,
            alpha: false,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.08,
          }}
          onCreated={handleCreated}
        >
          <CharacterController
            pointerRef={pointerRef}
            scrollProgressRef={scrollProgressRef}
            reducedMotion={reducedMotion}
            enableShadows={quality.enableShadows}
            particleCount={quality.particleCount}
            onDownloadProgress={setDownloadProgress}
            onDiagnosticsChange={setDiagnostics}
            onPointerHoverChange={setIsHoveringCharacter}
          />
        </Canvas>

        {isLoading ? (
          <CharacterFallback
            mode="loading"
            progressPercent={downloadProgress.percent}
            loadedBytes={downloadProgress.loadedBytes}
            totalBytes={downloadProgress.totalBytes}
          />
        ) : null}
      </div>
    </CanvasErrorBoundary>
  );
}
