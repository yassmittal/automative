"use client";

import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { SYSTEMS } from "@/content/systems";
import { findCatalogEntry, type CatalogEntry } from "@/lib/catalog";
import { atlas, useAtlas } from "@/lib/store";

/** The read-out for one part. Slides in over the plate, never reflows it. */
export function PartCard({ entry }: { entry: CatalogEntry }) {
  const selectedId = useAtlas((s) => s.selectedId);
  const part = entry.module.parts.find((candidate) => candidate.id === selectedId);
  const open = Boolean(part);
  const look = part ? SYSTEMS[part.system] : null;

  return (
    <aside
      aria-hidden={!open}
      className={`pointer-events-none absolute top-0 right-0 z-20 flex h-full w-full max-w-[22rem] flex-col transition-[transform,opacity] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        open ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
      }`}
    >
      {part && look && (
        <div className="plate-scroll pointer-events-auto m-3 max-h-[calc(100%-1.5rem)] overflow-y-auto border border-hairline bg-paper shadow-[0_2px_28px_rgba(0,0,0,0.45)]">
          {/* The header wears the system's colour, so the card, the legend row
              and the balloon on the model all agree at a glance. */}
          <header
            className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b-2 px-5 pt-4 pb-3 backdrop-blur-sm"
            style={{
              borderBottomColor: look.color,
              background: `color-mix(in srgb, ${look.soft} 88%, transparent)`,
            }}
          >
            <div>
              <div className="plate-tag" style={{ color: look.ink }}>
                {entry.figure} · Callout {String(part.callout).padStart(2, "0")}
              </div>
              <h2 className="plate-display mt-1.5 text-[26px] leading-[1.05] text-ink">
                {part.name}
              </h2>
              <div className="mt-1.5 text-[12px] text-graphite">
                {look.label} — {look.blurb}
              </div>
            </div>

            <button
              type="button"
              onClick={() => atlas.select(null)}
              aria-label="Close part details"
              className="-mr-1 shrink-0 border border-hairline bg-paper/70 p-1.5 text-graphite transition-colors hover:bg-paper hover:text-ink"
            >
              <X size={13} strokeWidth={1.75} />
            </button>
          </header>

          <div className="space-y-5 px-5 py-5">
            <Field label="What it does">{part.summary}</Field>
            <Field label="Worth knowing">{part.fact}</Field>

            <div>
              <div className="plate-tag mb-2">When it fails</div>
              <ul className="space-y-1.5">
                {part.symptoms.map((symptom) => (
                  <li
                    key={symptom}
                    className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink"
                  >
                    <span
                      aria-hidden
                      className="mt-[0.55em] h-px w-2.5 shrink-0 bg-graphite"
                    />
                    {symptom}
                  </li>
                ))}
              </ul>
            </div>

            <Field label="Service">{part.service}</Field>

            {part.detailModuleId && <DetailModuleLink moduleId={part.detailModuleId} />}
          </div>
        </div>
      )}
    </aside>
  );
}

/**
 * The link out to a plate that shows this part on its own.
 *
 * This is what stops the atlas being a set of unrelated figures: meeting the
 * cylinder head as one callout on the engine and then opening the plate that is
 * nothing but the head is the same move as turning to a referenced figure in a
 * manual, and it is the main way someone goes deeper without going back to the
 * catalog to guess.
 */
function DetailModuleLink({ moduleId }: { moduleId: string }) {
  const target = findCatalogEntry(moduleId);
  if (!target) return null;

  return (
    <Link
      href={`/module/${target.module.id}`}
      className="group flex items-center justify-between gap-3 border border-hairline px-4 py-3 transition-colors hover:border-ink"
    >
      <span>
        <span className="plate-tag block">Shown in full on</span>
        <span className="plate-display mt-1 block text-[15px] leading-none text-ink">
          {target.module.name}
        </span>
      </span>
      <ArrowUpRight
        size={15}
        strokeWidth={1.75}
        className="shrink-0 text-graphite transition-colors group-hover:text-ink"
      />
    </Link>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="plate-tag mb-1.5">{label}</div>
      <p className="text-[13.5px] leading-relaxed text-ink">{children}</p>
    </div>
  );
}
