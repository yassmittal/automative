"use client";

import { Color, DoubleSide, ShaderMaterial, type Texture } from "three";

/**
 * The callout balloon: a camera-facing disc that holds a constant size in
 * pixels no matter how far the camera orbits out, with the callout number
 * stamped into it.
 *
 * Size is held constant in the vertex shader rather than by rescaling the
 * mesh on the CPU each frame, so the balloons stay rock steady during an
 * orbit. Anti-aliasing width is derived from the known pixel size instead of
 * screen-space derivatives, which keeps the edge clean at any zoom without
 * needing a derivatives extension.
 */
const vertex = /* glsl */ `
  uniform float uPixelSize;
  uniform float uViewportHeight;
  uniform float uFovScale;
  uniform float uEmphasis;

  varying vec2 vUv;

  void main() {
    vUv = uv;

    // Collapse the quad to the anchor point, then expand it in view space so
    // it always faces the camera.
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float dist = max(-mv.z, 0.001);
    float unitsPerPixel = (dist * uFovScale) / uViewportHeight;

    float px = uPixelSize * (1.0 + uEmphasis * 0.16);
    mv.xy += position.xy * px * unitsPerPixel;

    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D uGlyph;
  uniform vec3 uRing;
  uniform vec3 uFill;
  uniform vec3 uInk;
  uniform float uOpacity;
  uniform float uPixelSize;
  uniform float uEmphasis;
  uniform float uPulse;

  varying vec2 vUv;

  const float R  = 0.60;   // balloon radius inside the quad
  // The ring is what carries the system colour, and at 0.085 of the quad it
  // was a hairline that read as grey against a bright casting. Thick enough to
  // hold its hue, thin enough to still look drawn rather than printed.
  const float TH = 0.115;  // ring thickness

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float d = length(p);

    // The quad is exactly uPixelSize pixels across, so one pixel is
    // 2/uPixelSize in this space. Feather over roughly 1.4px.
    float aa = (2.0 / uPixelSize) * 1.4;

    float disc  = 1.0 - smoothstep(R - aa, R + aa, d);
    float inner = 1.0 - smoothstep(R - TH - aa, R - TH + aa, d);
    float ring  = clamp(disc - inner, 0.0, 1.0);

    // A second ring that blooms outward for hover, selection and quiz reveal.
    float outerR = R + 0.14 + uPulse * 0.22;
    float outerDisc  = 1.0 - smoothstep(outerR - aa, outerR + aa, d);
    float outerInner = 1.0 - smoothstep(outerR - 0.05 - aa, outerR - 0.05 + aa, d);
    float outerRing  = clamp(outerDisc - outerInner, 0.0, 1.0) * uEmphasis;

    // Zooming the glyph UVs shrinks the number so it sits inside the ring.
    vec2 gUv = (vUv - 0.5) / 0.80 + 0.5;
    float glyph = 0.0;
    if (gUv.x > 0.0 && gUv.x < 1.0 && gUv.y > 0.0 && gUv.y < 1.0) {
      glyph = texture2D(uGlyph, gUv).a;
    }

    // The ring is the only part of the balloon carrying which system the part
    // belongs to, so it is the last thing to go. Fading the white disc faster
    // than the coloured ring keeps eight hues apart at the 45% opacity a
    // balloon sits at while something else is selected — flat-fading all of it
    // turns the darker systems into the same mud at that point.
    float fillFade = uOpacity * uOpacity;
    float ringFade = pow(uOpacity, 0.6);

    vec3 color = uFill;
    float alpha = inner * fillFade;

    color = mix(color, uInk, glyph * inner);
    color = mix(color, uRing, ring);
    alpha = max(alpha, ring * ringFade);

    color = mix(color, uRing, outerRing);
    alpha = max(alpha, outerRing * (0.75 - uPulse * 0.45) * ringFade);

    if (alpha < 0.004) discard;

    gl_FragColor = vec4(color, alpha);

    // A ShaderMaterial writes gl_FragColor straight out — none of the output
    // conversion a built-in material gets is applied for us. Three has already
    // converted every Color uniform from sRGB into the linear working space,
    // so without this the balloons render as the *linear* value of their hue:
    // markedly darker and more saturated than the same token in the DOM. That
    // mismatch is invisible until you hold the legend and the model side by
    // side, which is exactly when it matters.
    #include <colorspace_fragment>
  }
`;

export function createBalloonMaterial(glyph: Texture) {
  return new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      uGlyph: { value: glyph },
      // Neutral to start with. The real colours are the system's own and are
      // lerped in per frame by Callouts — see LOOKS there.
      uRing: { value: new Color("#5a6268") },
      uFill: { value: new Color("#fcfcfb") },
      uInk: { value: new Color("#14181c") },
      uOpacity: { value: 1 },
      uPixelSize: { value: 30 },
      uViewportHeight: { value: 800 },
      uFovScale: { value: 1 },
      uEmphasis: { value: 0 },
      uPulse: { value: 0 },
    },
    transparent: true,
    // Occlusion is handled by the facing fade, not the depth buffer — a
    // balloon on the visible side should never be swallowed by a rib of the
    // casting sitting a millimetre in front of it.
    depthTest: false,
    depthWrite: false,
    side: DoubleSide,
    toneMapped: false,
  });
}
