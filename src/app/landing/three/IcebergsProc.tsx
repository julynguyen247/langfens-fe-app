"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cameraYRef } from "./OceanEnvironment";

/* ------------------------------------------------------------------ */
/*  Seeded pseudo-noise (hash-based)                                  */
/* ------------------------------------------------------------------ */
function hashNoise(x: number, y: number, z: number, seed: number): number {
  const raw =
    Math.sin(x * 12.9898 + y * 78.233 + z * 45.164 + seed) * 43758.5453;
  return raw - Math.floor(raw); // fract → [0, 1)
}

/* ------------------------------------------------------------------ */
/*  Multi-octave fractal noise                                        */
/* ------------------------------------------------------------------ */
function fractalNoise(
  x: number, y: number, z: number,
  seed: number, octaves: number, lacunarity: number, persistence: number
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value += hashNoise(x * frequency, y * frequency, z * frequency, seed + i * 31.7) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  return value / maxValue;
}

/* ------------------------------------------------------------------ */
/*  6-zone vertex color palette                                       */
/* ------------------------------------------------------------------ */
const snowWhite = new THREE.Color(0.97, 0.98, 1.0);
const iceBlue = new THREE.Color(0.78, 0.90, 0.97);
const glacialBlue = new THREE.Color(0.45, 0.72, 0.85);
const waterlineGreen = new THREE.Color(0.35, 0.65, 0.70);
const deepAqua = new THREE.Color(0.12, 0.45, 0.58);
const abyssBlue = new THREE.Color(0.05, 0.18, 0.35);

function getIceColor(normalizedY: number): THREE.Color {
  const c = new THREE.Color();
  if (normalizedY > 0.8) return c.copy(snowWhite);
  if (normalizedY > 0.4) return c.copy(snowWhite).lerp(iceBlue, (0.8 - normalizedY) / 0.4);
  if (normalizedY > 0.1) return c.copy(iceBlue).lerp(glacialBlue, (0.4 - normalizedY) / 0.3);
  if (normalizedY > -0.1) return c.copy(waterlineGreen);
  if (normalizedY > -0.5) return c.copy(waterlineGreen).lerp(deepAqua, (-0.1 - normalizedY) / 0.4);
  return c.copy(deepAqua).lerp(abyssBlue, Math.min(1, (-0.5 - normalizedY) / 0.5));
}

/* ------------------------------------------------------------------ */
/*  Generate a single iceberg geometry (flat-shaded, crystalline)     */
/* ------------------------------------------------------------------ */
interface IcebergParams {
  peakSharpness: number;
  underwaterBulge: number;
  asymmetry: number;
  erosionLevel: number;
}

