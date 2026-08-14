"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Color,
  MathUtils,
  Mesh,
  PlaneGeometry,
  Raycaster,
  type PerspectiveCamera,
  type ShaderMaterial,
  Vector3,
} from "three";
import { SYSTEMS } from "@/content/systems";
import {
  CORRECT,
  PAPER,
  PLATE_DEEP,
  PLATE_INK,
  WRONG,
} from "@/content/palette";
import type { SystemId } from "@/content/types";
import { glyphTexture, type Anchor } from "@/lib/callouts";
import { createBalloonMaterial } from "./balloonMaterial";
import { useAtlas } from "@/lib/store";

type BalloonLook = { ring: string; fill: string; ink: string };

/**
 * The balloon palette.
 *
 * These are `Color` uniforms in a shader, which cannot read CSS — but they are
 * read from the same typed constants that generate the CSS, so the legend and
 * the model can no longer drift apart. That drift is why this file used to
 * carry hand-mirrored hex values, and why a palette change made in one place
 * left every balloon on the model wearing the previous colour.
 *
 * Balloons sit on the near-black plate, so a system appears here as its
 * `beacon` — the bright variant — while the legend beside it uses the
 * paper-tuned `color`. Same hue, two grounds.
 */
const LOOKS = {
  /** Quiz mode: every balloon that is not part of the answer goes grey, so a
   *  system colour can never leak the answer. */
  quiet: { ring: PLATE_INK, fill: PLATE_DEEP, ink: PLATE_INK },
  correct: { ring: PAPER, fill: CORRECT, ink: PAPER },
  wrong: { ring: PAPER, fill: WRONG, ink: PAPER },
} satisfies Record<string, BalloonLook>;

/**
 * Idle / hover / selected, in the colour of the system the part belongs to.
 *
 * Idle is a dark disc with a lit ring and a lit number, so eleven of them read
 * as a constellation over the casting rather than as eleven white stickers.
 * Selecting one floods the disc with the system colour and knocks the number
 * out dark — the strongest state change available without moving anything.
 */
function systemLooks(system: SystemId) {
  const { beacon } = SYSTEMS[system];
  return {
    idle: { ring: beacon, fill: PLATE_DEEP, ink: beacon },
    hover: { ring: PAPER, fill: PLATE_DEEP, ink: PAPER },
    active: { ring: PAPER, fill: beacon, ink: PLATE_DEEP },
  };
}

const QUAD = new PlaneGeometry(1, 1);

/**
 * Renders every callout as a billboarded disc and, each frame, fades the ones
 * facing away from the camera.
 *
 * The fade is what stops a balloon on the far side of the block from showing
 * through the casting. It is computed from the surface normal captured when
 * the callout was snapped, which is far cheaper and far steadier than
 * depth-testing or occlusion queries against a 77k-triangle mesh.
 *
 * `facing` is written in place and shared with the picker, so clicking uses
 * exactly the same visibility the eye does.
 */
