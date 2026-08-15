/**
 * Fails the build when the UI names a design token that does not exist.
 *
 * This exists because of a specific, expensive bug. The palette was reworked
 * from a light "paper" system to the dark console one, and globals.css, the
 * palette module and the catalog page were all migrated together — but the ten
 * components behind /module/[id] were not. Nothing complained. Tailwind emits
 * no rule at all for an unknown utility, and CSS drops any declaration holding
 * an undefined `var()`, so every surface, border and button fill in the plate
 * view silently became transparent. The app still built, still type-checked,
 * still linted, still rendered — with the part read-out lying directly on the
 * 3D model and the primary button reduced to bare words on a dark ground.
 *
 * The lesson is not "be more careful during a refactor". It is that a design
 * system whose vocabulary is enforced only by eyes is not a system. Two things
 * are checked, both exhaustive:
 *
 *   1. Every `var(--x)` resolves to a property that lib/paletteCss.ts publishes
 *      or globals.css declares.
 *   2. Every class named in a `className` resolves to either a real Tailwind
 *      utility or a class globals.css defines.
 *
 * The second check asks Tailwind itself rather than pattern-matching what a
 * utility looks like — `candidatesToCss` returns null for anything it cannot
 * build, which is exactly the question being asked and leaves no room for the
 * checker and the compiler to disagree.
 *
 * Run with `npm run tokens:check`. Part of `npm run lint`.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { __unstable__loadDesignSystem } from "tailwindcss";
import { buildPaletteCss } from "../lib/paletteCss";

const ROOT = join(import.meta.dirname, "..");
const GLOBALS = join(ROOT, "app", "globals.css");
const SOURCE_DIRS = ["app", "components", "lib", "content"];

type Problem = { file: string; line: number; token: string; reason: string };

/**
 * Marker classes that legitimately build no CSS of their own — they exist only
 * so a `group-hover:` or `peer-checked:` variant elsewhere has something to
 * name.
 */
const MARKERS = /^(group|peer)(\/[\w-]+)?$/;

/* --------------------------------------------------------------- vocabulary */

/** Every `--name` the running document actually defines. */
function knownCustomProperties(css: string): Set<string> {
  const names = new Set<string>();
  // Published at runtime from the TypeScript palette (see lib/paletteCss.ts).
  for (const match of buildPaletteCss().matchAll(/(--[\w-]+)\s*:/g)) {
    names.add(match[1]);
  }
  // Declared anywhere in globals.css, including inside @theme.
  for (const match of css.matchAll(/(--[\w-]+)\s*:/g)) names.add(match[1]);
  return names;
}

/** Component classes globals.css defines by hand — `.btn`, `.t-body`, … */
function knownComponentClasses(css: string): Set<string> {
  const names = new Set<string>();
  for (const match of css.matchAll(/\.([a-zA-Z][\w-]*)/g)) names.add(match[1]);
  return names;
}

/** Tailwind's own answer to "is this a utility?", loaded from our own CSS. */
async function loadTailwind() {
  return __unstable__loadDesignSystem(readFileSync(GLOBALS, "utf8"), {
    base: ROOT,
    loadStylesheet: async (id: string, base: string) => {
      const path =
        id === "tailwindcss"
          ? join(ROOT, "node_modules/tailwindcss/index.css")
          : join(base, id);
      // Only Tailwind's own entry point matters here — the check needs the
      // utility grammar, not whatever else globals.css might pull in.
      return {
        path,
        base,
        content: id === "tailwindcss" ? readFileSync(path, "utf8") : "",
      };
    },
  });
}

/* ---------------------------------------------------------------- extraction */

/**
 * Pulls the class names out of one `className={...}` value.
 *
 * Only string literals count. Walking them properly — rather than stripping
 * punctuation and hoping — is what keeps identifiers, ternary operators and
 * interpolated expressions from being reported as broken classes, which is the
 * difference between a check the team runs and one they turn off.
 */
