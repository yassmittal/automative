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

export const SYSTEMS: Record<
  SystemId,
  { label: string; blurb: string; color: string; soft: string; ink: string }
> = {
  air: {
    label: "Air path",
    blurb: "Getting air into the cylinders",
    color: "#0ea5e9",
    soft: "#dff5ff",
    ink: "#075985",
  },
  "fuel-ignition": {
    label: "Fuel & ignition",
    blurb: "Lighting the mixture at the right moment",
    color: "#f59e0b",
    soft: "#fff2cc",
    ink: "#92400e",
  },
  rotating: {
    label: "Rotating assembly",
    blurb: "Turning combustion into torque",
    color: "#8b5cf6",
    soft: "#efe7ff",
    ink: "#5b21b6",
  },
  cooling: {
    label: "Cooling",
    blurb: "Carrying waste heat away",
    color: "#06b6d4",
    soft: "#d8fbff",
    ink: "#0e7490",
  },
  lubrication: {
    label: "Lubrication",
    blurb: "Keeping metal off metal",
    color: "#22c55e",
    soft: "#dcfce7",
    ink: "#166534",
  },
  accessory: {
    label: "Accessory drive",
    blurb: "The bolt-on parts the crankshaft spins",
    color: "#f97316",
    soft: "#ffedd5",
    ink: "#9a3412",
  },
  exhaust: {
    label: "Exhaust",
    blurb: "Getting burnt gas out",
    color: "#ef4444",
    soft: "#fee2e2",
    ink: "#991b1b",
  },
  driveline: {
    label: "Driveline",
    blurb: "Handing power to the transmission",
    color: "#d946ef",
    soft: "#fae8ff",
    ink: "#86198f",
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
