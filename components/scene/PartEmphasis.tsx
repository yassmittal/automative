"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils } from "three";
import { SYSTEMS } from "@/content/systems";
import { CORRECT } from "@/content/palette";
import type { Anchor } from "@/lib/callouts";
import type { CastingUniforms } from "@/lib/castingMaterial";
import { useAtlas } from "@/lib/store";
import { useAnnotatedId } from "./Annotation";

/**
 * Shows on the model which part is being read — in whichever of the two ways
 * this particular model can honestly support.
 *
 * When the part is bound to its own meshes, the whole part lights up, because
 * the geometry genuinely knows where it begins and ends. When it is not — the
 * usual case, a single merged casting — a tight wash sits on the authored
 * callout point instead. The wash is a spotlight, not a boundary, and its
 * radius is deliberately small for exactly that reason: widen it and it starts
 * making a claim about the part's extent that the model cannot back up.
 *
 * Both follow `useAnnotatedId` rather than reading hover and selection
 * themselves, so both inherit its rule for free: nothing is lit while a quiz
 * question is still open, because lighting up the answer would hand it over.
 */
export function PartEmphasis({
  anchors,
  casting,
  uniformsByPartId,
}: {
  anchors: Anchor[];
  casting: CastingUniforms;
  uniformsByPartId: Map<string, CastingUniforms>;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const annotatedId = useAnnotatedId();
  const mode = useAtlas((s) => s.mode);

  const target = useMemo(
    () => anchors.find((anchor) => anchor.id === annotatedId) ?? null,
    [anchors, annotatedId],
  );

  /**
   * A reveal is washed in the quiz's own green rather than the part's system
   * colour — the same rule the balloons follow. During a quiz the colour would
   * otherwise narrow down the answer before you had found it.
   */
  const emphasisColor = useMemo(() => {
    if (!target) return null;
    return mode === "quiz" ? CORRECT : SYSTEMS[target.system].beacon;
  }, [target, mode]);

  /** Mesh-bound parts light up as themselves; everything else gets the wash. */
  const boundUniforms = target ? uniformsByPartId.get(target.id) : undefined;

  // On-demand render loop: a change of subject has to ask for frames itself.
  useEffect(() => {
    invalidate();
  }, [annotatedId, mode, invalidate]);

  /**
   * The part currently lit, which lags the target by one fade. Moving the
   * wash's centre while it is still lit drags a smear of colour across the
   * casting, so the old one is put out before the new one is taken up.
   */
  const litPartId = useRef<string | null>(null);

  useFrame(() => {
    const settled = litPartId.current === annotatedId;
    const currentWash = casting.uFocusAmount.value;

    if (!settled && currentWash > 0.02) {
      casting.uFocusAmount.value = MathUtils.damp(currentWash, 0, 10, 0.016);
      fadeAllHighlights(uniformsByPartId, null);
      invalidate();
      return;
    }

    if (!settled) {
      litPartId.current = annotatedId;
      if (target && emphasisColor) {
        casting.uFocusPos.value.copy(target.position);
        casting.uFocusColor.value.set(emphasisColor);
        boundUniforms?.uHighlightColor.value.set(emphasisColor);
      }
    }

    // A mesh-bound part is shown by lighting the mesh, so the point wash would
    // be a second, weaker answer to a question already answered better.
    const wantWash = target && !boundUniforms ? 1 : 0;
    const nextWash = MathUtils.damp(currentWash, wantWash, 8, 0.016);
    casting.uFocusAmount.value = nextWash;

    const stillMoving =
      Math.abs(nextWash - wantWash) > 0.002 ||
      fadeAllHighlights(uniformsByPartId, boundUniforms ? target?.id ?? null : null);

    if (stillMoving) invalidate();
  });

  return null;
}

/**
 * Brings the lit part's highlight up and every other part's down.
 * Returns whether anything is still moving, so the caller knows to ask for
 * another frame.
 */
function fadeAllHighlights(
  uniformsByPartId: Map<string, CastingUniforms>,
  litPartId: string | null,
): boolean {
  let stillMoving = false;

  for (const [partId, uniforms] of uniformsByPartId) {
    const want = partId === litPartId ? 1 : 0;
    const next = MathUtils.damp(uniforms.uHighlightAmount.value, want, 9, 0.016);
    uniforms.uHighlightAmount.value = next;
    if (Math.abs(next - want) > 0.002) stillMoving = true;
  }
  return stillMoving;
}
