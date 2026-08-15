import { Colophon } from "@/components/catalog/Colophon";
import { ModuleCard } from "@/components/catalog/ModuleCard";
import { PartSearch } from "@/components/catalog/PartSearch";
import { SourceLink } from "@/components/ui/SourceLink";
import { SystemSwatch } from "@/components/ui/SystemSwatch";
import { SYSTEMS, SYSTEM_ORDER } from "@/content/systems";
import { listCatalogEntries, listChaptersWithEntries } from "@/lib/catalog";

export default function CatalogPage() {
  const chapters = listChaptersWithEntries();
  const entries = listCatalogEntries();
  const totalParts = entries.reduce((sum, entry) => sum + entry.partCount, 0);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[76rem] flex-col gap-6 px-4 py-6 sm:px-6">
      {/* The page header is a section rather than loose text: it carries the
          app title, the counts that describe the whole catalog, and the one
          control that reaches every plate. Those belong to one another. */}
      <section className="section-surface flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="t-page-title text-fg">Car Parts Atlas</h1>
            <p className="t-body mt-2 max-w-[38rem] text-fg-muted">
              Rotate a real part, click any numbered callout to read what it
              does, then take a labelling quiz that names a part and asks you to
              find it.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
            <SourceLink />
            <dl className="flex items-center gap-4">
              <Stat term="Plates" value={String(entries.length)} />
              <span aria-hidden className="h-7 w-px bg-edge" />
              <Stat term="Parts" value={String(totalParts)} />
              <span aria-hidden className="h-7 w-px bg-edge" />
              <Stat term="Systems" value={String(SYSTEM_ORDER.length)} />
            </dl>
          </div>
        </div>

        <div className="max-w-[32rem]">
          <PartSearch />
        </div>
      </section>

      {chapters.map(({ chapter, entries }) => (
        <section key={chapter.id} className="section-surface">
          <div className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="t-section-title text-fg">{chapter.label}</h2>
            <p className="t-small text-fg-muted">{chapter.blurb}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <ModuleCard key={entry.module.id} entry={entry} />
            ))}
          </div>
        </section>
      ))}

      <SystemKey />

      <Colophon plateCount={entries.length} partCount={totalParts} />
    </main>
  );
}

/** One figure from the catalog header, set as a labelled stat rather than prose. */
function Stat({ term, value }: { term: string; value: string }) {
  return (
    <div className="text-right">
      <dt className="t-field-label">{term}</dt>
      <dd className="t-code mt-0.5 text-[14px] text-fg">{value}</dd>
    </div>
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
    <section className="section-surface">
      <div className="mb-4">
        <h2 className="t-section-title text-fg">Colour means system</h2>
        <p className="t-small mt-1 text-fg-muted">
          Eleven systems, each with one hue it wears on every plate — in the
          legend, on its balloon, and on its leader line.
        </p>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SYSTEM_ORDER.map((system) => {
          const look = SYSTEMS[system];
          return (
            <li
              key={system}
              className="widget flex items-start gap-2.5 border-l-[3px] p-3"
              style={{ borderLeftColor: look.color }}
            >
              <SystemSwatch system={system} size={16} />
              <span className="min-w-0">
                <span
                  className="t-label block"
                  style={{ color: look.ink }}
                >
                  {look.label}
                </span>
                <span className="t-small mt-0.5 block text-fg-muted">
                  {look.blurb}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
