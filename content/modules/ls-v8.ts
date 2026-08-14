import type { Module, Part } from "../types";

/**
 * Callout positions are authored by clicking the model directly in the browser
 * with `?authoring=1`, not typed by hand. They live in normalized model space
 * (see lib/useNormalizedModel.ts), so they stay comparable across models of
 * completely different native scale.
 *
 * The list only covers components that can actually be picked out on this
 * particular model. The source mesh arrives as one merged casting with no part
 * names, so anything that could not be identified with confidence — the
 * alternator, starter, oil filter and water pump among them — is left off
 * rather than pinned to a plausible-looking lump. See VERIFY.md.
 */

const parts: Part[] = [
  {
    id: "supercharger",
    callout: 1,
    name: "Supercharger",
    system: "air",
    position: [0.62, 1.28, 0.92],
    summary:
      "A belt-driven air pump that force-feeds the engine more air than it could ever draw in on its own.",
    fact: "It is driven by the crankshaft, so it steals engine power to make engine power — the trade is worth it because the air it packs in is worth far more than the power it costs.",
    symptoms: [
      "Whine that rises in pitch or turns into a rattle",
      "Noticeably less pull at full throttle",
      "Oil weeping from the snout bearing housing",
    ],
    service:
      "Not a wear item on a service schedule. The snout oil and the drive belt are the parts that get changed.",
  },
  {
    id: "air-filter",
    callout: 2,
    name: "Air filter",
    system: "air",
    position: [-1.76, 0.62, -1.33],
    summary:
      "The cone every bit of air entering the engine has to pass through first.",
    fact: "An engine swallows thousands of litres of air for every litre of fuel it burns, so this is the only thing standing between the cylinder walls and a road's worth of grit.",
    symptoms: [
      "Sluggish response and worse fuel economy",
      "Visible dirt caking the pleats",
      "Intake noise that turns harsh or breathy",
    ],
    service:
      "A scheduled replacement item — inspected at services and changed far sooner in dusty conditions.",
    needsVerify: true,
  },
  {
    id: "valve-cover",
    callout: 3,
    name: "Valve cover",
    system: "lubrication",
    position: [1.47, 0.6, 1],
    summary:
      "The lid over the top of each cylinder head. It keeps oil in and dirt out of the valvetrain.",
    fact: "It is mostly a sealing part, but it is also where crankcase fumes get drawn back into the intake so they get burned instead of vented to atmosphere.",
    symptoms: [
      "Oil seeping down the side of the head",
      "Burning-oil smell after a drive, worst at a stop",
      "Oil pooling in the spark plug wells",
    ],
    service:
      "The cover itself rarely fails. Its gasket is the consumable and gets replaced when it starts weeping.",
  },
  {
    id: "ignition-coil",
    callout: 4,
    name: "Ignition coil",
    system: "fuel-ignition",
    position: [1.45, 0.77, 0.62],
    summary:
      "Turns twelve volts into the tens of thousands needed to jump a spark across the plug gap.",
    fact: "An LS gives every cylinder its own coil bolted to the valve cover, so there is no distributor and no plug leads to degrade — and one dead coil kills exactly one cylinder rather than the whole bank.",
    symptoms: [
      "A misfire that shakes the engine at idle",
      "Flashing engine light under acceleration",
      "Fuel smell from unburnt mixture going out the exhaust",
    ],
    service:
      "Replaced on failure. Plugs underneath them are the scheduled item.",
  },
  {
    id: "cylinder-head",
    callout: 5,
    name: "Cylinder head",
    system: "air",
    position: [1.72, 0.33, 0.93],
    summary:
      "Caps the top of each cylinder and holds the valves that let air in and exhaust out.",
    fact: "The shape of the ports and chambers cast into it sets how well the engine breathes — it is the single biggest limit on how much power a given block can make.",
    symptoms: [
      "White smoke from the exhaust or coolant disappearing with no visible leak",
      "Overheating that comes on quickly",
      "Bubbles in the coolant reservoir",
    ],
    service:
      "Lifetime part unless the engine is overheated badly enough to warp it or lift the head gasket.",
    detailModuleId: "cylinder-head",
  },
  {
    id: "exhaust-header",
    callout: 6,
    name: "Exhaust header",
    system: "exhaust",
    position: [1.84, -0.29, 0.76],
    summary:
      "A set of tuned pipes that carries burnt gas out of each cylinder and into the exhaust system.",
    fact: "Headers use equal-length runners so the pulse leaving one cylinder helps pull the next one clear — a well-designed set is worth real power for no fuel.",
    symptoms: [
      "A tapping or ticking that is loudest on a cold start",
      "Exhaust smell in the cabin",
      "Sooty streaks at a flange or a cracked weld",
    ],
    service:
      "Lasts for years. Gaskets and bolts are what actually get replaced, usually because a bolt snapped.",
  },
  {
    id: "engine-block",
    callout: 7,
    name: "Engine block",
    system: "rotating",
    position: [0.75, 0.33, 1.32],
    summary:
      "The main aluminium casting everything else bolts to. It holds the cylinders and carries the crankshaft.",
    fact: "The LS block's deep-skirt design wraps down past the crankshaft centreline, which makes the bottom end stiff enough to take boost that the architecture was never originally designed for.",
    symptoms: [
      "Knocking from deep in the engine that gets louder under load",
      "Coolant and oil mixing into a milky sludge",
      "Loss of compression on one cylinder",
    ],
    service:
      "The foundation of the engine. If this is damaged the engine is rebuilt or replaced.",
  },
  {
    id: "oil-pan",
    callout: 8,
    name: "Oil pan",
    system: "lubrication",
    position: [0.68, -1.35, 0.64],
    summary:
      "The reservoir bolted to the bottom of the block that holds the engine's oil supply.",
    fact: "It has baffles inside to stop the oil sloshing away from the pickup under hard cornering — starve the pickup for a couple of seconds and you can wipe out the bearings.",
    symptoms: [
      "Oil spots under the car where it parks",
      "Low oil level with no smoke",
      "A dented or scraped pan after hitting something in the road",
    ],
    service:
      "Lifetime part. The drain plug washer and pan gasket are the serviceable bits.",
  },
  {
    id: "belt-drive",
    callout: 9,
    name: "Accessory belt",
    system: "accessory",
    position: [0.59, 0.81, -0.51],
    summary:
      "One long belt running off the crank pulley that drives the engine's bolt-on accessories.",
    fact: "A spring-loaded tensioner keeps it tight automatically. Everything it drives stops the instant it snaps, which is why a broken belt means an overheating engine and a dying battery at the same time.",
    symptoms: [
      "Squealing on start-up or when you turn the wheel",
      "Cracks, glazing or missing chunks across the ribs",
      "Battery light and temperature gauge rising together",
    ],
    service:
      "A wear item — inspected at services and replaced when cracked or glazed.",
    needsVerify: true,
  },
  {
    id: "radiator",
    callout: 10,
    name: "Radiator",
    system: "cooling",
    position: [-0.93, 0.36, -1.79],
    summary:
      "A heat exchanger up front that dumps the engine's waste heat into the passing air.",
    fact: "Roughly a third of the energy in the fuel leaves the engine as heat through this, which is why a supercharged build almost always needs a bigger one than stock.",
    symptoms: [
      "Green, orange or pink puddles under the front of the car",
      "Temperature gauge climbing on the motorway",
      "Bent, blocked or crusty fins across the face",
    ],
    service:
      "The coolant in it is the scheduled item; the radiator is replaced when it leaks or blocks up.",
    needsVerify: true,
  },
  {
    id: "flexplate",
    callout: 11,
    name: "Flexplate",
    system: "driveline",
    position: [0.18, -0.04, 1.42],
    summary:
      "A steel disc on the back of the crankshaft that the starter grabs and the transmission bolts to.",
    fact: "A manual car gets a heavy flywheel that stores momentum for the clutch to bite against; an automatic gets this thinner flexplate instead, because the torque converter already does that job.",
    symptoms: [
      "Grinding or a whirring noise when starting",
      "A rhythmic knock that changes with engine speed",
      "Chipped or missing teeth around the ring gear",
    ],
    service: "Lifetime part unless the ring gear teeth get chewed up.",
  },
  {
    id: "torque-converter",
    callout: 12,
    name: "Torque converter",
    system: "driveline",
    position: [0.41, -0.59, 1.84],
    summary:
      "A fluid coupling that lets an automatic car sit still in gear without stalling the engine.",
    fact: "There is no mechanical connection through it at low speed — the engine spins one turbine, oil flung off it spins another, and that fluid link is what lets you hold the brake at a red light in Drive.",
    symptoms: [
      "Shuddering at a steady cruise, like driving over rumble strips",
      "Slipping — engine revs climb but the car does not accelerate",
      "Stalling as you come to a stop",
    ],
    service:
      "Tied to transmission fluid condition. Replaced with the transmission or after a failure contaminates it.",
  },
];

export const lsV8: Module = {
  id: "ls-v8",
  chapter: "engine",
  name: "Supercharged LS V8",
  subtitle: "General Motors small-block, positive-displacement blower",
  blurb:
    "The whole engine in one piece: air in at the blower, burnt gas out at the headers, and every system that keeps it alive in between.",
  modelSlug: "ls-v8",
  parts,
};
