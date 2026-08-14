import { AUTHOR } from "@/content/author";
import { GithubMark } from "./GithubMark";

/**
 * "Read the source" — the standing invitation in the chrome.
 *
 * Two tones because the atlas has two grounds: the catalog is paper, the plate
 * header sits above a near-black viewport. Same link, same wording, so it reads
 * as one control wherever you meet it.
 */
export function SourceLink({
  tone = "paper",
  label = "View source",
  compactLabel = false,
  className = "",
}: {
  tone?: "paper" | "plate";
  label?: string;
  /** Drops to the bare mark on narrow screens, where the plate header is tight. */
  compactLabel?: boolean;
  className?: string;
}) {
  const onPlate = tone === "plate";

  return (
    <a
      href={AUTHOR.repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`View the source on GitHub — ${AUTHOR.handle}/automative`}
      className={`group flex shrink-0 items-center gap-2 border px-3 py-1.5 transition-colors ${
        onPlate
          ? "border-plate-hairline hover:border-plate-ink hover:bg-plate-hairline"
          : "border-hairline hover:border-ink hover:bg-ink"
      } ${className}`}
    >
      <GithubMark
        size={14}
        className={
          onPlate
            ? "text-plate-ink transition-colors group-hover:text-paper"
            : "text-graphite transition-colors group-hover:text-paper"
        }
      />
      <span
        className={`plate-tag transition-colors ${
          compactLabel ? "hidden sm:block" : ""
        } ${
          onPlate
            ? "text-plate-ink group-hover:text-paper"
            : "group-hover:text-paper"
        }`}
      >
        {label}
      </span>

      {/* The compact form is icon-only, so the name has to survive somewhere. */}
      {compactLabel && <span className="sr-only sm:hidden">{label}</span>}
    </a>
  );
}
