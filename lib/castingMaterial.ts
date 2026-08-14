"use client";

import { Color, MeshStandardMaterial, Vector3 } from "three";

/**
 * What a piece of the casting is currently being told to do.
 *
 * Held as a shared uniforms object rather than as material properties because
 * `applyClipping` flips `needsUpdate`, which recompiles the program and re-runs
 * `onBeforeCompile`. Handing the same objects back each time is what keeps both
 * effects alive across a section-cut toggle.
 */
export type CastingUniforms = {
  /* The focus wash: a spotlight on the callout point being read. */
  uFocusPos: { value: Vector3 };
  uFocusColor: { value: Color };
  uFocusAmount: { value: number };
  uFocusRadius: { value: number };

  /* The part highlight: this whole mesh *is* the part being read. */
  uHighlightColor: { value: Color };
  uHighlightAmount: { value: number };
};

function createUniforms(): CastingUniforms {
  return {
    uFocusPos: { value: new Vector3() },
    uFocusColor: { value: new Color("#7dd8ff") },
    uFocusAmount: { value: 0 },
    uFocusRadius: { value: 0.8 },
    uHighlightColor: { value: new Color("#7dd8ff") },
    uHighlightAmount: { value: 0 },
  };
}

/**
 * The casting.
 *
 * These models arrive untextured, with no UVs and usually a single merged mesh,
 * so every bit of colour the metal has must come from what it reflects. That is
 * why it is nearly a mirror: at this metalness the base colour only tints the
 * specular, and the studio in Stage.tsx supplies the rest — a warm flank and a
 * cold flank, the way a real casting photographs.
 *
 * Two effects sit on top of that, and the difference between them is the
 * difference between what the model knows and what it does not:
 *
 * - **The wash** is a spotlight on an authored point. It makes no claim about
 *   where a part begins or ends, because on a merged casting nothing can. Its
 *   radius is deliberately tight for exactly that reason: widen it and it
 *   starts implying a boundary the geometry cannot support.
 * - **The highlight** lights an entire mesh, and is only ever used on the few
 *   models whose meshes are the parts. There the boundary is real, so claiming
 *   it is honest — and far more useful than a spotlight.
 */
export function createCastingMaterial(): {
  material: MeshStandardMaterial;
  uniforms: CastingUniforms;
} {
  const uniforms = createUniforms();

  const material = new MeshStandardMaterial({
    color: "#c6cac7",
    // Cast and machined, not chromed. Past about 0.8 metalness with this
    // roughness the model turns into a mirror, and a mirror mostly reflects
    // the empty black between the studio panels — it went dark and glassy and
    // stopped reading as a figure in a manual.
    metalness: 0.8,
    roughness: 0.38,
    envMapIntensity: 1.5,
  });

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vCastingWorld;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvCastingWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vCastingWorld;
        uniform vec3 uFocusPos;
        uniform vec3 uFocusColor;
        uniform float uFocusAmount;
        uniform float uFocusRadius;
        uniform vec3 uHighlightColor;
        uniform float uHighlightAmount;`,
      )
      // After opaque_fragment and before tone mapping, so both effects mix in
      // linear light and get tone-mapped along with everything else. Scaling
      // each tint by the pixel's own luminance keeps the casting's highlights
      // and shadows — it colours the metal rather than painting over it.
      .replace(
        "#include <opaque_fragment>",
        `#include <opaque_fragment>
        float castingLum = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));

        if (uFocusAmount > 0.001) {
          float fd = distance(vCastingWorld, uFocusPos);
          float fw = 1.0 - smoothstep(uFocusRadius * 0.22, uFocusRadius, fd);
          fw *= uFocusAmount;
          vec3 tint = uFocusColor * (0.24 + 1.25 * castingLum);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, tint, fw * 0.6);
        }

        if (uHighlightAmount > 0.001) {
          vec3 tint = uHighlightColor * (0.26 + 1.15 * castingLum);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, tint, uHighlightAmount * 0.62);
        }`,
      );
  };

  return { material, uniforms };
}
