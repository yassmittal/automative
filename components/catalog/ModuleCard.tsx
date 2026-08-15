import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SYSTEMS } from "@/content/systems";
import type { CatalogEntry } from "@/lib/catalog";

/**
 * One plate in the catalog, as a widget.
 *
 * The strip along the top carries the figure number and a dot per system the
 * module covers, because the systems are the most useful thing to know before
 * opening it — "this one is cooling and lubrication" tells you more about
 * whether it is worth your time than any thumbnail would. The strip takes the
 * viewport's ground so the card previews what it opens.
 */
export function ModuleCard({ entry }: { entry: CatalogEntry }) {
  const { module, figure, systems, partCount } = entry;

  return (
    <Link
      href={`/module/${module.id}`}
      className="widget group flex flex-col p-0 transition-colors hover:border-primary"
    >
      <div className="flex items-center gap-2 rounded-t-[3px] border-b border-edge bg-viewport px-3 py-2">
        <span className="t-code text-fg-dim">{figure}</span>

        <span className="ml-auto flex items-center gap-1.5">
          {systems.map((system) => (
            <span
              key={system}
              title={SYSTEMS[system].label}
              className="h-2 w-2 rounded-full"
              style={{ background: SYSTEMS[system].beacon }}
            />
          ))}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="t-widget-title text-fg">{module.name}</h3>
          <ArrowUpRight
            size={15}
            strokeWidth={2}
            className="mt-1 shrink-0 text-fg-dim transition-colors group-hover:text-primary-light"
          />
        </div>

        <p className="t-field-label">{module.subtitle}</p>

        <p className="t-small mt-1 text-fg-muted">{module.blurb}</p>

        <p className="t-code mt-auto pt-3 text-fg-dim">
          {partCount} parts · {systems.length}{" "}
          {systems.length === 1 ? "system" : "systems"}
        </p>
      </div>
    </Link>
  );
}
