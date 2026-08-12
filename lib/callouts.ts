"use client";

import {
  CanvasTexture,
  LinearFilter,
  Matrix3,
  Mesh,
  Raycaster,
  SRGBColorSpace,
  Vector3,
  type Camera,
} from "three";
import type { Part, SystemId } from "@/content/types";

/** A callout after it has been snapped onto the mesh. */
export type Anchor = {
  id: string;
  callout: number;
  name: string;
  /** Which system it belongs to, so the balloon can wear that colour. */
  system: SystemId;
  /** Point on the surface, in normalized model space. */
  position: Vector3;
  /** Outward surface normal there. Drives the facing fade. */
  normal: Vector3;
};

/** Click has to land within this many pixels of a balloon to count. */
export const PICK_RADIUS_PX = 26;

/** How far either side of an authored point we look for the real surface. */
const LOCAL_REACH = 0.3;

/**
 * Pulls every authored point onto the model's actual surface.
 *
 * The probe is deliberately *local*: a short segment straight through the
 * authored point, taking the first surface it crosses. That fixes a
 * coordinate that is slightly inside or slightly proud of the casting
 * without moving it anywhere else.
 *
 * The obvious alternative — casting all the way in from outside the bounds
 * along the radial line — is wrong on an assembly like this one. A callout on
 * the front of the block would snap forward onto the radiator standing in
 * front of it, because the radiator is the first thing that ray meets. The
 * long cast survives only as a fallback for a coordinate authored so far off
 * the model that nothing is nearby.
 *
 * Runs once, after load.
 */
export function snapToSurface(
  parts: Part[],
  meshes: Mesh[],
  modelRadius: number,
): Anchor[] {
  const raycaster = new Raycaster();
  const center = new Vector3(0, 0, 0);
  const normalMatrix = new Matrix3();

  return parts.map((part) => {
    const authored = new Vector3(...part.position);
    const outward = authored.clone().sub(center);

    // A point authored exactly at the centre has no direction to cast along.
    if (outward.lengthSq() < 1e-8) outward.set(0, 1, 0);
    outward.normalize();

    const inward = outward.clone().negate();

    raycaster.far = LOCAL_REACH * 2;
    raycaster.set(authored.clone().addScaledVector(outward, LOCAL_REACH), inward);
    let hit = raycaster.intersectObjects(meshes, false)[0];

    if (!hit) {
      raycaster.far = Infinity;
      raycaster.set(outward.clone().multiplyScalar(modelRadius * 2.5), inward);
      hit = raycaster.intersectObjects(meshes, false)[0];
    }
    raycaster.far = Infinity;

    if (!hit || !hit.face) {
      return {
        id: part.id,
        callout: part.callout,
        name: part.name,
        system: part.system,
        position: authored,
        normal: outward.clone(),
      };
    }

    normalMatrix.getNormalMatrix(hit.object.matrixWorld);
    const normal = hit.face.normal
      .clone()
      .applyNormalMatrix(normalMatrix)
      .normalize();

    // Faces can be wound either way on this model (it is double-sided);
    // force the normal to point away from the centre so the fade is sane.
    if (normal.dot(outward) < 0) normal.negate();

    return {
      id: part.id,
      callout: part.callout,
      name: part.name,
      system: part.system,
      position: hit.point.clone(),
      normal,
    };
  });
}

const projected = new Vector3();

/** Projects a point in normalized model space to CSS pixels within the canvas. */
export function projectToScreen(
  point: Vector3,
  camera: Camera,
  width: number,
  height: number,
): { x: number; y: number; behind: boolean } {
  projected.copy(point).project(camera);
  return {
    x: (projected.x * 0.5 + 0.5) * width,
    y: (-projected.y * 0.5 + 0.5) * height,
    behind: projected.z > 1,
  };
}

/**
 * Picks the balloon nearest a click by projecting all of them to 2D, rather
 * than raycasting the mesh. Cost is a handful of matrix multiplies no matter
 * how dense the model is, and it lets a click near a balloon count as a hit
 * even when the balloon sits on a thin or awkward surface.
 *
 * `facing` carries each balloon's current visibility, written by the renderer,
 * so picking and drawing agree exactly — you cannot click something that
 * faded out behind the block or got cut away by the section plane.
 */
export function pickAnchor(
  x: number,
  y: number,
  anchors: Anchor[],
  facing: Float32Array,
  camera: Camera,
  width: number,
  height: number,
  radiusPx = PICK_RADIUS_PX,
): Anchor | null {
  let best: Anchor | null = null;
  let bestDist = radiusPx * radiusPx;

  for (let i = 0; i < anchors.length; i++) {
    if (facing[i] < 0.25) continue;
    const s = projectToScreen(anchors[i].position, camera, width, height);
    if (s.behind) continue;
    const dx = s.x - x;
    const dy = s.y - y;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = anchors[i];
    }
  }
  return best;
}

/* ------------------------------------------------------------ glyphs */

const glyphCache = new Map<number, CanvasTexture>();

/**
 * Renders a callout number to a small canvas so the balloon shader can stamp
 * it. Cached per number and coloured in the shader, so state changes never
 * touch the texture.
 */
export function glyphTexture(n: number): CanvasTexture {
  const cached = glyphCache.get(n);
  if (cached) return cached;

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `500 ${n > 9 ? 52 : 60}px "IBM Plex Mono", ui-monospace, monospace`;
  ctx.fillText(String(n), size / 2, size / 2 + 2);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 4;
  glyphCache.set(n, texture);
  return texture;
}
