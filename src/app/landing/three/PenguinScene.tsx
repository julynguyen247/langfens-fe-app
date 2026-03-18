"use client";

import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import OceanEnvironment, { cameraYRef } from "./OceanEnvironment";
import OceanTerrain from "./OceanTerrain";
import WaterSurface from "./WaterSurface";
import SkyDome from "./SkyDome";
import Icebergs from "./Icebergs";
import IceFloes from "./IceFloes";
import DiveTransition from "./DiveTransition";
import PenguinAnimator from "./PenguinAnimator";
import CoralField from "./CoralField";
import MarineParticles from "./MarineParticles";
import Bubbles from "./Bubbles";
import KelpForest from "./KelpForest";
import SeaCreatures from "./SeaCreatures";
import AnglerFish from "./AnglerFish";
import WhaleSilhouette from "./WhaleSilhouette";
import TubeWorms from "./TubeWorms";
import HydrothermalVents from "./HydrothermalVents";
import CombinedPostFX from "./CombinedPostFX";
import AntarcticLandmass from "./AntarcticLandmass";
import IcePenguins from "./IcePenguins";
import Dolphins from "./Dolphins";
import TropicalFish from "./TropicalFish";
import Seagulls from "./Seagulls";
import GiantSquid from "./GiantSquid";
import Swordfish from "./Swordfish";
import GiantIsopod from "./GiantIsopod";
import ColossalSquid from "./ColossalSquid";
import type { DeviceTier } from "@/app/components/effects/useDeviceCapability";

interface PenguinSceneProps {
  tier: DeviceTier;
}

/**
 * Keeps the penguin group parented to the camera's Y position
 * so penguin keyframes remain screen-relative offsets.
 */
function CameraTrackingGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.y = cameraYRef.current;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

export default React.memo(function PenguinScene({
  tier,
}: PenguinSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 15, 5], fov: 45 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
      }}
      dpr={[1, 1.2]}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
      }}
    >
      <Suspense fallback={null}>
        <OceanEnvironment />
        {tier === "full" && <SkyDome />}
        {tier === "full" && <Icebergs />}
        {tier === "full" && <IceFloes />}
        {tier === "full" && <AntarcticLandmass />}
        {tier === "full" && <IcePenguins />}
        <OceanTerrain />
        {tier === "full" && <WaterSurface />}
        {tier === "full" && <DiveTransition />}
        {tier === "full" && <CombinedPostFX />}
        <CameraTrackingGroup>
          <PenguinAnimator />
        </CameraTrackingGroup>
   
        <CoralField tier={tier} />
        <KelpForest tier={tier} />
        <MarineParticles tier={tier} />
        <Bubbles />
        <SeaCreatures tier={tier} />
        {tier === "full" && <AnglerFish />}
        {tier === "full" && <WhaleSilhouette />}
        {tier === "full" && <TubeWorms />}
        {tier === "full" && <HydrothermalVents />}
        {/* New sea creatures */}
        {tier === "full" && <Dolphins />}
        {tier === "full" && <TropicalFish />}
        {tier === "full" && <Seagulls />}
        {tier === "full" && <GiantSquid />}
        {tier === "full" && <Swordfish />}
        {tier === "full" && <GiantIsopod />}
        {tier === "full" && <ColossalSquid />}
      </Suspense>
    </Canvas>
  );
});
