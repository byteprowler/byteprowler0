import * as THREE from "three";

export interface WebGLCapabilityReport {
  supported: boolean;
  webgl2: boolean;
  isSoftwareGl: boolean;
  isMobile: boolean;
  maxDpr: number;
  enableShadows: boolean;
  enableAntialias: boolean;
  particleCount: number;
  rendererName: string;
}

const SOFTWARE_GL_PATTERN = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i;

export function detectWebGLCapability(): WebGLCapabilityReport {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      supported: false,
      webgl2: false,
      isSoftwareGl: false,
      isMobile: false,
      maxDpr: 1,
      enableShadows: false,
      enableAntialias: false,
      particleCount: 0,
      rendererName: "ssr",
    };
  }

  const isMobile =
    window.innerWidth < 768 ||
    (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches);

  try {
    const canvas = document.createElement("canvas");
    const gl2 = canvas.getContext("webgl2", { powerPreference: "high-performance" });
    const gl1 = gl2
      ? null
      : (canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl"));
    const gl = (gl2 ?? gl1) as WebGLRenderingContext | WebGL2RenderingContext | null;

    if (!gl) {
      return {
        supported: false,
        webgl2: false,
        isSoftwareGl: false,
        isMobile,
        maxDpr: 1,
        enableShadows: false,
        enableAntialias: false,
        particleCount: 0,
        rendererName: "unavailable",
      };
    }

    let rendererName = "unknown";
    try {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      rendererName = String(
        debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      );
    } catch {
      rendererName = "restricted";
    }

    const isSoftwareGl = SOFTWARE_GL_PATTERN.test(rendererName);
    const loseExt = gl.getExtension("WEBGL_lose_context");
    loseExt?.loseContext();

    const rawDpr = window.devicePixelRatio || 1;
    const maxDpr = isSoftwareGl ? 1 : Math.min(rawDpr, isMobile ? 1.5 : 2);

    return {
      supported: true,
      webgl2: Boolean(gl2),
      isSoftwareGl,
      isMobile,
      maxDpr,
      enableShadows: !isSoftwareGl && !isMobile,
      enableAntialias: !isSoftwareGl,
      particleCount: isSoftwareGl ? 48 : isMobile ? 64 : 130,
      rendererName,
    };
  } catch {
    return {
      supported: false,
      webgl2: false,
      isSoftwareGl: false,
      isMobile,
      maxDpr: 1,
      enableShadows: false,
      enableAntialias: false,
      particleCount: 0,
      rendererName: "error",
    };
  }
}

export function disposeMaterial(material: THREE.Material) {
  const rec = material as unknown as Record<string, unknown>;
  for (const value of Object.values(rec)) {
    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  }
  material.dispose();
}

export function disposeObject3D(root: THREE.Object3D | null | undefined) {
  if (!root) return;
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.Line) {
      obj.geometry?.dispose();
      if (Array.isArray(obj.material)) {
        for (const mat of obj.material) {
          disposeMaterial(mat);
        }
      } else if (obj.material) {
        disposeMaterial(obj.material);
      }
    }
  });
}
