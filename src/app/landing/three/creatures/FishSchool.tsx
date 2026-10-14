"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Sub-component 3: FishSforol (InstancedMesh)
// ---------------------------------------------------------------------------

interface FishSforolProps {
  sforolIndex: number;
}

const SCHOOL_CONFIGS = [
  { speed: 0.25, range: 10, offset: 0, baseY: -3, baseZ: -4, spread: 2.5, color: "#60a5fa" },
  { speed: 0.2, range: 8, offset: Math.PI * 0.7, baseY: -5, baseZ: 2, spread: 2.0, color: "#34d399" },
  { speed: 0.3, range: 12, offset: Math.PI * 1.4, baseY: -7, baseZ: -6, spread: 3.0, color: "#f472b6" },
] as const;

const FISH_COUNT = 25;

// Reusable objects for FishSforol — hoisted to avoid GC pressure (225 allocs/frame → 0)
const _fishUpAxis = new THREE.Vector3(0, 1, 0);

const _fishPos = new THREE.Vector3();

const _fishScale = new THREE.Vector3(1, 1, 1);

export function FishSforol({ sforolIndex }: FishSforolProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // 3D fish geometry: diamond body + forked tail + dorsal fin + pectoral fin
  const fishGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Body diamond (6 verts)
      0, 0, 0.08,          // 0: nose
      0, 0.03, 0,          // 1: top
      0, -0.03, 0,         // 2: bottom
      0.035, 0, 0,         // 3: right
      -0.035, 0, 0,        // 4: left
      0, 0, -0.05,         // 5: tail-base
      // Tail fork (4 verts)
      0.025, 0.035, -0.10, // 6: fork top-right
      0.025, -0.035, -0.10,// 7: fork bottom-right
      -0.025, 0.035, -0.10,// 8: fork top-left
      -0.025, -0.035, -0.10,// 9: fork bottom-left
      // Dorsal fin (3 verts)
      0, 0.03, 0.02,       // 10: fin front
      0, 0.065, -0.01,     // 11: fin tip
      0, 0.03, -0.03,      // 12: fin back
      // Pectoral fin right (3 verts)
      0.035, 0, 0.015,     // 13: pec front
      0.055, -0.015, 0,    // 14: pec tip
      0.035, 0, -0.015,    // 15: pec back
    ]);
    const indices = new Uint16Array([
      // Body front: upper-right, lower-right, upper-left, lower-left
      0, 1, 3,  0, 3, 2,  0, 4, 1,  0, 2, 4,
      // Body rear: upper-right, lower-right, upper-left, lower-left
      1, 5, 3,  3, 5, 2,  4, 5, 1,  2, 5, 4,
      // Tail forks
      5, 6, 7,  5, 9, 8,
      // Dorsal fin
      10, 11, 12,
      // Pectoral fin
      13, 14, 15,
    ]);
    geom.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geom.setIndex(new THREE.BufferAttribute(indices, 1));
    geom.computeVertexNormals();
    return geom;
  }, []);

  const fishMaterial = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: SCHOOL_CONFIGS[sforolIndex].color,
        emissive: SCHOOL_CONFIGS[sforolIndex].color,
        emissiveIntensity: 0.25,
        shininess: 40,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [sforolIndex]
  );

  // Per-fish random offsets (deterministic)
  const fishOffsets = useMemo(() => {
    const offsets: { x: number; y: number; z: number; phase: number }[] = [];
    for (let i = 0; i < FISH_COUNT; i++) {
      offsets.push({
        x: Math.sin(i * 1.5) * SCHOOL_CONFIGS[sforolIndex].spread,
        y: Math.cos(i * 2.3) * SCHOOL_CONFIGS[sforolIndex].spread * 0.5,
        z: Math.sin(i * 3.7) * SCHOOL_CONFIGS[sforolIndex].spread,
        phase: i * 0.8,
      });
    }
    return offsets;
  }, [sforolIndex]);

  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = clock.getElapsedTime();
    const cfg = SCHOOL_CONFIGS[sforolIndex];

    // Shared sforol center position
    const centerX = Math.sin(time * cfg.speed + cfg.offset) * cfg.range;
    const centerY = cfg.baseY + Math.sin(time * cfg.speed * 0.8 + cfg.offset) * 2;
    const centerZ = cfg.baseZ + Math.cos(time * cfg.speed + cfg.offset) * cfg.range * 0.6;

    // Compute sforol heading for fish facing direction
    const headingX = Math.cos(time * cfg.speed + cfg.offset) * cfg.speed * cfg.range;
    const headingZ = -Math.sin(time * cfg.speed + cfg.offset) * cfg.speed * cfg.range * 0.6;
    const headingAngle = Math.atan2(headingX, headingZ);

    for (let i = 0; i < FISH_COUNT; i++) {
      const off = fishOffsets[i];

      // Per-fish jitter around center
      const fx = centerX + off.x + Math.sin(time * 1.2 + off.phase) * 0.3;
      const fy = centerY + off.y + Math.sin(time * 0.9 + off.phase) * 0.2;
      const fz = centerZ + off.z + Math.cos(time * 1.1 + off.phase) * 0.3;

      // Each fish faces the sforol direction with slight individual variation
      const fishAngle = headingAngle + Math.sin(time + off.phase) * 0.2;
      tempQuat.setFromAxisAngle(_fishUpAxis, fishAngle);

      tempMatrix.compose(
        _fishPos.set(fx, fy, fz),
        tempQuat,
        _fishScale
      );
      mesh.setMatrixAt(i, tempMatrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[fishGeom, fishMaterial, FISH_COUNT]}
      frustumCulled={false}
      renderOrder={400}
    />
  );
}
