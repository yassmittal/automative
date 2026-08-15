/**
 * Searches for hue and lightness values that keep every system distinguishable.
 *
 *   npm run palette:tune
 *
 * Eleven systems around a wheel that also has a band reserved for the section
 * cut leaves neighbours roughly 30° apart. That is enough for normal vision and
 * nowhere near enough under deuteranopia, where the red–green axis collapses
 * and a cyan and a magenta of the same lightness become the same colour. The
 * fix is to separate such pairs by lightness instead — but which pairs collide,
 * and by how much, is the product of 55 pairs across four vision models, and
 * moving one system to fix one collision creates another somewhere else.
 *
 * So it is searched rather than eyeballed. This prints the definitions to paste
 * back into `content/systems.ts`; `npm run palette:check` then proves the
 * pasted result holds. The search is here, the answer is committed — nothing
 * about the app's colours is decided at runtime.
 */

import {
  deriveLook,
  SYSTEM_DEFINITIONS,
  type SystemDefinition,
} from "../content/systems";
import {
  PAGE,
  RESERVED_CUT_HUE_RANGE,
  VIEWPORT,
  WIDGET,
} from "../content/palette";
import { listCoOccurringSystemPairs } from "../lib/catalog";
import {
  contrastRatio,
  PALETTE_STANDARD,
  perceptualDistance,
  seenAs,
  VISION_MODES,
} from "./colorScience";
import type { SystemId, SystemLook } from "../content/types";

/** How far a system may drift from the hue chosen for it semantically. */
const MAX_HUE_DRIFT = 20;
/**
 * Lightness and chroma both have to range widely for eleven systems to fit.
 * Holding every system at one chroma and a narrow lightness band is the
 * intuitive choice and it caps out around a separation of 6 — well short of
 * target. Letting a system go both dark and muted, or light and vivid, is what
 * opens up the room, and it is why the palette is searched rather than picked
 * on a grid.
 */
const MAX_LIGHTNESS_SHIFT = 0.25;
const MIN_CHROMA_SCALE = 0.4;
const MAX_CHROMA_SCALE = 1.15;

const {
  minHueSpacing: MIN_HUE_SPACING,
  minTextContrast: MIN_TEXT_CONTRAST,
  minMarkContrast: MIN_MARK_CONTRAST,
} = PALETTE_STANDARD;

/** What the search aims for: the checker's floor, plus room for rounding. */
const MIN_SEPARATION =
  PALETTE_STANDARD.minSeparation + PALETTE_STANDARD.tuningMargin;

const SEARCH_RESTARTS = 60;
const STEPS_PER_RESTART = 12000;

type Candidate = Record<SystemId, SystemDefinition>;

const SYSTEM_IDS = Object.keys(SYSTEM_DEFINITIONS) as SystemId[];
const ANCHOR_HUES = Object.fromEntries(
  SYSTEM_IDS.map((id) => [id, SYSTEM_DEFINITIONS[id].hue]),
) as Record<SystemId, number>;

function isHueAllowed(hue: number): boolean {
  const wrapped = ((hue % 360) + 360) % 360;
  const [start, end] = RESERVED_CUT_HUE_RANGE;
  return wrapped < start || wrapped > end;
}

/**
 * Only systems that share a plate are compared — the same constraint
 * `npm run palette:check` enforces, and the reason eleven systems fit at all.
 * Computed once: it depends on the modules, not on the colours being searched.
 */
const CONSTRAINED_PAIRS = listCoOccurringSystemPairs();

/** The legend's marks and the model's balloons both have to survive. */
const CHECKED_ROLES: (keyof Pick<SystemLook, "color" | "beacon">)[] = [
  "color",
  "beacon",
];

function measureSeparation(looks: Record<SystemId, SystemLook>): number {
  let worst = Infinity;
  for (const [first, second] of CONSTRAINED_PAIRS) {
    for (const role of CHECKED_ROLES) {
      for (const { matrix } of VISION_MODES) {
        const distance = perceptualDistance(
          seenAs(looks[first][role], matrix),
          seenAs(looks[second][role], matrix),
        );
        if (distance < worst) worst = distance;
      }
    }
  }
  return worst;
}

