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
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-page">
      <PlateHeader entry={entry} />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[16rem] shrink-0 flex-col border-r border-edge bg-section md:flex">
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
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-edge bg-section px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        {/* Navigation is chrome, not an action — it gets the minimal rung so
            the one filled button in this rail is unambiguous. */}
        <Link href="/" className="btn btn-minimal btn-sm">
          <ArrowLeft size={13} strokeWidth={2} />
          Atlas
        </Link>

        <span aria-hidden className="hidden h-4 w-px bg-edge sm:block" />

        <span className="t-code hidden truncate text-fg-dim sm:block">
          {figure}
        </span>
        <span className="t-label hidden truncate text-fg-muted sm:block">
          {module.name}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <SourceLink label="Source" compactLabel className="btn-minimal" />

        {mode === "explore" ? (
          /* The primary action of the whole plate. It is the only filled
             control in this header, which is the entire point of the rung. */
          <button
            type="button"
            disabled={!ready}
            onClick={() => atlas.startQuiz(module.parts.map((part) => part.id))}
            className="btn btn-primary"
          >
            <GraduationCap size={13} strokeWidth={2} />
            Take the quiz
          </button>
        ) : (
          /* Leaving the quiz is a real alternative to finishing it, not the
             recommended path — bordered, never filled. */
          <button type="button" onClick={atlas.exitQuiz} className="btn">
            <RotateCcw size={13} strokeWidth={2} />
            Back to the plate
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
    <div className="pointer-events-none absolute top-0 left-0 z-10 p-3">
      <p className="overlay-panel t-small max-w-[15rem] px-3 py-2 text-fg-muted">
        Drag to rotate. Click a numbered balloon to read the part.
      </p>
    </div>
  );
}
