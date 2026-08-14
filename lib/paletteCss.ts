/**
 * Publishes the palette to CSS as custom properties.
 *
 * The palette is computed in TypeScript (see content/palette.ts) because it has
 * to reach two places CSS cannot: the balloon shader, which takes `Color`
 * uniforms, and the legend, which is DOM. Writing the values twice is what the
 * old build did, and the two copies drifted — a hue changed in globals.css left
 * every balloon on the model wearing the previous colour, which is invisible
 * until you hold the legend and the engine side by side.
 *
 * So there is one source, and this is the bridge to the CSS half of it.
 * Emitted once into the document head; Tailwind utilities and hand-written
 * rules then reference `var(--system-cooling-beacon)` like any other token.
 */

import {
  CORRECT,
  CUT,
  GRAPHITE,
  HAIRLINE,
  INK,
  PAPER,
  PAPER_SUNK,
  PLATE,
  PLATE_DEEP,
  PLATE_HAIRLINE,
  PLATE_INK,
  WRONG,
} from "@/content/palette";
import { SYSTEMS } from "@/content/systems";
import type { SystemId } from "@/content/types";

/** Names the CSS variable for one role of one system. */
export function systemCssVariable(
  system: SystemId,
  role: "color" | "soft" | "ink" | "beacon",
): string {
  return `--system-${system}-${role}`;
}

const GROUND_TOKENS: Record<string, string> = {
  "--paper": PAPER,
  "--paper-sunk": PAPER_SUNK,
  "--plate": PLATE,
  "--plate-deep": PLATE_DEEP,
  "--plate-hairline": PLATE_HAIRLINE,
  "--plate-ink": PLATE_INK,
  "--ink": INK,
  "--graphite": GRAPHITE,
  "--hairline": HAIRLINE,
  "--correct": CORRECT,
  "--wrong": WRONG,
  "--cut": CUT,
};

export function buildPaletteCss(): string {
  const declarations: string[] = Object.entries(GROUND_TOKENS).map(
    ([name, value]) => `${name}:${value}`,
  );

  for (const [system, look] of Object.entries(SYSTEMS)) {
    for (const role of ["color", "soft", "ink", "beacon"] as const) {
      declarations.push(
        `${systemCssVariable(system as SystemId, role)}:${look[role]}`,
      );
    }
  }

  return `:root{${declarations.join(";")}}`;
}