/** Mean saturation across the palette — the thing being maximised. */
function measureVividness(candidate: Candidate): number {
  const total = SYSTEM_IDS.reduce(
    (sum, id) => sum + (candidate[id].chromaScale ?? 1),
    0,
  );
  return total / SYSTEM_IDS.length;
}

/** Contrast is pass/fail: an unreadable palette is broken, not merely worse. */
function isReadable(looks: Record<SystemId, SystemLook>): boolean {
  return Object.values(looks).every(
    (look) =>
      contrastRatio(look.ink, WIDGET) >= MIN_TEXT_CONTRAST &&
      contrastRatio(look.ink, look.soft) >= MIN_TEXT_CONTRAST &&
      contrastRatio(look.color, PAGE) >= MIN_MARK_CONTRAST &&
      contrastRatio(look.beacon, VIEWPORT) >= MIN_MARK_CONTRAST,
  );
}

function deriveAll(candidate: Candidate): Record<SystemId, SystemLook> {
  return Object.fromEntries(
    SYSTEM_IDS.map((id) => [id, deriveLook(candidate[id])]),
  ) as Record<SystemId, SystemLook>;
}

/**
 * The two goals, as two scoring functions rather than one blended objective.
 *
 * Blending them into a single number was the first attempt and it fails in a
 * way worth recording: below the separation floor the combined score ignores
 * vividness entirely, so the search is really optimising two different
 * functions either side of a cliff, and a run that never reaches the floor
 * never optimises vividness at all. Splitting the phases makes the cliff a
 * boundary the search deliberately crosses once, rather than one it keeps
 * falling off.
 */
function hasDistinctHues(candidate: Candidate): boolean {
  return CONSTRAINED_PAIRS.every(([first, second]) => {
    const gap = Math.abs(candidate[first].hue - candidate[second].hue) % 360;
    return Math.min(gap, 360 - gap) >= MIN_HUE_SPACING;
  });
}

function scoreSeparation(candidate: Candidate): number | null {
  if (!hasDistinctHues(candidate)) return null;
  const looks = deriveAll(candidate);
  return isReadable(looks) ? measureSeparation(looks) : null;
}

function scoreVividness(candidate: Candidate): number | null {
  if (!hasDistinctHues(candidate)) return null;
  const looks = deriveAll(candidate);
  if (!isReadable(looks)) return null;
  if (measureSeparation(looks) < MIN_SEPARATION) return null;
  return measureVividness(candidate);
}

function randomBetween(low: number, high: number): number {
  return low + Math.random() * (high - low);
}

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

function mutate(candidate: Candidate, temperature: number): Candidate {
  const id = SYSTEM_IDS[Math.floor(Math.random() * SYSTEM_IDS.length)];
  const current = candidate[id];

  let { hue, lightnessShift, chromaScale = 1 } = current;

  // A locked system's saturation is a design decision, not a free variable.
  // Left free, the search spends it: maximising *mean* chroma has no view on
  // which system gets to be loud, so it will happily make the chassis rails
  // shout as loudly as the brake bolted to them.
  const axis = current.lockChroma
    ? Math.floor(Math.random() * 2)
    : Math.floor(Math.random() * 3);

  switch (axis) {
    case 0: {
      const anchor = ANCHOR_HUES[id];
      hue = clamp(
        current.hue + randomBetween(-1, 1) * 12 * temperature,
        anchor - MAX_HUE_DRIFT,
        anchor + MAX_HUE_DRIFT,
      );
      if (!isHueAllowed(hue)) return candidate;
      break;
    }
    case 1:
      lightnessShift = clamp(
        current.lightnessShift + randomBetween(-1, 1) * 0.12 * temperature,
        -MAX_LIGHTNESS_SHIFT,
        MAX_LIGHTNESS_SHIFT,
      );
      break;
    default:
      chromaScale = clamp(
        chromaScale + randomBetween(-1, 1) * 0.3 * temperature,
        MIN_CHROMA_SCALE,
        MAX_CHROMA_SCALE,
      );
      break;
  }

  return { ...candidate, [id]: { ...current, hue, lightnessShift, chromaScale } };
}

