"use client";

import { useEffect, useMemo, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Module } from "@/content/types";
import { snapToSurface } from "@/lib/callouts";
import { useNormalizedModel } from "@/lib/useNormalizedModel";
import { atlas } from "@/lib/store";
import { Annotator, type AnnotationRefs } from "./Annotation";
import { Callouts } from "./Callouts";
import { CameraRig } from "./CameraRig";
import { Picker, type AuthoredPoint } from "./Picker";
import { SectionCut } from "./SectionCut";
import { Stage } from "./Stage";

/** Opening three-quarter view, in normalized units. Used for the very first
 *  frame; the real distance is worked out from the viewport (see useFraming). */
export const HOME_CAMERA: [number, number, number] = [4.9, 2.65, 6.3];

/** Direction the opening view looks from. Distance is computed, not fixed. */
const HOME_DIR = new Vector3(...HOME_CAMERA).normalize();

export const CAMERA_FOV = 34;

/**
 * Works out how far back the camera has to sit for the model to fit.
 *
 * A fixed distance only ever frames one shape of window. The field of view is
 * vertical, so a tall narrow phone viewport sees far less across than a wide
 * desktop one and the engine runs off both sides. Dividing by the aspect when
 * it drops below 1 pushes the camera back by exactly the amount the narrower
 * window costs.
 */
function useFraming(radius: number) {
  const size = useThree((s) => s.size);

  return useMemo(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const halfFov = MathUtils.degToRad(CAMERA_FOV) / 2;

    // Compensating for a narrow window by the full aspect ratio assumes the
    // engine is as wide as its bounding sphere, which it is not — that leaves
    // a phone framing it far too small. The exponent takes most of the
    // correction without the slack.
    const narrowness = Math.min(1, aspect) ** 0.75;

    // 0.85 of the bounding sphere — a touch tighter than a true fit, so the
    // engine fills the plate instead of floating in it.
    const distance = (radius * 0.85) / (Math.tan(halfFov) * narrowness);
    return {
      distance,
      home: HOME_DIR.clone().multiplyScalar(distance),
      /** How far a focused part is viewed from, on the same aspect logic. */
      focusDistance: (radius * 2.15) / narrowness,
    };
  }, [radius, size.width, size.height]);
}

export function Scene({
  module,
  refs,
  authoring,
  onAuthor,
}: {
  module: Module;
  refs: AnnotationRefs;
  authoring: boolean;
  onAuthor?: (point: AuthoredPoint) => void;
}) {
  const model = useNormalizedModel(module.modelUrl);
  const controls = useRef<OrbitControlsImpl>(null);
  const cutX = useRef<number | null>(null);
  const framing = useFraming(model.radius);

  const anchors = useMemo(
    () => snapToSurface(module.parts, model.meshes, model.radius),
    [module.parts, model.meshes, model.radius],
  );

  const facing = useMemo(
    () => new Float32Array(anchors.length),
    [anchors.length],
  );

  useEffect(() => {
    atlas.setReady(true);
    return () => atlas.setReady(false);
  }, [anchors]);

  return (
    <>
      <primitive object={model.object} />

      <Stage radius={model.radius} />

      <SectionCut meshes={model.meshes} size={model.size} cutX={cutX} />

      <Callouts
        anchors={anchors}
        facing={facing}
        meshes={model.meshes}
        sectionPlaneX={cutX}
      />

      <Annotator anchors={anchors} refs={refs} />

      <Picker
        anchors={anchors}
        facing={facing}
        authoring={authoring}
        onAuthor={onAuthor}
        meshes={model.meshes}
      />

      <CameraRig
        anchors={anchors}
        controls={controls}
        focusDistance={framing.focusDistance}
        home={framing.home}
      />

      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.075}
        rotateSpeed={0.75}
        zoomSpeed={0.7}
        minDistance={model.radius * 1.15}
        maxDistance={framing.distance * 1.7}
        // Stop short of the poles so the model never flips or ends up viewed
        // from directly underneath the bench.
        minPolarAngle={0.16}
        maxPolarAngle={Math.PI * 0.86}
      />
    </>
  );
}
