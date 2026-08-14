import type { Module, Part } from "../types";

/**
 * A rear-drive chassis with its suspension in place. Which end is which was
 * settled by the model itself rather than assumed: there is a differential
 * housing dead centre of one axle and nothing equivalent on the other, so that
 * axle is the driven one.
 *
 * Several parts a suspension plate would normally carry are deliberately
 * absent, because this model cannot distinguish them:
 *
 * - The **damper** is not called out separately. Whether it sits inside the
 *   coil as a coilover or beside it cannot be told here, so the spring is
 *   labelled as the spring and the damper is explained alongside it.
 * - The **driveshafts** and the **anti-roll bar** are bars running between the
 *   differential and the wheels, and cannot be told apart from the suspension
 *   arms on this geometry.
 *
 * Every position was probed from the view the plate opens in, which matters
 * more than it sounds: a callout authored while the model was rotated lands on
 * whichever side happened to face the camera at the time, and then spends the
 * whole opening view hidden behind the structure. On a compact casting that is
 * barely noticeable; on an open frame like this one it left a plate with a
 * single visible balloon out of six.
 *
 * See VERIFY.md.
 */
const parts: Part[] = [
  {
    id: "coil-spring",
    callout: 1,
    name: "Coil spring",
    system: "suspension",
    position: [0.67, -0.01, 1.66],
    summary:
      "The spring carrying the car's weight at each corner and absorbing what the road throws up.",
    fact: "It only decides how far the car moves, not how fast. A spring on its own would keep bouncing long after the bump — stopping that is entirely the damper's job, which is why the two are always fitted as a pair and often built into one unit.",
    symptoms: [
      "The car sitting lower on one corner",
      "A clunk over bumps from a snapped coil",
      "Bottoming out on dips it used to take comfortably",
    ],
    service:
      "Lifetime part in normal use. Replaced in pairs when one breaks or sags.",
  },
  {
    id: "suspension-arm",
    callout: 2,
    name: "Suspension arm",
    system: "suspension",
    position: [0.42, -0.16, 1.72],
    summary:
      "The hinged links that locate the wheel while letting it move up and down.",
    fact: "Their length and the angles they swing through are what decide how the wheel leans as the suspension moves — geometry chosen so the tyre stays as flat to the road as possible while the body rolls.",
    symptoms: [
      "Knocking over small bumps from a worn bush",
      "Vague steering and wandering under braking",
      "Uneven inner or outer tyre wear from shifted alignment",
    ],
    service:
      "The arm lasts; its rubber bushes and ball joints are the wear items.",
  },
  {
    id: "hub-upright",
    callout: 3,
    name: "Upright and hub",
    system: "suspension",
    position: [1.1, -0.01, 1.71],
    summary:
      "The casting the wheel bearing sits in, held between the suspension arms.",
    fact: "Everything meets here: the wheel bolts to it, the brake caliper hangs off it, and the arms locate it. It is the one part that has to survive braking, cornering and bump loads all at once.",
    symptoms: [
      "A droning wheel bearing that changes pitch as you steer",
      "Play at the top and bottom of the wheel when it is rocked",
      "Vibration through the steering at speed",
    ],
    service:
      "The bearing inside is the serviceable item; the upright itself is only replaced after accident damage.",
  },
  {
    id: "differential",
    callout: 4,
    name: "Differential",
    system: "driveline",
    position: [-0.02, 0.09, -1.76],
    summary:
      "The gearbox in the middle of the driven axle that splits drive between the two wheels.",
    fact: "The outer wheel travels further than the inner one through every corner. Without this letting them turn at different speeds, something would have to give on every turn — usually a tyre, scrubbing its way round.",
    symptoms: [
      "Whining that changes with road speed rather than engine speed",
      "Clunking on and off the throttle",
      "Oil weeping from the pinion or output seals",
    ],
    service:
      "Oil is the scheduled item on some designs and sealed for life on others.",
    needsVerify: true,
  },
  {
    id: "chassis-rail",
    callout: 5,
    name: "Chassis rail",
    system: "structure",
    position: [0.17, -0.14, 0.39],
    summary:
      "The main longitudinal structure running the length of the car, carrying both axles.",
    fact: "The rails are deliberately not uniform. Sections of them are designed to fold in a controlled way in a crash, so the structure absorbs energy instead of passing it straight through to the cabin.",
    symptoms: [
      "Doors and panel gaps that no longer line up",
      "Corrosion at seams and closed sections",
      "Uneven tyre wear that no alignment will fix",
    ],
    service:
      "Not a serviceable part. Inspected after any significant impact.",
  },
  {
    id: "crossmember",
    callout: 6,
    name: "Crossmember",
    system: "structure",
    position: [-0.33, -0.08, 1.25],
    summary:
      "The transverse members tying the two rails together across the frame.",
    fact: "A ladder frame is far stiffer in bending than in twist, and it is the crossmembers that do most of what little resists the twist. Their number and spacing is why the same pair of rails can be built into a light car or a loaded truck.",
    symptoms: [
      "A dull clunk on hard acceleration from collapsed mounting bushes",
      "Corrosion around the mounting points",
      "Rear alignment drifting out as the mounts soften",
    ],
    service:
      "Structural and long-lived. Its mounting bushes are the part that ages.",
  },
];

export const suspensionChassis: Module = {
  id: "suspension-chassis",
  chapter: "running-gear",
  name: "Suspension & chassis",
  subtitle: "Rear-drive ladder frame, both axles in place",
  blurb:
    "How a car is held up, located and driven: springs, arms, uprights, and the frame that carries all of it.",
  modelSlug: "suspension-chassis",
  parts,
};
