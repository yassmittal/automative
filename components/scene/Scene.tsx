"use client";

import { useEffect, useMemo, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CatalogEntry } from "@/lib/catalog";
import { snapToSurface } from "@/lib/callouts";
import { useNormalizedModel } from "@/lib/useNormalizedModel";
import { atlas } from "@/lib/store";
import { Annotator, type AnnotationRefs } from "./Annotation";
import { Callouts } from "./Callouts";
import { CameraRig } from "./CameraRig";
import { PartEmphasis } from "./PartEmphasis";
import { Picker, type AuthoredPoint } from "./Picker";
import { SectionCut } from "./SectionCut";
import { Stage } from "./Stage";

/**
 * Opening three-quarter view, in normalized units. Used for the very first
 * frame, and as the default for any module that does not name its own — see
 * `openingView` on Module. The real distance is worked out from the viewport
 * (see useFraming), so only the direction of this vector matters.
 */
export const HOME_CAMERA: [number, number, number] = [4.9, 2.65, 6.3];

export const CAMERA_FOV = 34;

/**
 * Works out how far back the camera has to sit for the model to fit.
 *
 * A fixed distance only ever frames one shape of window. The field of view is
 * vertical, so a tall narrow phone viewport sees far less across than a wide
 * desktop one and the model runs off both sides. Dividing by the aspect when
 * it drops below 1 pushes the camera back by exactly the amount the narrower
 * window costs.
 */
function useFraming(radius: number, openingView: [number, number, number]) {
  const size = useThree((s) => s.size);

  return useMemo(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const halfFov = MathUtils.degToRad(CAMERA_FOV) / 2;

    // Compensating for a narrow window by the full aspect ratio assumes the
    // model is as wide as its bounding sphere, which it is not — that leaves
    // a phone framing it far too small. The exponent takes most of the
    // correction without the slack.
    const narrowness = Math.min(1, aspect) ** 0.75;

    // 0.85 of the bounding sphere — a touch tighter than a true fit, so the
    // model fills the plate instead of floating in it.
    const distance = (radius * 0.85) / (Math.tan(halfFov) * narrowness);
    return {
      distance,
      home: new Vector3(...openingView).normalize().multiplyScalar(distance),
      narrowness,
      halfFov,
    };
  }, [radius, size.width, size.height, openingView]);
}

/**
 * How far back to view a part from.
 *
 * The default is a fraction of the whole model, which reads well for a part
 * that is a detail of something larger — pulled right onto the surface, a
 * callout on a casting is just an abstract lump of aluminium, so it wants the
 * rest of the model around it for context.
 *
 * A part bound to its own meshes is different: we know how big it actually is,
 * and some of them are most of their model. A brake disc framed at the distance
 * that suits a spark plug bore fills the screen edge to edge. Where the real
 * size is known, it wins.
 */
function useFocusDistance(
  radius: number,
  radiusByPartId: Map<string, number>,
  narrowness: number,
): (partId: string) => number {
  return useMemo(() => {
    const defaultDistance = (radius * 2.15) / narrowness;

    return (partId: string) => {
      const partRadius = radiusByPartId.get(partId);
      if (partRadius === undefined) return defaultDistance;
      return Math.max(defaultDistance, (partRadius * 2.4) / narrowness);
    };
  }, [radius, radiusByPartId, narrowness]);
}

export function Scene({
  entry,
  refs,
  authoring,
  onAuthor,
}: {
  entry: CatalogEntry;
  refs: AnnotationRefs;
  authoring: boolean;
  onAuthor?: (point: AuthoredPoint) => void;
}) {
  const { module, modelUrl } = entry;
  const model = useNormalizedModel(modelUrl, module.parts);
  const controls = useRef<OrbitControlsImpl>(null);
  const cutX = useRef<number | null>(null);
  const framing = useFraming(model.radius, module.openingView ?? HOME_CAMERA);
  const focusDistanceFor = useFocusDistance(
    model.radius,
    model.radiusByPartId,
    framing.narrowness,
  );

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

      <PartEmphasis
        anchors={anchors}
        casting={model.casting}
        uniformsByPartId={model.uniformsByPartId}
      />

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
        focusDistanceFor={focusDistanceFor}
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
