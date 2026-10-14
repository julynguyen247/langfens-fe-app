"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cameraYRef } from "../OceanEnvironment";

// --- Layer 4: Bioluminescence (full tier, Midnight+ zones) ---

const BIOLUM_COUNT = 230;

const BIOLUM_COLORS = [
  new THREE.Color("#06D6A0"), // teal
  new THREE.Color("#8B5CF6"), // purple
  new THREE.Color("#0EA5E9"), // deep blue
  new THREE.Color("#F59E0B"), // warm amber
];

export function BioluminescenceLayer() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const frameCounter = useRef(0);

  const { positions, colors, phases } = useMemo(() => {
    const pos = new Float32Array(BIOLUM_COUNT * 3);
    const col = new Float32Array(BIOLUM_COUNT * 3);
    const ph = new Float32Array(BIOLUM_COUNT);

    for (let i = 0; i < BIOLUM_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;     // X: [-25, 25]
      pos[i * 3 + 1] = -14 - Math.random() * 26;    // Y: [-14, -40] (Midnight → Abyss)
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;  // Z: [-20, 20]

      const c = BIOLUM_COLORS[i % BIOLUM_COLORS.length];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      ph[i] = Math.random() * Math.PI * 2; // random phase for twinkle
    }

    return { positions: pos, colors: col, phases: ph };
  }, []);

  const basePositions = useMemo(() => new Float32Array(positions), [positions]);

  useFrame(({ clock }) => {
    const points = pointsRef.current;
    if (!points) return;

    const camY = cameraYRef.current;

    // Only visible in deep zones (camY < -12)
    points.visible = camY < -12;
    if (!points.visible) return;

    // Frame-skip: update every 3rd frame
    frameCounter.current++;
    if (frameCounter.current % 3 !== 0) return;

    const time = clock.getElapsedTime();

    // Gentle drift animation
    const posAttr = points.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < BIOLUM_COUNT; i++) {
      arr[i * 3] = basePositions[i * 3] + Math.sin(time * 0.2 + phases[i]) * 0.5;
      arr[i * 3 + 1] = basePositions[i * 3 + 1] + Math.sin(time * 0.15 + phases[i] * 2) * 0.3;
    }
    posAttr.needsUpdate = true;

    // Twinkle: pulse size
    if (materialRef.current) {
      materialRef.current.size = 0.25 + Math.sin(time * 0.8) * 0.08;
      // Brighter as camera goes deeper
      const depthFactor = Math.min(1, Math.max(0, (-camY - 12) / 8));
      materialRef.current.opacity = 0.4 + depthFactor * 0.4;
    }
  });

  return (
    <points ref={pointsRef} renderOrder={510}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={BIOLUM_COUNT}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={BIOLUM_COUNT}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.25}
        vertexColors
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
}
