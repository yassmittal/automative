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
  EDGE,
  EDGE_STRONG,
  FG,
  FG_DIM,
  FG_MUTED,
  INTENT_DANGER,
  INTENT_PRIMARY,
  INTENT_PRIMARY_HOVER,
  INTENT_PRIMARY_LIGHT,
  INTENT_SUCCESS,
  INTENT_WARNING,
  PAGE,
  SECTION,
  VIEWPORT,
  VIEWPORT_DEEP,
  WIDGET,
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
  /* Surface hierarchy, darkest first. */
  "--viewport": VIEWPORT,
  "--viewport-deep": VIEWPORT_DEEP,
  "--page": PAGE,
  "--section": SECTION,
  "--widget": WIDGET,
  "--edge": EDGE,
  "--edge-strong": EDGE_STRONG,

  /* Text tiers. */
  "--fg": FG,
  "--fg-muted": FG_MUTED,
  "--fg-dim": FG_DIM,

  /* Blueprint intents. */
  "--intent-primary": INTENT_PRIMARY,
  "--intent-primary-hover": INTENT_PRIMARY_HOVER,
  "--intent-primary-light": INTENT_PRIMARY_LIGHT,
  "--intent-success": INTENT_SUCCESS,
  "--intent-warning": INTENT_WARNING,
  "--intent-danger": INTENT_DANGER,

  /* Verdicts and tools, aliased onto the intents they mean. */
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
