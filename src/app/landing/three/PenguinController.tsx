"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import PenguinModel from "./PenguinModel";

/**
 * Controls the penguin's position, rotation, and scale based on scroll progress.
 * Reads scroll from props and interpolates position per frame.
 */

interface PenguinControllerProps {
  scrollProgress: number;
  currentSection: string;
}

// Keyframe positions for the penguin at different scroll points
// Camera is at [0, 0, 5], looking at origin. Keep penguin z >= 0 to avoid fog.
const KEYFRAMES: { progress: number; position: [number, number, number]; scale: number }[] = [
  { progress: 0.0, position: [1.8, 0, 1], scale: 1 },       // Hero: center-right, close
  { progress: 0.12, position: [2.0, 0.3, 0.5], scale: 0.9 }, // Features start
  { progress: 0.35, position: [2.2, 0, 0], scale: 0.85 },    // Features mid
  { progress: 0.55, position: [1.8, -0.2, 0.5], scale: 0.9 }, // How It Works
  { progress: 0.68, position: [0, 0.5, 1], scale: 0.85 },    // Stats: centered, proud
  { progress: 0.78, position: [-1.5, 0, 0.5], scale: 0.85 }, // Testimonials: peeking from left
  { progress: 0.88, position: [0, 1, 1.5], scale: 1.1 },     // CTA: ascending, triumphant
  { progress: 1.0, position: [0, 2, 2], scale: 1 },           // Footer: risen to surface
];

function getInterpolatedKeyframe(progress: number) {
  // Find the two keyframes to interpolate between
  let from = KEYFRAMES[0];
  let to = KEYFRAMES[1];

  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (progress >= KEYFRAMES[i].progress && progress <= KEYFRAMES[i + 1].progress) {
      from = KEYFRAMES[i];
      to = KEYFRAMES[i + 1];
      break;
    }
  }

  // Last keyframe
  if (progress >= KEYFRAMES[KEYFRAMES.length - 1].progress) {
    from = KEYFRAMES[KEYFRAMES.length - 2];
    to = KEYFRAMES[KEYFRAMES.length - 1];
  }

  const rangeSize = to.progress - from.progress;
  const t = rangeSize > 0 ? (progress - from.progress) / rangeSize : 0;
  const smoothT = t * t * (3 - 2 * t); // smoothstep

  return {
    position: [
      THREE.MathUtils.lerp(from.position[0], to.position[0], smoothT),
      THREE.MathUtils.lerp(from.position[1], to.position[1], smoothT),
      THREE.MathUtils.lerp(from.position[2], to.position[2], smoothT),
    ] as [number, number, number],
    scale: THREE.MathUtils.lerp(from.scale, to.scale, smoothT),
  };
}

export default function PenguinController({
  scrollProgress,
  currentSection,
}: PenguinControllerProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const target = getInterpolatedKeyframe(scrollProgress);

    // Smooth lerp to target position
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      target.position[0],
      delta * 3
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      target.position[1],
      delta * 3
    );
    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z,
      target.position[2],
      delta * 3
    );

    // Scale
    const currentScale = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, target.scale, delta * 3);
    groupRef.current.scale.setScalar(newScale);
  });

  return (
    <group ref={groupRef}>
      <PenguinModel
        scrollProgress={scrollProgress}
        currentSection={currentSection}
      />
    </group>
  );
}
