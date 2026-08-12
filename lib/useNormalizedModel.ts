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

/** Every module is rescaled to this size on its longest axis, so a second
 *  module with a completely different native scale still frames identically
 *  and its authored callout coordinates stay comparable. */
export const FIT_SIZE = 3.8;

export type NormalizedModel = {
  /** Ready to drop into the scene inside the normalization group. */
  object: Object3D;
  /** Applied to the inner group: raw model units -> normalized units. */
  scale: number;
  /** Applied after scaling to sit the model's centre on the origin. */
  offset: Vector3;
  /** Half the diagonal of the normalized bounds. Drives camera clamps. */
  radius: number;
  /** Normalized extents, used to sweep the section plane edge to edge. */
  size: Vector3;
  /** Every mesh in the model, for raycasting and clipping-plane assignment. */
  meshes: Mesh[];
};

/**
 * Loads a GLB and works out the transform that centres and rescales it.
 *
 * The transform is *not* baked into the geometry — it is returned so the
 * caller can put it on a wrapper group. Callouts then live as siblings of
 * that group in normalized space, which is what makes authored coordinates
 * readable numbers (~ -2..2) instead of whatever the artist happened to
 * model in.
 */
export function useNormalizedModel(url: string): NormalizedModel {
  // Second arg turns on the Meshopt decoder, which our GLBs are compressed with.
  const { scene } = useGLTF(url, true);

  return useMemo(() => {
    // useGLTF caches by url; clone so two mounts can't fight over one graph.
    const object = scene.clone(true);

    const box = new Box3().setFromObject(object);
    const rawSize = box.getSize(new Vector3());
    const rawCenter = box.getCenter(new Vector3());

    const scale = FIT_SIZE / Math.max(rawSize.x, rawSize.y, rawSize.z);
    const offset = rawCenter.clone().multiplyScalar(-scale);
    const size = rawSize.clone().multiplyScalar(scale);

    // The source model is a single untextured casting sharing one material.
    // Give it a proper machined-aluminium response so the studio environment
    // has something to reflect — without this it renders as flat grey putty.
    const material = new MeshStandardMaterial({
      color: "#b6bab4",
      metalness: 0.72,
      roughness: 0.38,
      envMapIntensity: 1.15,
    });

    const meshes: Mesh[] = [];
    object.traverse((child) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      mesh.material = material;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      meshes.push(mesh);
    });

    // Bake the fit onto the loaded object itself and flush the matrices now,
    // rather than wrapping it in a transformed group at render time. Callout
    // snapping raycasts these meshes before React has mounted anything, so
    // their world matrices have to be correct already — and with the fit on
    // the object, world space and normalized space are the same space.
    object.scale.setScalar(scale);
    object.position.copy(offset);
    object.updateMatrixWorld(true);

    return {
      object,
      scale,
      offset,
      radius: size.length() / 2,
      size,
      meshes,
    };
  }, [scene]);
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
