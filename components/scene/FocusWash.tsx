"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils } from "three";
import { SYSTEMS } from "@/content/types";
import type { Anchor } from "@/lib/callouts";
import type { FocusUniforms } from "@/lib/castingMaterial";
import { useAtlas } from "@/lib/store";
import { useAnnotatedId } from "./Annotation";

/** The reveal wash is the quiz's own green, never a system colour — the same
 *  rule the balloons follow, for the same reason. */
const REVEAL = "#00752c";

/**
 * Lights the casting around whichever callout is being read, in that part's
 * system colour.
 *
 * It follows `useAnnotatedId` rather than reading hover/selection itself, so it
 * inherits that rule for free: nothing is washed while a quiz question is still
 * open, because lighting up the answer would hand it over.
 */
export function FocusWash({
  anchors,
  focus,
}: {
  anchors: Anchor[];
  focus: FocusUniforms;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const annotatedId = useAnnotatedId();
  const mode = useAtlas((s) => s.mode);

  const target = useMemo(
    () => anchors.find((a) => a.id === annotatedId) ?? null,
    [anchors, annotatedId],
  );

  const wanted = useMemo(() => {
    if (!target) return null;
    return mode === "quiz" ? REVEAL : SYSTEMS[target.system].color;
  }, [target, mode]);

  // On-demand render loop: a change of subject has to ask for frames itself.
  useEffect(() => {
    invalidate();
  }, [annotatedId, mode, invalidate]);

  /** The part the wash is currently sitting on, which lags the target by one
   *  fade — moving the centre while the wash is lit would drag a smear of
   *  colour across the block. */
  const shown = useRef<string | null>(null);

  useFrame(() => {
    const amount = focus.uFocusAmount.value;
    const settled = shown.current === annotatedId;

    // Wrong subject still lit: put it out first, then take over the centre.
    if (!settled && amount > 0.02) {
      const next = MathUtils.damp(amount, 0, 10, 0.016);
      focus.uFocusAmount.value = next;
      invalidate();
      return;
    }

    if (!settled) {
      shown.current = annotatedId;
      if (target) {
        focus.uFocusPos.value.copy(target.position);
        if (wanted) focus.uFocusColor.value.set(wanted);
      }
    }

    const wantAmount = target ? 1 : 0;
    const next = MathUtils.damp(amount, wantAmount, 8, 0.016);
    focus.uFocusAmount.value = next;
    if (Math.abs(next - wantAmount) > 0.002) invalidate();
  });

  return null;
}
