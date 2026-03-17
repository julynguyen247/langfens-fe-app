"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { DeviceTier } from "@/app/components/effects/useDeviceCapability";
import { cameraYRef } from "./OceanEnvironment";

interface CoralFieldProps {
  tier: DeviceTier;
}

// Simple seeded PRNG for deterministic placement
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface CoralType {
  geometry: THREE.BufferGeometry;
  color: string;
  fullCount: number;
  reducedCount: number;
  sways: boolean;
}

export default function CoralField({ tier }: CoralFieldProps) {
  const branchingRef = useRef<THREE.InstancedMesh>(null);
  const fanRef = useRef<THREE.InstancedMesh>(null);
  const tubeRef = useRef<THREE.InstancedMesh>(null);
  const rocksRef = useRef<THREE.InstancedMesh>(null);

  const coralTypes = useMemo<CoralType[]>(() => {
    const branching = new THREE.ConeGeometry(0.6, 3.0, 5);
    const fan = new THREE.CircleGeometry(1.6, 6);
    const tube = new THREE.CylinderGeometry(0.2, 0.3, 2.4, 6);
    const rock = new THREE.DodecahedronGeometry(1.0, 0);

    return [
      { geometry: branching, color: "#ec4899", fullCount: 20, reducedCount: 10, sways: true },
      { geometry: fan, color: "#8b5cf6", fullCount: 13, reducedCount: 7, sways: true },
      { geometry: tube, color: "#06d6a0", fullCount: 16, reducedCount: 8, sways: true },
      { geometry: rock, color: "#1e293b", fullCount: 24, reducedCount: 13, sways: false },
    ];
  }, []);

  const isReduced = tier === "reduced";

  // Generate transforms for all instances
  const transforms = useMemo(() => {
    const result: THREE.Matrix4[][] = [];
    let seedOffset = 0;

    for (const type of coralTypes) {
      const count = isReduced ? type.reducedCount : type.fullCount;
      const rand = seededRandom(42 + seedOffset);
      seedOffset += 100;
      const matrices: THREE.Matrix4[] = [];

      for (let i = 0; i < count; i++) {
        const x = (rand() - 0.5) * 60; // [-30, 30]
        const z = (rand() - 0.5) * 60; // [-30, 30]
        const y = -12;
        const rotY = rand() * Math.PI * 2;
        const s = 0.7 + rand() * 0.6; // [0.7, 1.3]

        const mat = new THREE.Matrix4();
        const position = new THREE.Matrix4().makeTranslation(x, y, z);
        const rotation = new THREE.Matrix4().makeRotationY(rotY);
        const scaleM = new THREE.Matrix4().makeScale(s, s, s);

        mat.multiplyMatrices(position, rotation);
        mat.multiply(scaleM);
        matrices.push(mat);
      }

      result.push(matrices);
    }

    return result;
  }, [coralTypes, isReduced]);

  // Set instance matrices on mount
  const initialized = useRef(false);
  useMemo(() => {
    initialized.current = false;
  }, [transforms]);

  // Materials
  const materials = useMemo(
    () =>
      coralTypes.map(
        (type) =>
          new THREE.MeshStandardMaterial({
            color: type.color,
            roughness: 0.8,
            emissive: type.color,
            emissiveIntensity: type.sways ? 0.5 : 0.15,
          })
      ),
    [coralTypes]
  );

  const refs = [branchingRef, fanRef, tubeRef, rocksRef];

  // Temp matrices for sway animation
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPosition = useMemo(() => new THREE.Vector3(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);
  const tempScale = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    // Initialize instance matrices
    if (!initialized.current) {
      let allReady = true;
      for (let t = 0; t < coralTypes.length; t++) {
        const mesh = refs[t].current;
        if (!mesh) {
          allReady = false;
          continue;
        }
        for (let i = 0; i < transforms[t].length; i++) {
          mesh.setMatrixAt(i, transforms[t][i]);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }
      if (allReady) initialized.current = true;
    }

    // Sway animation — only on full tier, only for coral (not rocks)
    if (tier !== "full") return;
    const time = clock.getElapsedTime();

    for (let t = 0; t < coralTypes.length; t++) {
      if (!coralTypes[t].sways) continue;
      const mesh = refs[t].current;
      if (!mesh) continue;

      for (let i = 0; i < transforms[t].length; i++) {
        // Decompose original transform
        tempMatrix.copy(transforms[t][i]);
        tempMatrix.decompose(tempPosition, tempQuat, tempScale);

        // Apply sway rotation offset on Y
        const swayAngle = Math.sin(time * 0.5 + i * 0.3) * 0.03;
        const swayQuat = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          swayAngle
        );
        tempQuat.multiply(swayQuat);

        // Recompose
        tempMatrix.compose(tempPosition, tempQuat, tempScale);
        mesh.setMatrixAt(i, tempMatrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {coralTypes.map((type, t) => {
        const count = isReduced ? type.reducedCount : type.fullCount;
        return (
          <instancedMesh
            key={t}
            ref={refs[t]}
            args={[type.geometry, materials[t], count]}
            frustumCulled={false}
          />
        );
      })}
    </group>
  );
}
