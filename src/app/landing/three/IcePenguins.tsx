"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { cameraYRef } from "./OceanEnvironment";

const PENGUIN_PATH = "/models/penguin.glb";

const ICEBERG_REFS = [
  { seed: 1, position: [-8, 0, -18] as const, rotY: 0 },
  { seed: 2, position: [12, 0, -25] as const, rotY: 0.8 },
  { seed: 4, position: [5, 0, -15] as const, rotY: 2.2 },
];

const PENGUIN_CONFIGS = [
  // Group 1: 4 penguins on iceberg 0
  { iceberg: 0, lx: 0.0, lz: 0.0, scale: 0.38, waddle: false },
  { iceberg: 0, lx: 0.4, lz: 0.2, scale: 0.35, waddle: true },
  { iceberg: 0, lx: -0.3, lz: 0.3, scale: 0.32, waddle: false },
  { iceberg: 0, lx: 0.1, lz: -0.4, scale: 0.36, waddle: false },
  // Group 2: 3 penguins on iceberg 1
  { iceberg: 1, lx: 0.0, lz: 0.1, scale: 0.37, waddle: false },
  { iceberg: 1, lx: 0.3, lz: -0.2, scale: 0.34, waddle: true },
  { iceberg: 1, lx: -0.2, lz: -0.1, scale: 0.36, waddle: false },
  // Group 3: 3 penguins on iceberg 2
  { iceberg: 2, lx: 0.1, lz: 0.0, scale: 0.35, waddle: false },
  { iceberg: 2, lx: -0.3, lz: 0.2, scale: 0.33, waddle: true },
  { iceberg: 2, lx: 0.2, lz: -0.3, scale: 0.37, waddle: false },
];

const TOTAL = PENGUIN_CONFIGS.length;

export default function IcePenguins() {
  const groupRef = useRef<THREE.Group>(null);
  const frameCounter = useRef(0);
  const { scene } = useGLTF(PENGUIN_PATH, true);

  // We clone the scene for each penguin so we can animate wings independently
  // 10 penguins * 3 meshes is only 30 draw calls, which is extremely fast and avoids InstancedMesh complexity for articulated parts.
  const penguins = useMemo(() => {
    return Array.from({ length: TOTAL }).map((_, i) => {
      const clone = scene.clone();
      
      // Update materials for the wet, sleek look
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const m = child.material.clone() as THREE.MeshStandardMaterial;
          m.emissive = new THREE.Color("#1e293b"); // Cooler, sleeker dark blue/slate emissive
          m.emissiveIntensity = 0.4;
          m.roughness = 0.25; // Sleek and wet look
          m.metalness = 0.1;
          m.transparent = true;
          m.opacity = 1;
          
          // Make wings distinct if needed
          if (child.name.includes("Wing")) {
             m.color = new THREE.Color("#111827"); 
          }
          child.material = m;
        }
      });
      return clone;
    });
  }, [scene]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const camY = cameraYRef.current;
    const opacity = THREE.MathUtils.clamp((camY + 5) / 3, 0, 1);
    groupRef.current.visible = opacity > 0.001;
    if (!groupRef.current.visible) return;

    // Frame-skip: update every 3rd frame
    frameCounter.current++;
    if (frameCounter.current % 3 !== 0) return;

    const t = clock.getElapsedTime();

    for (let i = 0; i < TOTAL; i++) {
      const clone = penguins[i];
      const cfg = PENGUIN_CONFIGS[i];
      const iceberg = ICEBERG_REFS[cfg.iceberg];

      // Replicate iceberg bob formula
      const primaryBob = Math.sin(t * 0.25 + iceberg.seed * 1.7) * 0.18;
      const secondaryBob = Math.sin(t * 0.6 + iceberg.seed * 3.1) * 0.04;
      const bobY = primaryBob + secondaryBob;

      // Rotate local offset by iceberg's rotY
      const cosR = Math.cos(iceberg.rotY);
      const sinR = Math.sin(iceberg.rotY);
      const worldLx = cfg.lx * cosR - cfg.lz * sinR;
      const worldLz = cfg.lx * sinR + cfg.lz * cosR;

      let posX = iceberg.position[0] + worldLx;
      let posY = iceberg.position[1] + 2.5 + bobY;
      let posZ = iceberg.position[2] + worldLz;

      let yRot = iceberg.rotY + Math.atan2(cfg.lx, cfg.lz) + Math.PI;
      let tiltZ = 0;

      if (cfg.waddle) {
        const waddlePhase = Math.sin(t * 1.5 + i * 2.0);
        posX += Math.sin(yRot) * waddlePhase * 0.3;
        posZ += Math.cos(yRot) * waddlePhase * 0.3;
        // Cute hop while waddling
        posY += Math.abs(Math.sin(t * 3.0 + i * 2.0)) * 0.12;
        yRot += waddlePhase * 0.08;
        // Cute side-to-side tilt
        tiltZ = waddlePhase * 0.15;
      } else {
        yRot += Math.sin(t * 2.1 + i * 1.3) * 0.035;
      }

      clone.position.set(posX, posY, posZ);
      clone.rotation.set(0, yRot, tiltZ);
      
      // Idle breathing (squish and stretch slightly)
      let scaleY = cfg.scale;
      let scaleX = cfg.scale;
      let scaleZ = cfg.scale;
      
      if (!cfg.waddle) {
        const breath = Math.sin(t * 2.5 + i * 1.5);
        scaleY *= 1.0 + breath * 0.04;
        scaleX *= 1.0 - breath * 0.02;
        scaleZ *= 1.0 - breath * 0.02;
      }
      clone.scale.set(scaleX, scaleY, scaleZ);

      // Wing animation!
      const wingL = clone.getObjectByName("PenguinWingL");
      const wingR = clone.getObjectByName("PenguinWingR");
      
      if (cfg.waddle) {
        // Active flapping while walking
        const flap = Math.sin(t * 6.0 + i) * 0.3;
        if (wingL) wingL.rotation.z = -0.5 - flap;
        if (wingR) wingR.rotation.z = 0.5 + flap;
      } else {
        // Idle wing movement
        const flap = Math.sin(t * 2.0 + i) * 0.05;
        if (wingL) wingL.rotation.z = -0.1 - flap;
        if (wingR) wingR.rotation.z = 0.1 + flap;
      }
      
      // Apply opacity
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
           child.material.opacity = opacity;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {penguins.map((p, i) => (
        <primitive key={i} object={p} />
      ))}
    </group>
  );
}
