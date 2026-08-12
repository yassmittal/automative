"use client";

import { SYSTEMS, type Module, type SystemId } from "@/content/types";
import { atlas, useAtlas } from "@/lib/store";

/**
 * The legend half of the figure plate: every callout number keyed to a part
 * name, grouped by the system it belongs to.
 *
 * The numbering here is the same numbering stamped on the balloons, which is
 * the whole reason it earns its place — it is a lookup table, not decoration.
 */
export function Legend({ module }: { module: Module }) {
  const selectedId = useAtlas((s) => s.selectedId);
  const hoveredId = useAtlas((s) => s.hoveredId);
  const mode = useAtlas((s) => s.mode);

  const grouped = new Map<SystemId, typeof module.parts>();
  for (const part of module.parts) {
    const list = grouped.get(part.system) ?? [];
    list.push(part);
    grouped.set(part.system, list);
  }

  if (mode === "quiz") {
    return (
      <div className="p-5">
        <div className="plate-tag mb-3">Legend</div>
        <p className="text-[13px] leading-relaxed text-graphite">
          Hidden while the quiz is running. Finish or leave the quiz to get the
          part names back.
        </p>
      </div>
    );
  }

  return (
    <div className="plate-scroll h-full overflow-y-auto overscroll-contain">
      <div className="px-5 pt-5 pb-3">
        <div className="plate-tag">Legend</div>
      </div>

      {[...grouped.entries()].map(([system, parts]) => {
        const look = SYSTEMS[system];
        // A spine down the left of the group in the system's colour, so a
        // row's membership is legible without reading the heading. The heading
        // still says it in words — colour is never the only channel here, and
        // neither is the callout number.
        return (
          <section
            key={system}
            className="mb-1 border-l-[3px]"
            style={{ borderLeftColor: look.color }}
          >
            <h3
              className="sticky top-0 z-10 border-y border-hairline/60 px-4 py-1.5 backdrop-blur-sm"
              style={{
                background: `color-mix(in srgb, ${look.soft} 82%, transparent)`,
              }}
            >
              <span className="plate-tag" style={{ color: look.ink }}>
                {look.label}
              </span>
            </h3>

            <ul>
              {parts.map((part) => {
                const active = selectedId === part.id;
                const warm = hoveredId === part.id;
                return (
                  <li key={part.id}>
                    <button
                      type="button"
                      onClick={() => atlas.select(active ? null : part.id)}
                      onPointerEnter={() => atlas.hover(part.id)}
                      onPointerLeave={() => atlas.hover(null)}
                      onFocus={() => atlas.hover(part.id)}
                      onBlur={() => atlas.hover(null)}
                      className="flex w-full items-baseline gap-3 px-4 py-1.5 text-left transition-colors duration-150"
                      style={{
                        background: active
                          ? look.color
                          : warm
                            ? look.soft
                            : "transparent",
                        color: active ? "var(--color-paper)" : "var(--color-ink)",
                      }}
                    >
                      <span
                        className="font-mono text-[11px] tabular-nums"
                        style={{
                          color: active
                            ? "color-mix(in srgb, var(--color-paper) 72%, transparent)"
                            : "var(--color-graphite)",
                        }}
                      >
                        {String(part.callout).padStart(2, "0")}
                      </span>
                      <span className="text-[13.5px] leading-tight">
                        {part.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
