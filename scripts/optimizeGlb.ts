/**
 * Turns a raw Sketchfab download into something a browser should be asked to
 * load.
 *
 * The models in this collection arrive in two shapes, and they need opposite
 * treatment:
 *
 * - **Game exports and scans** — a few hundred thousand to seven million
 *   triangles, split across hundreds of primitives whose names mean nothing.
 *   These get welded, decimated to the triangle budget, and merged into a
 *   single mesh: one draw call, no information lost, because there was no
 *   information in the names to begin with.
 *
 * - **Assemblies with real part names** — far rarer, and the merge would
 *   destroy exactly what makes them valuable. These skip the merge and keep
 *   their node names so parts can bind to them.
 *
 * Build-time only.
 */

import { readFileSync, statSync } from "node:fs";
import { NodeIO, type Document } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  flatten,
  join,
  meshopt,
  prune,
  simplify,
  textureCompress,
  weld,
} from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";

export type OptimizeGlbOptions = {
  inputPath: string;
  outputPath: string;
  /** Decimate to this many triangles if the source exceeds it. */
  triangleBudget: number;
  /** Skip the merge pass, because this model's mesh names identify parts. */
  hasNamedPartMeshes: boolean;
  /**
   * How far the decimated surface may drift from the original, as a fraction
   * of the model's size. This is a ceiling, not a target: the simplifier stops
   * at whichever it reaches first, so a tight value on a dense scan means the
   * triangle budget is never met. See DEFAULT_SIMPLIFY_ERROR.
   */
  simplifyError?: number;
};

/**
 * Loose enough that a million-triangle scan can actually reach its budget,
 * tight enough to hold a silhouette an eye can still recognise. Models whose
 * shape carries fine detail worth protecting can ask for less in the manifest.
 */
export const DEFAULT_SIMPLIFY_ERROR = 0.01;

export type OptimizeGlbResult = {
  triangleCountBefore: number;
  triangleCountAfter: number;
  byteSizeBefore: number;
  byteSizeAfter: number;
  meshCountAfter: number;
  /** Node names left in the file, when they were worth keeping. */
  partMeshNames: string[];
};

async function createIO(): Promise<NodeIO> {
  await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
  return new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      "meshopt.decoder": MeshoptDecoder,
      "meshopt.encoder": MeshoptEncoder,
    });
}

function countTriangles(document: Document): number {
  let indexCount = 0;
  for (const mesh of document.getRoot().listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      const indices = primitive.getIndices();
      indexCount +=
        indices?.getCount() ?? primitive.getAttribute("POSITION")?.getCount() ?? 0;
    }
  }
  return Math.round(indexCount / 3);
}

function listMeshNodeNames(document: Document): string[] {
  return document
    .getRoot()
    .listNodes()
    .filter((node) => node.getMesh() !== null)
    .map((node) => node.getName())
    .filter((name) => name.length > 0);
}

export async function optimizeGlbForWeb({
  inputPath,
  outputPath,
  triangleBudget,
  hasNamedPartMeshes,
  simplifyError = DEFAULT_SIMPLIFY_ERROR,
}: OptimizeGlbOptions): Promise<OptimizeGlbResult> {
  const io = await createIO();
  const document = await io.read(inputPath);

  const triangleCountBefore = countTriangles(document);

  // Collapse the scene graph and drop duplicated accessors/materials first, so
  // every later pass has less to chew on. `flatten` is safe for named meshes —
  // it bakes transforms into node hierarchy, it does not rename anything.
  // Weld first, and unconditionally. It merges vertices that are already
  // identical, so it never changes the surface — but these exports routinely
  // ship each triangle standing on its own three vertices, which both inflates
  // the file and leaves the simplifier with no shared edges to collapse along.
  await document.transform(dedup(), flatten(), weld());

  if (triangleCountBefore > triangleBudget) {
    await document.transform(
      simplify({
        simplifier: MeshoptSimplifier,
        ratio: triangleBudget / triangleCountBefore,
        error: simplifyError,
      }),
    );
  }

  if (!hasNamedPartMeshes) {
    await document.transform(join());
  }

  await document.transform(
    prune(),
    dedup(),
    // Photogrammetry models carry 4K–8K baked textures. Most of this
    // collection is untextured, so this usually does nothing at all.
    textureCompress({
      encoder: sharp,
      targetFormat: "webp",
      resize: [2048, 2048],
    }),
    // Compression last: it rewrites buffer views into a form the other passes
    // cannot read, so anything running after it would have to decode the file
    // again.
    //
    // This one transform is worth more than every other pass here combined.
    // It reorders vertices into the locality the encoder's delta coding wants,
    // quantizes positions and normals down from 32-bit floats, and enables the
    // EXT_meshopt_compression extension — and at "high" it filters normals
    // octahedrally rather than merely truncating them, which is most of the
    // difference between a 1.1 MB engine and an 830 KB one.
    meshopt({ encoder: MeshoptEncoder, level: "high" }),
  );

  await io.write(outputPath, document);

  return {
    triangleCountBefore,
    triangleCountAfter: countTriangles(document),
    byteSizeBefore: statSync(inputPath).size,
    byteSizeAfter: statSync(outputPath).size,
    meshCountAfter: document.getRoot().listMeshes().length,
    partMeshNames: hasNamedPartMeshes ? listMeshNodeNames(document) : [],
  };
}

export type GlbDescription = {
  triangleCount: number;
  byteSize: number;
  meshCount: number;
  meshNodeNames: string[];
};

/**
 * Reads what a GLB already on disk contains, without re-optimising it. Lets a
 * sync that skips the download still report accurate numbers.
 */
export async function describeGlb(glbPath: string): Promise<GlbDescription> {
  const io = await createIO();
  const document = await io.readBinary(readFileSync(glbPath));
  return {
    triangleCount: countTriangles(document),
    byteSize: statSync(glbPath).size,
    meshCount: document.getRoot().listMeshes().length,
    meshNodeNames: listMeshNodeNames(document),
  };
}
