"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cameraYRef } from "../OceanEnvironment";

// --- Layer 2: Fish Sforols (full tier only) ---

export function FishSforolLayer() {
  const pointsRef = useRef<THREE.Points>(null);
  const frameCounter = useRef(0);

  const positions = useMemo(() => {
    const count = 50;
    const arr = new Float32Array(count * 3);
    // Initial positions don't matter much since useFrame overrides them
    for (let i = 0; i < count; i++) {
      arr[i * 3] = 0;
      arr[i * 3 + 1] = 0;
      arr[i * 3 + 2] = 0;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    // Visibility check first — early exit if not visible
    if (pointsRef.current) {
      pointsRef.current.visible = cameraYRef.current < 0;
    }
    if (!pointsRef.current?.visible) return;

    // Frame-skip: update every 2nd frame, matching PlanktonLayer pattern
    frameCounter.current++;
    if (frameCounter.current % 2 !== 0) return;

    const geom = pointsRef.current.geometry;
    const time = clock.getElapsedTime();
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < 50; i++) {
      arr[i * 3] =
        Math.sin(time * 0.3) * 10 + Math.sin(i * 2.0) * 3;
      arr[i * 3 + 1] =
        Math.sin(time * 0.2 + i * 1.5) * 3 - 4;
      arr[i * 3 + 2] =
        Math.cos(time * 0.25 + i * 0.8) * 6 - 5;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} renderOrder={500}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={50}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        color="#94a3b8"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
