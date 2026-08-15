import { ArrowUpRight } from "lucide-react";
import { AUTHOR } from "@/content/author";
import { GithubMark } from "@/components/ui/GithubMark";

/**
 * The title block, borrowed from the drawing this atlas is documenting.
 *
 * Every service-manual sheet ends with a block naming who drew it and what
 * sheet you are holding, so that is the shape this takes — which is also the
 * most honest place to put the repository. It sits on the viewport ground
 * rather than the section ground so it closes the page the way the plate opens
 * it, without borrowing a colour the palette has reserved for a system.
 */
export function Colophon({
  plateCount,
  partCount,
}: {
  plateCount: number;
  partCount: number;
}) {
  return (
    <section className="mb-2 rounded-[var(--radius-section)] border border-edge bg-viewport">
      <div className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="t-field-label">Drawn by</p>

          <h2 className="t-page-title mt-2 text-fg">{AUTHOR.name}</h2>

          <p className="t-label mt-1.5 text-fg-muted">{AUTHOR.role}</p>

          <p className="t-body mt-4 max-w-[36rem] text-fg-muted">
            Every plate in this atlas is open source — the colour system, the
            balloon shader, the section cut, the quiz. Pull the repository apart
            the same way you just pulled apart the engine.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <a
              href={AUTHOR.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <GithubMark size={14} />
              Read the source
            </a>

            <a
              href={AUTHOR.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              @{AUTHOR.handle} on GitHub
              <ArrowUpRight size={13} strokeWidth={2} />
            </a>
          </div>
        </div>

        {/* The sheet block. Hairline gaps rather than borders, so the rules
            read as ruled lines on a drawing instead of boxed-in cells. */}
        <dl className="grid shrink-0 grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-widget)] bg-edge lg:w-[19rem]">
          <SheetCell term="Plates" detail={String(plateCount)} />
          <SheetCell term="Parts" detail={String(partCount)} />
          <SheetCell term="Drawn with" detail="Next.js · three.js" span />
        </dl>
      </div>
    </section>
  );
}

function SheetCell({
  term,
  detail,
  span = false,
}: {
  term: string;
  detail: string;
  span?: boolean;
}) {
  return (
    <div className={`bg-widget px-4 py-3 ${span ? "col-span-2" : ""}`}>
      <dt className="t-field-label">{term}</dt>
      <dd className="t-label mt-1.5 text-fg">{detail}</dd>
    </div>
  );
}
