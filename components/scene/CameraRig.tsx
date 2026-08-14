"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Anchor } from "@/lib/callouts";
import { useAtlas } from "@/lib/store";

/**
 * Flies the camera to whichever part is being read, and back out again when
 * nothing is selected.
 *
 * The destination is derived from the callout's own surface normal, so the
 * camera always arrives looking straight at the part rather than at some
 * fixed angle that happens to work for one of them. Any tween is killed the
 * moment the user grabs the model — an animation that fights your hands is
 * worse than no animation.
 */
export function CameraRig({
  anchors,
  controls,
  focusDistanceFor,
  home,
}: {
  anchors: Anchor[];
  controls: React.RefObject<OrbitControlsImpl | null>;
  /** How far back to view a given part from. See useFraming in Scene. */
  focusDistanceFor: (partId: string) => number;
  /** Opening camera position, already sized to the viewport. */
  home: Vector3;
}) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const selectedId = useAtlas((s) => s.selectedId);
  const mode = useAtlas((s) => s.mode);
  const quiz = useAtlas((s) => s.quiz);
  const tweens = useRef<gsap.core.Tween[]>([]);
  const settled = useRef(false);

  // In explore mode the camera follows the selection. In a quiz it follows the
  // answer once the question resolves, so a part hiding round the back is
  // actually shown to you rather than being drawn on top of the near side.
  const focusId =
    mode === "quiz"
      ? quiz.phase === "correct" || quiz.phase === "wrong"
        ? quiz.queue[quiz.index]
        : null
      : selectedId;

  // Let the user interrupt any move by touching the model.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const kill = () => {
      for (const t of tweens.current) t.kill();
      tweens.current = [];
    };
    c.addEventListener("start", kill);
    return () => c.removeEventListener("start", kill);
  }, [controls]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;

    for (const t of tweens.current) t.kill();
    tweens.current = [];

    const anchor = anchors.find((a) => a.id === focusId);

    // Tip the approach up before it is scaled, never after. Clamping the
    // finished position's height instead would drag the camera back towards a
    // downward-facing part like the sump until it ended up inside the casting.
    const approach = anchor?.normal.clone() ?? new Vector3(0, 0, 1);
    if (approach.y < -0.2) {
      approach.y = -0.2;
      approach.normalize();
    }

    // Far enough back that the part still has the rest of the engine around
    // it for context — pulled right onto the surface it reads as an abstract
    // lump of aluminium.
    const destination = anchor
      ? anchor.position
          .clone()
          .add(approach.multiplyScalar(focusDistanceFor(anchor.id)))
      : home.clone();
    const lookAt = anchor ? anchor.position.clone() : new Vector3(0, 0, 0);

    // The opening position, and any re-fit after a resize, are placements
    // rather than moves — there is nothing for the eye to follow, so a tween
    // would just be a lurch on load.
    if (!anchor && !settled.current) {
      settled.current = true;
      camera.position.copy(destination);
      c.target.set(0, 0, 0);
      c.update();
      invalidate();
      return;
    }

    // Someone who has asked for reduced motion still needs to end up looking
    // at the right part — they just should not be flown there.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const settings = {
      duration: reduced ? 0 : anchor ? 1.05 : 0.95,
      ease: "power3.inOut",
      overwrite: true as const,
      onUpdate: invalidate,
    };

    tweens.current = [
      gsap.to(camera.position, {
        x: destination.x,
        y: destination.y,
        z: destination.z,
        ...settings,
      }),
      gsap.to(c.target, {
        x: lookAt.x,
        y: lookAt.y,
        z: lookAt.z,
        ...settings,
        onComplete: () => {
          tweens.current = [];
          invalidate();
        },
      }),
    ];

    return () => {
      for (const t of tweens.current) t.kill();
    };
  }, [focusId, mode, anchors, camera, controls, focusDistanceFor, home, invalidate]);

  return null;
}
