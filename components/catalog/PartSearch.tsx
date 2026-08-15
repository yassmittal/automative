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
      <div className="input-shell">
        <Search size={14} strokeWidth={2} className="shrink-0 text-fg-dim" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a part — radiator, caliper, turbine…"
          aria-label="Search every part in the atlas"
          className="t-small w-full bg-transparent text-fg outline-none placeholder:text-fg-dim"
        />
      </div>

      {/* Results float above the page, so they take the overlay elevation
          rather than a widget's border-only depth. */}
      {isSearching && (
        <div className="console-scroll shadow-overlay absolute top-full right-0 left-0 z-20 mt-1 max-h-[19rem] overflow-y-auto rounded-[var(--radius-widget)] border border-edge bg-widget">
          {results.length === 0 ? (
            <p className="t-small px-3 py-3 text-fg-muted">
              Nothing matches “{query.trim()}”.
            </p>
          ) : (
            <ul>
              {results.map(({ part, entry }) => (
                <li key={`${entry.module.id}/${part.id}`}>
                  <Link
                    href={`/module/${entry.module.id}?part=${part.id}`}
                    className="flex items-center gap-2.5 border-b border-edge px-3 py-2 transition-colors last:border-b-0 hover:bg-edge"
                  >
                    <SystemSwatch system={part.system} callout={part.callout} />
                    <span className="min-w-0 flex-1">
                      <span className="t-label block truncate text-fg">
                        {part.name}
                      </span>
                      <span className="t-small block truncate text-fg-dim">
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
