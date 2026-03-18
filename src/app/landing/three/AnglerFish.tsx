"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cameraYRef } from "./OceanEnvironment";

// ---------------------------------------------------------------------------
// Configs
// ---------------------------------------------------------------------------

const ANGLER_CONFIGS = [
  { position: [-5, -16, -8], scale: 1.0, seed: 0 },
  { position: [8, -18, -5], scale: 0.7, seed: 1.5 },
  { position: [-3, -17, -12], scale: 0.85, seed: 3.0 },
] as const;

// ---------------------------------------------------------------------------
// Shared geometries
// ---------------------------------------------------------------------------
const _bodyGeom = new THREE.SphereGeometry(0.5, 8, 6);
const _tailGeom = new THREE.ConeGeometry(0.35, 0.7, 4);
const _upperJawGeom = new THREE.SphereGeometry(0.3, 6, 2, 0, Math.PI * 2, 0, Math.PI / 2);
const _lowerJawGeom = new THREE.SphereGeometry(0.35, 6, 2, 0, Math.PI * 2, 0, Math.PI / 2); // larger for underbite
const _eyeScleraGeom = new THREE.SphereGeometry(0.035, 4, 3); // tiny deep-sea eyes
const _eyePupilGeom = new THREE.SphereGeometry(0.022, 4, 3);
const _finGeom = new THREE.PlaneGeometry(0.2, 0.12);
const _dorsalGeom = new THREE.PlaneGeometry(0.15, 0.2);
const _tailFinGeom = new THREE.PlaneGeometry(0.18, 0.12);
const _escaGeom = new THREE.SphereGeometry(0.06, 4, 3);
const _tendrilGeom = new THREE.PlaneGeometry(0.04, 0.08);

// Lure stalk via LatheGeometry (tapered, organic curve)
const _stalkProfile = [
  new THREE.Vector2(0.015, 0),
  new THREE.Vector2(0.012, 0.5),
  new THREE.Vector2(0.006, 1.0),
];
const _stalkGeom = new THREE.LatheGeometry(_stalkProfile, 3);

// Teeth: 10 needle-like teeth at random angles (cage-of-needles look)
const _teethGeom = (() => {
  const toothCount = 10;
  const verts = new Float32Array(toothCount * 3 * 3);
  // Seeded pseudo-random for deterministic placement
  const seeds = [0.73, 0.21, 0.89, 0.45, 0.12, 0.67, 0.34, 0.91, 0.56, 0.08];
  for (let i = 0; i < toothCount; i++) {
    const angle = (i / toothCount) * Math.PI * 2 + (seeds[i] - 0.5) * 0.4;
    const len = 0.06 + seeds[(i + 3) % toothCount] * 0.07; // 0.06-0.13 varied lengths
    const r = 0.28;
    const cx = Math.cos(angle) * r;
    const cy = Math.sin(angle) * r;
    const perpAngle = angle + Math.PI / 2;
    const halfBase = 0.008; // thinner needles
    const tiltZ = (seeds[(i + 5) % toothCount] - 0.5) * 0.04; // random inward tilt
    verts[i * 9 + 0] = cx + Math.cos(perpAngle) * halfBase;
    verts[i * 9 + 1] = cy + Math.sin(perpAngle) * halfBase;
    verts[i * 9 + 2] = 0;
    verts[i * 9 + 3] = cx - Math.cos(perpAngle) * halfBase;
    verts[i * 9 + 4] = cy - Math.sin(perpAngle) * halfBase;
    verts[i * 9 + 5] = 0;
    verts[i * 9 + 6] = Math.cos(angle) * (r - len);
    verts[i * 9 + 7] = Math.sin(angle) * (r - len);
    verts[i * 9 + 8] = 0.02 + tiltZ;
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  geom.computeVertexNormals();
  return geom;
})();

// ---------------------------------------------------------------------------
// Pre-merged static geometries (reduces draw calls per fish)
// ---------------------------------------------------------------------------

// Merge body + tail + upper jaw (all use _anglerBodyMat) → 3 DC → 1 DC
const _mergedAnglerBodyGeom = (() => {
  const body = _bodyGeom.clone();
  body.scale(1, 0.95, 0.9);

  const tail = _tailGeom.clone();
  tail.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(0, 0, -0.7),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)),
    new THREE.Vector3(1, 1, 0.7),
  ));

  const jaw = _upperJawGeom.clone();
  jaw.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(0, 0.15, 0.38),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0.5, 0, 0)),
    new THREE.Vector3(1, 1, 1),
  ));

  const merged = mergeGeometries([body, tail, jaw])!;
  [body, tail, jaw].forEach((g) => g.dispose());
  return merged;
})();

