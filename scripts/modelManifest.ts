/**
 * Every 3D model the atlas ships, and where it came from.
 *
 * This file is the only place a model's origin is written down. `npm run
 * models:sync` reads it, pulls each model from Sketchfab, decimates and
 * compresses it into `public/models/<slug>.glb`, and regenerates
 * `content/generated/modelCredits.ts` with the attribution the UI displays.
 *
 * Adding a module to the atlas starts here: one entry, one sync, then write
 * the module's parts in `content/modules/`.
 */

export type ModelManifestEntry = {
  /**
   * Filename stem under `public/models`, and the key a module uses to find
   * its credit. Kebab-case, matches the module id it belongs to.
   */
  slug: string;

  /** Sketchfab model uid — the last path segment of the model's page URL. */
  sketchfabUid: string;

  /**
   * Upper bound on triangles in the shipped file. Anything heavier is
   * decimated down to it. Photogrammetry scans in this collection arrive at
   * one to seven million triangles, which no browser should be asked to
   * download, let alone draw.
   */
  triangleBudget: number;

  /**
   * True when the model's sub-meshes carry real part names ("Disc",
   * "Caliper") rather than exporter noise ("Object_2", "New_Game_Object_mat0").
   *
   * Named meshes are worth protecting: a part can bind to them and get a true
   * highlight over its actual geometry instead of a balloon floating at an
   * authored point. So these models skip the merge pass that would otherwise
   * collapse them into one nameless mesh — they trade draw calls for the
   * ability to say precisely where a part is.
   *
   * Most of the collection is scans and game exports, where the names mean
   * nothing and merging is a free win.
   */
  hasNamedPartMeshes?: boolean;

  /**
   * Override how far decimation may move the surface, as a fraction of model
   * size. Raise it when a dense scan refuses to reach its triangle budget;
   * lower it when a model's fine detail is the point. Defaults to
   * DEFAULT_SIMPLIFY_ERROR.
   */
  simplifyError?: number;
};

export const MODEL_MANIFEST: ModelManifestEntry[] = [
  {
    slug: "ls-v8",
    sketchfabUid: "6e920e47959d4da797eff437beeaa3f3",
    triangleBudget: 90_000,
  },
  {
    slug: "brake-assembly",
    sketchfabUid: "d36d43ad176a45a18095c04b1754ea79",
    triangleBudget: 130_000,
    hasNamedPartMeshes: true,
  },
  {
    slug: "turbocharger",
    sketchfabUid: "f44b6ff9974d4d01bc5b672cf993a636",
    triangleBudget: 110_000,
  },
  {
    // "RWD car suspension/chassis" rather than the collection's "4x4
    // Independent RH Front Suspension", which is the better-looking model but
    // is licensed CC Attribution-NonCommercial. Everything shipped here is
    // Free Standard or plain CC Attribution, so the atlas stays free to use
    // commercially if it ever needs to be.
    slug: "suspension-chassis",
    sketchfabUid: "108faf69976747c09a21968727a13255",
    triangleBudget: 70_000,
  },
  {
    slug: "cylinder-head",
    sketchfabUid: "d9d69a680bf240a7a6f77038530122cc",
    triangleBudget: 110_000,
  },
];

export function findManifestEntry(slug: string): ModelManifestEntry | undefined {
  return MODEL_MANIFEST.find((entry) => entry.slug === slug);
}
