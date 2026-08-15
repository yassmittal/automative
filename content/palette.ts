/**
 * The one place a colour is decided.
 *
 * Every surface in the atlas reads its colour from here — the DOM through CSS
 * custom properties, the balloon shader through `Color` uniforms. That is the
 * point of the file. Colour carries the atlas's main idea (a part's hue is its
 * system), and it used to be written twice: once in globals.css for the legend
 * and once in GLSL for the model. A palette change made in one place left the
 * legend and the balloons quietly disagreeing about what "cooling" looks like,
 * which is invisible until you hold them side by side.
 *
 * System colours are *derived*, not typed. Each system picks a hue; the four
 * roles it wears — mark, text, tint, beacon — come from fixed recipes in OKLCH,
 * so all eleven systems are lit the same way and adding a twelfth is a hue and
 * a label rather than an exercise in colour science. `npm run palette:check`
 * proves the result still separates and still has the contrast it claims.
 */

/* ------------------------------------------------------------------ OKLCH */

/**
 * OKLCH is the working space because its lightness axis matches what an eye
 * reports. Holding L fixed across eleven hues in HSL gives wildly different
 * apparent brightness — a yellow at 50% reads far lighter than a blue at 50%.
 * In OKLCH it does not, which is what lets one recipe serve every system.
 */
export type Oklch = {
  /** 0 (black) to 1 (white). */
  lightness: number;
  /** Distance from grey. Roughly 0 to 0.37 for colours sRGB can show. */
  chroma: number;
  /** Degrees around the wheel. */
  hue: number;
};

function oklchToLinearRgb({ lightness, chroma, hue }: Oklch): number[] {
  const hueRadians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(hueRadians);
  const b = chroma * Math.sin(hueRadians);

  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function isDisplayable(linearRgb: number[]): boolean {
  return linearRgb.every((channel) => channel >= -0.0001 && channel <= 1.0001);
}

function linearToHex(linearRgb: number[]): string {
  return `#${linearRgb
    .map((channel) => {
      const clamped = Math.min(1, Math.max(0, channel));
      const encoded =
        clamped <= 0.0031308
          ? clamped * 12.92
          : 1.055 * clamped ** (1 / 2.4) - 0.055;
      return Math.round(encoded * 255)
        .toString(16)
        .padStart(2, "0");
    })
    .join("")}`;
}

/**
 * OKLCH to a hex string, backing off chroma until the colour fits in sRGB.
 *
 * Clamping the channels instead — the obvious shortcut — shifts the hue, and
 * shifting hue is precisely the failure this palette cannot afford: it is what
 * makes two systems that were designed 30° apart render 12° apart. Desaturating
 * costs vividness and keeps the hue, which is the right trade every time.
 */
export function oklchToHex(color: Oklch): string {
  let chroma = color.chroma;

  for (let attempt = 0; attempt < 60; attempt++) {
    const linearRgb = oklchToLinearRgb({ ...color, chroma });
    if (isDisplayable(linearRgb)) return linearToHex(linearRgb);
    chroma -= 0.005;
    if (chroma <= 0) break;
  }
  return linearToHex(oklchToLinearRgb({ ...color, chroma: 0 }));
}

/* ------------------------------------------------------------- the ground */

/**
 * The surface hierarchy, in Blueprint's dark neutrals.
 *
 * Four grounds, each one step lighter than the last, and the order is the
 * information architecture rather than a gradient for its own sake: the
 * viewport is the darkest thing on screen because a photographed aluminium
 * casting needs something to be lighter than; the page is the backdrop; a
 * section groups a workflow; a widget is the focused unit of work sitting
 * inside it. Anything that reads as a panel picks one of these four and a
 * one-pixel `EDGE`, and depth comes from that contrast rather than from
 * shadow — see the shadow rules in globals.css.
 */
export const VIEWPORT = "#10161A";
export const VIEWPORT_DEEP = "#080c0f";
export const PAGE = "#182026";
export const SECTION = "#202B33";
export const WIDGET = "#293742";
export const EDGE = "#30404D";

/** A stronger rule than `EDGE`: hover borders, disabled controls, dividers. */
export const EDGE_STRONG = "#5C7080";

/**
 * Text, in three tiers.
 *
 * The third tier is Blueprint's gray-4 rather than the gray-1 its dark palette
 * nominally offers for secondary text. Gray-1 is a *light-theme* secondary —
 * on the page ground it measures 2.8:1, which cannot carry a field label, let
 * alone a sentence. Gray-4 carries the same role at 6.7:1. Gray-1 is still
 * here, as `EDGE_STRONG`, doing the job it can actually do.
 */
export const FG = "#F5F8FA";
export const FG_MUTED = "#BFCCD6";
export const FG_DIM = "#A7B6C2";

/**
 * Blueprint intents. Each one means exactly one thing, everywhere.
 *
 * The rule these enforce is the design system's own: colour is semantic, so a
 * button is blue because it is the primary action and red because it destroys
 * something — never because a layout wanted variety.
 */
export const INTENT_PRIMARY = "#137CBD";
export const INTENT_PRIMARY_HOVER = "#106BA3";
export const INTENT_PRIMARY_LIGHT = "#2B95D6";
export const INTENT_SUCCESS = "#0F9960";
export const INTENT_WARNING = "#D9822B";
export const INTENT_DANGER = "#DB3737";

/**
 * Verdicts and tools, which are not systems and never take a system's hue.
 *
 * Green and red are safe to leave out of the system wheel's way because a quiz
 * greys every balloon and every legend row that is not the answer — a verdict
 * colour and a system colour are never on screen at the same time. The section
 * cut is the exception that genuinely is reserved: it is a tool, it can appear
 * mid-explore alongside all eleven systems, and no system may wear its orange.
 *
 * All three are intent colours rather than bespoke ones, because "correct",
 * "wrong" and "a destructive-feeling tool" are exactly what success, danger and
 * warning already mean in this system.
 */
export const CORRECT = INTENT_SUCCESS;
export const WRONG = INTENT_DANGER;
export const CUT = INTENT_WARNING;

/** Hue band the section cut owns. No system may sit inside it. */
export const RESERVED_CUT_HUE_RANGE: [number, number] = [30, 62];
