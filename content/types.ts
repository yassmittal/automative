/** A single labelled component on a module's artwork. */
export type Part = {
  /** Stable slug. Used for quiz answers and deep links. */
  id: string;
  /** Callout number on the plate. Keys the legend to the balloon, exactly
   *  like a figure in a factory service manual. Assigned by reading order
   *  in the legend, so it stays meaningful rather than decorative. */
  callout: number;
  name: string;
  /** Which system the part belongs to. Groups the legend. */
  system: SystemId;
  /** Hand-authored point in normalized model space (see useNormalizedModel).
   *  Snapped onto the mesh surface once on load, so a near-miss still lands. */
  position: [number, number, number];
  /** One line, plain language: what this part does. */
  summary: string;
  /** One thing worth knowing that isn't obvious from the name. */
  fact: string;
  /** What you notice when it is failing. */
  symptoms: string[];
  /** Rough service expectation. */
  service: string;
  /** True when `service` or `fact` contains a figure that should be checked
   *  against a real service manual before this ships as fact. Surfaced in
   *  VERIFY.md — never silently published as gospel. */
  needsVerify?: boolean;
};

export type SystemId =
  | "air"
  | "fuel-ignition"
  | "rotating"
  | "cooling"
  | "lubrication"
  | "accessory"
  | "exhaust"
  | "driveline";

/** How one system is drawn, everywhere it appears. */
export type SystemLook = {
  label: string;
  blurb: string;
  /** The mark: legend rule, balloon ring, leader line. ≥ 4.5:1 on paper, so
   *  paper-white text also sits on it. */
  color: string;
  /** Tint behind a row or a card header. `ink` reads ≥ 6:1 on it. */
  soft: string;
  /** Text and the ring of an emphasised balloon. ≥ 7.9:1 on paper. */
  ink: string;
};

/**
 * One source of truth for the system colours.
 *
 * These are *not* free choices. Green and red are reserved for quiz verdicts
 * and orange for the section cut, which leaves the wheel from 207° round to
 * 356° plus a brass island at 83° — seven cool slots at roughly 24° spacing,
 * and the brass. Lightness carries what the cramped hue spacing cannot: the
 * set holds a worst-pair CVD ΔE of 8.1 across all 28 pairs (OKLab ×100,
 * Machado 2009 protan/deutan at severity 1.0), against a target of 8.
 *
 * Colour is never the only channel — the callout number and the legend group
 * heading say the same thing without it. See README.
 *
 * Mirrored by hand into the balloon shader, which is GLSL and cannot read
 * these: `LOOKS` in components/scene/Callouts.tsx.
 */
export const SYSTEMS: Record<SystemId, SystemLook> = {
  air: {
    label: "Air path",
    blurb: "Getting air into the cylinders",
    color: "#017f97",
    soft: "#c2e7f2",
    ink: "#005768",
  },
  "fuel-ignition": {
    label: "Fuel & ignition",
    blurb: "Lighting the mixture at the right moment",
    color: "#7030c1",
    soft: "#e3d9ff",
    ink: "#5e1da8",
  },
  rotating: {
    label: "Rotating assembly",
    blurb: "Turning combustion into torque",
    color: "#5a105d",
    soft: "#f5d3f5",
    ink: "#5a105d",
  },
  cooling: {
    label: "Cooling",
    blurb: "Carrying waste heat away",
    color: "#0a4f86",
    soft: "#c9e3fe",
    ink: "#0a4f86",
  },
  lubrication: {
    label: "Lubrication",
    blurb: "Keeping metal off metal",
    color: "#916f02",
    soft: "#eddebc",
    ink: "#614900",
  },
  accessory: {
    label: "Accessory drive",
    blurb: "The bolt-on parts the crankshaft spins",
    color: "#3302a2",
    soft: "#d9ddff",
    ink: "#3302a2",
  },
  exhaust: {
    label: "Exhaust",
    blurb: "Getting burnt gas out",
    color: "#9d0f5b",
    soft: "#ffd1e1",
    ink: "#8d0050",
  },
  driveline: {
    label: "Driveline",
    blurb: "Handing power to the transmission",
    color: "#3167ed",
    soft: "#d1e0fe",
    ink: "#0f3bb7",
  },
};

export type Module = {
  id: string;
  /** Figure number on the plate header. */
  figure: string;
  name: string;
  subtitle: string;
  modelUrl: string;
  parts: Part[];
  credit: { author: string; url: string; license: string };
};
