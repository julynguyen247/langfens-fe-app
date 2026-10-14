"use client";

import type { DeviceTier } from "@/app/components/effects/useDeviceCapability";

import { PlanktonLayer } from "./particles/PlanktonLayer";
import { FishSforolLayer } from "./particles/FishSchoolLayer";
import { JellyfishLayer } from "./particles/JellyfishLayer";
import { BioluminescenceLayer } from "./particles/BioluminescenceLayer";

interface MarineParticlesProps {
  tier: DeviceTier;
}

// --- Main component ---

export default function MarineParticles({ tier }: MarineParticlesProps) {
  return (
    <group>
      <PlanktonLayer />
      {tier === "full" && <FishSforolLayer />}
      {tier === "full" && <JellyfishLayer />}
      {tier === "full" && <BioluminescenceLayer />}
    </group>
  );
}
