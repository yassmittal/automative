"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping } from "three";
import type { CatalogEntry } from "@/lib/catalog";
import { useAtlas } from "@/lib/store";
import type { AnnotationRefs } from "./scene/Annotation";
import type { AuthoredPoint } from "./scene/Picker";
import { HOME_CAMERA, Scene } from "./scene/Scene";
import { AnnotationOverlay } from "./ui/AnnotationOverlay";

/**
 * Caps the render resolution on machines that will not enjoy a full-density
 * scene. Starts conservative so the first frame is never the expensive one,
 * then settles on a ceiling once we can read the device.
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
  entry,
  authoring,
  onAuthor,
}: {
  entry: CatalogEntry;
  authoring: boolean;
  onAuthor?: (point: AuthoredPoint) => void;
}) {
  const label = useRef<HTMLDivElement>(null);
  const line = useRef<SVGPolylineElement>(null);
  const refs: AnnotationRefs = useMemo(() => ({ label, line }), []);
  const dpr = usePixelRatio();
  const ready = useAtlas((s) => s.ready);

  return (
    <div className="on-plate relative h-full w-full overflow-hidden bg-[radial-gradient(115%_95%_at_50%_18%,var(--plate)_0%,var(--plate-deep)_78%)]">
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
            entry={entry}
            refs={refs}
            authoring={authoring}
            onAuthor={onAuthor}
          />
        </Suspense>
      </Canvas>

      <AnnotationOverlay entry={entry} refs={refs} />

      <div
        className="pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-500"
        style={{ opacity: ready ? 0 : 1 }}
      >
        <div className="plate-tag animate-pulse text-plate-ink">Loading plate…</div>
      </div>
    </div>
  );
}

/** A faint surface-plate grid behind the model. Barely there on purpose. */
function PlateGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(to right, var(--plate-hairline) 1px, transparent 1px), linear-gradient(to bottom, var(--plate-hairline) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        maskImage:
          "radial-gradient(120% 90% at 50% 45%, transparent 26%, black 100%)",
        WebkitMaskImage:
          "radial-gradient(120% 90% at 50% 45%, transparent 26%, black 100%)",
        opacity: 0.55,
      }}
    />
  );
}