export function Callouts({
  anchors,
  facing,
  meshes,
  sectionPlaneX,
}: {
  anchors: Anchor[];
  facing: Float32Array;
  meshes: Mesh[];
  /** x of the section plane, or null when nothing is cut away. */
  sectionPlaneX: React.RefObject<number | null>;
}) {
  const balloons = useRef<(Mesh | null)[]>([]);
  const invalidate = useThree((s) => s.invalidate);

  const hoveredId = useAtlas((s) => s.hoveredId);
  const selectedId = useAtlas((s) => s.selectedId);
  const mode = useAtlas((s) => s.mode);
  const quiz = useAtlas((s) => s.quiz);

  const materials = useMemo(
    () => anchors.map((a) => createBalloonMaterial(glyphTexture(a.callout))),
    [anchors],
  );

  // Resolved once per anchor rather than per frame — eight string lookups a
  // frame across twelve balloons is pointless work in a render loop.
  const looks = useMemo(() => anchors.map((a) => systemLooks(a.system)), [anchors]);

  useEffect(() => {
    return () => {
      for (const m of materials) m.dispose();
    };
  }, [materials]);

  // Any state change needs one more frame drawn, since the loop is on demand.
  useEffect(() => {
    invalidate();
  }, [hoveredId, selectedId, mode, quiz, invalidate]);

  const toCamera = useRef(new Vector3());
  const scratch = useRef(new Color());

  // Facing alone cannot tell that the radiator is standing in front of the
  // block, so each frame we also line-of-sight test one callout against the
  // real geometry. Round-robin keeps the cost to a single raycast per frame
  // while still refreshing every balloon a few times a second.
  const occluded = useMemo(() => new Float32Array(anchors.length), [anchors]);
  const probe = useRef(0);
  const sightline = useRef(new Raycaster());
  const toAnchor = useRef(new Vector3());

  useFrame(({ camera, size, clock }) => {
    const perspective = camera as PerspectiveCamera;
    const fovScale = 2 * Math.tan(MathUtils.degToRad(perspective.fov) / 2);
    let wantsAnotherFrame = false;

    if (anchors.length > 0 && meshes.length > 0) {
      const i = probe.current % anchors.length;
      probe.current = i + 1;
      toAnchor.current.copy(anchors[i].position).sub(camera.position);
      const distance = toAnchor.current.length();
      const ray = sightline.current;
      ray.set(camera.position, toAnchor.current.normalize());
      // Stop just short of the surface the balloon is sitting on, or every
      // callout would be blocked by its own part.
      ray.far = distance - 0.08;
      const next = ray.intersectObjects(meshes, false).length > 0 ? 1 : 0;
      if (next !== occluded[i]) {
        occluded[i] = next;
        wantsAnotherFrame = true;
      }
      ray.far = Infinity;
    }

    for (let i = 0; i < anchors.length; i++) {
      const mesh = balloons.current[i];
      if (!mesh) continue;
      const anchor = anchors[i];
      const material = mesh.material as ShaderMaterial;
      const u = material.uniforms;

      // --- facing fade -------------------------------------------------
      toCamera.current.copy(camera.position).sub(anchor.position).normalize();
      const dot = toCamera.current.dot(anchor.normal);

      // Fully lit once the surface is within about 75° of facing the camera,
      // rather than 65°. On a compact casting the tighter band was invisible;
      // on a sparse structure like a chassis, where callouts land on tubes and
      // arms whose normals point all over the place, it hid most of the plate
      // at rest. Line-of-sight below is what actually stops a balloon showing
      // through the model, so this only has to handle the far side.
      let target = MathUtils.smoothstep(dot, -0.06, 0.26);
      if (occluded[i]) target = 0;

      // Anything the section plane has cut away goes with it. The plane keeps
      // the x <= cut half, so a balloon past the cut is no longer on the model.
      const cut = sectionPlaneX.current;
      if (cut !== null && anchor.position.x > cut) target = 0;

      // The picker shares this, so "clickable" and "visible" stay the same
      // thing — you can never hit a balloon you cannot see.
      facing[i] = target;

      // --- state -------------------------------------------------------
      const isHovered = hoveredId === anchor.id;
      const isSelected = selectedId === anchor.id;

      const system = looks[i];
      let look: BalloonLook = system.idle;
      let emphasis = 0;
      let pulse = 0;

      if (mode === "quiz") {
        look = LOOKS.quiet;
        if (quiz.phase === "correct" && quiz.queue[quiz.index] === anchor.id) {
          look = LOOKS.correct;
          emphasis = 1;
          pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 7);
          wantsAnotherFrame = true;
        } else if (quiz.phase === "wrong") {
          if (quiz.revealId === anchor.id) {
            look = LOOKS.correct;
            emphasis = 1;
            pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 7);
            wantsAnotherFrame = true;
            // Deliberately not forced visible here. If the answer is round the
            // back, the camera flies to it (see CameraRig) and it fades up as
            // it comes into view — pinning it on top of whatever is in front
            // would show the part in the wrong place.
          } else if (quiz.missedId === anchor.id) {
            look = LOOKS.wrong;
            emphasis = 1;
          }
        } else if (isHovered) {
          look = system.hover;
          emphasis = 1;
        }
      } else if (isSelected) {
        look = system.active;
        emphasis = 1;
      } else if (isHovered) {
        look = system.hover;
        emphasis = 1;
      } else if (selectedId) {
        // Dim the rest of the plate once something is being read.
        target *= 0.45;
      }

      // --- write uniforms ----------------------------------------------
      u.uViewportHeight.value = size.height;
      u.uFovScale.value = fovScale;
      // Large enough that a two-digit callout is readable at a glance against
      // a busy casting. The balloon holds this size in pixels no matter how far
      // the camera orbits out, so this is a real, final size — not a size at
      // some reference distance.
      u.uPixelSize.value = mode === "quiz" ? 42 : 37;

      const prevOpacity = u.uOpacity.value as number;
      const nextOpacity = MathUtils.damp(prevOpacity, target, 9, 0.016);
      u.uOpacity.value = nextOpacity;
      if (Math.abs(nextOpacity - target) > 0.002) wantsAnotherFrame = true;

      const prevEmphasis = u.uEmphasis.value as number;
      const nextEmphasis = MathUtils.damp(prevEmphasis, emphasis, 12, 0.016);
      u.uEmphasis.value = nextEmphasis;
      if (Math.abs(nextEmphasis - emphasis) > 0.002) wantsAnotherFrame = true;

      u.uPulse.value = pulse;

      lerpColor(u.uRing.value as Color, look.ring, scratch.current);
      lerpColor(u.uFill.value as Color, look.fill, scratch.current);
      lerpColor(u.uInk.value as Color, look.ink, scratch.current);

      mesh.visible = nextOpacity > 0.004;
    }

    if (wantsAnotherFrame) invalidate();
  });

  return (
    <group renderOrder={10}>
      {anchors.map((anchor, i) => (
        <mesh
          key={anchor.id}
          ref={(node) => {
            balloons.current[i] = node;
          }}
          position={anchor.position}
          geometry={QUAD}
          material={materials[i]}
          renderOrder={10}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}

function lerpColor(current: Color, hex: string, scratch: Color) {
  scratch.set(hex);
  current.lerp(scratch, 0.25);
}
