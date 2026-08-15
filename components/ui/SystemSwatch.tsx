import { SYSTEMS } from "@/content/systems";
import type { SystemId } from "@/content/types";

/**
 * How a system is shown anywhere outside the model: a dark tile carrying the
 * system's beacon colour.
 *
 * The tile takes the viewport's own ground on purpose. The swatch's job is to
 * say "this is what that system looks like on the plate", and on the plate a
 * system is its beacon on near-black. A swatch painted in the chrome-tuned
 * mark instead would be a different, darker colour from the balloon it claims
 * to identify — and that mismatch is invisible until someone holds the legend
 * against the model, which is precisely when a legend is being used.
 */
export function SystemSwatch({
  system,
  callout,
  size = 18,
}: {
  system: SystemId;
  /** Shown inside the tile, so the swatch reads as the balloon it stands for. */
  callout?: number;
  size?: number;
}) {
  const { beacon, label } = SYSTEMS[system];

  return (
    <span
      className="system-swatch shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
      title={label}
    >
      {callout === undefined ? (
        <span
          style={{
            width: Math.round(size * 0.42),
            height: Math.round(size * 0.42),
            borderRadius: "50%",
            background: beacon,
          }}
        />
      ) : (
        <span
          className="font-mono leading-none"
          style={{ color: beacon, fontSize: Math.round(size * 0.55) }}
        >
          {callout}
        </span>
      )}
    </span>
  );
}
