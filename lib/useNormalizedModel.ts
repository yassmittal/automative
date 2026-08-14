"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import {
  Box3,
  Mesh,
  MeshStandardMaterial,
  Vector3,
  type Object3D,
  type Plane,
} from "three";
import { createCastingMaterial, type CastingUniforms } from "./castingMaterial";
import type { Part } from "@/content/types";

/** Every module is rescaled to this size on its longest axis, so a model with
 *  a completely different native scale still frames identically and its
 *  authored callout coordinates stay comparable. */
export const FIT_SIZE = 3.8;

export type NormalizedModel = {
  /** Ready to drop into the scene. */
  object: Object3D;
  /** Half the diagonal of the normalized bounds. Drives camera clamps. */
  radius: number;
  /** Normalized extents, used to sweep the section plane edge to edge. */
  size: Vector3;
  /** Every mesh in the model, for raycasting and clipping-plane assignment. */
  meshes: Mesh[];
  /** Drives the system-coloured wash on the casting. See FocusWash. */
  casting: CastingUniforms;
  /**
   * Per-part uniforms, for the few parts bound to their own named meshes.
   * Empty for the usual case of one merged casting with nothing to bind to.
   */
  uniformsByPartId: Map<string, CastingUniforms>;
  /**
   * How big each mesh-bound part actually is, in normalized units.
   *
   * The camera needs this or it frames a point rather than a part: a brake disc
   * that *is* most of its model has to be viewed from much further back than a
   * spark plug bore, and a single focus distance tuned for one puts your nose
   * against the other.
   */
  radiusByPartId: Map<string, number>;
};

/**
 * Loads a GLB, centres and rescales it, and gives its meshes their materials.
 *
 * The fit is baked onto the loaded object rather than put on a wrapper group at
 * render time, because callout snapping raycasts these meshes before React has
 * mounted anything — their world matrices have to already be correct. With the
 * fit on the object, world space and normalized space are the same space, which
 * is what makes authored coordinates readable numbers (~ −2..2) instead of
 * whatever the artist happened to model in.
 *
 * `parts` is needed here, rather than being applied later, because a part bound
 * to named meshes needs those meshes to carry their *own* material instance —
 * a highlight is a uniform, and a uniform shared with the rest of the casting
 * would light the whole model up at once.
 */
export function useNormalizedModel(url: string, parts: Part[]): NormalizedModel {
  // Second arg turns on the Meshopt decoder, which our GLBs are compressed with.
  const { scene } = useGLTF(url, true);

  return useMemo(() => {
    // useGLTF caches by url; clone so two mounts can't fight over one graph.
    const object = scene.clone(true);

    const box = new Box3().setFromObject(object);
    const rawSize = box.getSize(new Vector3());
    const rawCenter = box.getCenter(new Vector3());

    const scale = FIT_SIZE / Math.max(rawSize.x, rawSize.y, rawSize.z);
    const size = rawSize.clone().multiplyScalar(scale);

    object.scale.setScalar(scale);
    object.position.copy(rawCenter.clone().multiplyScalar(-scale));
    object.updateMatrixWorld(true);

    const meshes: Mesh[] = [];
    const meshesByNodeName = new Map<string, Mesh[]>();

    object.traverse((child) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      meshes.push(mesh);

      const named = meshesByNodeName.get(mesh.name) ?? [];
      named.push(mesh);
      meshesByNodeName.set(mesh.name, named);
    });

    // One material for the casting at large, plus one per mesh-bound part.
    const { material: castingMaterial, uniforms: casting } =
      createCastingMaterial();

    const focusRadius = (size.length() / 2) * 0.17;
    casting.uFocusRadius.value = focusRadius;

    const uniformsByPartId = new Map<string, CastingUniforms>();
    const radiusByPartId = new Map<string, number>();
    const claimedMeshes = new Set<Mesh>();

    for (const part of parts) {
      const boundMeshes = (part.meshNodeNames ?? []).flatMap(
        (nodeName) => meshesByNodeName.get(nodeName) ?? [],
      );
      if (boundMeshes.length === 0) continue;

      const { material, uniforms } = createCastingMaterial();
      uniforms.uFocusRadius.value = focusRadius;

      const partBounds = new Box3();
      for (const mesh of boundMeshes) {
        mesh.material = material;
        claimedMeshes.add(mesh);
        partBounds.expandByObject(mesh);
      }

      uniformsByPartId.set(part.id, uniforms);
      radiusByPartId.set(
        part.id,
        partBounds.getSize(new Vector3()).length() / 2,
      );
    }

    for (const mesh of meshes) {
      if (!claimedMeshes.has(mesh)) mesh.material = castingMaterial;
    }

    return {
      object,
      radius: size.length() / 2,
      size,
      meshes,
      casting,
      uniformsByPartId,
      radiusByPartId,
    };
  }, [scene, parts]);
}

/** Points every material in the model at the shared section plane. */
export function applyClipping(meshes: Mesh[], planes: Plane[]) {
  for (const mesh of meshes) {
    const material = mesh.material as MeshStandardMaterial;
    material.clippingPlanes = planes;
    material.clipShadows = true;
    material.needsUpdate = true;
  }
}

export function preloadModel(url: string) {
  useGLTF.preload(url, true);
}
