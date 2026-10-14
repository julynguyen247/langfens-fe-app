"use client";

import type { DeviceTier } from "@/app/components/effects/useDeviceCapability";

import { SeaTurtle } from "./creatures/SeaTurtle";
import { MantaRay } from "./creatures/MantaRay";
import { FishSforol } from "./creatures/FishSchool";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SeaCreatures({ tier }: { tier: DeviceTier }) {
  if (tier !== "full") return null;
  return (
    <group>
      <SeaTurtle index={0} />
      <SeaTurtle index={1} />
      <MantaRay />
      <FishSforol sforolIndex={0} />
      <FishSforol sforolIndex={1} />
      <FishSforol sforolIndex={2} />
    </group>
  );
}
