/**
 * Reports where things are inside a shipped model, in the coordinate space
 * callouts are authored in.
 *
 *   npm run model:inspect brake-assembly
 *
 * Authoring a callout means putting a point on a part, and the honest way to do
 * that is to click the part in the browser at `?authoring=1`. But two things
 * are worth knowing before you open the browser, and this prints both:
 *
 *   - The model's extent, so you know what range of numbers to expect and can
 *     tell a plausible coordinate from a typo.
 *   - Each named mesh's centre and size. On the rare model whose meshes carry
 *     real part names, that is not a hint — it is the answer, exact and free,
 *     and those parts never need to be clicked at all.
 *
 * Coordinates match `useNormalizedModel`: every model is scaled so its longest
 * axis is FIT_SIZE and centred on the origin, which is what keeps authored
 * numbers comparable between models of wildly different native scale.
 */

import { readFileSync } from "node:fs";
import { dirname, join as joinPath } from "node:path";
import { fileURLToPath } from "node:url";
import { NodeIO, type Node } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";

/** Must match FIT_SIZE in lib/useNormalizedModel.ts. */
const FIT_SIZE = 3.8;

const PROJECT_ROOT = joinPath(dirname(fileURLToPath(import.meta.url)), "..");

type Bounds = { min: number[]; max: number[] };

function emptyBounds(): Bounds {
  return { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
}

function growBounds(bounds: Bounds, point: number[]): void {
  for (let axis = 0; axis < 3; axis++) {
    bounds.min[axis] = Math.min(bounds.min[axis], point[axis]);
    bounds.max[axis] = Math.max(bounds.max[axis], point[axis]);
  }
}

function transformPoint(point: number[], matrix: number[]): number[] {
  // glTF matrices are column-major.
  return [0, 1, 2].map(
    (row) =>
      matrix[row] * point[0] +
      matrix[4 + row] * point[1] +
      matrix[8 + row] * point[2] +
      matrix[12 + row],
  );
}

/** Every vertex of a node's mesh, in the scene's own coordinate space. */
function readWorldPositions(node: Node): number[][] {
  const mesh = node.getMesh();
  if (!mesh) return [];

  const matrix = node.getWorldMatrix();
  const points: number[][] = [];

  for (const primitive of mesh.listPrimitives()) {
    const position = primitive.getAttribute("POSITION");
    if (!position) continue;
    for (let i = 0; i < position.getCount(); i++) {
      points.push(transformPoint(position.getElement(i, [0, 0, 0]), matrix));
    }
  }
  return points;
}

function format(values: number[]): string {
  return `[${values.map((value) => value.toFixed(2).padStart(6)).join(", ")}]`;
}

async function main(): Promise<void> {
  const slug = process.argv[2];
  if (!slug) {
    throw new Error("Usage: npm run model:inspect -- <slug>");
  }

  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "meshopt.decoder": MeshoptDecoder });

  const path = joinPath(PROJECT_ROOT, "public", "models", `${slug}.glb`);
  const document = await io.readBinary(readFileSync(path));

  const meshNodes = document
    .getRoot()
    .listNodes()
    .filter((node) => node.getMesh() !== null);

  const positionsByNode = meshNodes.map(readWorldPositions);

  const modelBounds = emptyBounds();
  for (const positions of positionsByNode) {
    for (const point of positions) growBounds(modelBounds, point);
  }

  const rawSize = [0, 1, 2].map(
    (axis) => modelBounds.max[axis] - modelBounds.min[axis],
  );
  const scale = FIT_SIZE / Math.max(...rawSize);
  const rawCenter = [0, 1, 2].map(
    (axis) => (modelBounds.max[axis] + modelBounds.min[axis]) / 2,
  );

  /** Raw model space into the space callouts are authored in. */
  const normalize = (point: number[]): number[] =>
    point.map((value, axis) => (value - rawCenter[axis]) * scale);

  console.log(`\n${slug}`);
  console.log(`  normalized size   ${format(rawSize.map((s) => s * scale))}`);
  console.log(
    `  normalized bounds ${format(normalize(modelBounds.min))} → ${format(
      normalize(modelBounds.max),
    )}`,
  );
  console.log(`  mesh nodes        ${meshNodes.length}`);

  if (meshNodes.length <= 1) {
    console.log(
      `\n  One merged mesh — no per-part geometry to read. Author these callouts` +
        `\n  by clicking the model at /module/${slug}?authoring=1.`,
    );
    return;
  }

  console.log(`\n  Per-mesh centres, in authored coordinates:\n`);
  meshNodes.forEach((node, index) => {
    const positions = positionsByNode[index];
    if (positions.length === 0) return;

    const bounds = emptyBounds();
    for (const point of positions) growBounds(bounds, point);

    const centre = normalize(
      [0, 1, 2].map((axis) => (bounds.max[axis] + bounds.min[axis]) / 2),
    );
    const size = [0, 1, 2].map(
      (axis) => (bounds.max[axis] - bounds.min[axis]) * scale,
    );

    console.log(`    ${node.getName() || "<unnamed>"}`);
    console.log(
      `      position ${format(centre)}   size ${format(size)}   verts ${positions.length}`,
    );
  });
}

main().catch((error) => {
  console.error(`\n${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
