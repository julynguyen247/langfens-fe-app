"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cameraYRef } from "./OceanEnvironment";

// Mountain profile paths for LatheGeometry (Y=height, X=radius from center)
const PROFILES = [
  // Profile 0: Jagged twin peaks
  [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.8, 0),
    new THREE.Vector2(1.0, 0.1),
    new THREE.Vector2(0.7, 0.35),
    new THREE.Vector2(0.5, 0.5),
    new THREE.Vector2(0.55, 0.6),
    new THREE.Vector2(0.3, 0.75),
    new THREE.Vector2(0.15, 0.85),
    new THREE.Vector2(0.08, 0.95),
    new THREE.Vector2(0.001, 1.0),
  ],
  // Profile 1: Broad rounded ridge
  [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(1.0, 0),
    new THREE.Vector2(1.1, 0.08),
    new THREE.Vector2(0.9, 0.25),
    new THREE.Vector2(0.75, 0.45),
    new THREE.Vector2(0.6, 0.6),
    new THREE.Vector2(0.4, 0.75),
    new THREE.Vector2(0.2, 0.9),
    new THREE.Vector2(0.001, 1.0),
  ],
  // Profile 2: Steep cliff face
  [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.7, 0),
    new THREE.Vector2(0.85, 0.15),
    new THREE.Vector2(0.8, 0.4),
    new THREE.Vector2(0.6, 0.55),
    new THREE.Vector2(0.25, 0.7),
    new THREE.Vector2(0.12, 0.88),
    new THREE.Vector2(0.05, 0.95),
    new THREE.Vector2(0.001, 1.0),
  ],
];

const LANDMASS_CONFIGS = [
  { profile: 0, position: [-25, 0, -65] as const, scale: [12, 12, 8] as const, rotY: 0.3 },
  { profile: 1, position: [15, 0, -75] as const, scale: [18, 8, 14] as const, rotY: 1.2 },
  { profile: 2, position: [-10, 0, -80] as const, scale: [10, 15, 10] as const, rotY: 2.5 },
];

const snowWhite = new THREE.Color(0.95, 0.97, 1.0);
const rockDark = new THREE.Color("#2A3A4A");
const iceBlue = new THREE.Color("#4A7DA8");

function buildLandmassGeometry(profileIndex: number): THREE.BufferGeometry {
  const profile = PROFILES[profileIndex];
  const geo = new THREE.LatheGeometry(profile, 8);
  geo.deleteAttribute("uv");
  const nonIndexed = geo.toNonIndexed();
  geo.dispose();

  const pos = nonIndexed.getAttribute("position");
  const colors = new Float32Array(pos.count * 3);
  const tempColor = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y > 0.7) {
      tempColor.copy(snowWhite);
    } else if (y > 0.15) {
      const t = (y - 0.15) / 0.55;
      tempColor.copy(rockDark).lerp(snowWhite, t * 0.3);
    } else {
      tempColor.copy(iceBlue).lerp(rockDark, y / 0.15);
    }
    colors[i * 3] = tempColor.r;
    colors[i * 3 + 1] = tempColor.g;
    colors[i * 3 + 2] = tempColor.b;
  }

  nonIndexed.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  nonIndexed.computeVertexNormals();
  return nonIndexed;
}

export default function AntarcticLandmass() {
  const materialRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  const geometries = useMemo(
    () => LANDMASS_CONFIGS.map((cfg) => buildLandmassGeometry(cfg.profile)),
    []
  );

  useFrame(() => {
    const opacity = THREE.MathUtils.clamp((cameraYRef.current + 3) / 6, 0, 1);
    if (opacity <= 0) return;
    for (const mat of materialRefs.current) {
      if (mat) mat.opacity = opacity;
    }
  });

  return (
    <group>
      {LANDMASS_CONFIGS.map((cfg, i) => (
        <mesh
          key={i}
          geometry={geometries[i]}
          position={[cfg.position[0], cfg.position[1], cfg.position[2]]}
          scale={[cfg.scale[0], cfg.scale[1], cfg.scale[2]]}
          rotation={[0, cfg.rotY, 0]}
        >
          <meshStandardMaterial
            ref={(el) => { materialRefs.current[i] = el; }}
            vertexColors
            flatShading
            emissive="#2A3A5A"
            emissiveIntensity={0.15}
            roughness={0.8}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}
