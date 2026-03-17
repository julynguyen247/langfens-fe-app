"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cameraYRef } from "./OceanEnvironment";

const BUBBLE_COUNT = 120;

export default function Bubbles() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, riseSpeeds, sizes } = useMemo(() => {
    const pos = new Float32Array(BUBBLE_COUNT * 3);
    const speeds = new Float32Array(BUBBLE_COUNT);
    const sz = new Float32Array(BUBBLE_COUNT);

    for (let i = 0; i < BUBBLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50; // X: [-25, 25]
      pos[i * 3 + 1] = Math.random() * 30 - 15; // Y: [-15, 15]
      pos[i * 3 + 2] = Math.random() * -25 + 5; // Z: [-20, 5]
      speeds[i] = 0.3 + Math.random() * 1.2; // [0.3, 1.5]
      sz[i] = 0.03 + Math.random() * 0.09; // [0.03, 0.12]
    }

    return { positions: pos, riseSpeeds: speeds, sizes: sz };
  }, []);

  useFrame(({ clock }, delta) => {
    const geom = pointsRef.current?.geometry;
    if (!geom) return;

    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const time = clock.getElapsedTime();

    for (let i = 0; i < BUBBLE_COUNT; i++) {
      // Rise
      arr[i * 3 + 1] += riseSpeeds[i] * delta;

      // Reset when exceeding top boundary
      if (arr[i * 3 + 1] > 15) {
        arr[i * 3 + 1] = -15;
      }

      // Wobble
      arr[i * 3] += Math.sin(time * 2 + i) * 0.003;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} renderOrder={450}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={BUBBLE_COUNT}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
          count={BUBBLE_COUNT}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#a0d8ef"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
