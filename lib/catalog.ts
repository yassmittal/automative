/**
 * The one way the app asks about content.
 *
 * Every component reads the atlas through this module rather than importing
 * `content/` directly. That keeps two things true: the derived facts — figure
 * numbers, which systems a plate uses, where a model file lives — are computed
 * once here instead of being re-derived slightly differently in four
 * components, and the source of the content can change without the UI noticing.
 *
 * Today the source is typed TypeScript compiled into the bundle. If it ever
 * becomes an API, this file is what changes.
 */

import { CHAPTERS, getChapter } from "@/content/chapters";
import { MODEL_CREDITS } from "@/content/generated/modelCredits";
import { ATLAS_MODULES } from "@/content/modules";
import { SYSTEMS, SYSTEM_ORDER } from "@/content/systems";
import type {
  Chapter,
  ModelCredit,
  Module,
  Part,
  SystemId,
} from "@/content/types";

/** A module plus everything about it the UI would otherwise have to work out. */
export type CatalogEntry = {
  module: Module;
  /** "FIG. 3" — the module's position in the catalog, not a stored field. */
  figure: string;
  chapter: Chapter;
  /** Path to the GLB under public/. */
  modelUrl: string;
  credit: ModelCredit;
  /** Systems this plate actually uses, in the palette's reading order. */
  systems: SystemId[];
  partCount: number;
};

function buildModelUrl(modelSlug: string): string {
  return `/models/${modelSlug}.glb`;
}

function findCredit(modelSlug: string): ModelCredit {
  const credit = MODEL_CREDITS[modelSlug];
  if (!credit) {
    throw new Error(
      `No credit recorded for model "${modelSlug}". Add it to ` +
        `scripts/modelManifest.ts and run \`npm run models:sync\`.`,
    );
  }
  return credit;
}

/** The systems a module uses, ordered as the palette orders them. */
export function listSystemsUsedBy(module: Module): SystemId[] {
  const used = new Set(module.parts.map((part) => part.system));
  return SYSTEM_ORDER.filter((system) => used.has(system));
}

function toCatalogEntry(module: Module, index: number): CatalogEntry {
  return {
    module,
    figure: `FIG. ${index + 1}`,
    chapter: getChapter(module.chapter),
    modelUrl: buildModelUrl(module.modelSlug),
    credit: findCredit(module.modelSlug),
    systems: listSystemsUsedBy(module),
    partCount: module.parts.length,
  };
}

/** Built once at module load: the content is static, so this never changes. */
const CATALOG: CatalogEntry[] = ATLAS_MODULES.map(toCatalogEntry);

const CATALOG_BY_MODULE_ID = new Map(
  CATALOG.map((entry) => [entry.module.id, entry]),
);

export function listCatalogEntries(): CatalogEntry[] {
  return CATALOG;
}

export function findCatalogEntry(moduleId: string): CatalogEntry | undefined {
  return CATALOG_BY_MODULE_ID.get(moduleId);
}

/** Throws rather than returning undefined, for callers that cannot continue. */
export function getCatalogEntry(moduleId: string): CatalogEntry {
  const entry = CATALOG_BY_MODULE_ID.get(moduleId);
  if (!entry) throw new Error(`Unknown module: ${moduleId}`);
  return entry;
}

export function listModuleIds(): string[] {
  return CATALOG.map((entry) => entry.module.id);
}

/** Chapters that actually contain a module, each with its entries. */
export function listChaptersWithEntries(): {
  chapter: Chapter;
  entries: CatalogEntry[];
}[] {
  return CHAPTERS.map((chapter) => ({
    chapter,
    entries: CATALOG.filter((entry) => entry.module.chapter === chapter.id),
  })).filter(({ entries }) => entries.length > 0);
}

export function findPart(module: Module, partId: string): Part | undefined {
  return module.parts.find((part) => part.id === partId);
}

/* ----------------------------------------------------------------- search */

/** A part, with enough context to be shown outside its own plate. */
export type PartSearchResult = {
  part: Part;
  entry: CatalogEntry;
};

/**
 * Substring search across every part in the atlas.
 *
 * Deliberately not fuzzy and deliberately not indexed. A few hundred parts is
 * far too little to justify either — a linear scan over this much text is
 * imperceptible, and an approximate match on a technical term is more likely to
 * hide the right answer than to find it.
 */
export function searchParts(query: string, limit = 12): PartSearchResult[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];

  const results: PartSearchResult[] = [];

  for (const entry of CATALOG) {
    for (const part of entry.module.parts) {
      const haystack = `${part.name} ${SYSTEMS[part.system].label} ${part.summary}`;
      if (haystack.toLowerCase().includes(needle)) {
        results.push({ part, entry });
      }
    }
  }

  // A name match is what the user meant; a match buried in the summary is a
  // consolation prize, so it sorts below.
  return results
    .sort((a, b) => {
      const aInName = a.part.name.toLowerCase().includes(needle) ? 0 : 1;
      const bInName = b.part.name.toLowerCase().includes(needle) ? 0 : 1;
      return aInName - bInName;
    })
    .slice(0, limit);
}

/**
 * Every pair of systems that share a plate.
 *
 * The palette has to keep these pairs distinguishable; systems that never
 * appear together do not constrain each other, which is what makes eleven
 * systems fit on a wheel that could not hold eleven mutually distinct hues.
 * Used by `npm run palette:check`.
 */
export function listCoOccurringSystemPairs(): [SystemId, SystemId][] {
  const pairs = new Set<string>();

  for (const entry of CATALOG) {
    const systems = entry.systems;
    for (let i = 0; i < systems.length; i++) {
      for (let j = i + 1; j < systems.length; j++) {
        pairs.add([systems[i], systems[j]].sort().join("|"));
      }
    }
  }

  return [...pairs].map((key) => key.split("|") as [SystemId, SystemId]);
}
