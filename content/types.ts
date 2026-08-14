/**
 * The shape of everything the atlas teaches.
 *
 * Content lives as typed TypeScript rather than in a database: it is authored,
 * not user-generated, it changes when someone writes prose, and it benefits far
 * more from type checking and code review than from an admin panel. Everything
 * the UI reads goes through `lib/catalog.ts`, so if that ever stops being true
 * the source can move behind an API without a component noticing.
 */

/**
 * A functional system a part belongs to. This is the atlas's main idea: a part
 * is easier to remember as a member of a system that does one job than as a
 * lump of metal in a particular place.
 *
 * Colour follows this, not the module — a coolant hose is the cooling colour
 * whether you meet it on the V8 or on the cylinder head, so "all the blue ones
 * carry heat away" survives moving between plates.
 */
export type SystemId =
  // Engine systems
  | "air"
  | "fuel-ignition"
  | "rotating"
  | "cooling"
  | "lubrication"
  | "accessory"
  | "exhaust"
  | "driveline"
  // Running-gear systems
  | "braking"
  | "suspension"
  | "structure";

/** How one system is drawn, everywhere it appears. */
export type SystemLook = {
  label: string;
  /** One line on what the system is for, shown under the legend heading. */
  blurb: string;
  /** The mark: legend rule, balloon ring, leader line. */
  color: string;
  /** Tint behind a row or a card header. `ink` reads against it. */
  soft: string;
  /** Text, and the ring of an emphasised balloon. */
  ink: string;
  /**
   * The same hue lifted bright enough to read on the dark viewport. This is
   * what the balloon on the model wears; `color` is what the legend beside it
   * wears on paper. Two values because they sit on grounds 30 lightness points
   * apart, not because they are two different colours.
   */
  beacon: string;
};

/**
 * A chapter of the atlas — how modules are grouped for browsing, the way a
 * service manual is split into sections before it is split into figures.
 */
export type ChapterId = "engine" | "forced-induction" | "running-gear";

export type Chapter = {
  id: ChapterId;
  label: string;
  /** A sentence on what this chapter covers, shown on the catalog page. */
  blurb: string;
};

/** A single labelled component on a module's artwork. */
export type Part = {
  /** Stable slug. Used for quiz answers and deep links. Unique within a module. */
  id: string;
  /**
   * Callout number on the plate. Keys the legend to the balloon, exactly like
   * a figure in a factory service manual. Assigned by reading order in the
   * legend, so it stays meaningful rather than decorative.
   */
  callout: number;
  name: string;
  system: SystemId;
  /**
   * Hand-authored point in normalized model space (see useNormalizedModel).
   * Snapped onto the mesh surface once on load, so a near-miss still lands.
   *
   * Authored by clicking the model at `?authoring=1` — never typed by hand.
   */
  position: [number, number, number];
  /**
   * Mesh nodes in the GLB that *are* this part, when the model happens to name
   * them. Present on only a few models: most of the source library is scans
   * and game exports whose meshes are called things like `Object_2`.
   *
   * When present, the part can be highlighted over its real geometry instead of
   * only carrying a balloon. When absent, the balloon is the whole story — and
   * that is the honest answer, not a degraded one, because the model genuinely
   * does not know where the part ends.
   */
  meshNodeNames?: string[];
  /** One line, plain language: what this part does. */
  summary: string;
  /** One thing worth knowing that isn't obvious from the name. */
  fact: string;
  /** What you notice when it is failing. */
  symptoms: string[];
  /** Rough service expectation. */
  service: string;
  /**
   * Another module that shows this same part in detail on its own. Turns the
   * atlas from a set of separate plates into something you can follow: the
   * cylinder head on the V8 leads to the plate that is nothing but the head.
   */
  detailModuleId?: string;
  /**
   * True when `service` or `fact` contains a figure that should be checked
   * against a real service manual before this ships as fact. Surfaced in
   * VERIFY.md — never silently published as gospel.
   */
  needsVerify?: boolean;
};

/**
 * One plate of the atlas: a model, and every part called out on it.
 *
 * `figure` is deliberately absent — it is the module's position in the
 * catalog, derived in lib/catalog.ts, so inserting a module does not mean
 * renumbering the ones after it by hand.
 */
export type Module = {
  id: string;
  chapter: ChapterId;
  name: string;
  /** The specific thing this is, under the name. */
  subtitle: string;
  /** A sentence for the catalog card: why this plate is worth opening. */
  blurb: string;
  /**
   * Which GLB to load, by manifest slug. The file path and the attribution are
   * both derived from this, so neither can drift from what was actually built
   * by `npm run models:sync`.
   */
  modelSlug: string;
  /**
   * Which direction the plate opens from, as a camera direction in normalized
   * model space. The distance is always computed from the viewport, so only
   * the direction matters here.
   *
   * Defaults to a three-quarter view from above, which suits anything shaped
   * roughly like an engine. It is wrong often enough to be worth overriding:
   * a cylinder head keeps everything interesting on its underside, and opening
   * above it shows a plate with one visible callout out of seven.
   */
  openingView?: [number, number, number];
  parts: Part[];
};

/**
 * Where a model came from and what it cost, written by `npm run models:sync`
 * from the Sketchfab API. Never hand-edited — see scripts/modelManifest.ts.
 */
export type ModelCredit = {
  /** Matches the GLB filename stem under public/models. */
  slug: string;
  sourceName: string;
  authorName: string;
  authorProfileUrl: string;
  modelPageUrl: string;
  licenseLabel: string;
  /** Triangles as published, before our optimisation pass. */
  sourceTriangleCount: number;
  /** Triangles in the file the browser actually downloads. */
  shippedTriangleCount: number;
  shippedByteSize: number;
};
