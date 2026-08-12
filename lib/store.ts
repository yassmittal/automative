"use client";

import { useSyncExternalStore } from "react";

export type Mode = "explore" | "quiz";

export type QuizPhase = "idle" | "asking" | "correct" | "wrong" | "done";

export type QuizState = {
  phase: QuizPhase;
  /** Shuffled part ids, asked in order. */
  queue: string[];
  index: number;
  score: number;
  /** Set on a wrong answer so the plate can reveal where the part actually is. */
  revealId: string | null;
  /** What the user clicked when they got it wrong, so we can flash it red. */
  missedId: string | null;
};

export type AtlasState = {
  mode: Mode;
  hoveredId: string | null;
  selectedId: string | null;
  quiz: QuizState;
  /** 0 = no cut, 1 = swept fully through the block. */
  section: number;
  sectionOn: boolean;
  /** Flips once the GLB is parsed and callouts have been snapped to the mesh. */
  ready: boolean;
};

const EMPTY_QUIZ: QuizState = {
  phase: "idle",
  queue: [],
  index: 0,
  score: 0,
  revealId: null,
  missedId: null,
};

let state: AtlasState = {
  mode: "explore",
  hoveredId: null,
  selectedId: null,
  quiz: EMPTY_QUIZ,
  section: 0,
  sectionOn: false,
  ready: false,
};

const listeners = new Set<() => void>();

function set(patch: Partial<AtlasState>) {
  state = { ...state, ...patch };
  for (const l of listeners) l();
}

export function getState() {
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/**
 * Selector must return a primitive or a reference that only changes when the
 * underlying value does — the store replaces objects wholesale on write, so
 * `s => s.quiz` is safe while `s => ({ ...s.quiz })` is not.
 */
export function useAtlas<T>(selector: (s: AtlasState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

/* ---------------------------------------------------------------- actions */

export const atlas = {
  setReady: (ready: boolean) => set({ ready }),

  hover(id: string | null) {
    if (state.hoveredId !== id) set({ hoveredId: id });
  },

  select(id: string | null) {
    if (state.mode === "quiz") return;
    set({ selectedId: id, hoveredId: null });
  },

  setSection(section: number) {
    set({ section, sectionOn: section > 0.001 });
  },

  toggleSection() {
    const on = !state.sectionOn;
    set({ sectionOn: on, section: on ? Math.max(state.section, 0.45) : 0 });
  },

  startQuiz(partIds: string[]) {
    set({
      mode: "quiz",
      selectedId: null,
      hoveredId: null,
      sectionOn: false,
      section: 0,
      quiz: {
        phase: "asking",
        queue: shuffle(partIds),
        index: 0,
        score: 0,
        revealId: null,
        missedId: null,
      },
    });
  },

  exitQuiz() {
    set({ mode: "explore", quiz: EMPTY_QUIZ, hoveredId: null });
  },

  /** Called by the picker while a quiz is running. `id` is null for a miss. */
  answer(id: string | null) {
    const q = state.quiz;
    if (q.phase !== "asking") return;
    const target = q.queue[q.index];
    if (id === target) {
      set({ quiz: { ...q, phase: "correct", score: q.score + 1 } });
    } else {
      set({ quiz: { ...q, phase: "wrong", revealId: target, missedId: id } });
    }
  },

  nextQuestion() {
    const q = state.quiz;
    if (q.phase !== "correct" && q.phase !== "wrong") return;
    const next = q.index + 1;
    if (next >= q.queue.length) {
      set({ quiz: { ...q, phase: "done", revealId: null, missedId: null } });
    } else {
      set({
        quiz: {
          ...q,
          phase: "asking",
          index: next,
          revealId: null,
          missedId: null,
        },
      });
    }
  },
};

function shuffle<T>(input: T[]): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
