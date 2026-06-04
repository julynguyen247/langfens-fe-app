"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cameraYRef } from "./OceanEnvironment";
import { useScrollStore } from "../hooks/useScrollStore";
import Penguin3D from "./Penguin3D";

// Keyframe positions for the penguin at different scroll points.
// Positions are screen-relative offsets, parented to camera tracking group.
const KEYFRAMES: {
  progress: number;
  position: [number, number, number];
  scale: number;
}[] = [
  { progress: 0.0, position: [1.5, 0.5, 1.5], scale: 0.8 }, // Surface: standing on ice
  { progress: 0.08, position: [1.2, 0, 1.0], scale: 0.7 }, // Approaching water
  { progress: 0.15, position: [1.8, -0.2, 0.5], scale: 0.65 }, // Diving in
  { progress: 0.3, position: [2.0, 0, 0], scale: 0.6 }, // Swimming in sunlight
  { progress: 0.5, position: [1.5, 0.2, 0.5], scale: 0.6 }, // Twilight
  { progress: 0.65, position: [0, 0.3, 1], scale: 0.6 }, // Midnight: centered
  { progress: 0.8, position: [-1.0, 0, 0.5], scale: 0.6 }, // Deep: left side
  { progress: 0.9, position: [0, 0.5, 1.5], scale: 0.7 }, // Abyss: centered
  { progress: 1.0, position: [0, 0.8, 2], scale: 0.7 }, // Floor: resting
];

const BUBBLE_COUNT = 20;

