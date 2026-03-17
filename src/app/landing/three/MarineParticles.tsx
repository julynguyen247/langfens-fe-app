"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { DeviceTier } from "@/app/components/effects/useDeviceCapability";
import { cameraYRef } from "./OceanEnvironment";

interface MarineParticlesProps {
  tier: DeviceTier;
}

// --- Layer 1: Plankton (all tiers) ---

function PlanktonLayer() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const positions = useMemo(() => {
    const count = 200;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 40; // X: [-20, 20]
      arr[i * 3 + 1] = (Math.random() - 0.5) * 30; // Y: [-15, 15]
      arr[i * 3 + 2] = Math.random() * -20 + 5; // Z: [-15, 5]
    }
    return arr;
  }, []);

  const basePositions = useMemo(() => new Float32Array(positions), [positions]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const geom = pointsRef.current?.geometry;
    if (!geom) return;

    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < 200; i++) {
      arr[i * 3 + 1] =
        basePositions[i * 3 + 1] +
        Math.sin(time * 0.3 + i * 0.1) * 0.002 * (i + 1);
    }
    posAttr.needsUpdate = true;

    // Opacity increases with depth
    if (materialRef.current) {
      const rawOpacity = 0.3 + Math.max(0, -cameraYRef.current) * 0.05;
      materialRef.current.opacity = Math.min(rawOpacity, 0.8);
    }
  });

  return (
    <points ref={pointsRef} renderOrder={500}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={200}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.05}
        color="#06d6a0"
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        opacity={0.3}
      />
    </points>
  );
}

// --- Layer 2: Fish Schools (full tier only) ---

function FishSchoolLayer() {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 30;
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
    const geom = pointsRef.current?.geometry;
    if (!geom) return;

    const time = clock.getElapsedTime();
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < 30; i++) {
      arr[i * 3] =
        Math.sin(time * 0.3) * 10 + Math.sin(i * 2.0) * 3;
      arr[i * 3 + 1] =
        Math.sin(time * 0.2 + i * 1.5) * 4 - 2;
      arr[i * 3 + 2] =
        Math.cos(time * 0.25 + i * 0.8) * 6 - 5;
    }
    posAttr.needsUpdate = true;

    // Visibility based on camera depth
    if (pointsRef.current) {
      pointsRef.current.visible = cameraYRef.current < 4;
    }
  });

  return (
    <points ref={pointsRef} renderOrder={500}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={30}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color="#94a3b8"
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// --- Layer 3: Jellyfish (full tier only) ---

const JELLYFISH_COLORS = ["#a78bfa", "#ec4899"] as const;

interface JellyfishData {
  x: number;
  y: number;
  z: number;
  color: string;
}

function JellyfishLayer() {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const tentacleRefs = useRef<(THREE.Mesh | null)[][]>([]);
  const rootRef = useRef<THREE.Group>(null);

  const jellyfish = useMemo<JellyfishData[]>(() => {
    const data: JellyfishData[] = [];
    // Seeded positions for deterministic layout
    const seeds = [0.2, 0.7, 0.4, 0.9, 0.1, 0.6];
    for (let i = 0; i < 6; i++) {
      data.push({
        x: (seeds[i] - 0.5) * 30, // [-15, 15]
        y: -5 - seeds[(i + 3) % 6] * 7, // [-5, -12]
        z: (seeds[(i + 1) % 6] - 0.5) * 30, // [-15, 15]
        color: JELLYFISH_COLORS[i % 2],
      });
    }
    return data;
  }, []);

  // Track base Y positions for float animation
  const baseYs = useMemo(() => jellyfish.map((j) => j.y), [jellyfish]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const visible = cameraYRef.current < -2;

    if (rootRef.current) {
      rootRef.current.visible = visible;
    }
    if (!visible) return;

    for (let i = 0; i < 6; i++) {
      const group = groupRefs.current[i];
      if (!group) continue;

      // Gentle float
      group.position.y = baseYs[i] + Math.sin(time * 0.5 + i) * 0.003 * (time * 10);

      // Pulsing scale
      const s = 1.0 + Math.sin(time * 1.5 + i * 2) * 0.1;
      group.scale.set(s, s, s);

      // Opacity pulse on hemisphere mesh
      const mesh = meshRefs.current[i];
      if (mesh) {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.4 + Math.sin(time * 1.2 + i * 1.5) * 0.2;
      }

      // Opacity pulse on tentacles
      const tentacles = tentacleRefs.current[i];
      if (tentacles) {
        for (const t of tentacles) {
          if (!t) continue;
          const mat = t.material as THREE.MeshBasicMaterial;
          mat.opacity =
            (0.4 + Math.sin(time * 1.2 + i * 1.5) * 0.2) * 0.6;
        }
      }
    }
  });

  return (
    <group ref={rootRef}>
      {jellyfish.map((jf, i) => (
        <group
          key={i}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
          position={[jf.x, jf.y, jf.z]}
        >
          {/* Hemisphere bell */}
          <mesh
            ref={(el) => {
              meshRefs.current[i] = el;
            }}
          >
            <sphereGeometry args={[0.3, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshBasicMaterial
              color={jf.color}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Tentacles — 4 thin cylinders */}
          {[0, 1, 2, 3].map((t) => {
            const angle = (t / 4) * Math.PI * 2;
            const offsetX = Math.cos(angle) * 0.12;
            const offsetZ = Math.sin(angle) * 0.12;
            return (
              <mesh
                key={t}
                ref={(el) => {
                  if (!tentacleRefs.current[i]) {
                    tentacleRefs.current[i] = [];
                  }
                  tentacleRefs.current[i][t] = el;
                }}
                position={[offsetX, -0.4, offsetZ]}
              >
                <cylinderGeometry args={[0.005, 0.005, 0.8, 4]} />
                <meshBasicMaterial
                  color={jf.color}
                  transparent
                  opacity={0.25}
                />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

// --- Main component ---

export default function MarineParticles({ tier }: MarineParticlesProps) {
  return (
    <group>
      <PlanktonLayer />
      {tier === "full" && <FishSchoolLayer />}
      {tier === "full" && <JellyfishLayer />}
    </group>
  );
}
