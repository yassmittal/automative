/**
 * The slice of the Sketchfab API the asset pipeline needs: what a model is,
 * who made it, and where to download it from.
 *
 * Build-time only. Nothing here ships to the browser — the app serves GLB
 * files out of `public/models` and never talks to Sketchfab at runtime.
 */

import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const SKETCHFAB_API = "https://api.sketchfab.com/v3";

/** What the atlas needs to credit a model correctly. */
export type SketchfabModelMetadata = {
  uid: string;
  name: string;
  authorName: string;
  authorProfileUrl: string;
  modelPageUrl: string;
  licenseLabel: string;
  /** Triangle count as published, before our optimisation pass. */
  sourceTriangleCount: number;
};

function readApiToken(): string {
  const token = process.env.SKETCHFAB_API_TOKEN;
  if (!token) {
    throw new Error(
      "SKETCHFAB_API_TOKEN is not set. Put it in the .env file one directory " +
        "above this project, or export it before running the sync.",
    );
  }
  return token;
}

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${SKETCHFAB_API}${path}`, {
    headers: { Authorization: `Token ${readApiToken()}` },
  });

  if (!response.ok) {
    throw new Error(
      `Sketchfab ${path} responded ${response.status} ${response.statusText}`,
    );
  }
  return (await response.json()) as T;
}

export async function fetchModelMetadata(
  uid: string,
): Promise<SketchfabModelMetadata> {
  const model = await requestJson<{
    uid: string;
    name: string;
    viewerUrl: string;
    faceCount: number;
    user: { displayName: string; profileUrl: string };
    license: { label: string } | null;
  }>(`/models/${uid}`);

  return {
    uid: model.uid,
    name: model.name,
    authorName: model.user.displayName,
    authorProfileUrl: model.user.profileUrl,
    modelPageUrl: model.viewerUrl,
    licenseLabel: model.license?.label ?? "Unknown",
    sourceTriangleCount: model.faceCount,
  };
}

/**
 * Sketchfab hands out short-lived signed URLs rather than serving the file
 * directly, so this has to be resolved immediately before the download — the
 * link expires in five minutes.
 */
export async function resolveGlbDownloadUrl(uid: string): Promise<string> {
  const download = await requestJson<{ glb?: { url: string } }>(
    `/models/${uid}/download`,
  );

  if (!download.glb?.url) {
    throw new Error(
      `Model ${uid} offers no GLB download. It may be download-disabled, or ` +
        `available only as a source archive.`,
    );
  }
  return download.glb.url;
}

export async function downloadToFile(
  url: string,
  destinationPath: string,
): Promise<void> {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  await pipeline(
    Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]),
    createWriteStream(destinationPath),
  );
}
