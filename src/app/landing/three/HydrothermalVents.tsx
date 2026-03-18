"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cameraYRef } from "./OceanEnvironment";

const VENT_POSITIONS: [number, number, number][] = [
  [0, -24, -5],
  [-5, -24, -10],
  [4, -24, -8],
];

const PARTICLES_PER_VENT = 30;
const TOTAL_PARTICLES = VENT_POSITIONS.length * PARTICLES_PER_VENT;
const MAX_RISE = 5;

export default function HydrothermalVents() {
  const pointsRef = useRef<THREE.Points>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Per-particle data: spawn position, current Y offset, rise speed, size
  const { positions, spawnY, riseSpeeds, sizes } = useMemo(() => {
    const pos = new Float32Array(TOTAL_PARTICLES * 3);
    const sy = new Float32Array(TOTAL_PARTICLES);
    const speeds = new Float32Array(TOTAL_PARTICLES);
    const sz = new Float32Array(TOTAL_PARTICLES);

    for (let v = 0; v < VENT_POSITIONS.length; v++) {
      const [vx, vy, vz] = VENT_POSITIONS[v];
      for (let p = 0; p < PARTICLES_PER_VENT; p++) {
        const i = v * PARTICLES_PER_VENT + p;
        // Random spread around vent center
        pos[i * 3] = vx + (Math.random() - 0.5) * 1.0;
        pos[i * 3 + 1] = vy + Math.random() * MAX_RISE; // Stagger initial Y
        pos[i * 3 + 2] = vz + (Math.random() - 0.5) * 1.0;
        sy[i] = vy;
        speeds[i] = 0.5 + Math.random() * 1.5; // [0.5, 2.0]
        sz[i] = 0.05 + Math.random() * 0.1; // [0.05, 0.15]
      }
    }

    return { positions: pos, spawnY: sy, riseSpeeds: speeds, sizes: sz };
  }, []);

  useFrame(({ clock }, delta) => {
    // Visibility gate
    const visible = cameraYRef.current < -20;
    if (groupRef.current) {
      groupRef.current.visible = visible;
    }
    if (!visible) return;

    // Animate particles
    const geom = pointsRef.current?.geometry;
    if (geom) {
      const posAttr = geom.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < TOTAL_PARTICLES; i++) {
        // Rise upward
        arr[i * 3 + 1] += riseSpeeds[i] * delta;

        // Slight X/Z drift
        const ventIdx = Math.floor(i / PARTICLES_PER_VENT);
        const [vx, , vz] = VENT_POSITIONS[ventIdx];
        arr[i * 3] += (Math.random() - 0.5) * 0.01;
        arr[i * 3 + 2] += (Math.random() - 0.5) * 0.01;

        // Reset when risen MAX_RISE above spawn
        if (arr[i * 3 + 1] > spawnY[i] + MAX_RISE) {
          arr[i * 3] = vx + (Math.random() - 0.5) * 1.0;
          arr[i * 3 + 1] = spawnY[i];
          arr[i * 3 + 2] = vz + (Math.random() - 0.5) * 1.0;
        }
      }

      posAttr.needsUpdate = true;
    }

  });

  return (
    <group ref={groupRef}>
      {/* Vent particle system */}
      <points ref={pointsRef} renderOrder={500}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={TOTAL_PARTICLES}
          />
          <bufferAttribute
            attach="attributes-size"
            args={[sizes, 1]}
            count={TOTAL_PARTICLES}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.15}
          color="#FF6B35"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

    </group>
  );
}
