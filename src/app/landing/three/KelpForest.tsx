"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { DeviceTier } from "@/app/components/effects/useDeviceCapability";

interface KelpForestProps {
  tier: DeviceTier;
}

// Same seeded PRNG as CoralField for consistency
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface StrandData {
  x: number;
  z: number;
  height: number;
  rotY: number;
  scale: number;
}

export default function KelpForest({ tier }: KelpForestProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const initialized = useRef(false);

  if (tier === "minimal") return null;

  const count = tier === "full" ? 25 : 12;

  const strands = useMemo(() => {
    const rand = seededRandom(1337);
    const data: StrandData[] = [];

    for (let i = 0; i < count; i++) {
      data.push({
        x: (rand() - 0.5) * 50, // [-25, 25]
        z: (rand() - 0.5) * 50, // [-25, 25]
        height: 2 + rand() * 3, // [2, 5]
        rotY: rand() * Math.PI * 2,
        scale: 0.8 + rand() * 0.4, // [0.8, 1.2]
      });
    }

    return data;
  }, [count]);

  // Base matrices for each strand
  const baseMatrices = useMemo(() => {
    return strands.map((s) => {
      const mat = new THREE.Matrix4();
      const position = new THREE.Matrix4().makeTranslation(
        s.x,
        -14 + s.height / 2, // position so base sits at Y=-14
        s.z
      );
      const rotation = new THREE.Matrix4().makeRotationY(s.rotY);
      const scale = new THREE.Matrix4().makeScale(s.scale, 1, s.scale);

      mat.multiplyMatrices(position, rotation);
      mat.multiply(scale);
      return mat;
    });
  }, [strands]);

  // Geometry: use the tallest possible strand, scale Y per-instance
  const geometry = useMemo(() => {
    // We create individual geometries per strand height via instance matrices
    // Use a unit box (height=1) and scale Y in the matrix
    return new THREE.BoxGeometry(0.08, 1, 0.08, 1, 8, 1);
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#0d7a5f",
        transparent: true,
        opacity: 0.7,
      }),
    []
  );

  // Temp objects for animation
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPosition = useMemo(() => new THREE.Vector3(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);
  const tempScale = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Initialize matrices on first frame
    if (!initialized.current) {
      for (let i = 0; i < strands.length; i++) {
        // Scale Y by strand height
        const heightScale = new THREE.Matrix4().makeScale(
          1,
          strands[i].height,
          1
        );
        tempMatrix.copy(baseMatrices[i]);
        tempMatrix.multiply(heightScale);
        mesh.setMatrixAt(i, tempMatrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      initialized.current = true;
    }

    // Sway animation
    const time = clock.getElapsedTime();

    for (let i = 0; i < strands.length; i++) {
      // Start from base matrix with height scale
      const heightScale = new THREE.Matrix4().makeScale(
        1,
        strands[i].height,
        1
      );
      tempMatrix.copy(baseMatrices[i]);
      tempMatrix.multiply(heightScale);

      // Decompose
      tempMatrix.decompose(tempPosition, tempQuat, tempScale);

      // Apply sway rotation on Z axis
      const swayAngle = Math.sin(time * 0.8 + i * 0.5) * 0.15;
      const swayQuat = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 0, 1),
        swayAngle
      );
      tempQuat.multiply(swayQuat);

      // Recompose
      tempMatrix.compose(tempPosition, tempQuat, tempScale);
      mesh.setMatrixAt(i, tempMatrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}
