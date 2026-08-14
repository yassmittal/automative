import type { Module, Part } from "../types";

/**
 * The head on its own, turned over so the deck face is visible — which is the
 * only way most of this is ever seen. On the assembled V8 plate the head is a
 * single callout; here it is the whole subject.
 *
 * Every position was probed against the real mesh at `?authoring=1`. Two
 * judgements were made by eye and are flagged `needsVerify`:
 *
 * - **Which face is which.** The ports on one side are round, the other oval.
 *   Round-and-small is the exhaust side and oval-and-large the intake side on
 *   essentially every production head, because an intake port needs area and an
 *   exhaust port needs to survive heat. That is an inference from shape, not a
 *   label read off the model.
 * - **Which deck openings are which.** Round through-holes at the ends of the
 *   deck are head bolts; the elongated ones are coolant transfer passages.
 *
 * Depth matters when authoring into a recess. A chamber callout probed too far
 * up lands in the port throat behind the chamber rather than on its roof, and
 * the plate then points at a port while calling it a chamber. The chamber
 * points here sit within about 0.07 of the deck plane; the valve seat sits
 * deeper, in the throat, which is where a seat ring actually is.
 *
 * The **spark plug bore** is deliberately absent. It is one of the most
 * interesting features of a head and it could not be picked out on this model
 * with confidence, so it is left off rather than pinned to a plausible hole.
 * See VERIFY.md.
 */
const parts: Part[] = [
  {
    id: "combustion-chamber",
    callout: 1,
    name: "Combustion chamber",
    system: "rotating",
    position: [-0.24, -0.45, 1.28],
    summary:
      "The shallow dish cast into the underside of the head. It is the roof of the cylinder, and where the fuel actually burns.",
    fact: "Its shape decides how the flame travels. A chamber that makes the mixture tumble as it is squeezed burns faster and more completely, which is why two engines of identical capacity can be worlds apart on both power and economy.",
    symptoms: [
      "Heavy carbon build-up changing the chamber's effective size",
      "Pitting or erosion around the edge after detonation",
      "Uneven compression between cylinders",
    ],
    service:
      "Not serviced in normal use. Cleaned and measured whenever the head is off for other reasons.",
  },
  {
    id: "valve-seat",
    callout: 2,
    name: "Valve seat",
    system: "air",
    position: [-0.16, -0.25, 0.43],
    summary:
      "The hardened ring in the chamber roof that the valve closes against to seal the cylinder.",
    fact: "It does far more than seal. Each time the valve shuts, the seat is the main path heat escapes the valve head into the water-cooled casting — an exhaust valve that cannot dump its heat this way will burn.",
    symptoms: [
      "Compression loss with a hissing sound at the intake or exhaust",
      "A misfire that gets worse as the engine warms",
      "Valve recession in a head running unleaded on old soft seats",
    ],
    service:
      "Recut when a head is reconditioned, which is also when valves are ground to match.",
  },
  {
    id: "intake-port",
    callout: 3,
    name: "Intake port",
    system: "air",
    position: [0.55, -0.28, 0.56],
    summary:
      "The passage carrying air from the manifold to the back of the intake valve. The larger, more oval of the two port faces.",
    fact: "Bigger is not better. The port has to keep air moving fast enough to stay energetic at low engine speed — oversize it chasing peak power and the engine goes soft everywhere you actually drive.",
    symptoms: [
      "Carbon build-up on the port walls on a direct-injection engine",
      "Oil pooling in the port from failed valve stem seals",
      "Poor low-speed response after badly done porting work",
    ],
    service: "Lifetime feature of the casting. Cleaned when the head is off.",
    needsVerify: true,
  },
  {
    id: "exhaust-port",
    callout: 4,
    name: "Exhaust port",
    system: "exhaust",
    position: [-0.55, -0.25, -0.7],
    summary:
      "The passage taking burnt gas from the exhaust valve out to the manifold. The smaller, rounder face.",
    fact: "It is much shorter than the intake port, and deliberately so. Gas leaves under its own pressure, so the job is to get it out with the least heat dumped into the head on the way.",
    symptoms: [
      "Cracks between the port and a coolant passage",
      "Heavy sooting that suggests a rich-running cylinder",
      "A warped or eroded manifold sealing face",
    ],
    service: "Lifetime feature of the casting.",
    needsVerify: true,
  },
  {
    id: "deck-surface",
    callout: 5,
    name: "Deck surface",
    system: "structure",
    position: [-0.34, -0.52, -0.26],
    summary:
      "The machined flat face that clamps down onto the block with the head gasket between.",
    fact: "It has to be flat to within a few hundredths of a millimetre across its whole length. An engine badly overheated warps this face, and no gasket will seal against it until it has been machined true again.",
    symptoms: [
      "Coolant loss with no visible external leak",
      "White smoke from the exhaust and a sweet smell",
      "Bubbles rising in the coolant reservoir with the engine running",
    ],
    service:
      "Checked with a straightedge whenever the head comes off, and skimmed if it has moved.",
  },
  {
    id: "head-bolt-hole",
    callout: 6,
    name: "Head bolt hole",
    system: "structure",
    position: [0.35, -0.43, -1.66],
    summary:
      "The through-holes the head bolts pass down to clamp the head to the block.",
    fact: "This clamping load is what actually contains combustion — the gasket only fills the microscopic gaps. That is why head bolts are tightened to a stretch angle rather than a torque figure, and on many engines are single-use.",
    symptoms: [
      "A gasket that fails again shortly after replacement",
      "Cracking radiating from a bolt boss on a badly overheated head",
      "Pulled threads in the block below",
    ],
    service:
      "The bolts are the consumable, not the hole. Many designs require new ones every time the head is disturbed.",
    needsVerify: true,
  },
  {
    id: "coolant-passage",
    callout: 7,
    name: "Coolant passage",
    system: "cooling",
    position: [0.36, -0.5, 1.26],
    summary:
      "The elongated openings where coolant crosses between the block and the head.",
    fact: "The head sees far more heat per square centimetre than the block does, because the chamber roof and the exhaust port are both inside it. Most of the cooling system's real work happens in this casting.",
    symptoms: [
      "Hot spots and localised boiling after a partial blockage",
      "Corrosion where coolant was never changed",
      "External weeping at a core plug",
    ],
    service:
      "The coolant is the scheduled item; the passages themselves are cleaned when the head is reconditioned.",
    needsVerify: true,
  },
];

export const cylinderHead: Module = {
  id: "cylinder-head",
  chapter: "engine",
  name: "Cylinder head",
  subtitle: "Off the engine and turned over",
  blurb:
    "The most worked-on casting in the engine, seen from underneath — chambers, ports, seats, and the face that has to seal against combustion.",
  modelSlug: "cylinder-head",
  // Opens from below. Five of this plate's seven callouts are on the deck
  // face, and the default view from above shows exactly one of them.
  openingView: [2.4, -3.4, 3.6],
  parts,
};
