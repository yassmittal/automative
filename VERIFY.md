# Claims to verify, and parts deliberately left out

The part copy in `content/modules/` is a first draft written from general
mechanical knowledge, not transcribed from a service manual. Most of it is
qualitative and safe. This file records the two kinds of thing that are not:
claims that should be checked, and identifications that could not be made.

Every item in the first section is flagged `needsVerify: true` in the data.

---

## 1. Identifications made by eye rather than read off the model

Sketchfab's glTF export does not preserve original part names — nearly every
model in this atlas arrives with meshes called `Object_2`. So on most plates the
question "which lump is this?" is answered by looking, and the answers below are
inferences from shape. They are the most likely place this atlas is wrong.

### Turbocharger — which volute is which

`compressor-housing`, `turbine-housing`, `turbine-inlet`

The scan carries no labels. The assignment was made from two standard cues: a
large, smooth, circular bore is a compressor inlet, and the flanged face that
would bolt to an exhaust manifold is the turbine side. Both are reliable cues
and both are still inferences.

**Check:** against the original Sketchfab model page or a photograph of the same
turbo, that the flanged end is indeed the turbine housing.

### Cylinder head — which port face is which

`intake-port`, `exhaust-port`

One face has round ports, the other oval. Oval-and-larger is the intake side and
round-and-smaller the exhaust side on essentially every production head, because
an intake port needs cross-sectional area and an exhaust port needs to survive
heat. Measured on the model, the two faces do differ in bore size.

**Check:** the port shapes against a photograph of the same head, or measure the
two faces' bore areas directly rather than by eye.

### Cylinder head — which deck openings are which

`head-bolt-hole`, `coolant-passage`

Round through-holes at the ends of the deck were taken to be head bolt holes,
and elongated openings to be coolant transfer passages. That is the usual
arrangement, but the deck was viewed obliquely, which distorts the shapes the
judgement rests on.

**Check:** view the deck square-on and confirm the hole shapes.

### Suspension & chassis — which axle is driven

`differential`

There is a housing dead centre of one axle and nothing equivalent on the other,
so that axle was taken to be the driven one. This is strong evidence, and the
model is described by its author as a rear-drive chassis.

**Check:** that the central housing is a differential rather than, say, a fuel
tank or a transfer case.

### Disc brake — the mounting ear

`mounting-ear`

Bolt torque figures are named as "specific" without a value, and whether the
bolts are single-use varies by design.

**Check:** whether a figure should be named for a representative application.

---

## 2. Quantitative claims in the LS V8 copy

### Air filter — service interval

> "A scheduled replacement item — inspected at services and changed far sooner
> in dusty conditions."

**Check:** whether GM's schedule for the relevant LS application lists the air
filter on a fixed interval, and what that interval is. If it is condition-based,
say so.

### Air filter — air-to-fuel volume claim

> "An engine swallows thousands of litres of air for every litre of fuel it
> burns."

**Check:** the arithmetic. At a stoichiometric ~14.7:1 by mass, one litre of
petrol (~750 g) needs ~11 kg of air, which at sea-level density (~1.2 g/L) is
roughly 9,000 litres. Believed correct, but it is a specific order-of-magnitude
claim.

### Radiator — share of fuel energy rejected as heat

> "Roughly a third of the energy in the fuel leaves the engine as heat through
> this."

**Check:** the fraction rejected specifically to the **coolant circuit** rather
than out of the exhaust. Textbook energy balances for a spark-ignition engine
usually put coolant around 25–30% and exhaust around 30–35%, so "a third" may be
overstating it.

### Accessory belt — inspection interval

> "A wear item — inspected at services and replaced when cracked or glazed."

**Check:** whether a mileage or time interval should be named.

### Differential — oil service

> "Oil is the scheduled item on some designs and sealed for life on others."

**Check:** true in general, but worth naming a representative interval.

---

## 3. Parts left out rather than pinned to a plausible lump

Labelling the wrong lump in a learning tool is worse than omitting the part.
These were all identified as worth covering and then dropped, because the model
could not support the callout honestly.

### Turbocharger

- **Turbine wheel** and **compressor wheel** — genuinely the most interesting
  parts of a turbo, and sealed inside the two housings. The model is an exterior
  scan; there is nothing on the surface to point at.
- **Oil feed** and **oil drain** fittings — not identifiable on the scan.

### Cylinder head

- **Spark plug bore** — one of the most interesting features of a head. Attempts
  to isolate it by probing for a deep narrow tunnel kept returning the far wall
  of the port face instead.

### Disc brake

- **Caliper piston** — no separate geometry, and nothing on the caliper's outer
  surface marks where it sits.

### Suspension & chassis

- **Damper** — cannot be told from the coil spring on this model. Whether it
  sits inside the coil as a coilover or beside it is not visible, so the spring
  is labelled as the spring and the damper is explained alongside it.
- **Driveshafts** and **anti-roll bar** — bars running between the differential
  and the wheels, indistinguishable from the suspension arms on this geometry.

### LS V8

Components that could not be identified with confidence on the merged casting:
alternator, starter motor, oil filter, water pump, throttle body.

---

## 4. Licensing note

One model in the source collection — "4x4 Independent RH Front Suspension" — is
licensed CC Attribution-**NonCommercial** and was deliberately not used, in
favour of a Free Standard alternative. Everything shipped is Free Standard or
plain CC Attribution, so the atlas stays free to use commercially. See
[CREDITS.md](./CREDITS.md).
