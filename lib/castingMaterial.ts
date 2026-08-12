"use client";

import { Color, MeshStandardMaterial, Vector3 } from "three";

/**
 * The focus wash: which point on the casting is currently being read, in what
 * colour, and how strongly. Written every frame by FocusWash.
 *
 * Held as a shared uniforms object rather than as material properties because
 * `applyClipping` flips `needsUpdate`, which recompiles the program and re-runs
 * `onBeforeCompile`. Handing the same objects back each time is what keeps the
 * wash alive across a section-cut toggle.
 */
export type FocusUniforms = {
  uFocusPos: { value: Vector3 };
  uFocusColor: { value: Color };
  uFocusAmount: { value: number };
  uFocusRadius: { value: number };
};

/**
 * The casting.
 *
 * The source model is one merged mesh with no UVs, no sub-parts and no
 * textures, so every bit of colour it has must come from what it reflects.
 * That is why it is nearly a mirror: at this metalness the base colour only
 * tints the specular, and the studio in Stage.tsx supplies the rest — a warm
 * flank and a cool flank, the way a real casting photographs.
 *
 * The wash on top is deliberately a *spotlight*, not a label. The model cannot
 * be partitioned honestly — one mesh, no part names — so nothing here claims a
 * boundary. It lights the neighbourhood of the authored callout point in that
 * part's system colour while you are reading it, and fades out again.
 */
export function createCastingMaterial(): {
  material: MeshStandardMaterial;
  focus: FocusUniforms;
} {
  const focus: FocusUniforms = {
    uFocusPos: { value: new Vector3() },
    uFocusColor: { value: new Color("#017f97") },
    uFocusAmount: { value: 0 },
    uFocusRadius: { value: 0.8 },
  };

  const material = new MeshStandardMaterial({
    color: "#c6cac7",
    // Cast and machined, not chromed. Past about 0.8 metalness with this
    // roughness the engine turns into a mirror, and a mirror mostly reflects
    // the empty black between the studio panels — it went dark and glassy and
    // stopped reading as a figure in a manual.
    metalness: 0.8,
    roughness: 0.38,
    envMapIntensity: 1.5,
  });

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, focus);

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
        uniform float uFocusRadius;`,
      )
      // After opaque_fragment and before tone mapping, so the wash is mixed in
      // linear light and gets tone-mapped along with everything else. Scaling
      // the tint by the pixel's own luminance keeps the casting's highlights
      // and shadows — it colours the metal rather than painting over it.
      .replace(
        "#include <opaque_fragment>",
        `#include <opaque_fragment>
        if (uFocusAmount > 0.001) {
          float fd = distance(vCastingWorld, uFocusPos);
          float fw = 1.0 - smoothstep(uFocusRadius * 0.22, uFocusRadius, fd);
          fw *= uFocusAmount;
          float lum = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
          vec3 tint = uFocusColor * (0.24 + 1.25 * lum);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, tint, fw * 0.6);
        }`,
      );
  };

  return { material, focus };
}
