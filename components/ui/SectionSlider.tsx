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
      <div className="overlay-panel pointer-events-auto flex items-center gap-3 px-2 py-1.5">
        {/* A tool toggle, so it lives on the minimal rung and states its own
            on-ness with the cut's colour rather than with a filled ground. */}
        <button
          type="button"
          onClick={atlas.toggleSection}
          aria-pressed={sectionOn}
          className="btn btn-minimal btn-sm"
          style={sectionOn ? { color: "var(--color-cut)" } : undefined}
        >
          <Scissors size={13} strokeWidth={2} />
          Section
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={section}
          onChange={(e) => atlas.setSection(Number(e.target.value))}
          aria-label="Sweep the section cut through the model"
          className="section-range w-32 cursor-ew-resize sm:w-52"
        />

        <span className="t-code w-9 text-right text-fg-dim">
          {Math.round(section * 100)}%
        </span>
      </div>
    </div>
  );
}
