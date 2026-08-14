/**
 * The eleven systems, and the colour each one wears everywhere it appears.
 *
 * A system is the atlas's unit of meaning: a part is far easier to hold onto as
 * a member of a system that does one job than as a lump of metal in a
 * particular place. So the hue is not decoration — "all the blue ones carry
 * heat away" is a fact about the car, and it has to survive moving from the V8
 * plate to the cylinder-head plate unchanged.
 *
 * Each system declares a hue and a lightness shift. The four roles it wears are
 * derived from those by fixed recipes, so every system is lit identically and a
 * twelfth is two lines rather than an afternoon of eyedropper work.
 */

import { oklchToHex, RESERVED_CUT_HUE_RANGE } from "./palette";
import type { SystemId, SystemLook } from "./types";

/**
 * What a system declares. Everything else about its appearance is computed.
 */
export type SystemDefinition = {
  label: string;
  blurb: string;
  /** Degrees in OKLCH. Must sit outside the section cut's reserved band. */
  hue: number;
  /**
   * Nudges every role lighter (+) or darker (−).
   *
   * Eleven hues will not fit around a wheel that also has a band reserved for
   * the section cut — neighbours land about 30° apart, which at this chroma is
   * a perceptual distance of roughly 8, and colour vision deficiency pushes
   * some of those pairs below it. Alternating the shift between neighbours
   * separates them by lightness instead, which no form of colour blindness
   * takes away. This is the load-bearing field, not a stylistic one.
   */
  lightnessShift: number;
  /**
   * Scales how far from grey the system is drawn. Defaults to 1.
   */
  chromaScale?: number;
  /**
   * Holds `chromaScale` out of the tuner's reach. Set when a system's
   * saturation is carrying meaning rather than merely being available to
   * spend — see `structure`.
   */
  lockChroma?: boolean;
};

/* --------------------------------------------------------- role recipes */

/**
 * How each role is built from a system's hue.
 *
 * `lightnessShift` is applied at full strength to the mark, and damped for the
 * other three: the shift exists to separate neighbouring systems on the model
 * and in the legend, and applying it undamped to text would swing readability
 * around with it.
 *
 * - **color** — the mark on paper: legend rule, card header, leader line.
 * - **ink** — the same system set as text, dark enough to read at small sizes.
 * - **soft** — a wash behind a legend row or card header, with `ink` on top.
 * - **beacon** — what the balloon on the model wears. A mark tuned for white
 *   paper is far too dark against a near-black viewport, so the same hue is
 *   lifted well up the lightness axis. Two values because they sit on grounds
 *   thirty lightness points apart, not because they are two different colours.
 */
const ROLE_RECIPES = {
  color: { lightness: 0.55, shiftWeight: 1, chroma: 0.16 },
  ink: { lightness: 0.42, shiftWeight: 0.4, chroma: 0.13 },
  soft: { lightness: 0.93, shiftWeight: 0.15, chroma: 0.05 },
  beacon: { lightness: 0.8, shiftWeight: 0.4, chroma: 0.16 },
} as const;

type RoleName = keyof typeof ROLE_RECIPES;

function deriveRole(
  role: RoleName,
  { hue, lightnessShift, chromaScale = 1 }: SystemDefinition,
): string {
  const recipe = ROLE_RECIPES[role];
  return oklchToHex({
    lightness: recipe.lightness + lightnessShift * recipe.shiftWeight,
    chroma: recipe.chroma * chromaScale,
    hue,
  });
}

export function deriveLook(definition: SystemDefinition): SystemLook {
  return {
    label: definition.label,
    blurb: definition.blurb,
    color: deriveRole("color", definition),
    ink: deriveRole("ink", definition),
    soft: deriveRole("soft", definition),
    beacon: deriveRole("beacon", definition),
  };
}

/* ------------------------------------------------------------- the systems */

/**
 * Exported so `npm run palette:tune` can search over these values and
 * `npm run palette:check` can audit what they produce. Nothing at runtime
 * should read this — read SYSTEMS instead.
 */
export const SYSTEM_DEFINITIONS: Record<SystemId, SystemDefinition> = {
  lubrication: {
    label: "Lubrication",
    blurb: "Keeping metal off metal",
    hue: 95.8,
    lightnessShift: 0.111,
    chromaScale: 1.15,
  },
  driveline: {
    label: "Driveline",
    blurb: "Handing power to the transmission",
    hue: 116.9,
    lightnessShift: -0.112,
    chromaScale: 1.15,
  },
  suspension: {
    label: "Suspension & steering",
    blurb: "Keeping the tyres on the road",
    hue: 166.5,
    lightnessShift: -0.249,
    chromaScale: 1.15,
  },
  air: {
    label: "Air path",
    blurb: "Getting air into the cylinders",
    hue: 189.2,
    lightnessShift: -0.045,
    chromaScale: 0.52,
  },
  cooling: {
    label: "Cooling",
    blurb: "Carrying waste heat away",
    hue: 228.1,
    lightnessShift: 0.097,
    chromaScale: 1.14,
  },
  accessory: {
    label: "Accessory drive",
    blurb: "The bolt-on parts the crankshaft spins",
    hue: 295.5,
    lightnessShift: -0.25,
    chromaScale: 0.9,
  },
  "fuel-ignition": {
    label: "Fuel & ignition",
    blurb: "Lighting the mixture at the right moment",
    hue: 312.1,
    lightnessShift: -0.073,
    chromaScale: 1.15,
  },
  rotating: {
    label: "Rotating assembly",
    blurb: "Turning combustion into torque",
    hue: 328.2,
    lightnessShift: 0.039,
    chromaScale: 0.76,
  },
  braking: {
    label: "Braking",
    blurb: "Turning speed back into heat",
    hue: 352.1,
    lightnessShift: -0.168,
    chromaScale: 1.15,
  },
  exhaust: {
    label: "Exhaust",
    blurb: "Getting burnt gas out",
    hue: 13.8,
    lightnessShift: -0.243,
    chromaScale: 1.15,
  },
  // The one deliberately quiet system. Structure is what everything else bolts
  // to, and a chassis rail claiming the same visual weight as the brake it
  // carries would be a lie about which one you are meant to be looking at. It
  // is also the pressure valve on a crowded wheel: dropping one system to near
  // grey buys the other ten room they would not otherwise have.
  structure: {
    label: "Structure",
    blurb: "The frame everything else hangs on",
    hue: 212.0,
    lightnessShift: 0.095,
    chromaScale: 0.22,
    lockChroma: true,
  },
};

function assertHueIsAllowed(id: SystemId, hue: number): void {
  const [start, end] = RESERVED_CUT_HUE_RANGE;
  if (hue >= start && hue <= end) {
    throw new Error(
      `System "${id}" sits at hue ${hue}, inside the ${start}–${end}° band ` +
        `reserved for the section cut. Pick another hue.`,
    );
  }
}

export const SYSTEMS: Record<SystemId, SystemLook> = Object.fromEntries(
  Object.entries(SYSTEM_DEFINITIONS).map(([id, definition]) => {
    assertHueIsAllowed(id as SystemId, definition.hue);
    return [id, deriveLook(definition)];
  }),
) as Record<SystemId, SystemLook>;

/** Reading order for legends and any list of systems. Matches SYSTEM_DEFINITIONS. */
export const SYSTEM_ORDER = Object.keys(SYSTEM_DEFINITIONS) as SystemId[];
