"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, GraduationCap, RotateCcw } from "lucide-react";
import type { CatalogEntry } from "@/lib/catalog";
import { useIsAuthoring, useQueryFlag } from "@/lib/useQueryFlag";
import { atlas, getState, useAtlas } from "@/lib/store";
import { SourceLink } from "./ui/SourceLink";
import { Viewport } from "./Viewport";
import { AuthoringPanel, type AuthoredMap } from "./ui/AuthoringPanel";
import { Legend } from "./ui/Legend";
import { PartCard } from "./ui/PartCard";
import { QuizPanel } from "./ui/QuizPanel";
import { SectionSlider } from "./ui/SectionSlider";

export function Atlas({ entry }: { entry: CatalogEntry }) {
  const { module } = entry;
  const authoring = useIsAuthoring();
  const mode = useAtlas((s) => s.mode);

  // Escape backs out of whatever is open — the part card first, then the quiz.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const { selectedId, mode: current } = getState();
      if (current === "quiz") atlas.exitQuiz();
      else if (selectedId) atlas.select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useDeepLinkedPart(entry);

  const [authored, setAuthored] = useState<AuthoredMap>({});
  const [armedId, setArmedId] = useState<string | null>(
    module.parts[0]?.id ?? null,
  );

  const onAuthor = useCallback(
    ({ position }: { position: [number, number, number] }) => {
      if (!armedId) return;
      setAuthored((previous) => ({ ...previous, [armedId]: position }));

      // Step to the next part that still needs a coordinate.
      const index = module.parts.findIndex((part) => part.id === armedId);
      setArmedId(module.parts[index + 1]?.id ?? null);
    },
    [armedId, module.parts],
  );

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-paper">
      <PlateHeader entry={entry} />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[16rem] shrink-0 flex-col border-r border-hairline bg-paper md:flex">
          <Legend entry={entry} />
        </aside>

        <div className="relative min-w-0 flex-1">
          <Viewport entry={entry} authoring={authoring} onAuthor={onAuthor} />

          {mode === "explore" && <SectionSlider />}
          <PartCard entry={entry} />
          <QuizPanel entry={entry} />

          {authoring && (
            <AuthoringPanel
              module={module}
              authored={authored}
              armedId={armedId}
              onArm={setArmedId}
              onReset={() => {
                setAuthored({});
                setArmedId(module.parts[0]?.id ?? null);
              }}
            />
          )}

          {!authoring && mode === "explore" && <Hint />}
        </div>
      </div>
    </main>
  );
}

/**
 * Opens the plate with a part already selected, so a search result or a shared
 * link lands on the part rather than on the plate it happens to live on.
 *
 * Runs once per module: after that the selection belongs to the user, and
 * re-applying the query parameter would fight every click they make.
 */
function useDeepLinkedPart(entry: CatalogEntry) {
  const requestedPartId = useQueryFlag("part");
  const ready = useAtlas((s) => s.ready);

  useEffect(() => {
    if (!ready || !requestedPartId) return;
    const exists = entry.module.parts.some((part) => part.id === requestedPartId);
    if (exists) atlas.select(requestedPartId);
    // Intentionally keyed to the module, not to the selection: this is an
    // opening state, not a binding.
  }, [ready, requestedPartId, entry.module]);
}

function PlateHeader({ entry }: { entry: CatalogEntry }) {
  const mode = useAtlas((s) => s.mode);
  const ready = useAtlas((s) => s.ready);
  const { module, figure } = entry;

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-hairline bg-paper px-4 py-2.5">
      <div className="flex min-w-0 items-baseline gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-graphite transition-colors hover:text-ink"
        >
          <ArrowLeft size={13} strokeWidth={1.75} />
          <span className="plate-display text-[13px] tracking-[0.02em]">
            Atlas
          </span>
        </Link>

        <span className="hidden h-3 w-px bg-hairline sm:block" />

        <span className="plate-tag hidden truncate sm:block">
          {figure} — {module.name}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <SourceLink label="Source" compactLabel />

        {mode === "explore" ? (
          <button
            type="button"
            disabled={!ready}
            onClick={() => atlas.startQuiz(module.parts.map((part) => part.id))}
            className="flex items-center gap-1.5 bg-ink px-3 py-1.5 text-paper transition-colors hover:bg-graphite disabled:opacity-40"
          >
            <GraduationCap size={13} strokeWidth={1.75} />
            <span className="plate-tag text-paper">Take the quiz</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={atlas.exitQuiz}
            className="flex items-center gap-1.5 border border-hairline px-3 py-1.5 transition-colors hover:bg-paper-sunk"
          >
            <RotateCcw size={13} strokeWidth={1.75} />
            <span className="plate-tag">Back to the plate</span>
          </button>
        )}
      </div>
    </header>
  );
}

function Hint() {
  const selectedId = useAtlas((s) => s.selectedId);
  const ready = useAtlas((s) => s.ready);
  if (selectedId || !ready) return null;

  return (
    <div className="pointer-events-none absolute top-0 left-0 z-10 p-4">
      <p className="max-w-[15rem] text-[12.5px] leading-relaxed text-plate-ink">
        Drag to rotate. Click a numbered balloon to read the part.
      </p>
    </div>
  );
}
