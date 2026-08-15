# Car Parts Atlas

An interactive 3D atlas of car parts. Open a plate, rotate a real part, click a
numbered callout to read what it does, then take a labelling quiz where the app
names a part and you have to find it on the model.

Every screen is framed as a page out of a factory service manual with a
photographic plate inset into it: numbered callout balloons on the artwork, a
legend keyed to those numbers, and a section line you can sweep through.

```bash
npm install
npm run dev
```

## Stack

Next.js (App Router) · TypeScript · Tailwind v4 · react-three-fiber + drei ·
GSAP · lucide-react. No database, no auth, no API routes — the content layer is
plain typed TypeScript in `content/`, read through `lib/catalog.ts`.

## Where things live

```
content/
  types.ts          the shape of everything the atlas teaches
  palette.ts        OKLCH → hex, and the neutral grounds
  systems.ts        the eleven systems, and the colour each one wears
  chapters.ts       how plates are grouped for browsing
  modules/          one file per plate, plus the registry in index.ts
  generated/        model attribution, written by the asset pipeline
lib/
  catalog.ts        the one way the app asks about content
scripts/            asset pipeline and palette tooling (build-time only)
```

**Adding a plate is three steps:** an entry in `scripts/modelManifest.ts`, a
file in `content/modules/`, and a line in `content/modules/index.ts`. Figure
numbers, the systems a plate uses, its model path and its credit are all
derived — nothing is hand-numbered.

Every component reads content through `lib/catalog.ts` rather than importing
`content/` directly. That keeps derived facts computed once, and means the
source could move behind an API without a component noticing.

## The asset pipeline

Models are licensed, not modelled here. `npm run models:sync` pulls each entry
in the manifest from Sketchfab, decimates and compresses it, writes it to
`public/models/`, and regenerates the attribution the UI shows.

```bash
npm run models:sync              # fetch anything missing
npm run models:sync -- --force   # rebuild everything
npm run model:inspect -- ls-v8   # what is actually inside a shipped model
```

Optimised models are committed, so a normal install and build never touch the
network or need an API token. The sync runs when the manifest gains an entry.

The pass is worth knowing about, because the sources are enormous — one of the
shipped models arrives as a 27 MB, million-triangle photogrammetry scan and
leaves as 792 KB. Two transforms do nearly all of that work: `simplify` against
a per-model triangle budget, and `meshopt` at `level: "high"`, which reorders
vertices for the encoder, quantises positions and normals, and enables
`EXT_meshopt_compression`. Leaving `meshopt` out still produces a valid file —
just one roughly two and a half times larger.

## How the callouts work

This is the part worth reading before changing anything.

**Parts are data, not meshes.** Sketchfab's glTF export does not preserve the
original part names: the models in this library arrive with meshes called
`Object_2` and `New_Game_Object_mat0__Instance__0`. There is nothing to raycast
against per-part, so each callout is an authored point in the module's content
file, rendered as a camera-facing disc.

**Except when the names survive.** One model in the atlas — the brake assembly —
does carry real names, so its disc, pads and caliper set `meshNodeNames` and get
their own material instance. Those parts light up as themselves rather than only
carrying a balloon, and the camera frames them by their actual size. This is the
rare case, not the plan: see `lib/useNormalizedModel.ts`.

**Coordinates live in normalized space.** Every model is fitted to the same size
on its longest axis, so authored coordinates are readable numbers around −2..2
and stay comparable between models of wildly different native scale.

**Snapping takes the nearest surface, not the first one.** A short probe runs
through each authored point and keeps the intersection closest to it. Taking the
first hit instead — the obvious approach — moves a callout authored on the roof
of a combustion chamber onto the chamber's rim, which then faces the wrong way,
and the camera flies to the far side of it and ends up inside the casting.

**Picking is screen-space.** Clicks project every balloon to 2D and take the
nearest within a pixel radius, rather than raycasting the mesh. The renderer
writes each balloon's current visibility into a shared array that the picker
reads, so you can never click something you cannot see.

**Visibility is facing + line-of-sight.** A per-frame dot product against the
surface normal handles the far side. That alone cannot tell that one part stands
in front of another, so one balloon per frame is also line-of-sight tested
against the real geometry, round-robin.

**Balloons hold constant pixel size in the vertex shader** rather than being
rescaled on the CPU each frame, which is what keeps them steady during an orbit.

The render loop is `frameloop="demand"`. Anything that animates must call
`invalidate()`, or it will render one frame and stop.

## Authoring callout positions

Never type coordinates by hand. Open any plate at `?authoring=1`, pick a part,
and click it on the model — the position is read off a real raycast.

For anything more than a couple of points, that mode also publishes
`window.atlasAuthoring.probeScreenPoint(x, y)`, which answers the same question
without a click and returns the name of the mesh it hit. A whole plate can be
probed in one pass, which is the difference between authoring a module in
minutes and in an afternoon.

