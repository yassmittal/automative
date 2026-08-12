"use client";

import { useCallback, useEffect, useState } from "react";
import { GraduationCap, RotateCcw } from "lucide-react";
import type { Module } from "@/content/types";
import { useIsAuthoring } from "@/lib/useQueryFlag";
import { atlas, getState, useAtlas } from "@/lib/store";
import { Viewport } from "./Viewport";
import { AuthoringPanel, type AuthoredMap } from "./ui/AuthoringPanel";
import { Legend } from "./ui/Legend";
import { PartCard } from "./ui/PartCard";
import { QuizPanel } from "./ui/QuizPanel";
import { SectionSlider } from "./ui/SectionSlider";

export function Atlas({ module }: { module: Module }) {
  const authoring = useIsAuthoring();
  const mode = useAtlas((s) => s.mode);

  // Escape backs out of whatever is open — the part card first, then the quiz.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const { selectedId, mode: current } = getState();
      if (current === "quiz") atlas.exitQuiz();
      else if (selectedId) atlas.select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const [authored, setAuthored] = useState<AuthoredMap>({});
  const [armedId, setArmedId] = useState<string | null>(
    module.parts[0]?.id ?? null,
  );

  const onAuthor = useCallback(
    ({ position }: { position: [number, number, number] }) => {
      if (!armedId) return;
      setAuthored((prev) => ({ ...prev, [armedId]: position }));

      // Step to the next part that still needs a coordinate.
      const index = module.parts.findIndex((p) => p.id === armedId);
      const next = module.parts.slice(index + 1)[0];
      setArmedId(next?.id ?? null);
    },
    [armedId, module.parts],
  );

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-plate">
      <PlateHeader module={module} />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[15.5rem] shrink-0 flex-col border-r border-hairline bg-plate md:flex">
          <Legend module={module} />
        </aside>

        <div className="relative min-w-0 flex-1">
          <Viewport
            module={module}
            authoring={authoring}
            onAuthor={onAuthor}
          />

          {mode === "explore" && <SectionSlider />}
          <PartCard module={module} />
          <QuizPanel module={module} />

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

function PlateHeader({ module }: { module: Module }) {
  const mode = useAtlas((s) => s.mode);
  const ready = useAtlas((s) => s.ready);

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-hairline bg-plate px-4 py-2.5">
      <div className="flex items-baseline gap-3">
        <span className="plate-display text-[13px] tracking-[0.02em] text-ink">
          Car Parts Atlas
        </span>
        <span className="hidden h-3 w-px bg-hairline sm:block" />
        <span className="plate-tag hidden sm:block">
          {module.figure} — {module.name}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {mode === "explore" ? (
          <button
            type="button"
            disabled={!ready}
            onClick={() => atlas.startQuiz(module.parts.map((p) => p.id))}
            className="flex items-center gap-1.5 bg-ink px-3 py-1.5 text-paper transition-colors hover:bg-graphite disabled:opacity-40"
          >
            <GraduationCap size={13} strokeWidth={1.75} />
            <span className="plate-tag text-paper">Take the quiz</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={atlas.exitQuiz}
            className="flex items-center gap-1.5 border border-hairline px-3 py-1.5 transition-colors hover:bg-wash"
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
      <p className="max-w-[15rem] text-[12.5px] leading-relaxed text-graphite">
        Drag to rotate. Click a numbered balloon to read the part.
      </p>
    </div>
  );
}
