/**
 * Audits the system palette.
 *
 *   npm run palette:check
 *
 * Colour is the atlas's main carrier of meaning — a part's system is its hue —
 * so "these look different to me on this monitor" is not good enough. Two
 * things go wrong, and both are invisible until someone reports them:
 *
 *   1. Two systems that collapse into the same colour under common colour
 *      vision deficiency, so a legend stops being readable at all.
 *   2. Text set in a system colour without the contrast to be read on the
 *      surface it is actually printed on.
 *
 * This checks both and fails the run if either falls below target. It is a lint
 * for the palette, and it is why the numbers in the README can be quoted.
 *
 * The separation check only compares systems that **share a plate**. Eleven
 * mutually distinguishable hues do not exist on a wheel that also reserves a
 * band for the section cut — but two systems that never appear together never
 * need telling apart, and legends are per-module. That makes this check tighten
 * automatically as the atlas grows: a new module that puts braking and the air
 * path on one plate makes them a constrained pair for the first time, and the
 * check starts demanding they separate.
 */

import { listCoOccurringSystemPairs } from "../lib/catalog";
import { PAPER, PLATE } from "../content/palette";
import { SYSTEMS } from "../content/systems";
import type { SystemId, SystemLook } from "../content/types";
import {
  contrastRatio,
  PALETTE_STANDARD,
  perceptualDistance,
  seenAs,
  VISION_MODES,
} from "./colorScience";

const {
  minSeparation: MIN_SEPARATION,
  minTextContrast: MIN_TEXT_CONTRAST,
  minMarkContrast: MIN_MARK_CONTRAST,
} = PALETTE_STANDARD;

type Failure = { check: string; detail: string };

/**
 * The legend's marks and the model's balloons are different colours sitting on
 * grounds thirty lightness points apart. Tuning one and assuming the other
 * follows is how a palette ends up readable in the sidebar and muddy on the
 * engine, so both are checked.
 */
const CHECKED_ROLES = ["color", "beacon"] as const;

function checkSeparation(failures: Failure[]): void {
  const constrainedPairs = listCoOccurringSystemPairs();

  const measurements: {
    label: string;
    role: string;
    vision: string;
    distance: number;
  }[] = [];

  for (const [first, second] of constrainedPairs) {
    for (const role of CHECKED_ROLES) {
      for (const { name, matrix } of VISION_MODES) {
        measurements.push({
          label: `${first} / ${second}`,
          role,
          vision: name,
          distance: perceptualDistance(
            seenAs(SYSTEMS[first][role], matrix),
            seenAs(SYSTEMS[second][role], matrix),
          ),
        });
      }
    }
  }

  measurements.sort((a, b) => a.distance - b.distance);

  console.log(
    `\nSystems sharing a plate: ${constrainedPairs.length} pairs, ` +
      `${measurements.length} comparisons (target ≥ ${MIN_SEPARATION}).`,
  );
  console.log(`\nClosest (OKLab ×100):`);
  for (const { label, role, vision, distance } of measurements.slice(0, 10)) {
    const verdict = distance < MIN_SEPARATION ? "FAIL" : "ok  ";
    console.log(
      `  ${verdict}  ${distance.toFixed(1).padStart(5)}  ${label.padEnd(30)} ${role.padEnd(7)} ${vision}`,
    );
  }

  const worst = measurements[0];
  if (worst && worst.distance < MIN_SEPARATION) {
    failures.push({
      check: "system separation",
      detail:
        `${worst.label} are ${worst.distance.toFixed(1)} apart ` +
        `as ${worst.role} under ${worst.vision}`,
    });
  }
}

function checkContrast(failures: Failure[]): void {
  console.log(`\nContrast:`);

  for (const [id, look] of Object.entries(SYSTEMS) as [SystemId, SystemLook][]) {
    const measurements = [
      { label: "ink on soft", value: contrastRatio(look.ink, look.soft), min: MIN_TEXT_CONTRAST },
      { label: "ink on paper", value: contrastRatio(look.ink, PAPER), min: MIN_TEXT_CONTRAST },
      { label: "mark on paper", value: contrastRatio(look.color, PAPER), min: MIN_MARK_CONTRAST },
      { label: "beacon on plate", value: contrastRatio(look.beacon, PLATE), min: MIN_MARK_CONTRAST },
    ];

    const failed = measurements.filter(({ value, min }) => value < min);

    console.log(
      `  ${failed.length ? "FAIL" : "ok  "}  ${id.padEnd(14)}` +
        measurements.map((m) => `${m.label} ${m.value.toFixed(1)}`).join("  "),
    );

    for (const { label, value, min } of failed) {
      failures.push({
        check: `${id} contrast`,
        detail: `${label} is ${value.toFixed(2)}, needs ${min}`,
      });
    }
  }
}

function main(): void {
  console.log(`Auditing ${Object.keys(SYSTEMS).length} systems.`);

  const failures: Failure[] = [];
  checkSeparation(failures);
  checkContrast(failures);

  if (failures.length > 0) {
    console.error(`\n${failures.length} problem(s):`);
    for (const { check, detail } of failures) {
      console.error(`  ${check}: ${detail}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`\nPalette passes.`);
}

main();
