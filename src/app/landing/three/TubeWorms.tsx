"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cameraYRef } from "./OceanEnvironment";

// Same seeded PRNG as CoralField / KelpForest for consistency
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const VENT_POSITIONS: [number, number, number][] = [
  [0, -25, -5],
  [-5, -25, -10],
  [4, -25, -8],
];

const WORM_COUNT = 40;
const WORMS_PER_VENT = Math.ceil(WORM_COUNT / VENT_POSITIONS.length); // ~13

interface WormData {
  ventIndex: number;
  x: number;
  z: number;
  height: number;
  tiltZ: number;
  rotY: number;
}

export default function TubeWorms() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const initialized = useRef(false);

  const geometry = useMemo(
    () => new THREE.CylinderGeometry(0.04, 0.06, 1, 6),
    []
  );

  // Shared time uniform for GPU sway
  const timeUniform = useMemo(() => ({ value: 0 }), []);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: "#DC2626",
      emissive: "#F59E0B",
      emissiveIntensity: 0.3,
      roughness: 0.7,
    });

    // GPU sway — Z-axis rotation in vertex shader
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = timeUniform;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `#include <common>
        uniform float uTime;`
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float swayAngle = sin(uTime * 0.6 + float(gl_InstanceID) * 0.4) * 0.05;
        // Weight by height (top sways more)
        float weight = clamp(transformed.y + 0.5, 0.0, 1.0);
        swayAngle *= weight;
        float cs = cos(swayAngle);
        float sn = sin(swayAngle);
        vec3 swayed = transformed;
        swayed.x = transformed.x * cs - transformed.y * sn;
        swayed.y = transformed.x * sn + transformed.y * cs;
        transformed = swayed;`
      );
    };
    mat.customProgramCacheKey = () => "tubeworm-sway";

    return mat;
  }, [timeUniform]);

  // Generate deterministic worm placement data
  const worms = useMemo(() => {
    const rand = seededRandom(9999);
    const data: WormData[] = [];

    for (let v = 0; v < VENT_POSITIONS.length; v++) {
      const count = v < VENT_POSITIONS.length - 1
        ? WORMS_PER_VENT
        : WORM_COUNT - WORMS_PER_VENT * (VENT_POSITIONS.length - 1);

      for (let i = 0; i < count; i++) {
        // Cluster within 2-unit radius of vent
        const angle = rand() * Math.PI * 2;
        const radius = rand() * 2;

        data.push({
          ventIndex: v,
          x: VENT_POSITIONS[v][0] + Math.cos(angle) * radius,
          z: VENT_POSITIONS[v][2] + Math.sin(angle) * radius,
          height: 0.5 + rand() * 1.5, // [0.5, 2.0]
          tiltZ: (rand() - 0.5) * 0.4, // [-0.2, 0.2]
          rotY: rand() * Math.PI * 2,
        });
      }
    }

    return data;
  }, []);

  // Precompute base matrices
  const baseMatrices = useMemo(() => {
    return worms.map((w) => {
      const mat = new THREE.Matrix4();
      const position = new THREE.Matrix4().makeTranslation(
        w.x,
        VENT_POSITIONS[w.ventIndex][1] + w.height / 2, // base at ocean floor
        w.z
      );
      const rotY = new THREE.Matrix4().makeRotationY(w.rotY);
      const rotZ = new THREE.Matrix4().makeRotationZ(w.tiltZ);
      const scale = new THREE.Matrix4().makeScale(1, w.height, 1);

      mat.multiplyMatrices(position, rotY);
      mat.multiply(rotZ);
      mat.multiply(scale);
      return mat;
    });
  }, [worms]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Visibility: only in the abyss
    const camY = cameraYRef.current;
    const visible = camY < -22;
    mesh.visible = visible;
    if (!visible) return;

    // Initialize matrices once — sway is handled by vertex shader
    if (!initialized.current) {
      for (let i = 0; i < worms.length; i++) {
        mesh.setMatrixAt(i, baseMatrices[i]);
      }
      mesh.instanceMatrix.needsUpdate = true;
      initialized.current = true;
    }

    // Only update the time uniform — GPU handles sway
    timeUniform.value = clock.getElapsedTime();
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, WORM_COUNT]}
      frustumCulled={false}
    />
  );
}
