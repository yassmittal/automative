import type { Module, Part } from "../types";

/**
 * The one model in the atlas whose meshes carry real part names, so the disc,
 * the pads and the caliper are bound to their actual geometry with
 * `meshNodeNames` and light up as themselves rather than only carrying a
 * balloon. The mesh each callout sits on was confirmed by probing the model at
 * `?authoring=1` — the names below are the GLB's own, verbatim.
 *
 * The caliper piston is deliberately absent. It is a real and interesting part,
 * but this model has no separate geometry for it and nothing on the caliper's
 * outer surface identifies where it sits, so a callout would be pointing at a
 * plausible-looking lump. See VERIFY.md.
 */
const parts: Part[] = [
  {
    id: "brake-disc",
    callout: 1,
    name: "Brake disc",
    system: "braking",
    position: [0.14, 0.29, 1.21],
    meshNodeNames: [
      "0-_BrakeAssembly_Disc_0-_0-_BrakeAssembly_D_0",
      "0-_BrakeAssembly_Disc_1-_0-_BrakeAssembly_D_0",
    ],
    summary:
      "The steel disc that turns with the wheel and that the pads clamp onto.",
    fact: "A brake does not destroy the car's energy, it moves it: every stop turns motion into heat in this disc, and repeated hard stops can put it past the temperature at which steel visibly glows.",
    symptoms: [
      "A pulsing through the pedal under braking",
      "A lip worn around the outer edge",
      "Blue patches or fine cracks across the face after overheating",
    ],
    service:
      "A wear item. Replaced when it reaches its minimum thickness, which is stamped on the disc itself.",
  },
  {
    id: "vent-vane",
    callout: 2,
    name: "Ventilation vanes",
    system: "cooling",
    position: [-0.12, 0.67, 1.77],
    summary:
      "The gap between the disc's two faces, split by curved vanes you can see around its edge.",
    fact: "The disc is a centrifugal fan. Spinning it throws air outward through these vanes and draws cool air in behind, which is the difference between a disc that survives repeated hard stops and one that cooks its pads.",
    symptoms: [
      "Vanes packed with road debris or corrosion",
      "Brake fade appearing sooner than it used to",
      "Cracks running between vanes on a heavily used disc",
    ],
    service: "Not serviced directly. Renewed with the disc.",
  },
  {
    id: "brake-pad",
    callout: 3,
    name: "Brake pads",
    system: "braking",
    position: [0.57, 1.08, -0.69],
    meshNodeNames: ["3-__4-_3-__0", "3-__5-_3-__0"],
    summary:
      "The friction blocks pressed against each face of the disc.",
    fact: "The pad is designed to be the part that wears — it is the cheap, replaceable half of the pair, sacrificing itself to protect the far more expensive disc behind it.",
    symptoms: [
      "A squeal from the wear indicator touching the disc",
      "Grinding, which means the friction material is already gone",
      "Longer stopping distances and a pedal that travels further",
    ],
    service:
      "The most frequently replaced brake part. Inspected at every service and changed on thickness.",
  },
  {
    id: "caliper-body",
    callout: 4,
    name: "Caliper",
    system: "braking",
    position: [0.25, -0.24, -1],
    meshNodeNames: [
      "2-_BrakeAssembly_Cali_2-_2-_BrakeAssembly_C_0",
      "2-_BrakeAssembly_Cali_3-_2-_BrakeAssembly_C_0",
    ],
    summary:
      "The casting that straddles the disc and squeezes the pads against it.",
    fact: "It is a hydraulic clamp with no mechanical advantage of its own — all the multiplication happens in the fluid, which is why a small movement of your foot becomes an enormous force at the pad.",
    symptoms: [
      "The car pulling to one side under braking",
      "One pad worn far more than the other",
      "Fluid weeping around the piston seal",
    ],
    service:
      "Slide pins are cleaned and greased at pad changes. The body itself is replaced or reconditioned when a piston or seal fails.",
  },
  {
    id: "mounting-ear",
    callout: 5,
    name: "Mounting ear",
    system: "structure",
    position: [0.72, -0.95, -0.98],
    summary:
      "The lugs that bolt the whole assembly to the suspension upright.",
    fact: "This is where braking force actually enters the car. Everything the pads do to the disc is reacted through these two bolts into the upright, and from there into the suspension arms.",
    symptoms: [
      "Knocking under braking from a loose or stretched bolt",
      "Corrosion swelling between the ear and the upright",
      "Seized slide pins stopping the caliper floating on its mount",
    ],
    service:
      "Bolts are torqued to a specific figure on reassembly and are often single-use.",
    needsVerify: true,
  },
];

export const brakeAssembly: Module = {
  id: "brake-assembly",
  chapter: "running-gear",
  name: "Disc brake",
  subtitle: "Ventilated disc, floating caliper",
  blurb:
    "Where speed becomes heat. A steel disc, two pads, and a hydraulic clamp doing the most safety-critical job on the car.",
  modelSlug: "brake-assembly",
  parts,
};