// Merge 2 eye scleras → 1 DC
const _mergedEyeScleraGeom = (() => {
  const left = _eyeScleraGeom.clone();
  left.translate(-0.12, 0.28, 0.35);
  const right = _eyeScleraGeom.clone();
  right.translate(0.12, 0.28, 0.35);
  const merged = mergeGeometries([left, right])!;
  [left, right].forEach((g) => g.dispose());
  return merged;
})();

// Merge 2 eye pupils → 1 DC
const _mergedEyePupilGeom = (() => {
  const left = _eyePupilGeom.clone();
  left.translate(-0.13, 0.28, 0.38);
  const right = _eyePupilGeom.clone();
  right.translate(0.13, 0.28, 0.38);
  const merged = mergeGeometries([left, right])!;
  [left, right].forEach((g) => g.dispose());
  return merged;
})();

// Merge dorsal + tail fin (both _anglerFinMat) → 2 DC → 1 DC
const _mergedStaticFinGeom = (() => {
  const dorsal = _dorsalGeom.clone();
  dorsal.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(0, 0.42, -0.15),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 0, 0)),
    new THREE.Vector3(1, 1, 1),
  ));

  const tailFin = _tailFinGeom.clone();
  tailFin.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(0, 0, -1.0),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.15)),
    new THREE.Vector3(1, 1, 1),
  ));

  const merged = mergeGeometries([dorsal, tailFin])!;
  [dorsal, tailFin].forEach((g) => g.dispose());
  return merged;
})();

// Merge esca + 3 tendrils (all _anglerLureMat) → 4 DC → 1 DC
const _mergedLureTipGeom = (() => {
  const esca = _escaGeom.clone();

  const makeTransformed = (pos: [number, number, number], rot: [number, number, number]) => {
    const g = _tendrilGeom.clone();
    g.applyMatrix4(new THREE.Matrix4().compose(
      new THREE.Vector3(...pos),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
      new THREE.Vector3(1, 1, 1),
    ));
    return g;
  };

  const t1 = makeTransformed([0.03, -0.05, 0], [0, 0, 0.2]);
  const t2 = makeTransformed([-0.03, -0.05, 0], [0, 0, -0.15]);
  const t3 = makeTransformed([0, -0.05, 0.03], [0.2, 0, 0]);

  const merged = mergeGeometries([esca, t1, t2, t3])!;
  [esca, t1, t2, t3].forEach((g) => g.dispose());
  return merged;
})();

// ---------------------------------------------------------------------------
// Shared materials
// ---------------------------------------------------------------------------
const _anglerBodyMat = new THREE.MeshPhongMaterial({
  color: "#0A0A20",
  emissive: "#2563EB",
  emissiveIntensity: 0.2,
  shininess: 5,
  transparent: true,
  opacity: 0.95,
});
const _anglerFinMat = new THREE.MeshPhongMaterial({
  color: "#0A0A20",
  emissive: "#2563EB",
  emissiveIntensity: 0.2,
  shininess: 5,
  side: THREE.DoubleSide,
});
const _mouthMat = new THREE.MeshBasicMaterial({ color: "#020208" });
const _toothMat = new THREE.MeshBasicMaterial({ color: "#d4c5a9" });
const _anglerEyeScleraMat = new THREE.MeshStandardMaterial({
  color: "#e8e8d0",
  emissive: "#e8e8d0",
  emissiveIntensity: 0.4,
});
const _anglerEyePupilMat = new THREE.MeshBasicMaterial({ color: "#1a0a2e" });
const _anglerLureMat = new THREE.MeshStandardMaterial({
  color: "#F59E0B",
  emissive: "#F59E0B",
  emissiveIntensity: 0.8,
});

// ---------------------------------------------------------------------------
// Sub-component: SingleAnglerFish
// ---------------------------------------------------------------------------

interface SingleAnglerFishProps {
  config: (typeof ANGLER_CONFIGS)[number];
}