function generateIceberg(seed: number, params: IcebergParams): THREE.BufferGeometry {
  // Subdivision 1 + toNonIndexed for flat shading (crystalline facets)
  const geo = new THREE.IcosahedronGeometry(1, 1);
  geo.deleteAttribute("uv"); // remove UVs before toNonIndexed to avoid attribute mismatch
  const nonIndexed = geo.toNonIndexed();
  geo.dispose();

  const pos = nonIndexed.getAttribute("position");
  const count = pos.count;
  const positions = new Float32Array(pos.array.length);
  positions.set(pos.array);
  const colors = new Float32Array(count * 3);
  const tempColor = new THREE.Color();

  // Track all displacement magnitudes for crevasse detection
  const displacements = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const ix = i * 3;
    let x = positions[ix];
    let y = positions[ix + 1];
    let z = positions[ix + 2];

    if (y >= 0) {
      // Above water: 3-octave fractal + ridge noise for jagged peaks
      const noise = fractalNoise(x, y, z, seed, 3, 2.2, 0.6) * 2 - 1;
      const ridgeNoise = (1.0 - Math.abs(noise * 2 - 1)) * params.peakSharpness;
      const amplitude = 0.5 + ridgeNoise * 0.3;

      x *= 0.7;
      z *= 0.7;
      y *= 1.5;
      x += noise * amplitude * 0.5 + params.asymmetry * hashNoise(x, 0, 0, seed) * 0.3;
      y += Math.abs(noise) * amplitude * 0.8;
      z += noise * amplitude * 0.5;

      displacements[i] = Math.abs(noise) * amplitude;
    } else {
      // Below water: 2-octave smooth, wider
      const noise = fractalNoise(x, y, z, seed, 2, 1.8, 0.4) * 2 - 1;
      const bulge = params.underwaterBulge;
      const amplitude = 0.15 + Math.abs(noise) * 0.1;

      x *= 1.5 * bulge;
      z *= 1.5 * bulge;
      y *= 2.0;
      x += noise * amplitude * 0.3;
      y += noise * amplitude * 0.2;
      z += noise * amplitude * 0.3;

      displacements[i] = Math.abs(noise) * amplitude;
    }

    // Waterline erosion notch
    if (Math.abs(y) < 0.15) {
      const erosion = (1 - Math.abs(y) / 0.15) * params.erosionLevel * 0.1;
      x *= (1 - erosion);
      z *= (1 - erosion);
    }

    positions[ix] = x;
    positions[ix + 1] = y;
    positions[ix + 2] = z;
  }

  // Compute average displacement for crevasse detection
  let avgDisp = 0;
  for (let i = 0; i < count; i++) avgDisp += displacements[i];
  avgDisp /= count;

  // Apply 6-zone colors + crevasse darkening + sparkle
  for (let i = 0; i < count; i++) {
    const y = positions[i * 3 + 1];
    const maxY = 2.5; // approximate max height after displacement
    const normalizedY = y / maxY; // roughly -1 to 1

    tempColor.copy(getIceColor(normalizedY));

    // Crevasse darkening: recessed vertices get darker
    if (displacements[i] < avgDisp * 0.7) {
      tempColor.multiplyScalar(0.7);
    }

    // Sparkle: random 15% get blue boost
    if (hashNoise(i * 0.1, 0, 0, seed + 99) > 0.85) {
      tempColor.b = Math.min(1, tempColor.b + 0.12);
    }

    colors[i * 3] = tempColor.r;
    colors[i * 3 + 1] = tempColor.g;
    colors[i * 3 + 2] = tempColor.b;
  }

  nonIndexed.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  nonIndexed.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  nonIndexed.computeVertexNormals();

  return nonIndexed;
}

/* ------------------------------------------------------------------ */
/*  Iceberg placement configs                                         */
/* ------------------------------------------------------------------ */
const ICEBERG_CONFIGS = [
  { seed: 1, position: [-8, 0, -18] as const, scale: [3.5, 6, 3.5] as const, rotY: 0,
    params: { peakSharpness: 0.9, underwaterBulge: 1.4, asymmetry: 0.15, erosionLevel: 0.3 } },
  { seed: 2, position: [12, 0, -25] as const, scale: [6, 5, 5.5] as const, rotY: 0.8,
    params: { peakSharpness: 0.4, underwaterBulge: 1.6, asymmetry: 0.3, erosionLevel: 0.7 } },
  { seed: 3, position: [-15, 0, -30] as const, scale: [3.5, 4.5, 3.5] as const, rotY: 1.5,
    params: { peakSharpness: 1.0, underwaterBulge: 1.2, asymmetry: 0.4, erosionLevel: 0.5 } },
  { seed: 4, position: [5, 0, -15] as const, scale: [2.5, 3, 2.5] as const, rotY: 2.2,
    params: { peakSharpness: 0.6, underwaterBulge: 1.0, asymmetry: 0.5, erosionLevel: 1.0 } },
] as const;

/* ------------------------------------------------------------------ */
/*  Single iceberg mesh pair (outer + inner glow)                     */
/* ------------------------------------------------------------------ */
interface IcebergMeshProps {
  geometry: THREE.BufferGeometry;
  config: (typeof ICEBERG_CONFIGS)[number];
}

function IcebergMesh({ geometry, config }: IcebergMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const outerRef = useRef<THREE.MeshStandardMaterial>(null);
  const innerNearRef = useRef<THREE.MeshBasicMaterial>(null);
  const innerDeepRef = useRef<THREE.MeshBasicMaterial>(null);

  const { seed, position, scale, rotY } = config;

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

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1], position[2]]}
      scale={[scale[0], scale[1], scale[2]]}
      rotation={[0, rotY, 0]}
    >
      {/* Outer ice surface — flat shading for crystalline facets */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          ref={outerRef}
          vertexColors
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
/*  Icebergs group                                                    */
/* ------------------------------------------------------------------ */
export default function Icebergs() {
  const geometries = useMemo(
    () => ICEBERG_CONFIGS.map((cfg) => generateIceberg(cfg.seed, cfg.params)),
    []
  );

  return (
    <group>
      {ICEBERG_CONFIGS.map((cfg, i) => (
        <IcebergMesh key={cfg.seed} geometry={geometries[i]} config={cfg} />
      ))}
    </group>
  );
}
