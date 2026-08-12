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

## How the colour works

**Colour encodes the system, not the mood.** Each of the eight engine systems
owns a hue in `SYSTEMS` (`content/types.ts`) — `color` for marks, `soft` for
tints, `ink` for text — and wears it in four places: the legend group, the
balloon on the model, the part card header and the leader-line label. That is
the whole point of it: "all the blue ones are cooling" is a fact about the
engine, not decoration.

**Colour is never the only channel.** The callout number and the legend group
heading each say the same thing on their own. Some pairs of the eight sit close
under simulated colour blindness — 8.1 ΔE at worst, which is the target, not a
comfortable margin — so the redundancy is load-bearing, not a nicety.

**Green, red and orange are reserved.** Green means *correct*, red means
*wrong*, and orange belongs to the section cut and nothing else. Reserving them
is why the eight system hues are packed into the arc from 207° round to 356°
plus a brass island at 83° — the wheel is genuinely that crowded, and lightness
rather than hue does most of the separating.

**The balloon palette lives in GLSL and does not read the CSS.** The hues reach
the model through `Color` uniforms in `components/scene/balloonMaterial.ts` and
`LOOKS` in `components/scene/Callouts.tsx`. Tailwind tokens cannot reach a
shader, so a palette change made only in `globals.css` leaves every balloon on
the engine wearing the old colour — the DOM goes bright and the model quietly
does not. Change both.

## Why the casting cannot be colour-coded

The obvious next step — paint each part of the engine in its system colour — is
not available, and it is worth knowing why before someone tries.

The GLB is **one mesh, one primitive, one material, no UVs**. There are no
sub-parts to assign colours to, and nothing to texture. The only way to
partition it would be geometrically, by taking the nearest authored callout
point for every fragment, and that paints wrong lumps: the radiator would take
whichever anchor happened to be closest to it. Labelling the wrong lump is worse
than not labelling it (see VERIFY.md), so the model is not partitioned.

Instead the colour on the casting comes from two things that don't make a claim:

- **What it reflects.** `Stage.tsx` is a gelled studio — a brass key panel down
  one flank, a cold blueprint rim down the other, dim wrap panels behind so the
  polished faces have something other than black to mirror. That is the whole
  reason the engine reads as metal rather than grey putty, and it roughly
  doubles the measured colour in the render without encoding anything.
- **The focus wash.** While you are reading a part, `FocusWash` lights the
  neighbourhood of that callout point in the system colour, scaled by the
  pixel's own luminance so it colours the metal instead of painting over it. It
  is a spotlight, not a boundary, and the radius is deliberately tight for
  exactly that reason — widen it and it starts implying where the part ends.

The wash follows `useAnnotatedId`, so it inherits that function's rules: nothing
is lit while a quiz question is still open, and a reveal is washed in the quiz
green rather than the part's system colour.

Two things in the balloon shader are deliberate and easy to undo by accident. The ring
fades more slowly than the white disc, because a balloon sits at 45% opacity
whenever something else is selected and a flat fade turns the darker systems
into the same mud. And `#include <colorspace_fragment>` is what makes the
rendered pixels equal the tokens — a `ShaderMaterial` gets no output conversion
of its own, so without it the balloons render the *linear* value of each hue and
come out visibly darker than the legend swatch beside them.

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
