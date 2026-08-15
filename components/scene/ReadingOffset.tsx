"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { PerspectiveCamera } from "three";
import { useAtlas } from "@/lib/store";

/**
 * Slides the framing out from under the part read-out.
 *
 * Selecting a part does two things at once: it flies the camera to that part,
 * and it opens a panel down the right-hand side to describe it. Left alone
 * those two fight — the camera centres the part in the viewport, and the panel
 * is then drawn on top of the exact thing it is describing. Making the panel
 * opaque fixed the text; it did not fix the part being hidden behind it.
 *
 * The fix is to move the *frustum*, not the model or the camera: an off-centre
 * projection shifts everything left by half the panel's width, so the part
 * lands in the middle of the space the reader can actually see. Nothing about
 * the orbit changes, so dragging still behaves exactly as it did, and because
 * the projection matrix is what moved, the leader lines and click targets that
 * project through it follow along for free.
 */

/** Matches PartCard's `max-w-[22rem]` plus its `m-3`. */
const READOUT_WIDTH = 352 + 12;

/**
 * Below this the read-out covers most of the plate and there is no free half
 * to frame into — shifting would only push the model off the opposite edge.
 */
const MIN_FREE_FRACTION = 0.55;

export function ReadingOffset() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const selectedId = useAtlas((s) => s.selectedId);
  const mode = useAtlas((s) => s.mode);

  // Deliberately a ref rather than state: this is tweened every frame, and
  // re-rendering the scene graph to move the frustum a pixel is the thing the
  // rest of this viewport is at pains to avoid.
  const shift = useRef({ px: 0 });

  const covered = Math.min(size.width, READOUT_WIDTH);
  const roomToShift = size.width - covered > size.width * MIN_FREE_FRACTION;
  const target =
    mode === "explore" && selectedId && roomToShift ? covered / 2 : 0;

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;

    const apply = () => {
      const px = shift.current.px;
      if (px < 0.5) camera.clearViewOffset();
      else {
        camera.setViewOffset(
          size.width,
          size.height,
          px,
          0,
          size.width,
          size.height,
        );
      }
      camera.updateProjectionMatrix();
      invalidate();
    };

    // The pan is only legible as motion, so someone who has asked for less of
    // it should simply arrive at the right framing.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Matched to CameraRig's flight, so the two read as one move rather than
    // as the panel shoving the model aside after the fact.
    const tween = gsap.to(shift.current, {
      px: target,
      duration: reduced ? 0 : 1.05,
      ease: "power3.inOut",
      overwrite: true,
      onUpdate: apply,
      onComplete: apply,
    });

    apply();
    return () => {
      tween.kill();
    };
  }, [target, camera, size.width, size.height, invalidate]);

  return null;
}
