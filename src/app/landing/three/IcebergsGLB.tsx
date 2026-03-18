"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { cameraYRef } from "./OceanEnvironment";

/* ------------------------------------------------------------------ */
/*  Iceberg GLB configs — same positions/scales as procedural          */
/* ------------------------------------------------------------------ */
const ICEBERG_PATH = "/models/iceberg.glb";

const ICEBERG_GLB_CONFIGS = [
  { position: [-8, 0, -18] as const, scale: [3.5, 6, 3.5] as const, rotY: 0, seed: 1 },
  { position: [12, 0, -25] as const, scale: [6, 5, 5.5] as const, rotY: 0.8, seed: 2 },
  { position: [-15, 0, -30] as const, scale: [3.5, 4.5, 3.5] as const, rotY: 1.5, seed: 3 },
  { position: [5, 0, -15] as const, scale: [2.5, 3, 2.5] as const, rotY: 2.2, seed: 4 },
] as const;

useGLTF.preload(ICEBERG_PATH, true);

/* ------------------------------------------------------------------ */
/*  Single GLB iceberg mesh with 3-layer rendering + animation         */
/* ------------------------------------------------------------------ */
interface IcebergGLBMeshProps {
  config: (typeof ICEBERG_GLB_CONFIGS)[number];
}

function IcebergGLBMesh({ config }: IcebergGLBMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const outerRef = useRef<THREE.MeshStandardMaterial>(null);
  const innerNearRef = useRef<THREE.MeshBasicMaterial>(null);
  const innerDeepRef = useRef<THREE.MeshBasicMaterial>(null);

  const { seed, position, scale, rotY } = config;

  // Load shared GLB with Draco enabled
  const { scene } = useGLTF(ICEBERG_PATH, true);

  // Extract geometry from GLTF scene
  const geometry = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null;
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && !geo) {
        geo = child.geometry;
      }
    });
    return geo;
  }, [scene]);

  // Animation — identical to procedural version
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!groupRef.current) return;

    // Multi-frequency bob (primary + secondary wave)
    const primaryBob = Math.sin(t * 0.25 + seed * 1.7) * 0.18;
    const secondaryBob = Math.sin(t * 0.6 + seed * 3.1) * 0.04;
    groupRef.current.position.y = position[1] + primaryBob + secondaryBob;

    // Gentle roll (wave-induced tilt)
    groupRef.current.rotation.z = Math.sin(t * 0.2 + seed * 2.3) * 0.008;

    // Slow yaw drift
    groupRef.current.rotation.y = rotY + Math.sin(t * 0.15 + seed) * 0.015;

    // Fade out when camera goes below -5
    const opacity = THREE.MathUtils.clamp((cameraYRef.current + 5) / 3, 0, 1);
    if (outerRef.current) outerRef.current.opacity = opacity;
    if (innerNearRef.current) innerNearRef.current.opacity = opacity * 0.12;
    if (innerDeepRef.current) innerDeepRef.current.opacity = opacity * 0.08;
  });

  if (!geometry) return null;

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1], position[2]]}
      scale={[scale[0], scale[1], scale[2]]}
      rotation={[0, rotY, 0]}
    >
      {/* Outer ice surface — Blender materials + flat shading */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          ref={outerRef}
          color="#d9ebf7"
          roughness={0.25}
          metalness={0.02}
          emissive="#40C4FF"
          emissiveIntensity={0.06}
          flatShading
          transparent
          opacity={1}
        />
      </mesh>

      {/* Near-surface translucency */}
      <mesh geometry={geometry} scale={[0.88, 0.88, 0.88]}>
        <meshBasicMaterial
          ref={innerNearRef}
          color="#40C4FF"
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Deep internal glow (BackSide for volumetric feel) */}
      <mesh geometry={geometry} scale={[0.6, 0.6, 0.6]}>
        <meshBasicMaterial
          ref={innerDeepRef}
          color="#1A8FBF"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  IcebergsGLB group — loaded via Suspense                            */
/* ------------------------------------------------------------------ */
export default function IcebergsGLB() {
  return (
    <group>
      {ICEBERG_GLB_CONFIGS.map((cfg) => (
        <IcebergGLBMesh key={cfg.seed} config={cfg} />
      ))}
    </group>
  );
}
