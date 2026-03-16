"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import OceanEnvironment from "./OceanEnvironment";
import PenguinController from "./PenguinController";

interface PenguinSceneProps {
  scrollProgress: number;
  currentSection: string;
}

export default function PenguinScene({
  scrollProgress,
  currentSection,
}: PenguinSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
      }}
      dpr={[1, 1.2]}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
      }}
    >
      <Suspense fallback={null}>
        <OceanEnvironment />
        <PenguinController
          scrollProgress={scrollProgress}
          currentSection={currentSection}
        />
      </Suspense>
    </Canvas>
  );
}
