"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, RotateCcw, X } from "lucide-react";
import type { Module } from "@/content/types";
import { atlas, useAtlas } from "@/lib/store";
import { annotationScreen } from "../scene/Annotation";

/**
 * The labelling quiz. It reuses the plate exactly as-is — the same balloons,
 * the same click handling — and only changes what a click means.
 *
 * Feedback opens on whichever half of the plate the answer is *not* in, so
 * the panel never lands on top of the part you were just asked to find.
 */
export function QuizPanel({ module }: { module: Module }) {
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
    return <Scorecard module={module} score={quiz.score} total={total} />;
  }

  return (
    <>
      {/* Progress rail, always at the top — it never moves. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center p-3">
        <div className="pointer-events-auto flex items-center gap-4 border border-hairline bg-paper/95 px-4 py-2 shadow-sm backdrop-blur-sm">
          <span className="plate-tag">
            Question {quiz.index + 1} / {total}
          </span>
          <span className="h-3 w-px bg-hairline" />
          <span className="font-mono text-[11px] tabular-nums text-ink">
            {quiz.score} correct
          </span>
          <button
            type="button"
            onClick={atlas.exitQuiz}
            className="ml-1 flex items-center gap-1 text-graphite transition-colors hover:text-ink"
          >
            <X size={12} strokeWidth={2} />
            <span className="plate-tag">Leave</span>
          </button>
        </div>
      </div>

      <div
        className={`pointer-events-none absolute inset-x-0 z-30 flex justify-center p-4 transition-[top,bottom] duration-300 ${
          side === "top" ? "top-14" : "bottom-0"
        }`}
      >
        <div className="pointer-events-auto w-full max-w-md border border-hairline bg-paper/97 p-5 shadow-[0_1px_24px_rgba(23,26,23,0.12)] backdrop-blur-sm">
          {quiz.phase === "asking" && (
            <>
              <div className="plate-tag mb-2">Click it on the engine</div>
              <h2 className="plate-display text-[28px] leading-none text-ink">
                {target?.name}
              </h2>
              <p className="mt-3 text-[13px] leading-relaxed text-graphite">
                {target?.summary}
              </p>
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

          {answered && (
            <button
              type="button"
              onClick={atlas.nextQuestion}
              autoFocus
              className="mt-4 flex w-full items-center justify-center gap-2 bg-ink px-4 py-2.5 text-paper transition-colors hover:bg-annotate"
            >
              <span className="plate-tag text-paper">
                {quiz.index + 1 >= total ? "See score" : "Next part"}
              </span>
              <ArrowRight size={13} strokeWidth={2} />
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
            <Check size={12} strokeWidth={3} color="#edeeea" />
          ) : (
            <X size={12} strokeWidth={3} color="#edeeea" />
          )}
        </span>
        <span
          className="plate-display text-[17px]"
          style={{ color: correct ? "var(--color-correct)" : "var(--color-wrong)" }}
        >
          {title}
        </span>
      </div>
      <p className="text-[14px] leading-relaxed text-ink">{body}</p>
      {detail && (
        <p className="mt-2 text-[13px] leading-relaxed text-graphite">{detail}</p>
      )}
    </>
  );
}

function Scorecard({
  module,
  score,
  total,
}: {
  module: Module;
  score: number;
  total: number;
}) {
  const pct = Math.round((score / total) * 100);
  const verdict =
    pct === 100
      ? "Every part, first go."
      : pct >= 75
        ? "You know your way around this engine."
        : pct >= 40
          ? "The big ones are landing. The accessories need another pass."
          : "Worth a lap through the legend before trying again.";

  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-paper/75 p-6 backdrop-blur-md">
      <div className="plate-rise w-full max-w-sm border border-hairline bg-paper p-7 shadow-[0_2px_40px_rgba(23,26,23,0.14)]">
        <div className="plate-tag">Result</div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="plate-display text-[64px] leading-none text-ink tabular-nums">
            {score}
          </span>
          <span className="font-mono text-[15px] text-graphite">/ {total}</span>
        </div>

        <p className="mt-3 text-[14px] leading-relaxed text-ink">{verdict}</p>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => atlas.startQuiz(module.parts.map((p) => p.id))}
            className="flex flex-1 items-center justify-center gap-2 bg-ink px-4 py-2.5 text-paper transition-colors hover:bg-annotate"
          >
            <RotateCcw size={13} strokeWidth={2} />
            <span className="plate-tag text-paper">Try again</span>
          </button>
          <button
            type="button"
            onClick={atlas.exitQuiz}
            className="flex-1 border border-hairline px-4 py-2.5 text-ink transition-colors hover:bg-annotate-soft"
          >
            <span className="plate-tag whitespace-nowrap text-ink">
              Back to the plate
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