function SingleAnglerFish({ config }: SingleAnglerFishProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lureStalkRef = useRef<THREE.Group>(null);
  const lureTipRef = useRef<THREE.Mesh>(null);
  const lowerJawRef = useRef<THREE.Mesh>(null);
  const leftFinRef = useRef<THREE.Mesh>(null);
  const rightFinRef = useRef<THREE.Mesh>(null);

  const prevPos = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  const [baseX, baseY, baseZ] = config.position;
  const { seed, scale } = config;

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    const time = clock.getElapsedTime();

    // Visibility: camera Y between -12 and -22
    const camY = cameraYRef.current;
    const visible = camY < -12 && camY > -22;
    group.visible = visible;
    if (!visible) return;

    // Slow swimming path
    const x = baseX + Math.sin(time * 0.1 + seed) * 3;
    const y = baseY + Math.sin(time * 0.15 + seed) * 0.5;
    const z = baseZ + Math.cos(time * 0.1 + seed * 0.7) * 3;
    group.position.set(x, y, z);

    // Heading rotation
    if (initialized.current) {
      const dx = x - prevPos.current.x;
      const dz = z - prevPos.current.z;
      if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001) {
        group.rotation.y = Math.atan2(dx, dz);
      }
    }
    prevPos.current.set(x, y, z);
    initialized.current = true;

    // Mouth breathing — wider gape with irregular timing
    if (lowerJawRef.current) {
      const jawAngle = Math.sin(time * 0.8 + seed * 1.7) * 0.2 + Math.sin(time * 1.3 + seed) * 0.08 + 0.1;
      lowerJawRef.current.rotation.x = Math.PI + jawAngle;
    }

    // Pectoral fin sculling (alternating)
    if (leftFinRef.current) {
      leftFinRef.current.rotation.z = -0.5 + Math.sin(time * 1.2 + seed) * 0.15;
    }
    if (rightFinRef.current) {
      rightFinRef.current.rotation.z = 0.5 + Math.sin(time * 1.2 + seed + 0.5) * 0.15;
    }

    // Lure compound wobble (dual-frequency)
    if (lureStalkRef.current) {
      lureStalkRef.current.rotation.z =
        Math.sin(time * 1.2 + seed) * 0.08 +
        Math.sin(time * 2.7 + seed * 1.5) * 0.04;
      lureStalkRef.current.rotation.x =
        0.6 + Math.sin(time * 0.9 + seed * 0.8) * 0.05;
    }

    // Lure emissive flicker
    if (lureTipRef.current) {
      const mat = lureTipRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity =
        0.6 + Math.sin(time * 3 + seed) * 0.3 + Math.sin(time * 7.1 + seed * 2.3) * 0.1;
    }
  });

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      {/* Merged static body: body + tail + upper jaw (3→1 DC) */}
      <mesh geometry={_mergedAnglerBodyGeom} material={_anglerBodyMat} />

      {/* Lower jaw — animated breathing */}
      <mesh ref={lowerJawRef} geometry={_lowerJawGeom} material={_anglerBodyMat} position={[0, -0.15, 0.42]} rotation={[Math.PI + 0.15, 0, 0]} />

      {/* Teeth */}
      <mesh geometry={_teethGeom} material={_toothMat} position={[0, -0.02, 0.45]} />

      {/* Merged eyes (4→2 DC) */}
      <mesh geometry={_mergedEyeScleraGeom} material={_anglerEyeScleraMat} />
      <mesh geometry={_mergedEyePupilGeom} material={_anglerEyePupilMat} />

      {/* Pectoral fins — animated */}
      <mesh ref={leftFinRef} geometry={_finGeom} material={_anglerFinMat} position={[-0.4, -0.1, 0.05]} rotation={[0, -0.3, -0.5]} />
      <mesh ref={rightFinRef} geometry={_finGeom} material={_anglerFinMat} position={[0.4, -0.1, 0.05]} rotation={[0, 0.3, 0.5]} />

      {/* Merged static fins: dorsal + tail fin (2→1 DC) */}
      <mesh geometry={_mergedStaticFinGeom} material={_anglerFinMat} />

      {/* Lure assembly — animated group */}
      <group ref={lureStalkRef} position={[0, 0.30, 0.38]} rotation={[0.8, 0, 0]}>
        <mesh geometry={_stalkGeom} material={_anglerBodyMat} />
        {/* Merged esca + tendrils (4→1 DC) */}
        <mesh ref={lureTipRef} geometry={_mergedLureTipGeom} material={_anglerLureMat} position={[0, 0.95, 0]} />
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AnglerFish() {
  return (
    <group>
      {ANGLER_CONFIGS.map((config, i) => (
        <SingleAnglerFish key={i} config={config} />
      ))}
    </group>
  );
}
