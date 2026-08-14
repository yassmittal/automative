import type { Module } from "../types";
import { brakeAssembly } from "./brake-assembly";
import { cylinderHead } from "./cylinder-head";
import { lsV8 } from "./ls-v8";
import { suspensionChassis } from "./suspension-chassis";
import { turbocharger } from "./turbocharger";

/**
 * Every plate in the atlas, in catalog order.
 *
 * Order is meaningful: it decides the figure number each module is shown under,
 * so a module's position here is its identity on the page. Insert rather than
 * append if a new plate belongs earlier in a chapter — nothing is hand-numbered,
 * so renumbering costs nothing.
 *
 * Adding a module is three steps: an entry in scripts/modelManifest.ts, a file
 * beside this one, and a line here.
 */
export const ATLAS_MODULES: Module[] = [
  lsV8,
  cylinderHead,
  turbocharger,
  brakeAssembly,
  suspensionChassis,
];
