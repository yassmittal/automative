import type { Module, Part } from "../types";

/**
 * A turbo is two pumps on one shaft with a bearing housing between them, and
 * almost every question about how one behaves comes back to that arrangement.
 * The callouts walk that path: exhaust in on one side, air out on the other.
 *
 * Two things are deliberately missing. The **turbine and compressor wheels**
 * are the most interesting parts of a turbo and are not called out, because
 * they are sealed inside the two housings and this model is an exterior scan —
 * there is nothing on the surface to point at. And the **oil feed and drain**
 * fittings could not be picked out on the scan with confidence.
 *
 * Which volute is which was read off the shape rather than off any label: the
 * large smooth circular bore is a compressor inlet, and the flanged side bolts
 * to an exhaust manifold. That is how a turbo is identified by eye, and it is
 * why both housings carry `needsVerify`. See VERIFY.md.
 */
const parts: Part[] = [
  {
    id: "turbine-inlet",
    callout: 1,
    name: "Turbine inlet",
    system: "exhaust",
    position: [-1.24, 0.59, -0.43],
    summary:
      "The flanged mouth where exhaust gas arrives from the engine's manifold.",
    fact: "Everything a turbo does starts here, with energy that was already on its way out of the tailpipe. That is the free lunch a turbo takes and a supercharger cannot — nothing is stolen from the crankshaft to drive it.",
    symptoms: [
      "A blowing sound from a failed manifold gasket",
      "Sooty streaks around the flange",
      "Cracks in the casting after repeated heat cycling",
    ],
    service: "Gasket and studs are the serviceable parts, not the casting.",
    needsVerify: true,
  },
  {
    id: "turbine-housing",
    callout: 2,
    name: "Turbine housing",
    system: "exhaust",
    position: [-0.41, -1.28, -0.51],
    summary:
      "The scroll on the hot side. Exhaust gas spirals through it and spins the wheel sealed inside.",
    fact: "The scroll narrows as it goes round, so the gas speeds up before it reaches the wheel. Its size is the single biggest decision in turbo choice: a small one spins up instantly and runs out of breath, a large one lags low down and keeps pulling at the top.",
    symptoms: [
      "A whistle or roar that changes with load",
      "Cracks radiating from the flange",
      "Glowing red under sustained hard use",
    ],
    service:
      "Lifetime part. It is the wheel and bearings inside that wear out, not the housing.",
    needsVerify: true,
  },
  {
    id: "turbine-outlet",
    callout: 3,
    name: "Turbine outlet",
    system: "exhaust",
    position: [-0.5, -1.73, -0.25],
    summary:
      "The large bore where spent exhaust gas leaves for the rest of the system.",
    fact: "It is much bigger than the inlet, and deliberately so — the gas has given up most of its pressure to the wheel by this point, so it needs far more room to get away without backing up.",
    symptoms: [
      "Restricted flow from a collapsed downpipe",
      "Oil in the outlet, which means a failed turbine-side seal",
      "Rattling from a broken flange stud",
    ],
    service: "Lifetime part.",
  },
  {
    id: "centre-housing",
    callout: 4,
    name: "Centre housing",
    system: "lubrication",
    position: [0.03, -0.82, -0.71],
    summary:
      "The bearing housing in the middle, carrying the shaft that joins the two wheels.",
    fact: "The shaft does not touch metal. It floats on a film of pressurised engine oil, which is both bearing and coolant — and why the fastest way to kill a turbo is to run the engine low on oil, or to fit one without priming it first.",
    symptoms: [
      "Blue smoke from oil past a worn seal",
      "Oil found in the intake pipework",
      "Noticeable in-and-out movement of the shaft",
    ],
    service:
      "Depends entirely on oil condition. Clean oil changed on schedule is the whole maintenance story.",
  },
  {
    id: "compressor-housing",
    callout: 5,
    name: "Compressor housing",
    system: "air",
    position: [0.81, -0.41, -0.98],
    summary:
      "The scroll on the cold side, where air thrown off the compressor wheel becomes boost.",
    fact: "The wheel does not push air so much as fling it outward; the housing's widening spiral is what turns that speed into pressure. It is the same trick as a centrifugal water pump, run at over a hundred thousand rpm.",
    symptoms: [
      "Boost leaks at the outlet clamp",
      "Oil misting inside from a failed cold-side seal",
      "Surging — a fluttering noise when the throttle snaps shut",
    ],
    service: "Lifetime part.",
    needsVerify: true,
  },
  {
    id: "compressor-inlet",
    callout: 6,
    name: "Compressor inlet",
    system: "air",
    position: [1.22, 0.07, -0.44],
    summary:
      "The large smooth bore the turbo draws through, fed from the air filter.",
    fact: "Everything the engine will ever breathe comes through here first, and very fast. A restriction upstream costs boost twice over, because the compressor then has to work against the vacuum it creates pulling through it.",
    symptoms: [
      "A blocked air filter starving the inlet",
      "A collapsed or split intake hose",
      "Damage to the wheel from an object drawn in",
    ],
    service: "Kept clean by servicing the air filter feeding it.",
  },
  {
    id: "compressor-outlet",
    callout: 7,
    name: "Compressor outlet",
    system: "air",
    position: [1.44, -0.86, 0.69],
    summary:
      "Where pressurised air leaves for the intercooler and then the engine.",
    fact: "Air leaves here hot — compressing it heats it, and hot air is thin air, which is exactly what the turbo was fitted to avoid. That is why almost every turbo engine puts an intercooler immediately after this outlet.",
    symptoms: [
      "A boost leak at the clamp, with power down and no fault code",
      "Oil residue pointing to a failed seal upstream",
      "A split or ballooned hose",
    ],
    service:
      "The hose and its clamp are the wear items; the outlet itself is not serviced.",
  },
];

export const turbocharger: Module = {
  id: "turbocharger",
  chapter: "forced-induction",
  name: "Turbocharger",
  subtitle: "Exhaust-driven, oil-cooled, two scrolls on one shaft",
  blurb:
    "Two pumps joined by a shaft that floats on oil: waste exhaust spins one, and the other force-feeds the engine.",
  modelSlug: "turbocharger",
  // Opens onto the face the callouts were authored from. Both scrolls and the
  // centre housing present themselves on this side; the default view from the
  // opposite quarter puts most of them behind the compressor volute.
  openingView: [2.6, 1.4, -5.2],
  parts,
};
