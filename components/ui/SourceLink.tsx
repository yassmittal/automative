import { AUTHOR } from "@/content/author";
import { GithubMark } from "./GithubMark";

/**
 * "Read the source" — the standing invitation in the chrome.
 *
 * It used to carry a `tone` prop, because the atlas used to have two grounds:
 * a light paper catalog and a dark plate. There is one ground now, so the prop
 * is gone. A component that knows about two themes is only ever as correct as
 * the last person to remember it had a second branch.
 *
 * It is a link out of the product, so it never takes the primary rung — pass
 * `className="btn-minimal"` where it sits beside a real primary action.
 */
export function SourceLink({
  label = "View source",
  compactLabel = false,
  className = "",
}: {
  label?: string;
  /** Drops to the bare mark on narrow screens, where the plate header is tight. */
  compactLabel?: boolean;
  className?: string;
}) {
  return (
    <a
      href={AUTHOR.repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`View the source on GitHub — ${AUTHOR.handle}/automative`}
      className={`btn ${className}`}
    >
      <GithubMark size={14} />
      <span className={compactLabel ? "hidden sm:inline" : undefined}>
        {label}
      </span>

      {/* The compact form is icon-only, so the name has to survive somewhere. */}
      {compactLabel && <span className="sr-only sm:hidden">{label}</span>}
    </a>
  );
}
