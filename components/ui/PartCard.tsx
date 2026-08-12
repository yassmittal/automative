"use client";

import { X } from "lucide-react";
import { SYSTEMS, type Module } from "@/content/types";
import { atlas, useAtlas } from "@/lib/store";

/** The read-out for one part. Slides in over the plate, never reflows it. */
export function PartCard({ module }: { module: Module }) {
  const selectedId = useAtlas((s) => s.selectedId);
  const part = module.parts.find((p) => p.id === selectedId);
  const open = Boolean(part);

  return (
    <aside
      aria-hidden={!open}
      className={`pointer-events-none absolute top-0 right-0 z-20 flex h-full w-full max-w-[22rem] flex-col transition-[transform,opacity] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        open ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
      }`}
    >
      {part && (
        <div className="plate-scroll pointer-events-auto m-3 max-h-[calc(100%-1.5rem)] overflow-y-auto border border-hairline bg-paper/95 shadow-[0_1px_24px_rgba(23,26,23,0.10)] backdrop-blur-sm">
          <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-hairline bg-paper/95 px-5 pt-4 pb-3 backdrop-blur-sm">
            <div>
              <div className="plate-tag">
                {module.figure} · Callout{" "}
                {String(part.callout).padStart(2, "0")}
              </div>
              <h2 className="plate-display mt-1.5 text-[26px] leading-[1.05] text-ink">
                {part.name}
              </h2>
              <div className="mt-1.5 text-[12px] text-graphite">
                {SYSTEMS[part.system].label} — {SYSTEMS[part.system].blurb}
              </div>
            </div>

            <button
              type="button"
              onClick={() => atlas.select(null)}
              aria-label="Close part details"
              className="-mr-1 shrink-0 border border-hairline p-1.5 text-graphite transition-colors hover:bg-annotate-soft hover:text-ink"
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
          </div>
        </div>
      )}
    </aside>
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
