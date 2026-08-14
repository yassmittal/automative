import type { Chapter, ChapterId } from "./types";

/**
 * How the atlas is split for browsing, in reading order.
 *
 * A manual puts the engine before the running gear because that is the order
 * you meet them in when you learn a car, not because of where they sit on it.
 * The catalog follows the same order for the same reason.
 */
export const CHAPTERS: Chapter[] = [
  {
    id: "engine",
    label: "Engine",
    blurb:
      "Where fuel becomes torque, and the systems that keep that from destroying itself.",
  },
  {
    id: "forced-induction",
    label: "Forced induction",
    blurb: "Pushing more air in than the engine could ever draw on its own.",
  },
  {
    id: "running-gear",
    label: "Running gear",
    blurb: "Everything between the body and the road: stopping, steering, holding up.",
  },
];

const CHAPTERS_BY_ID = new Map(CHAPTERS.map((chapter) => [chapter.id, chapter]));

export function getChapter(id: ChapterId): Chapter {
  const chapter = CHAPTERS_BY_ID.get(id);
  if (!chapter) throw new Error(`Unknown chapter: ${id}`);
  return chapter;
}
