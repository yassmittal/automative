"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Mesh, Raycaster, Vector2, Vector3 } from "three";
import { pickAnchor, type Anchor } from "@/lib/callouts";
import { atlas, getState } from "@/lib/store";

/** Pointer travel beyond this many pixels was an orbit, not a click. */
const DRAG_SLOP_PX = 6;

export type AuthoredPoint = { position: [number, number, number] };

/**
 * Where authoring mode publishes its raycast, so a coordinate can be read for
 * a point on screen without clicking it.
 *
 * Placing a callout means finding the point on the mesh under a pixel, and
 * clicking is the natural way to ask for one — but it is one question per
 * round trip, and a plate is a dozen parts across five plates. Exposing the
 * same raycast lets a whole plate be probed in a single pass, which is the
 * difference between authoring a module in minutes and in an afternoon.
 *
 * Only ever attached under `?authoring=1`, and removed when that unmounts.
 */
declare global {
  interface Window {
    atlasAuthoring?: {
      /**
       * Canvas-relative CSS pixels in; the point on the mesh under them, plus
       * the name of the mesh that was hit. On a model whose meshes are named
       * for real parts, that name turns authoring from "does this look like
       * the caliper" into a fact.
       */
      probeScreenPoint: (
        x: number,
        y: number,
      ) => { position: [number, number, number]; meshName: string } | null;
      canvasSize: () => { width: number; height: number };
    };
  }
}

/**
 * Turns pointer input on the canvas into hover, selection and quiz answers.
 *
 * Regular picking never touches the mesh: every balloon is projected to 2D
 * and the nearest one within a small pixel radius wins. Authoring mode is the
 * one exception — there we do raycast the real geometry, because the whole
 * point is to read a coordinate off the surface you clicked.
 */
export function Picker({
  anchors,
  facing,
  authoring,
  onAuthor,
  meshes,
}: {
  anchors: Anchor[];
  facing: Float32Array;
  authoring: boolean;
  onAuthor?: (point: AuthoredPoint) => void;
  meshes: Mesh[];
}) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);

  const anchorsRef = useRef(anchors);
  anchorsRef.current = anchors;

  // The raycast behind authoring, made callable without a click. See the
  // declaration of `window.atlasAuthoring` above for why this exists.
  useEffect(() => {
    if (!authoring) return;
    const canvas = gl.domElement;

    window.atlasAuthoring = {
      probeScreenPoint(x, y) {
        const rect = canvas.getBoundingClientRect();
        const raycaster = new Raycaster();
        raycaster.setFromCamera(
          new Vector2((x / rect.width) * 2 - 1, -(y / rect.height) * 2 + 1),
          camera,
        );
        const hit = raycaster.intersectObjects(meshes, false)[0];
        if (!hit) return null;
        const point = hit.point as Vector3;
        return {
          position: [round(point.x), round(point.y), round(point.z)],
          meshName: hit.object.name,
        };
      },
      canvasSize() {
        const rect = canvas.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      },
    };

    return () => {
      delete window.atlasAuthoring;
    };
  }, [authoring, camera, gl, meshes]);

  useEffect(() => {
    const el = gl.domElement;
    const down = new Vector2();
    let dragged = false;

    const local = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        w: rect.width,
        h: rect.height,
      };
    };

    const hitAt = (e: PointerEvent) => {
      const p = local(e);
      return pickAnchor(
        p.x,
        p.y,
        anchorsRef.current,
        facing,
        camera,
        p.w,
        p.h,
      );
    };

    const onPointerDown = (e: PointerEvent) => {
      down.set(e.clientX, e.clientY);
      dragged = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.buttons !== 0) {
        if (down.distanceTo(new Vector2(e.clientX, e.clientY)) > DRAG_SLOP_PX) {
          dragged = true;
        }
        return;
      }
      if (authoring) {
        el.style.cursor = "crosshair";
        return;
      }
      const hit = hitAt(e);
      atlas.hover(hit?.id ?? null);
      el.style.cursor = hit ? "pointer" : "grab";
    };

    const onPointerUp = (e: PointerEvent) => {
      if (dragged) return;

      if (authoring) {
        const p = local(e);
        const raycaster = new Raycaster();
        raycaster.setFromCamera(
          new Vector2((p.x / p.w) * 2 - 1, -(p.y / p.h) * 2 + 1),
          camera,
        );
        const hit = raycaster.intersectObjects(meshes, false)[0];
        if (hit) {
          // Meshes live under the normalization group, so the world-space hit
          // is already in the space authored coordinates are written in.
          const v = hit.point as Vector3;
          onAuthor?.({
            position: [round(v.x), round(v.y), round(v.z)],
          });
        }
        return;
      }

      const hit = hitAt(e);

      if (getState().mode === "quiz") {
        // A miss still counts as an answer — you got the part wrong.
        if (getState().quiz.phase === "asking") atlas.answer(hit?.id ?? null);
        return;
      }

      atlas.select(hit?.id ?? null);
      invalidate();
    };

    const onPointerLeave = () => {
      atlas.hover(null);
      el.style.cursor = "";
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointerleave", onPointerLeave);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointerleave", onPointerLeave);
      el.style.cursor = "";
    };
  }, [gl, camera, facing, authoring, onAuthor, meshes, invalidate]);

  return null;
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
