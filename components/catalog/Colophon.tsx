import { ArrowUpRight } from "lucide-react";
import { AUTHOR } from "@/content/author";
import { GithubMark } from "@/components/ui/GithubMark";

/**
 * The title block, borrowed from the drawing it is imitating.
 *
 * Every service-manual sheet ends with a block naming who drew it and what
 * sheet you are holding, so that is the shape this takes — which is also the
 * most honest place to put the repository. It is painted on the plate rather
 * than the paper for one reason: the whole page above it is near-white, so a
 * near-black block at the foot is the single loudest thing in the layout
 * without needing a colour the palette has reserved for a system.
 */
export function Colophon({
  plateCount,
  partCount,
}: {
  plateCount: number;
  partCount: number;
}) {
  return (
    <section className="on-plate mt-8 mb-6 bg-plate">
      <div className="flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="plate-tag text-plate-ink">Drawn by</p>

          <h2 className="plate-display mt-2.5 text-[30px] leading-none text-paper sm:text-[36px]">
            {AUTHOR.name}
          </h2>

          <p className="plate-tag mt-2.5 text-plate-ink">{AUTHOR.role}</p>

          <p className="mt-4 max-w-[34rem] text-[13.5px] leading-relaxed text-plate-ink">
            Every plate in this atlas is open source — the colour system, the
            balloon shader, the section cut, the quiz. Pull the repository apart
            the same way you just pulled apart the engine.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={AUTHOR.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-paper px-4 py-2.5 text-ink transition-colors hover:bg-plate-ink"
            >
              <GithubMark size={15} />
              <span className="plate-tag text-ink">Read the source</span>
            </a>

            <a
              href={AUTHOR.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 border border-plate-hairline px-4 py-2.5 transition-colors hover:border-plate-ink hover:bg-plate-hairline"
            >
              <span className="plate-tag text-plate-ink transition-colors group-hover:text-paper">
                @{AUTHOR.handle} on GitHub
              </span>
              <ArrowUpRight
                size={14}
                strokeWidth={1.75}
                className="text-plate-ink transition-colors group-hover:text-paper"
              />
            </a>
          </div>
        </div>

        {/* The sheet block. Hairline gaps rather than borders, so the rules
            read as ruled lines on a drawing instead of boxed-in cells. */}
        <dl className="grid shrink-0 grid-cols-2 gap-px bg-plate-hairline lg:w-[19rem]">
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
    <div className={`bg-plate px-4 py-3 ${span ? "col-span-2" : ""}`}>
      <dt className="plate-tag text-plate-ink">{term}</dt>
      <dd className="plate-display mt-1.5 text-[15px] text-paper">{detail}</dd>
    </div>
  );
}
