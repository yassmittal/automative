"use client";

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { projectToScreen, type Anchor } from "@/lib/callouts";
import { useAtlas } from "@/lib/store";

export type AnnotationRefs = {
  label: React.RefObject<HTMLDivElement | null>;
  line: React.RefObject<SVGPolylineElement | null>;
  /** The dark casing drawn under `line` so it reads on a lit casting too. */
  lineCasing: React.RefObject<SVGPolylineElement | null>;
};

/**
 * Where the annotated balloon currently sits, as a fraction of the viewport.
 * The quiz reads this so its feedback can open on whichever half of the plate
 * the revealed part is not in, instead of covering the thing you just got
 * wrong. Deliberately a plain mutable object — it is sampled at the moment a
 * question is answered, not subscribed to.
 */
export const annotationScreen = { x: 0.5, y: 0.5, valid: false };

/** Which callout, if any, should be wearing a leader line right now. */
export function useAnnotatedId(): string | null {
  const hoveredId = useAtlas((s) => s.hoveredId);
  const selectedId = useAtlas((s) => s.selectedId);
  const mode = useAtlas((s) => s.mode);
  const quiz = useAtlas((s) => s.quiz);

  if (mode === "quiz") {
    // Never label a balloon while the question is still open — that would
    // hand over the answer. Only the reveal gets a label.
    if (quiz.phase === "wrong") return quiz.revealId;
    if (quiz.phase === "correct") return quiz.queue[quiz.index];
    return null;
  }
  return hoveredId ?? selectedId;
}

/**
 * Draws the leader line from a balloon out to its label, and keeps both
 * pinned to the model as it rotates.
 *
 * This lives inside the Canvas because it needs the camera every frame, but
 * it writes straight to the overlay's DOM nodes instead of going through
 * React state — re-rendering a component sixty times a second to move a label
 * two pixels is how these overlays end up feeling sticky.
 */
export function Annotator({
  anchors,
  refs,
}: {
  anchors: Anchor[];
  refs: AnnotationRefs;
}) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const annotatedId = useAnnotatedId();

  useFrame(({ size }) => {
    const label = refs.label.current;
    const line = refs.line.current;
    if (!label || !line) return;

    const anchor = anchors.find((a) => a.id === annotatedId);
    if (!anchor) {
      annotationScreen.valid = false;
      return;
    }

    const s = projectToScreen(anchor.position, camera, size.width, size.height);
    if (s.behind) return;

    annotationScreen.x = s.x / size.width;
    annotationScreen.y = s.y / size.height;
    annotationScreen.valid = true;

    // Lead outward, away from the middle of the plate, like a manual callout
    // running to the margin.
    const dir = s.x < size.width / 2 ? -1 : 1;
    const rise = s.y > size.height * 0.6 ? -30 : 26;

    const elbowX = s.x + dir * 30;
    const elbowY = s.y + rise;
    const endX = elbowX + dir * 48;

    const points = `${s.x},${s.y} ${elbowX},${elbowY} ${endX},${elbowY}`;
    line.setAttribute("points", points);
    refs.lineCasing.current?.setAttribute("points", points);

    label.style.transform = `translate3d(${endX}px, ${elbowY}px, 0) translate(${
      dir < 0 ? "-100%" : "0"
    }, -50%)`;
    label.style.textAlign = dir < 0 ? "right" : "left";
  });

  // The overlay is DOM, so it needs a frame drawn to reposition after a
  // selection change even when the camera has not moved.
  useEffect(() => {
    invalidate();
  }, [annotatedId, invalidate]);

  return null;
}
