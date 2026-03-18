"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cameraYRef } from "./OceanEnvironment";

// ---------------------------------------------------------------------------
// Hoisted reusable objects — avoids GC pressure (allocs/frame → 0)
// ---------------------------------------------------------------------------
const _pos = new THREE.Vector3();
const _scale = new THREE.Vector3(1, 1, 1);
const _quat = new THREE.Quaternion();
const _upAxis = new THREE.Vector3(0, 1, 0);

// ---------------------------------------------------------------------------
// School configuration
// ---------------------------------------------------------------------------

const SCHOOL_CONFIGS = [
  {
    count: 20,
    color: "#F97316",
    centerX: 8,
    centerZ: -5,
    baseY: -2,
    spread: 3.0,
    speed: 0.25,
    offset: 0,
  },
  {
    count: 20,
    color: "#06B6D4",
    centerX: -6,
    centerZ: -8,
    baseY: -3,
    spread: 2.5,
    speed: 0.2,
    offset: Math.PI,
  },
] as const;

// ---------------------------------------------------------------------------
// FishSchoolInstance — InstancedMesh for one school
// ---------------------------------------------------------------------------

interface FishSchoolInstanceProps {
  cfg: (typeof SCHOOL_CONFIGS)[number];
}

function FishSchoolInstance({ cfg }: FishSchoolInstanceProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const frameCountRef = useRef(0);

  // Diamond-body fish geometry (same as existing FishSchool in SeaCreatures.tsx)
  const fishGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 0, 0.08,           // 0: nose
      0, 0.03, 0,           // 1: top
      0, -0.03, 0,          // 2: bottom
      0.035, 0, 0,          // 3: right
      -0.035, 0, 0,         // 4: left
      0, 0, -0.05,          // 5: tail-base
      0.025, 0.035, -0.10,  // 6: fork top-right
      0.025, -0.035, -0.10, // 7: fork bottom-right
      -0.025, 0.035, -0.10, // 8: fork top-left
      -0.025, -0.035, -0.10,// 9: fork bottom-left
      0, 0.03, 0.02,        // 10: dorsal front
      0, 0.065, -0.01,      // 11: dorsal tip
      0, 0.03, -0.03,       // 12: dorsal back
      0.035, 0, 0.015,      // 13: pectoral front
      0.055, -0.015, 0,     // 14: pectoral tip
      0.035, 0, -0.015,     // 15: pectoral back
    ]);
    const indices = new Uint16Array([
      0, 1, 3,  0, 3, 2,  0, 4, 1,  0, 2, 4,
      1, 5, 3,  3, 5, 2,  4, 5, 1,  2, 5, 4,
      5, 6, 7,  5, 9, 8,
      10, 11, 12,
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
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.25,
        shininess: 40,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [cfg.color]
  );

  // Per-fish deterministic offsets (stable across renders)
  const fishOffsets = useMemo(() => {
    const offsets: { x: number; y: number; z: number; phase: number }[] = [];
    for (let i = 0; i < cfg.count; i++) {
      offsets.push({
        x: Math.sin(i * 1.5) * cfg.spread,
        y: Math.cos(i * 2.3) * cfg.spread * 0.5,
        z: Math.sin(i * 3.7) * cfg.spread,
        phase: i * 0.8,
      });
    }
    return offsets;
  }, [cfg.count, cfg.spread]);

  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Frame-skip: update every 2nd frame
    frameCountRef.current++;
    if (frameCountRef.current % 2 !== 0) return;

    const camY = cameraYRef.current;

    // Visibility: camY > -5 && camY < 5, fade in/out
    const visible = camY > -5 && camY < 5;
    mesh.visible = visible;
    if (!visible) return;

    const alpha = Math.max(0, Math.min(1, (camY + 5) / 3));
    fishMaterial.opacity = alpha * 0.75;

    const time = clock.getElapsedTime();

    // Elliptical school center path
    const centerX = cfg.centerX + Math.sin(time * cfg.speed + cfg.offset) * 4;
    const centerY = cfg.baseY + Math.sin(time * cfg.speed * 0.8 + cfg.offset) * 1.5;
    const centerZ = cfg.centerZ + Math.cos(time * cfg.speed + cfg.offset) * 3;

    // School heading angle (tangent to elliptical path)
    const headingX = Math.cos(time * cfg.speed + cfg.offset) * cfg.speed * 4;
    const headingZ = -Math.sin(time * cfg.speed + cfg.offset) * cfg.speed * 3;
    const headingAngle = Math.atan2(headingX, headingZ);

    for (let i = 0; i < cfg.count; i++) {
      const off = fishOffsets[i];

      // Per-fish jitter around school center
      const fx = centerX + off.x + Math.sin(time * 1.2 + off.phase) * 0.3;
      const fy = centerY + off.y + Math.sin(time * 0.9 + off.phase) * 0.2;
      const fz = centerZ + off.z + Math.cos(time * 1.1 + off.phase) * 0.3;

      // Each fish faces school heading with slight individual variation
      const fishAngle = headingAngle + Math.sin(time + off.phase) * 0.2;
      _quat.setFromAxisAngle(_upAxis, fishAngle);

      tempMatrix.compose(_pos.set(fx, fy, fz), _quat, _scale);
      mesh.setMatrixAt(i, tempMatrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[fishGeom, fishMaterial, cfg.count]}
      frustumCulled={false}
      renderOrder={400}
    />
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export default function TropicalFish() {
  return (
    <group>
      {SCHOOL_CONFIGS.map((cfg, i) => (
        <FishSchoolInstance key={i} cfg={cfg} />
      ))}
    </group>
  );
}
