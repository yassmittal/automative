import { ModuleCard } from "@/components/catalog/ModuleCard";
import { PartSearch } from "@/components/catalog/PartSearch";
import { SystemSwatch } from "@/components/ui/SystemSwatch";
import { SYSTEMS, SYSTEM_ORDER } from "@/content/systems";
import { listCatalogEntries, listChaptersWithEntries } from "@/lib/catalog";

export default function CatalogPage() {
  const chapters = listChaptersWithEntries();
  const totalParts = listCatalogEntries().reduce(
    (sum, entry) => sum + entry.partCount,
    0,
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[68rem] flex-col px-5 py-8 sm:px-8">
      <header className="flex flex-col gap-6 border-b border-hairline pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="plate-display text-[30px] leading-none text-ink sm:text-[38px]">
              Car Parts Atlas
            </h1>
            <p className="mt-2 max-w-[34rem] text-[14px] leading-relaxed text-graphite">
              Rotate a real part, click any numbered callout to read what it
              does, then take a labelling quiz that names a part and asks you to
              find it.
            </p>
          </div>

          <p className="plate-tag">
            {listCatalogEntries().length} plates · {totalParts} parts
          </p>
        </div>

        <div className="max-w-[30rem]">
          <PartSearch />
        </div>
      </header>

      {chapters.map(({ chapter, entries }) => (
        <section key={chapter.id} className="border-b border-hairline py-8">
          <div className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="plate-display text-[19px] text-ink">
              {chapter.label}
            </h2>
            <p className="text-[13px] text-graphite">{chapter.blurb}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <ModuleCard key={entry.module.id} entry={entry} />
            ))}
          </div>
        </section>
      ))}

      <SystemKey />
    </main>
  );
}

/**
 * The colour key for the whole atlas.
 *
 * It sits at the bottom of the catalog rather than inside a plate because it is
 * the one claim that spans every plate: a hue means the same system wherever
 * you meet it. Reading it once should make every legend afterwards redundant.
 */
function SystemKey() {
  return (
    <section className="py-8">
      <h2 className="plate-tag mb-4">Colour means system</h2>

      <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {SYSTEM_ORDER.map((system) => (
          <li key={system} className="flex items-start gap-2.5">
            <SystemSwatch system={system} size={16} />
            <span className="min-w-0">
              <span className="block text-[13px] leading-tight text-ink">
                {SYSTEMS[system].label}
              </span>
              <span className="block text-[12.5px] leading-snug text-graphite">
                {SYSTEMS[system].blurb}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
