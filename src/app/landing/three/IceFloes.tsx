"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cameraYRef } from "./OceanEnvironment";

// Same seeded PRNG as CoralField/KelpForest for consistency
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const COUNT = 18;

interface FloeData {
  x: number;
  z: number;
  scale: number;
  rotY: number;
  driftSpeed: number;
  driftAngle: number;
}

export default function IceFloes() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const initialized = useRef(false);

  // Mutable positions/rotations for per-frame drift
  const liveData = useRef<{ x: number; z: number; rotY: number }[]>([]);

  const floes = useMemo(() => {
    const rand = seededRandom(7777);
    const data: FloeData[] = [];

    for (let i = 0; i < COUNT; i++) {
      data.push({
        x: (rand() - 0.5) * 50, // [-25, 25]
        z: -10 - rand() * 25, // [-10, -35]
        scale: 0.5 + rand() * 1.5, // [0.5, 2.0]
        rotY: rand() * Math.PI * 2,
        driftSpeed: 0.005 + rand() * 0.015, // [0.005, 0.02]
        driftAngle: rand() * Math.PI * 2,
      });
    }

    // Initialize mutable live positions
    liveData.current = data.map((d) => ({
      x: d.x,
      z: d.z,
      rotY: d.rotY,
    }));

    return data;
  }, []);

  // Geometry: low irregular disc shape
  const geometry = useMemo(
    () => new THREE.CylinderGeometry(1, 0.8, 0.3, 6),
    []
  );

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#E8F4FD",
        roughness: 0.5,
        emissive: "#B4D7E8",
        emissiveIntensity: 0.03,
        transparent: true,
        opacity: 1,
      }),
    []
  );

  // Temp objects for matrix composition
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPos = useMemo(() => new THREE.Matrix4(), []);
  const tempRot = useMemo(() => new THREE.Matrix4(), []);
  const tempScl = useMemo(() => new THREE.Matrix4(), []);

  const frameCounter = useRef(0);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Skip if camera is underwater (ice floes invisible)
    const camY = cameraYRef.current;
    if (camY < -3) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;

    const time = clock.getElapsedTime();
    const live = liveData.current;

    // Initialize matrices on first frame
    if (!initialized.current) {
      for (let i = 0; i < COUNT; i++) {
        const f = floes[i];
        const y = Math.sin(time * 0.5 + i) * 0.05;

        tempPos.makeTranslation(f.x, y, f.z);
        tempRot.makeRotationY(f.rotY);
        tempScl.makeScale(f.scale, f.scale, f.scale);

        tempMatrix.copy(tempPos);
        tempMatrix.multiply(tempRot);
        tempMatrix.multiply(tempScl);

        mesh.setMatrixAt(i, tempMatrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      initialized.current = true;
    }

    // Update only every 3rd frame — ice drifts slowly, no visible difference
    frameCounter.current++;
    if (frameCounter.current % 3 !== 0) return;

    for (let i = 0; i < COUNT; i++) {
      const f = floes[i];
      const l = live[i];

      // Apply drift (3x speed to compensate for 3rd-frame updates)
      l.x += Math.cos(f.driftAngle) * f.driftSpeed * 3;
      l.z += Math.sin(f.driftAngle) * f.driftSpeed * 3;
      l.rotY += 0.003;

      if (l.x > 30) l.x = -30;
      if (l.x < -30) l.x = 30;

      const y = Math.sin(time * 0.5 + i) * 0.05;

      tempPos.makeTranslation(l.x, y, l.z);
      tempRot.makeRotationY(l.rotY);
      tempScl.makeScale(f.scale, f.scale, f.scale);

      tempMatrix.copy(tempPos);
      tempMatrix.multiply(tempRot);
      tempMatrix.multiply(tempScl);

      mesh.setMatrixAt(i, tempMatrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    material.opacity = THREE.MathUtils.clamp((camY + 3) / 2, 0, 1);
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, COUNT]}
      frustumCulled={false}
    />
  );
}
