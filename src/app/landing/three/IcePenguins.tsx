"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
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

// Hoisted reusable objects (zero GC per frame)
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _yAxis = new THREE.Vector3(0, 1, 0);

function buildMergedPenguinGeometry(scene: THREE.Group): THREE.BufferGeometry | null {
  let bodyGeo: THREE.BufferGeometry | null = null;
  let wingLGeo: THREE.BufferGeometry | null = null;
  let wingRGeo: THREE.BufferGeometry | null = null;

  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (child.name.includes("PenguinBody")) bodyGeo = child.geometry;
    else if (child.name.includes("PenguinWingL")) wingLGeo = child.geometry;
    else if (child.name.includes("PenguinWingR")) wingRGeo = child.geometry;
  });

  if (!bodyGeo) return null;

  const safeBodyGeo = bodyGeo as THREE.BufferGeometry;
  const parts: THREE.BufferGeometry[] = [safeBodyGeo.clone()];

  const wingColor = new THREE.Color("#1E293B");
  for (const wGeo of [wingLGeo, wingRGeo] as Array<THREE.BufferGeometry | null>) {
    if (!wGeo) continue;
    const clone = wGeo.clone();
    const count = clone.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = wingColor.r;
      colors[i * 3 + 1] = wingColor.g;
      colors[i * 3 + 2] = wingColor.b;
    }
    clone.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    parts.push(clone);
  }

  const merged = mergeGeometries(parts);
  parts.forEach((g) => g.dispose());
  return merged;
}

export default function IcePenguins() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const frameCounter = useRef(0);
  const { scene } = useGLTF(PENGUIN_PATH, true);

  const geometry = useMemo(() => buildMergedPenguinGeometry(scene), [scene]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        emissive: "#555555",
        emissiveIntensity: 0.3,
        roughness: 0.6,
        transparent: true,
        opacity: 1,
      }),
    []
  );

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const camY = cameraYRef.current;
    const opacity = THREE.MathUtils.clamp((camY + 5) / 3, 0, 1);
    mesh.visible = opacity > 0.001;
    if (!mesh.visible) return;

    material.opacity = opacity;

    // Frame-skip: update every 3rd frame
    frameCounter.current++;
    if (frameCounter.current % 3 !== 0) return;

    const t = clock.getElapsedTime();

    for (let i = 0; i < TOTAL; i++) {
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

      _pos.set(
        iceberg.position[0] + worldLx,
        iceberg.position[1] + 2.5 + bobY,
        iceberg.position[2] + worldLz
      );

      let yRot = iceberg.rotY + Math.atan2(cfg.lx, cfg.lz) + Math.PI;

      if (cfg.waddle) {
        const waddlePhase = Math.sin(t * 1.5 + i * 2.0);
        _pos.x += Math.sin(yRot) * waddlePhase * 0.3;
        _pos.z += Math.cos(yRot) * waddlePhase * 0.3;
        yRot += waddlePhase * 0.08;
      } else {
        yRot += Math.sin(t * 2.1 + i * 1.3) * 0.035;
      }

      _quat.setFromAxisAngle(_yAxis, yRot);
      _scale.setScalar(cfg.scale);
      _mat4.compose(_pos, _quat, _scale);
      mesh.setMatrixAt(i, _mat4);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!geometry) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, TOTAL]}
      frustumCulled={false}
    />
  );
}
