"use client";

import type { CSSProperties } from "react";
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

      {[...grouped.entries()].map(([system, parts]) => (
        <section
          key={system}
          className="mb-1"
          style={
            {
              "--system-color": SYSTEMS[system].color,
              "--system-soft": SYSTEMS[system].soft,
              "--system-ink": SYSTEMS[system].ink,
            } as CSSProperties
          }
        >
          <h3 className="sticky top-0 z-10 border-y border-hairline/70 bg-[var(--system-soft)]/90 px-5 py-2 backdrop-blur-sm">
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full bg-[var(--system-color)] shadow-[0_0_0_3px_rgba(255,255,255,0.72)]"
              />
              <span className="plate-tag text-[var(--system-ink)]">
                {SYSTEMS[system].label}
              </span>
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
                    className={`flex w-full items-baseline gap-3 border-l-4 px-5 py-1.5 text-left transition-colors duration-150 ${
                      active
                        ? "border-[var(--system-color)] bg-[var(--system-color)] text-white"
                        : warm
                          ? "border-[var(--system-color)] bg-[var(--system-soft)] text-ink"
                          : "border-transparent text-ink hover:border-[var(--system-color)] hover:bg-[var(--system-soft)]"
                    }`}
                  >
                    <span
                      className={`grid h-5 min-w-5 place-items-center rounded-full border font-mono text-[10px] tabular-nums ${
                        active
                          ? "border-white/40 bg-white/15 text-white"
                          : "border-[var(--system-color)] bg-white text-[var(--system-ink)]"
                      }`}
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
      ))}
    </div>
  );
}
