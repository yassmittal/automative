"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { SYSTEMS } from "@/content/systems";
import { searchParts } from "@/lib/catalog";
import { SystemSwatch } from "@/components/ui/SystemSwatch";

/**
 * Find a part without knowing which plate it is on.
 *
 * This is the answer to the atlas's main navigation problem: someone who has
 * heard the words "torque converter" has no idea it lives on the engine plate,
 * and making them guess is the difference between a reference and a puzzle.
 *
 * The search runs against the whole catalog in the browser — the content is
 * already in the bundle, and a few hundred parts is far below the size where
 * an index would earn its complexity.
 */
export function PartSearch() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchParts(query), [query]);
  const isSearching = query.trim().length >= 2;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 border border-hairline bg-paper px-3 py-2 focus-within:border-ink">
        <Search size={14} strokeWidth={1.75} className="shrink-0 text-graphite" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a part — radiator, caliper, turbine…"
          aria-label="Search every part in the atlas"
          className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-graphite"
        />
      </div>

      {isSearching && (
        <div className="absolute top-full right-0 left-0 z-20 mt-1 max-h-[19rem] overflow-y-auto border border-hairline bg-paper shadow-lg plate-scroll">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-[13px] text-graphite">
              Nothing matches “{query.trim()}”.
            </p>
          ) : (
            <ul>
              {results.map(({ part, entry }) => (
                <li key={`${entry.module.id}/${part.id}`}>
                  <Link
                    href={`/module/${entry.module.id}?part=${part.id}`}
                    className="flex items-center gap-2.5 border-b border-hairline px-3 py-2.5 transition-colors last:border-b-0 hover:bg-paper-sunk"
                  >
                    <SystemSwatch system={part.system} callout={part.callout} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-ink">
                        {part.name}
                      </span>
                      <span className="plate-tag block truncate normal-case tracking-normal">
                        {SYSTEMS[part.system].label} · {entry.module.name}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