function randomStart(): Candidate {
  return Object.fromEntries(
    SYSTEM_IDS.map((id) => {
      const base = SYSTEM_DEFINITIONS[id];
      let hue = ANCHOR_HUES[id] + randomBetween(-MAX_HUE_DRIFT, MAX_HUE_DRIFT);
      if (!isHueAllowed(hue)) hue = ANCHOR_HUES[id];
      return [
        id,
        {
          ...base,
          hue,
          lightnessShift: randomBetween(-MAX_LIGHTNESS_SHIFT, MAX_LIGHTNESS_SHIFT),
          chromaScale: base.lockChroma
            ? base.chromaScale
            : randomBetween(MIN_CHROMA_SCALE, MAX_CHROMA_SCALE),
        },
      ];
    }),
  ) as Candidate;
}

type ScoreFn = (candidate: Candidate) => number | null;

/**
 * Hill-climbing with restarts and annealed step sizes.
 *
 * Equal-scoring moves are accepted, not just better ones. Both objectives have
 * broad plateaus — a system's chroma can often move a long way before the one
 * pair that limits the whole palette notices — and a search that only takes
 * strict improvements sits on those plateaus until it runs out of steps.
 */
function climb(
  score: ScoreFn,
  seeds: Candidate[],
  restarts: number,
  label: string,
): { candidate: Candidate; score: number } {
  let best = { candidate: seeds[0], score: score(seeds[0]) ?? -Infinity };

  for (let restart = 0; restart < restarts; restart++) {
    let candidate =
      restart < seeds.length ? seeds[restart] : randomStart();
    let current = score(candidate) ?? -Infinity;

    for (let step = 0; step < STEPS_PER_RESTART; step++) {
      // Anneal: big jumps early to escape a bad corner, fine adjustments late.
      const temperature = 1 - step / STEPS_PER_RESTART;
      const proposal = mutate(candidate, temperature);
      const proposalScore = score(proposal);
      if (proposalScore !== null && proposalScore >= current) {
        candidate = proposal;
        current = proposalScore;
      }
    }

    if (current > best.score) best = { candidate, score: current };
    process.stdout.write(
      `\r  ${label} ${restart + 1}/${restarts}  best ${best.score.toFixed(3)}   `,
    );
  }
  process.stdout.write("\n");
  return best;
}

/**
 * Find a palette that separates, then make that palette vivid.
 *
 * Phase two seeds from phase one's winner rather than starting over, because
 * feasibility is the hard part to find and the easy part to lose.
 */
function search(): { candidate: Candidate; score: number } {
  const separated = climb(
    scoreSeparation,
    [SYSTEM_DEFINITIONS as Candidate],
    SEARCH_RESTARTS,
    "separating",
  );
  console.log(`  best separation reachable: ${separated.score.toFixed(2)}`);

  if (separated.score < MIN_SEPARATION) {
    console.error(
      `\n  Cannot reach the floor of ${MIN_SEPARATION}. Either lower it, or ` +
        `reduce how many systems share a single plate.`,
    );
    return separated;
  }

  const vivid = climb(
    scoreVividness,
    [separated.candidate],
    Math.round(SEARCH_RESTARTS / 2),
    "saturating",
  );
  return vivid;
}

function printDefinitions(candidate: Candidate): void {
  console.log(`\nPaste into content/systems.ts:\n`);
  for (const id of SYSTEM_IDS) {
    const { hue, lightnessShift, chromaScale = 1 } = candidate[id];
    console.log(
      `    hue: ${hue.toFixed(1).padStart(5)}, ` +
        `lightnessShift: ${(lightnessShift >= 0 ? " " : "") + lightnessShift.toFixed(3)}, ` +
        `chromaScale: ${chromaScale.toFixed(2)},   // ${id}`,
    );
  }
}

function describe(candidate: Candidate): string {
  const looks = Object.fromEntries(
    SYSTEM_IDS.map((id) => [id, deriveLook(candidate[id])]),
  ) as Record<SystemId, SystemLook>;
  return (
    `separation ${measureSeparation(looks).toFixed(2)} ` +
    `(floor ${MIN_SEPARATION}), mean chroma ${measureVividness(candidate).toFixed(2)}`
  );
}

function main(): void {
  console.log(`Starting palette: ${describe(SYSTEM_DEFINITIONS as Candidate)}`);
  console.log(`Searching ${SEARCH_RESTARTS} restarts\u2026`);

  const { candidate } = search();
  console.log(`\nBest palette: ${describe(candidate)}`);
  printDefinitions(candidate);
}

main();
