"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, RotateCcw, X } from "lucide-react";
import type { CatalogEntry } from "@/lib/catalog";
import { AUTHOR } from "@/content/author";
import { atlas, useAtlas } from "@/lib/store";
import { annotationScreen } from "../scene/Annotation";
import { GithubMark } from "./GithubMark";

/**
 * The labelling quiz. It reuses the plate exactly as-is — the same balloons,
 * the same click handling — and only changes what a click means.
 *
 * Feedback opens on whichever half of the plate the answer is *not* in, so
 * the panel never lands on top of the part you were just asked to find.
 */
export function QuizPanel({ entry }: { entry: CatalogEntry }) {
  const { module } = entry;
  const mode = useAtlas((s) => s.mode);
  const quiz = useAtlas((s) => s.quiz);
  const [side, setSide] = useState<"top" | "bottom">("bottom");

  const answered = quiz.phase === "correct" || quiz.phase === "wrong";

  // Sample where the revealed balloon is the moment the question resolves.
  useEffect(() => {
    if (!answered) return;
    const id = requestAnimationFrame(() => {
      setSide(
        annotationScreen.valid && annotationScreen.y > 0.55 ? "top" : "bottom",
      );
    });
    return () => cancelAnimationFrame(id);
  }, [answered, quiz.index]);

  // Enter/space advances, so you can run the whole quiz without the mouse.
  useEffect(() => {
    if (!answered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        atlas.nextQuestion();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answered]);

  if (mode !== "quiz") return null;

  const total = quiz.queue.length;
  const target = module.parts.find((p) => p.id === quiz.queue[quiz.index]);
  const missed = module.parts.find((p) => p.id === quiz.missedId);

  if (quiz.phase === "done") {
    return <Scorecard entry={entry} score={quiz.score} total={total} />;
  }

  return (
    <>
      {/* Progress rail, always at the top — it never moves. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center p-3">
        <div className="overlay-panel pointer-events-auto flex items-center gap-3 py-1.5 pr-1.5 pl-4">
          <span className="t-field-label">
            Question {quiz.index + 1} / {total}
          </span>
          <span aria-hidden className="h-4 w-px bg-edge" />
          <span className="t-code text-fg">{quiz.score} correct</span>
          <button
            type="button"
            onClick={atlas.exitQuiz}
            className="btn btn-minimal btn-sm"
          >
            <X size={12} strokeWidth={2} />
            Leave
          </button>
        </div>
      </div>

      <div
        className={`pointer-events-none absolute inset-x-0 z-30 flex justify-center p-4 transition-[top,bottom] duration-300 ${
          side === "top" ? "top-14" : "bottom-0"
        }`}
      >
        <div className="overlay-surface pointer-events-auto w-full max-w-md p-5">
          {quiz.phase === "asking" && (
            <>
              <div className="t-field-label mb-2">Click it on the model</div>
              <h2 className="t-page-title text-[28px] text-fg">
                {target?.name}
              </h2>
              <p className="t-small mt-3 text-fg-muted">{target?.summary}</p>
            </>
          )}

          {quiz.phase === "correct" && (
            <Verdict
              tone="correct"
              title="Correct"
              body={`That is the ${target?.name.toLowerCase()}.`}
              detail={target?.fact}
            />
          )}

          {quiz.phase === "wrong" && (
            <Verdict
              tone="wrong"
              title="Not quite"
              body={
                missed
                  ? `You picked the ${missed.name.toLowerCase()}. The ${target?.name.toLowerCase()} is the one flashing green.`
                  : `The ${target?.name.toLowerCase()} is the one flashing green.`
              }
              detail={target?.summary}
            />
          )}

          {/* Once a question is answered there is exactly one thing to do, and
              the button says so: full width, filled, focused. */}
          {answered && (
            <button
              type="button"
              onClick={atlas.nextQuestion}
              autoFocus
              className="btn btn-primary btn-lg btn-block mt-4"
            >
              {quiz.index + 1 >= total ? "See score" : "Next part"}
              <ArrowRight size={14} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function Verdict({
  tone,
  title,
  body,
  detail,
}: {
  tone: "correct" | "wrong";
  title: string;
  body: string;
  detail?: string;
}) {
  const correct = tone === "correct";
  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`grid h-5 w-5 place-items-center rounded-full ${
            correct ? "bg-correct" : "bg-wrong"
          }`}
        >
          {correct ? (
            <Check size={12} strokeWidth={3} color="#ffffff" />
          ) : (
            <X size={12} strokeWidth={3} color="#ffffff" />
          )}
        </span>
        <span
          className="t-widget-title"
          style={{ color: correct ? "var(--correct)" : "var(--wrong)" }}
        >
          {title}
        </span>
      </div>
      <p className="t-body text-fg">{body}</p>
      {detail && <p className="t-small mt-2 text-fg-muted">{detail}</p>}
    </>
  );
}

function Scorecard({
  entry,
  score,
  total,
}: {
  entry: CatalogEntry;
  score: number;
  total: number;
}) {
  const { module } = entry;
  const pct = Math.round((score / total) * 100);
  const verdict =
    pct === 100
      ? "Every part, first go."
      : pct >= 75
        ? "You know your way around this plate."
        : pct >= 40
          ? "The big ones are landing. The accessories need another pass."
          : "Worth a lap through the legend before trying again.";

  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-[color-mix(in_srgb,var(--color-viewport-deep)_78%,transparent)] p-6 backdrop-blur-md">
      <div className="console-rise overlay-surface w-full max-w-sm p-7">
        <div className="t-field-label">Result</div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="t-page-title text-[64px] leading-none text-fg tabular-nums">
            {score}
          </span>
          <span className="t-code text-[15px] text-fg-dim">/ {total}</span>
        </div>

        <p className="t-body mt-3 text-fg-muted">{verdict}</p>

        {/* Running it again is what this screen is for; going back is merely
            allowed. One filled, one bordered — never two of either. */}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => atlas.startQuiz(module.parts.map((p) => p.id))}
            autoFocus
            className="btn btn-primary btn-lg flex-1"
          >
            <RotateCcw size={14} strokeWidth={2} />
            Try again
          </button>
          <button
            type="button"
            onClick={atlas.exitQuiz}
            className="btn btn-lg flex-1"
          >
            Back to the plate
          </button>
        </div>

        {/* The one moment someone has finished the thing and is still looking
            at it — the cheapest possible place to say who made it. */}
        <a
          href={AUTHOR.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-6 flex items-center gap-2 border-t border-edge pt-4 text-fg-dim transition-colors hover:text-fg"
        >
          <GithubMark size={14} />
          <span className="t-label">
            Built by {AUTHOR.name} — read the source
          </span>
          <ArrowUpRight
            size={13}
            strokeWidth={1.75}
            className="ml-auto shrink-0"
          />
        </a>
      </div>
    </div>
  );
}
