"use client";

import { SYSTEMS } from "@/content/systems";
import type { Part, SystemId } from "@/content/types";
import type { CatalogEntry } from "@/lib/catalog";
import { atlas, useAtlas } from "@/lib/store";
import { SystemSwatch } from "./SystemSwatch";

/**
 * The legend half of the figure plate: every callout number keyed to a part
 * name, grouped by the system it belongs to.
 *
 * The numbering here is the same numbering stamped on the balloons, which is
 * the whole reason it earns its place — it is a lookup table, not decoration.
 */
export function Legend({ entry }: { entry: CatalogEntry }) {
  const { module } = entry;
  const selectedId = useAtlas((s) => s.selectedId);
  const hoveredId = useAtlas((s) => s.hoveredId);
  const mode = useAtlas((s) => s.mode);

  if (mode === "quiz") {
    return (
      <div className="p-5">
        <div className="t-field-label mb-3">Legend</div>
        <p className="t-small text-fg-muted">
          Hidden while the quiz is running. Finish or leave the quiz to get the
          part names back.
        </p>
      </div>
    );
  }

  return (
    <div className="console-scroll h-full overflow-y-auto overscroll-contain">
      <div className="px-4 pt-4 pb-3">
        <div className="t-field-label">Legend</div>
      </div>

      {groupBySystem(module.parts).map(([system, parts]) => {
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
              className="sticky top-0 z-10 flex items-center gap-2 border-y border-edge px-4 py-1.5"
              style={{ background: look.soft }}
            >
              <SystemSwatch system={system} size={14} />
              <span className="t-label" style={{ color: look.ink }}>
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
                        // The mark is a *light* colour — it is tuned to read
                        // against a dark ground, not to sit behind pale text.
                        // A selected row therefore flips to dark ink, which is
                        // the only legible thing to print on it.
                        color: active
                          ? "var(--color-viewport)"
                          : "var(--color-fg)",
                      }}
                    >
                      <span
                        className="t-code"
                        style={{
                          color: active
                            ? "color-mix(in srgb, var(--color-viewport) 68%, transparent)"
                            : "var(--color-fg-dim)",
                        }}
                      >
                        {String(part.callout).padStart(2, "0")}
                      </span>
                      <span className="t-body leading-tight">{part.name}</span>
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

/** Groups parts under their system, in the order the parts are authored in. */
function groupBySystem(parts: Part[]): [SystemId, Part[]][] {
  const grouped = new Map<SystemId, Part[]>();
  for (const part of parts) {
    const list = grouped.get(part.system) ?? [];
    list.push(part);
    grouped.set(part.system, list);
  }
  return [...grouped.entries()];
}
