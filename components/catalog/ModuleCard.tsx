import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SYSTEMS } from "@/content/systems";
import type { CatalogEntry } from "@/lib/catalog";

/**
 * One plate in the catalog.
 *
 * The card leads with a dark tile because that is what the plate itself looks
 * like, and because the systems a module covers are the most useful thing to
 * know before opening it — "this one is cooling and lubrication" tells you more
 * about whether it is worth your time than any thumbnail would.
 */
export function ModuleCard({ entry }: { entry: CatalogEntry }) {
  const { module, figure, systems, partCount } = entry;

  return (
    <Link
      href={`/module/${module.id}`}
      className="group flex flex-col border border-hairline bg-paper transition-colors hover:border-ink"
    >
      <div className="on-plate relative flex items-end gap-2 overflow-hidden bg-plate p-3">
        <span className="plate-tag text-plate-ink">{figure}</span>

        <span className="ml-auto flex items-center gap-1.5">
          {systems.map((system) => (
            <span
              key={system}
              title={SYSTEMS[system].label}
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: SYSTEMS[system].beacon }}
            />
          ))}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="plate-display text-[17px] leading-tight text-ink">
            {module.name}
          </h3>
          <ArrowUpRight
            size={15}
            strokeWidth={1.75}
            className="mt-0.5 shrink-0 text-graphite transition-colors group-hover:text-ink"
          />
        </div>

        <p className="plate-tag">{module.subtitle}</p>

        <p className="mt-1 text-[13px] leading-relaxed text-graphite">
          {module.blurb}
        </p>

        <p className="plate-tag mt-auto pt-3">
          {partCount} parts · {systems.length}{" "}
          {systems.length === 1 ? "system" : "systems"}
        </p>
      </div>
    </Link>
  );
}
