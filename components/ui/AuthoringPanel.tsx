"use client";

import { useState } from "react";
import { Check, ClipboardCopy, Crosshair } from "lucide-react";
import type { Module } from "@/content/types";

export type AuthoredMap = Record<string, [number, number, number]>;

/**
 * Authoring mode, behind `?authoring=1`.
 *
 * Arm a part, click it on the model, and its coordinate is captured from a
 * real raycast against the mesh. It then arms the next unauthored part on its
 * own, so the whole plate can be laid out in one pass without touching the
 * keyboard. "Copy positions" emits a paste-ready block for the content file.
 *
 * This exists so nobody ever has to guess a coordinate by hand — which is the
 * only reason the callouts land on the right lumps of a 77k-triangle casting.
 */
export function AuthoringPanel({
  module,
  authored,
  armedId,
  onArm,
  onReset,
}: {
  module: Module;
  authored: AuthoredMap;
  armedId: string | null;
  onArm: (id: string | null) => void;
  onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const snippet = module.parts
    .map((part) => {
      const p = authored[part.id] ?? part.position;
      return `  { id: "${part.id}", position: [${p[0]}, ${p[1]}, ${p[2]}] },`;
    })
    .join("\n");

  const copy = async () => {
    await navigator.clipboard.writeText(`[\n${snippet}\n]`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const done = Object.keys(authored).length;

  return (
    <div className="absolute top-0 right-0 z-40 m-3 flex max-h-[calc(100%-1.5rem)] w-72 flex-col border border-cut bg-paper/97 shadow-lg backdrop-blur-sm">
      <header className="border-b border-hairline px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Crosshair size={12} strokeWidth={2} className="text-cut" />
          <span className="plate-tag" style={{ color: "var(--color-cut)" }}>
            Authoring
          </span>
        </div>
        <p className="mt-1.5 text-[12px] leading-snug text-graphite">
          Pick a part, then click it on the engine. {done} of{" "}
          {module.parts.length} placed.
        </p>
      </header>

      <ul className="plate-scroll flex-1 overflow-y-auto">
        {module.parts.map((part) => {
          const armed = armedId === part.id;
          const value = authored[part.id];
          return (
            <li key={part.id}>
              <button
                type="button"
                onClick={() => onArm(armed ? null : part.id)}
                className={`flex w-full flex-col gap-0.5 px-4 py-1.5 text-left transition-colors ${
                  armed ? "bg-cut text-paper" : "hover:bg-wash"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="font-mono text-[10px] tabular-nums opacity-70">
                    {String(part.callout).padStart(2, "0")}
                  </span>
                  <span className="text-[13px]">{part.name}</span>
                  {value && !armed && (
                    <Check size={11} strokeWidth={2.5} className="text-correct" />
                  )}
                </span>
                {value && (
                  <span className="font-mono text-[10px] tabular-nums opacity-60">
                    [{value.join(", ")}]
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <footer className="flex gap-2 border-t border-hairline p-3">
        <button
          type="button"
          onClick={copy}
          className="flex flex-1 items-center justify-center gap-1.5 bg-ink px-3 py-2 text-paper transition-colors hover:bg-cut"
        >
          {copied ? (
            <Check size={12} strokeWidth={2.5} />
          ) : (
            <ClipboardCopy size={12} strokeWidth={2} />
          )}
          <span className="plate-tag text-paper">
            {copied ? "Copied" : "Copy positions"}
          </span>
        </button>
        <button
          type="button"
          onClick={onReset}
          className="border border-hairline px-3 py-2 transition-colors hover:bg-wash"
        >
          <span className="plate-tag">Reset</span>
        </button>
      </footer>
    </div>
  );
}
