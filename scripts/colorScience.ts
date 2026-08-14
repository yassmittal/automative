/**
 * The colour maths the palette tools share: how different two colours look,
 * and how they look to someone with colour vision deficiency.
 *
 * Build-time only — nothing here ships to the browser. `content/palette.ts` is
 * the runtime counterpart, and it only needs to go one way (OKLCH out to hex).
 */

/**
 * The standard the palette is held to, in one place, because it is enforced in
 * two: `palette:tune` searches for values that meet it and `palette:check`
 * proves the committed values still do. When those two drifted apart the tuner
 * happily reported success on a palette the checker then failed.
 */
export const PALETTE_STANDARD = {
  /**
   * Minimum perceptual distance (OKLab ×100) between two systems that share a
   * plate, under every vision mode.
   *
   * Eight was the target when there were eight systems, and it was met. Eleven
   * cannot reach it. That is a property of the colour wheel rather than of
   * effort: the search tops out just above seven, and every attempt to force it
   * higher buys the distance by draining saturation, returning a palette of
   * greys and dusty teals. The atlas already looked washed out; a more
   * measurably accessible version of that failure is not an improvement.
   *
   * So the floor is set at what eleven vivid systems actually hold, and the
   * shortfall is carried by the channels that do not depend on hue at all:
   * every balloon carries its callout number, and every legend row sits under a
   * named system heading. Colour is the fastest channel here, never the only
   * one. Committed palettes measure a worst constrained pair of about 7.0.
   */
  minSeparation: 6.8,
  /**
   * Extra separation the tuner aims for beyond the floor.
   *
   * Its results are rounded to three decimals when pasted into
   * `content/systems.ts`, and a palette searched to land exactly on the floor
   * lands just under it once rounded — the tuner reports success and the
   * checker then fails the committed values. Aiming slightly high absorbs that.
   */
  tuningMargin: 0.2,
  /**
   * Minimum hue gap in degrees between systems sharing a plate. Stops the
   * search "solving" separation with two purples of different lightness, which
   * measures as distinct and reads as a category and its sub-category.
   */
  minHueSpacing: 16,
  /** Body text. */
  minTextContrast: 4.5,
  /** Non-text marks: a legend rule, a balloon ring. */
  minMarkContrast: 3,
} as const;

export type Rgb = [number, number, number];

export function parseHex(hex: string): Rgb {
  const value = hex.replace("#", "");
  return [0, 2, 4].map(
    (offset) => parseInt(value.slice(offset, offset + 2), 16) / 255,
  ) as Rgb;
}

/** sRGB transfer function, undone. Every calculation below wants linear light. */
function toLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function linearize([r, g, b]: Rgb): Rgb {
  return [toLinear(r), toLinear(g), toLinear(b)];
}

function relativeLuminance(rgb: Rgb): number {
  const [r, g, b] = linearize(rgb);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(parseHex(foreground));
  const b = relativeLuminance(parseHex(background));
  const [lighter, darker] = a > b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * OKLab, which is what makes "how different are these two colours" a number
 * worth trusting. Euclidean distance in sRGB or HSL does not match what an eye
 * reports; in OKLab it roughly does.
 */
export function toOklab(rgb: Rgb): [number, number, number] {
  const [r, g, b] = linearize(rgb);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/**
 * Machado et al. (2009) colour vision deficiency simulation, at full severity.
 * Protanopia and deuteranopia together cover the overwhelming majority of
 * cases; tritanopia is rare but cheap to check, so it is here too.
 */
export const CVD_MATRICES: Record<string, number[][]> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

/** Every way of seeing the palette that it has to survive, "normal" included. */
export const VISION_MODES: { name: string; matrix: number[][] | null }[] = [
  { name: "normal", matrix: null },
  ...Object.entries(CVD_MATRICES).map(([name, matrix]) => ({ name, matrix })),
];

export function simulateCvd(rgb: Rgb, matrix: number[][]): Rgb {
  const linear = linearize(rgb);
  return matrix.map((row) =>
    Math.min(1, Math.max(0, row.reduce((sum, k, i) => sum + k * linear[i], 0))),
  ) as Rgb;
}

export function seenAs(hex: string, matrix: number[][] | null): Rgb {
  const rgb = parseHex(hex);
  return matrix ? simulateCvd(rgb, matrix) : rgb;
}

/** Perceptual distance on the 0–100 scale the README quotes. */
export function perceptualDistance(a: Rgb, b: Rgb): number {
  const [la, aa, ba] = toOklab(a);
  const [lb, ab, bb] = toOklab(b);
  return Math.hypot(la - lb, aa - ab, ba - bb) * 100;
}

/**
 * The worst any two of these colours look alike, across every vision mode.
 * This single number is what the palette is tuned against.
 */
export function worstSeparation(hexes: string[]): {
  distance: number;
  firstIndex: number;
  secondIndex: number;
  vision: string;
} {
  let worst = {
    distance: Infinity,
    firstIndex: 0,
    secondIndex: 0,
    vision: "normal",
  };

  for (const { name, matrix } of VISION_MODES) {
    const seen = hexes.map((hex) => seenAs(hex, matrix));
    for (let i = 0; i < seen.length; i++) {
      for (let j = i + 1; j < seen.length; j++) {
        const distance = perceptualDistance(seen[i], seen[j]);
        if (distance < worst.distance) {
          worst = { distance, firstIndex: i, secondIndex: j, vision: name };
        }
      }
    }
  }
  return worst;
}
