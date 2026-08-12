"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping } from "three";
import type { Module } from "@/content/types";
import { useAtlas } from "@/lib/store";
import type { AnnotationRefs } from "./scene/Annotation";
import type { AuthoredPoint } from "./scene/Picker";
import { HOME_CAMERA, Scene } from "./scene/Scene";
import { AnnotationOverlay } from "./ui/AnnotationOverlay";

/**
 * Caps the render resolution on machines that will not enjoy a full-density
 * 77k-triangle scene. Starts conservative so the first frame is never the
 * expensive one, then settles on a ceiling once we can read the device.
 */
function usePixelRatio(): [number, number] {
  // Read the device once, when the state is first created. Probing in an
  // effect and calling setState would render the Canvas at one resolution and
  // then immediately tear it down for another.
  return useState<[number, number]>(() => {
    if (typeof window === "undefined") return [1, 1.25];
    const cores = navigator.hardwareConcurrency ?? 4;
    const narrow = window.innerWidth < 900;
    return [1, cores <= 4 || narrow ? 1.25 : 2];
  })[0];
}

export function Viewport({
  module,
  authoring,
  onAuthor,
}: {
  module: Module;
  authoring: boolean;
  onAuthor?: (point: AuthoredPoint) => void;
}) {
  const label = useRef<HTMLDivElement>(null);
  const line = useRef<SVGPolylineElement>(null);
  const refs: AnnotationRefs = useMemo(() => ({ label, line }), []);
  const dpr = usePixelRatio();
  const ready = useAtlas((s) => s.ready);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(120%_100%_at_50%_0%,#f4f5f2_0%,#e6e8e2_55%,#d7dad3_100%)]">
      <PlateGrid />

      <Canvas
        frameloop="demand"
        dpr={dpr}
        shadows
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: ACESFilmicToneMapping,
        }}
        camera={{ fov: 34, position: HOME_CAMERA, near: 0.1, far: 100 }}
        style={{ touchAction: "none" }}
      >
        <Suspense fallback={null}>
          <Scene
            module={module}
            refs={refs}
            authoring={authoring}
            onAuthor={onAuthor}
          />
        </Suspense>
      </Canvas>

      <AnnotationOverlay module={module} refs={refs} />

      <div
        className="pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-500"
        style={{ opacity: ready ? 0 : 1 }}
      >
        <div className="plate-tag animate-pulse">Loading plate…</div>
      </div>
    </div>
  );
}

/** A faint surface-plate grid behind the model. Barely there on purpose. */
function PlateGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.5]"
      style={{
        backgroundImage:
          "linear-gradient(to right, #aab0a8 1px, transparent 1px), linear-gradient(to bottom, #aab0a8 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        maskImage:
          "radial-gradient(120% 90% at 50% 45%, transparent 30%, black 100%)",
        WebkitMaskImage:
          "radial-gradient(120% 90% at 50% 45%, transparent 30%, black 100%)",
        opacity: 0.16,
      }}
    />
  );
}
