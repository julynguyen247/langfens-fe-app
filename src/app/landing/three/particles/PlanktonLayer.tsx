"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cameraYRef } from "../OceanEnvironment";

// --- Layer 1: Plankton (all tiers) ---

export function PlanktonLayer() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const frameCounter = useRef(0);

  const positions = useMemo(() => {
    const count = 300;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 40; // X: [-20, 20]
      arr[i * 3 + 1] = Math.random() * -23 + 3; // Y: [-20, 3]
      arr[i * 3 + 2] = Math.random() * -20 + 5; // Z: [-15, 5]
    }
    return arr;
  }, []);

  const basePositions = useMemo(() => new Float32Array(positions), [positions]);

  useFrame(({ clock }) => {
    // Hide plankton above water
    if (pointsRef.current) {
      pointsRef.current.visible = cameraYRef.current < 2;
    }
    if (cameraYRef.current >= 2) return;

    // Frame-skip: plankton wobble is imperceptible at 30fps
    frameCounter.current++;
    if (frameCounter.current % 2 !== 0) return;

    const time = clock.getElapsedTime();
    const geom = pointsRef.current?.geometry;
    if (!geom) return;

    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < 300; i++) {
      arr[i * 3 + 1] =
        basePositions[i * 3 + 1] +
        Math.sin(time * 0.3 + i * 0.1) * 0.002 * (i + 1);
    }
    posAttr.needsUpdate = true;

    // Opacity increases with depth
    if (materialRef.current) {
      const rawOpacity = 0.6 + Math.max(0, -cameraYRef.current) * 0.04;
      materialRef.current.opacity = Math.min(rawOpacity, 0.9);
    }
  });

  return (
    <points ref={pointsRef} renderOrder={500}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={300}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.18}
        color="#06d6a0"
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        opacity={0.6}
      />
    </points>
  );
}
