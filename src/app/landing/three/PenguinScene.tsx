"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import OceanEnvironment, { cameraYRef } from "./OceanEnvironment";
import OceanTerrain from "./OceanTerrain";
import WaterSurface from "./WaterSurface";
import PenguinController from "./PenguinController";
import CoralField from "./CoralField";
import MarineParticles from "./MarineParticles";
import { CausticOverlay3D } from "./shaders/caustic";
import { GodRaysOverlay } from "./shaders/godRays";
import type { DeviceTier } from "@/app/components/effects/useDeviceCapability";

interface PenguinSceneProps {
  scrollProgress: number;
  currentSection: string;
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

export default function PenguinScene({
  scrollProgress,
  currentSection,
  tier,
}: PenguinSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 10, 5], fov: 45 }}
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
        <OceanEnvironment scrollProgress={scrollProgress} />
        <OceanTerrain />
        {tier === "full" && <WaterSurface />}
        {tier === "full" && <CausticOverlay3D />}
        {tier === "full" && <GodRaysOverlay />}
        <CameraTrackingGroup>
          <PenguinController
            scrollProgress={scrollProgress}
            currentSection={currentSection}
          />
        </CameraTrackingGroup>
        <CoralField tier={tier} />
        <MarineParticles tier={tier} />
      </Suspense>
    </Canvas>
  );
}
