"use client";

import { useEffect, useRef } from "react";
import type { Module } from "@/content/types";
import { SYSTEMS } from "@/content/types";
import { useAnnotatedId, type AnnotationRefs } from "../scene/Annotation";

/**
 * The label end of a callout: a leader line running out of the balloon to a
 * part name set in the margin, the way a figure in a service manual is keyed.
 *
 * Geometry is written every frame from inside the Canvas (see Annotator).
 * This half only owns what the label says and how it fades in.
 */
export function AnnotationOverlay({
  module,
  refs,
}: {
  module: Module;
  refs: AnnotationRefs;
}) {
  const annotatedId = useAnnotatedId();
  const part = module.parts.find((p) => p.id === annotatedId);
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
      <svg className="absolute inset-0 h-full w-full">
        <polyline
          ref={refs.line}
          points="0,0 0,0 0,0"
          fill="none"
          stroke={look?.color ?? "var(--color-ink)"}
          strokeWidth="1.25"
          strokeDasharray="120"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div
        ref={refs.label}
        className="absolute top-0 left-0 whitespace-nowrap"
        style={{ willChange: "transform" }}
      >
        {/* The label sits over the casting, so it carries its own ground
            rather than relying on the plate showing through behind it. */}
        <div className="bg-paper/90 px-1.5 py-1 backdrop-blur-[2px]">
          <div className="plate-tag mb-0.5" style={{ color: look?.ink }}>
            {look?.label ?? ""}
          </div>
          <div className="plate-display text-[15px] leading-none text-ink">
            {part?.name ?? ""}
          </div>
        </div>
      </div>
    </div>
  );
}