**Author from the view the plate opens in.** A callout placed while the model
was rotated lands on whichever side happened to face the camera, and then spends
the entire opening view hidden behind the structure. On a compact casting that
is barely noticeable; on an open frame like the chassis it left a plate showing
one balloon out of six. A module can set `openingView` when the default
three-quarter view is wrong for its shape — a cylinder head keeps everything
interesting on its underside.

## How the colour works

**Colour encodes the system, not the mood.** Each of the eleven systems owns a
hue and wears it in the legend, on its balloon, on its part card and on its
leader line. "All the blue ones carry heat away" is a fact about the car, not
decoration, and it holds across plates.

**There is one source for it.** `content/palette.ts` computes the palette in
OKLCH; `lib/paletteCss.ts` publishes it to the DOM as custom properties and
`components/scene/Callouts.tsx` reads the same constants into shader uniforms.
The previous build wrote the values twice — once in CSS, once in GLSL — and they
drifted, so a hue changed in one place left every balloon on the model wearing
the old colour. That is invisible until you hold the legend against the model.

**Two grounds, so two variants per system.** The chrome sits on the console's
dark neutrals; the viewport is darker still, so that a lit aluminium casting
has something to be brighter than. A mark tuned for the chrome is not bright
enough against the plate, so each system has both a `color` (on chrome) and a
`beacon` (on the plate). They are the same hue on grounds several lightness
steps apart, not two different colours. Legend swatches deliberately show the
*beacon* on a viewport-dark chip, because that is what the balloon they
identify actually looks like.

**The vocabulary is enforced, not remembered.** `npm run tokens:check` (part of
`npm run lint`) asks Tailwind whether every class named in a `className`
resolves, and checks every `var(--x)` against what `lib/paletteCss.ts` actually
publishes. It exists because a theme migration once left ten components naming
tokens that had been deleted: Tailwind emits no rule for an unknown utility and
CSS drops any declaration holding an undefined `var()`, so the app built, typed,
linted and rendered — with every surface in the plate view silently transparent
and the part read-out lying directly on the 3D model.

**The palette is searched, then verified.**

```bash
npm run palette:check   # does the committed palette still hold up?
npm run palette:tune    # search for values that do
```

Eleven systems will not fit around a wheel that also reserves a band for the
section cut, and colour vision deficiency collapses several of the pairs that
remain. The tuner searches hue, lightness and chroma against every co-occurring
pair under normal, protan, deutan and tritan vision; the checker proves the
committed result still passes and fails the run if it does not.

Two findings from that are worth keeping:

- **Only systems that share a plate constrain each other.** Legends are
  per-module, so two systems that never appear together never need telling
  apart. That is what makes eleven fit at all, and it tightens automatically —
  a new module that puts braking and the air path on one plate makes them a
  constrained pair for the first time.
- **Maximising separation is a trap.** The search discovers that muted colours
  separated by lightness pass every vision test easily, and returns a palette of
  greys and dusty teals. That is an excellent answer to the wrong question. So
  separation is a floor and vividness is the goal above it.

The floor is 6.8 (OKLab ×100) rather than the 8 an eight-system palette could
reach; committed palettes measure about 7.0. The shortfall is carried by the
channels that do not depend on hue at all: every balloon carries its callout
number, and every legend row sits under a named system heading. Colour is the
fastest channel here, never the only one.

## Why the casting is not colour-coded

The obvious next step — paint each part of the model in its system colour — is
mostly unavailable, and it is worth knowing why before someone tries.

Most of these models are one mesh with one material and no UVs. There are no
sub-parts to assign colours to. The only way to partition one would be
geometrically, by nearest authored callout, and that paints wrong lumps.
Labelling the wrong lump in a learning tool is worse than not labelling it.

So a part shows itself in whichever of two ways its model can honestly support.
Where meshes are named, the part lights up as itself. Where they are not, a
tight wash sits on the authored point — a spotlight, not a boundary, with a
deliberately small radius for exactly that reason. Both live in
`components/scene/PartEmphasis.tsx`, and both inherit `useAnnotatedId`'s rule:
nothing is lit while a quiz question is still open.

## Content honesty

Part copy is a first draft. Anything making a quantitative claim, or resting on
an identification made by eye rather than read off the model, is flagged
`needsVerify: true` and listed in [VERIFY.md](./VERIFY.md).

Components that could not be identified with confidence were left off rather
than pinned to a plausible-looking lump. Several are listed in VERIFY.md,
including the turbo's compressor and turbine wheels — genuinely the most
interesting parts of a turbocharger, and sealed inside an exterior scan.

## Asset licensing

The 3D models are licensed, not self-modelled. Full attribution and license
terms are in [CREDITS.md](./CREDITS.md), generated from the same manifest the
pipeline reads.