function classNamesIn(input: string): string[] {
  // A literal on the right of a comparison is a value being tested, not a
  // class being applied — `side === "top"` must not be read as the class
  // `top`. Blanking these is the one place this scanner needs to know it is
  // reading TypeScript rather than a bag of strings.
  const value = input.replace(/[!=]==?\s*(["'])(?:\\.|[^\\])*?\1/g, "");
  const found: string[] = [];
  let i = 0;

  while (i < value.length) {
    const char = value[i];

    if (char === '"' || char === "'") {
      let j = i + 1;
      while (j < value.length && value[j] !== char) j += value[j] === "\\" ? 2 : 1;
      found.push(...value.slice(i + 1, j).split(/\s+/));
      i = j + 1;
      continue;
    }

    if (char === "`") {
      let j = i + 1;
      while (j < value.length && value[j] !== "`") {
        // Step into `${ ... }` and read the literals inside it too — a class
        // chosen by a ternary is still a class this file is claiming exists.
        if (value[j] === "$" && value[j + 1] === "{") {
          let depth = 1;
          let k = j + 2;
          while (k < value.length && depth > 0) {
            if (value[k] === "{") depth++;
            else if (value[k] === "}") depth--;
            k++;
          }
          found.push(...classNamesIn(value.slice(j + 2, k - 1)));
          j = k;
          continue;
        }
        j++;
      }
      // The literal chunks of the template, with the interpolations blanked.
      found.push(
        ...value
          .slice(i + 1, j)
          .replace(/\$\{[\s\S]*?\}/g, " ")
          .split(/\s+/),
      );
      i = j + 1;
      continue;
    }

    i++;
  }

  return found.filter(Boolean);
}

/** Finds each `className=` and returns its value with the line it started on. */
function classNameValues(source: string): { value: string; line: number }[] {
  const out: { value: string; line: number }[] = [];

  for (const match of source.matchAll(/\bclassName\s*=\s*/g)) {
    let i = match.index + match[0].length;
    const line = source.slice(0, i).split("\n").length;

    if (source[i] === "{") {
      let depth = 1;
      const start = ++i;
      while (i < source.length && depth > 0) {
        if (source[i] === "{") depth++;
        else if (source[i] === "}") depth--;
        i++;
      }
      out.push({ value: source.slice(start, i - 1), line });
    } else if (source[i] === '"' || source[i] === "'") {
      const quote = source[i];
      const start = i;
      i++;
      while (i < source.length && source[i] !== quote) i++;
      out.push({ value: source.slice(start, i + 1), line });
    }
  }

  return out;
}

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...sourceFiles(path));
    else if (/\.(tsx?|css)$/.test(path)) out.push(path);
  }
  return out;
}

/* --------------------------------------------------------------------- main */

async function main() {
  const css = readFileSync(GLOBALS, "utf8");
  const properties = knownCustomProperties(css);
  const components = knownComponentClasses(css);
  const tailwind = await loadTailwind();

  const files = SOURCE_DIRS.flatMap((dir) => sourceFiles(join(ROOT, dir)));
  const problems: Problem[] = [];

  for (const file of files) {
    const source = readFileSync(file, "utf8");

    // 1. Custom properties. A `var()` carrying a fallback still renders, so it
    //    is not a defect and is skipped.
    source.split("\n").forEach((text, index) => {
      for (const match of text.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)) {
        if (properties.has(match[1])) continue;
        problems.push({
          file,
          line: index + 1,
          token: `var(${match[1]})`,
          reason: "no such custom property is ever published",
        });
      }
    });

    // 2. Classes, asked of Tailwind directly.
    if (file.endsWith(".css")) continue;

    for (const { value, line } of classNameValues(source)) {
      const names = [...new Set(classNamesIn(value))].filter(
        (name) => !MARKERS.test(name) && !components.has(name.replace(/^.*:/, "")),
      );
      if (names.length === 0) continue;

      const built = tailwind.candidatesToCss(names);
      names.forEach((name, index) => {
        if (built[index] !== null) return;
        problems.push({
          file,
          line,
          token: name,
          reason: "Tailwind builds no rule for this — it renders as nothing",
        });
      });
    }
  }

  if (problems.length === 0) {
    console.log(
      `✓ ${files.length} files reference only tokens the design system publishes.`,
    );
    return;
  }

  console.error(
    `\n✗ ${problems.length} reference${problems.length === 1 ? "" : "s"} to a token that does not exist.` +
      `\n  None of these error at build time. They render as nothing at all.\n`,
  );
  for (const problem of problems) {
    console.error(
      `  ${relative(ROOT, problem.file)}:${problem.line}  ${problem.token}\n` +
        `      ${problem.reason}`,
    );
  }
  console.error("");
  process.exitCode = 1;
}

main();
