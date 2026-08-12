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
import { SYSTEMS, type SystemId } from "@/content/types";
import { glyphTexture, type Anchor } from "@/lib/callouts";
import { createBalloonMaterial } from "./balloonMaterial";
import { useAtlas } from "@/lib/store";

type BalloonLook = { ring: string; fill: string; ink: string };

const PAPER = "#fcfcfb";

/**
 * The balloon palette.
 *
 * These are `Color` uniforms in a shader, not CSS — the Tailwind tokens in
 * globals.css cannot reach them, so the values are mirrored here by hand.
 * Change one side and you must change the other, or the DOM and the model
 * will disagree about what colour a system is.
 *
 * The system hues themselves come from SYSTEMS, which is the source of truth;
 * only the states that mean the same thing for every part are literals here.
 */
const LOOKS = {
  /** Quiz mode: every balloon that is not part of the answer goes grey, so a
   *  system colour can never leak the answer. */
  quiet: { ring: "#6e767c", fill: PAPER, ink: "#4a5157" },
  correct: { ring: "#014b1a", fill: "#00752c", ink: PAPER },
  wrong: { ring: "#940009", fill: "#cf2020", ink: PAPER },
} satisfies Record<string, BalloonLook>;

/** Idle / hover / selected, in the colour of the system the part belongs to. */
function systemLooks(system: SystemId) {
  const { color, ink } = SYSTEMS[system];
  return {
    idle: { ring: color, fill: PAPER, ink },
    hover: { ring: ink, fill: "#ffffff", ink },
    active: { ring: ink, fill: color, ink: PAPER },
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

      let target = MathUtils.smoothstep(dot, 0.02, 0.4);
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
      u.uPixelSize.value = mode === "quiz" ? 34 : 30;

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
