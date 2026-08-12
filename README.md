# Car Parts Atlas

An interactive 3D atlas of a supercharged LS V8. Rotate the engine, click a
numbered callout to read what the part does, then take a labelling quiz where
the app names a part and you have to find it on the model.

The whole screen is framed as a plate out of a factory service manual: numbered
callout balloons on the artwork, a legend keyed to those numbers, and a section
line you can sweep through the block.

```bash
npm install
npm run dev
```

## Stack

Next.js (App Router) · TypeScript · Tailwind v4 · react-three-fiber + drei ·
GSAP · lucide-react. No database, no auth, no API routes — the content layer is
plain typed TypeScript in `content/`.

## How the callouts work

This is the part worth reading before changing anything.

**Parts are data, not meshes.** The source model is one merged casting with no
part names, so there is nothing to raycast against per-part. Each callout is an
authored point in `content/ls-v8.ts`, rendered as a camera-facing disc.

**Coordinates live in normalized space.** `useNormalizedModel` fits every model
to the same size on its longest axis and bakes that transform onto the loaded
object, so authored coordinates are readable numbers around −2..2 and stay
comparable if a second module with a different native scale is added.

**Snapping is local, not radial.** `snapToSurface` probes a short segment
straight through each authored point. Casting in from outside along the radial
line — the obvious approach — is wrong here: a callout on the front of the block
would snap forward onto the radiator standing in front of it.

**Picking is screen-space.** Clicks project every balloon to 2D and take the
nearest within a pixel radius, rather than raycasting a 77k-triangle mesh. The
renderer writes each balloon's current visibility into a shared array that the
picker reads, so you can never click something you cannot see.

**Visibility is facing + line-of-sight.** A per-frame dot product against the
surface normal handles the far side of the engine. That alone cannot tell that
the radiator is standing in front of the block, so one balloon per frame is also
line-of-sight tested against the real geometry, round-robin.

**Balloons hold constant pixel size in the vertex shader** rather than being
rescaled on the CPU each frame, which is what keeps them steady during an orbit.

The render loop is `frameloop="demand"`. Anything that animates must call
`invalidate()`, or it will render one frame and stop.

## Authoring callout positions

Never type coordinates by hand. Open `/?authoring=1`, pick a part in the panel,
and click it on the model — the position is read off a real raycast against the
mesh. "Copy positions" emits a paste-ready block for `content/ls-v8.ts`.

## Content honesty

Part copy is a first draft. Anything making a quantitative or interval claim is
flagged `needsVerify: true` and listed in [VERIFY.md](./VERIFY.md) — check those
against a real service manual before treating them as fact.

Components that could not be identified with confidence on this particular model
were left off rather than pinned to a plausible-looking lump. See VERIFY.md.

## Asset licensing

The 3D model is licensed, not self-modelled. Full attribution, license terms and
the exact optimisation pass are in [CREDITS.md](./CREDITS.md).
