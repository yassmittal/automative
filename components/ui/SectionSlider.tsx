"use client";

import { Scissors } from "lucide-react";
import { atlas, useAtlas } from "@/lib/store";

/** Drives the clipping plane. Reads as a section marker on a drawing. */
export function SectionSlider() {
  const section = useAtlas((s) => s.section);
  const sectionOn = useAtlas((s) => s.sectionOn);
  const mode = useAtlas((s) => s.mode);

  if (mode === "quiz") return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-4">
      <div className="pointer-events-auto flex items-center gap-3 border border-hairline bg-paper/90 px-3 py-2 shadow-sm backdrop-blur-sm">
        <button
          type="button"
          onClick={atlas.toggleSection}
          aria-pressed={sectionOn}
          className={`flex items-center gap-1.5 px-1.5 py-1 transition-colors ${
            sectionOn ? "text-cut" : "text-graphite hover:text-ink"
          }`}
        >
          <Scissors size={13} strokeWidth={1.75} />
          <span className="plate-tag" style={{ color: "inherit" }}>
            Section
          </span>
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={section}
          onChange={(e) => atlas.setSection(Number(e.target.value))}
          aria-label="Sweep the section cut through the engine"
          className="section-range h-1 w-32 cursor-ew-resize appearance-none bg-hairline outline-none sm:w-52"
        />

        <span className="w-9 text-right font-mono text-[10px] tabular-nums text-graphite">
          {Math.round(section * 100)}%
        </span>
      </div>
    </div>
  );
}
