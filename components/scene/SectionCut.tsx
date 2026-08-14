"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { BufferGeometry, Float32BufferAttribute, Mesh, Plane, Vector3 } from "three";
import { CUT } from "@/content/palette";
import { applyClipping } from "@/lib/useNormalizedModel";
import { useAtlas } from "@/lib/store";

/**
 * Sweeps a single clipping plane through the model so you can see inside it.
 *
 * One plane assigned to the one shared material is all it takes — the model
 * is already double-sided, so the interior walls render properly instead of
 * showing as holes. The orange frame marks where the cut is taken, the way a
 * section line is marked on a drawing.
 */
export function SectionCut({
  meshes,
  size,
  cutX,
}: {
  meshes: Mesh[];
  size: Vector3;
  /** Mirrors the plane's x so the callouts can fade with it. */
  cutX: React.RefObject<number | null>;
}) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const section = useAtlas((s) => s.section);
  const sectionOn = useAtlas((s) => s.sectionOn);

  const maxX = size.x / 2;
  const minX = -size.x / 2;

  // Keeps everything with x <= constant.
  const plane = useMemo(() => new Plane(new Vector3(-1, 0, 0), maxX), [maxX]);
  const frame = useRef<import("three").LineSegments>(null);
  const progress = useRef({ value: 0 });

  useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);

  useEffect(() => {
    applyClipping(meshes, [plane]);
    return () => applyClipping(meshes, []);
  }, [meshes, plane]);

  // Smooth the slider rather than snapping to it, and give the toggle a real
  // sweep. Short enough that dragging still feels directly connected.
  useEffect(() => {
    const target = sectionOn ? section : 0;
    const tween = gsap.to(progress.current, {
      value: target,
      duration: 0.28,
      ease: "power2.out",
      overwrite: true,
      onUpdate: invalidate,
      onComplete: invalidate,
    });
    return () => void tween.kill();
  }, [section, sectionOn, invalidate]);

  const geometry = useMemo(() => {
    const y = size.y / 2;
    const z = size.z / 2;
    const corners = [
      [-y, -z],
      [y, -z],
      [y, z],
      [-y, z],
    ];
    const points: number[] = [];
    for (let i = 0; i < 4; i++) {
      const a = corners[i];
      const b = corners[(i + 1) % 4];
      points.push(0, a[0], a[1], 0, b[0], b[1]);
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(points, 3));
    return g;
  }, [size]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    const t = progress.current.value;
    // A hair past maxX at rest, so nothing is clipped when the cut is off.
    const x = maxX + 0.001 + t * (minX - maxX - 0.001);
    plane.constant = x;
    cutX.current = t > 0.002 ? x : null;

    const node = frame.current;
    if (node) {
      node.visible = t > 0.002;
      node.position.x = x;
    }
  });

  return (
    <lineSegments ref={frame} geometry={geometry} visible={false} renderOrder={5}>
      <lineBasicMaterial color={CUT} transparent opacity={0.85} depthTest={false} />
    </lineSegments>
  );
}
