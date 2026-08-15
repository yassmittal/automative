"use client";

import { useEffect, useRef } from "react";
import { SYSTEMS } from "@/content/systems";
import type { CatalogEntry } from "@/lib/catalog";
import { useAnnotatedId, type AnnotationRefs } from "../scene/Annotation";

/**
 * The label end of a callout: a leader line running out of the balloon to a
 * part name set in the margin, the way a figure in a service manual is keyed.
 *
 * Geometry is written every frame from inside the Canvas (see Annotator).
 * This half only owns what the label says and how it fades in.
 */
export function AnnotationOverlay({
  entry,
  refs,
}: {
  entry: CatalogEntry;
  refs: AnnotationRefs;
}) {
  const annotatedId = useAnnotatedId();
  const part = entry.module.parts.find((candidate) => candidate.id === annotatedId);
  const look = part ? SYSTEMS[part.system] : null;
  const wrapper = useRef<HTMLDivElement>(null);

  // Redraw the leader from the balloon outward each time the subject changes.
  useEffect(() => {
    const line = refs.line.current;
    if (!line || !annotatedId) return;
    line.style.transition = "none";
    line.style.strokeDashoffset = "120";
    // Force the reset to land before the transition is re-enabled.
    void line.getBoundingClientRect();
    line.style.transition = "stroke-dashoffset 0.34s cubic-bezier(0.22,1,0.36,1)";
    line.style.strokeDashoffset = "0";
  }, [annotatedId, refs.line]);

  return (
    <div
      ref={wrapper}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ opacity: part ? 1 : 0, transition: "opacity 0.18s ease-out" }}
    >
      {/* The leader is drawn twice: a dark casing first, then the system's
          colour on top of it. A single stroke has to cross both the near-black
          viewport and a bright aluminium casting on its way to the margin, and
          no one colour is legible on both — the casing gives the coloured line
          its own edge to sit against wherever it happens to land. */}
      <svg className="absolute inset-0 h-full w-full">
        <polyline
          ref={refs.lineCasing}
          points="0,0 0,0 0,0"
          fill="none"
          stroke="var(--color-viewport-deep)"
          strokeWidth="3.5"
          strokeOpacity="0.65"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          ref={refs.line}
          points="0,0 0,0 0,0"
          fill="none"
          stroke={look?.beacon ?? "var(--color-fg)"}
          strokeWidth="1.5"
          strokeDasharray="120"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div
        ref={refs.label}
        className="absolute top-0 left-0 whitespace-nowrap"
        style={{ willChange: "transform" }}
      >
        {/* The chip carries its own opaque ground. It has to: this label lands
            wherever the part happens to be, which is routinely on top of a
            brightly lit casting, and a translucent chip is legible right up
            until the model rotates under it. The left rule is the system's
            colour, so the chip, the legend row and the balloon agree. */}
        <div
          className="overlay-panel border-l-[3px] px-2.5 py-1.5"
          style={{ borderLeftColor: look?.color }}
        >
          <div
            className="t-field-label mb-0.5"
            style={{ color: look?.beacon }}
          >
            {look?.label ?? ""}
          </div>
          <div className="t-widget-title text-[15px] leading-none text-fg">
            {part?.name ?? ""}
          </div>
        </div>
      </div>
    </div>
  );
}