function getInterpolatedKeyframe(progress: number) {
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

function getZone(camY: number): string {
  if (camY > 2) return "surface";
  if (camY > -2) return "dive";
  if (camY > -8) return "sunlight";
  if (camY > -14) return "twilight";
  if (camY > -20) return "midnight";
  if (camY > -25) return "deep";
  return "abyss";
}

export default function PenguinAnimator() {
  const groupRef = useRef<THREE.Group>(null);
  const penguinRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  const bubblesRef = useRef<THREE.Points>(null);
  const spotlightRef = useRef<THREE.SpotLight>(null);
  const spotlightTargetRef = useRef<THREE.Object3D>(null);
  
  // Track continuous barrel rolls to prevent Euler snapping
  const barrelRollAcc = useRef(0);
  const spinTimer = useRef(0);

  // Track each bubble's spawn Y so we know when to reset
  const bubbleSpawnY = useRef(new Float32Array(BUBBLE_COUNT));

  // Pre-allocate bubble positions
  const bubblePositions = useMemo(() => {
    const positions = new Float32Array(BUBBLE_COUNT * 3);
    // Initialize all bubbles far offscreen
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -1000;
      positions[i * 3 + 2] = 0;
    }
    return positions;
  }, []);

  // Index for round-robin bubble spawning
  const nextBubbleIdx = useRef(0);
  const bubbleSpawnTimer = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;
    const camY = cameraYRef.current;
    const zone = getZone(camY);

    // --- Position interpolation ---
    const scrollProgress = useScrollStore.getState().scrollProgress;
    const target = getInterpolatedKeyframe(scrollProgress);

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

    const currentScale = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, target.scale, delta * 3);
    groupRef.current.scale.setScalar(newScale);

    // --- Wing animation ---
    if (leftWingRef.current && rightWingRef.current) {
      let wingZ = 0;
      let wingX = 0;
      let wingY = 0;
      let bodyTilt = 0;
      let bodyRoll = 0;

      switch (zone) {
        case "surface":
          wingZ = Math.sin(time * 1.5) * 0.15 - 0.1; // Idle balance
          wingX = 0.1;
          bodyTilt = 0; // Upright
          break;
        case "dive":
          wingZ = -1.2; // Wings tucked tight against body for speed
          wingX = 0.3;
          bodyTilt = -0.8; // Steep dive angle
          break;
        case "sunlight":
          // Power stroke! Realistic figure-8 swimming motion
          const strokePhase = time * 4.0;
          wingZ = Math.sin(strokePhase) * 0.5 - 0.2; // Up/down sweep
          wingX = Math.cos(strokePhase) * 0.3;       // Forward/back rowing
          wingY = Math.sin(strokePhase) * 0.2;       // Twist (pitch control)
          bodyTilt = -0.3 + Math.sin(strokePhase * 0.5) * 0.05; // Speed bobbing
          bodyRoll = Math.sin(strokePhase) * 0.1; // Side to side roll
          
          // Trigger a beautiful 360 barrel roll every 8 seconds!
          spinTimer.current += delta;
          if (spinTimer.current > 8.0) {
             barrelRollAcc.current -= Math.PI * 2.0; // Target another full spin
             spinTimer.current = 0;
          }
          break;
        case "twilight":
          // Slower, relaxed gliding strokes
          const glidePhase = time * 2.5;
          wingZ = Math.sin(glidePhase) * 0.3 - 0.1;
          wingX = Math.cos(glidePhase) * 0.2;
          wingY = Math.sin(glidePhase) * 0.1;
          bodyTilt = -0.15;
          bodyRoll = Math.sin(glidePhase) * 0.05;
          break;
        case "midnight":
          // Suspended / cautious hovering
          wingZ = Math.sin(time * 1.0) * 0.1 - 0.3;
          wingX = 0.15;
          bodyTilt = 0;
          break;
        case "deep":
        case "abyss":
          // Exploring deep, very slow motion
          wingZ = Math.sin(time * 0.8) * 0.15 - 0.2;
          wingX = Math.cos(time * 0.8) * 0.1;
          bodyTilt = -0.05;
          break;
      }

      // Apply realistic 3D stroke to wings (Left)
      leftWingRef.current.rotation.set(wingX, wingY, wingZ);
      // Right wing is mirrored: X is same, Y is inverted, Z is inverted
      rightWingRef.current.rotation.set(wingX, -wingY, -wingZ);

      // Apply body tilt, dynamic roll, and looking around
      if (penguinRef.current) {
        penguinRef.current.rotation.x = THREE.MathUtils.lerp(
          penguinRef.current.rotation.x,
          bodyTilt,
          delta * 3
        );
        // Lerp towards the base roll PLUS any accumulated barrel rolls
        penguinRef.current.rotation.z = THREE.MathUtils.lerp(
          penguinRef.current.rotation.z,
          bodyRoll + barrelRollAcc.current,
          delta * 2.5 // Smooth, natural spin interpolation
        );
        // Add a gentle Y-axis turning motion so it looks around!
        const lookAroundY = Math.sin(time * 0.8) * 0.3;
        penguinRef.current.rotation.y = THREE.MathUtils.lerp(
          penguinRef.current.rotation.y,
          lookAroundY,
          delta * 2
        );
      }
    }

    // Head animation removed — eyes/beak baked into body mesh

    // --- Bubble trail ---
    if (bubblesRef.current) {
      const geom = bubblesRef.current.geometry;
      const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      const isUnderwater = camY < 0 && zone !== "surface";

      if (isUnderwater) {
        // Spawn new bubbles periodically
        bubbleSpawnTimer.current += delta;
        if (bubbleSpawnTimer.current > 0.12) {
          bubbleSpawnTimer.current = 0;
          const idx = nextBubbleIdx.current;

          // Spawn at penguin's current world-ish position
          const px = groupRef.current.position.x + (Math.random() - 0.5) * 0.3;
          const py = groupRef.current.position.y - 0.2;
          const pz = groupRef.current.position.z + (Math.random() - 0.5) * 0.3;

          posArray[idx * 3] = px;
          posArray[idx * 3 + 1] = py;
          posArray[idx * 3 + 2] = pz;
          bubbleSpawnY.current[idx] = py;

          nextBubbleIdx.current = (idx + 1) % BUBBLE_COUNT;
        }

        // Update existing bubbles: rise and wobble
        for (let i = 0; i < BUBBLE_COUNT; i++) {
          const y = posArray[i * 3 + 1];
          // Skip offscreen bubbles
          if (y < -500) continue;

          posArray[i * 3 + 1] += 1.5 * delta; // Rise
          posArray[i * 3] += Math.sin(time * 2 + i) * 0.003; // Wobble X

          // Reset bubbles that have risen 3+ units above spawn
          if (posArray[i * 3 + 1] - bubbleSpawnY.current[i] > 3) {
            posArray[i * 3 + 1] = -1000;
          }
        }
      } else {
        // Not underwater — push all bubbles offscreen
        for (let i = 0; i < BUBBLE_COUNT; i++) {
          posArray[i * 3 + 1] = -1000;
        }
      }

      posAttr.needsUpdate = true;
    }

    // --- Beak flashlight ---
    if (spotlightRef.current) {
      const isMidnight = zone === "midnight";
      spotlightRef.current.intensity = THREE.MathUtils.lerp(
        spotlightRef.current.intensity,
        isMidnight ? 0.8 : 0,
        delta * 5
      );

      // Attach spotlight target
      if (spotlightTargetRef.current) {
        spotlightRef.current.target = spotlightTargetRef.current;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <Penguin3D
        penguinRef={penguinRef}
        headRef={headRef}
        leftWingRef={leftWingRef}
        rightWingRef={rightWingRef}
      />

      {/* Bubble trail */}
      <points ref={bubblesRef} renderOrder={450}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[bubblePositions, 3]}
            count={BUBBLE_COUNT}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#a0d8ef"
          blending={THREE.AdditiveBlending}
          transparent
          opacity={0.5}
          size={0.06}
          depthWrite={false}
        />
      </points>

      {/* Beak flashlight */}
      <spotLight
        ref={spotlightRef}
        color="#F59E0B"
        angle={Math.PI / 6}
        intensity={0}
        distance={8}
        penumbra={0.5}
        position={[0, 0.3, 0.5]}
      />
      <object3D ref={spotlightTargetRef} position={[0, 0, 3]} />
    </group>
  );
}
