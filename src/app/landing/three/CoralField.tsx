"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { DeviceTier } from "@/app/components/effects/useDeviceCapability";
import { cameraYRef } from "./OceanEnvironment";

interface CoralFieldProps {
  tier: DeviceTier;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ------------------------------------------------------------------ */
/*  Reef patches — corals cluster around rocky outcrops, not random    */
/* ------------------------------------------------------------------ */
const REEF_PATCHES = [
  // Shallow reef (camera y=-2 to -8 range)
  { cx: -6, cz: -10, r: 5, baseY: -8, density: 1.0 },
  { cx: 10, cz: -14, r: 6, baseY: -10, density: 1.0 },
  // Mid-depth reef
  { cx: -12, cz: -20, r: 5, baseY: -14, density: 0.8 },
  { cx: 6, cz: -24, r: 6, baseY: -16, density: 0.8 },
  // Deep reef
  { cx: -2, cz: -30, r: 4, baseY: -20, density: 0.6 },
  { cx: 12, cz: -28, r: 4, baseY: -19, density: 0.6 },
] as const;

/* ------------------------------------------------------------------ */
/*  Coral type definitions with improved geometry                      */
/* ------------------------------------------------------------------ */
interface CoralType {
  name: string;
  geometry: THREE.BufferGeometry;
  color: string;
  emissive: string;
  emissiveIntensity: number;
  countPerPatch: number;
  sways: boolean;
  side?: THREE.Side;
}

function buildCoralTypes(): CoralType[] {
  // 1. Branching coral — taller Y-shaped with sub-branches
  const branchTrunk = new THREE.CylinderGeometry(0.2, 0.35, 1.8, 6);
  branchTrunk.translate(0, 0.9, 0);
  const branchL = new THREE.ConeGeometry(0.15, 2.0, 5);
  branchL.rotateZ(0.45);
  branchL.translate(-0.45, 2.2, 0);
  const branchR = new THREE.ConeGeometry(0.15, 2.0, 5);
  branchR.rotateZ(-0.45);
  branchR.translate(0.45, 2.2, 0);
  const branchC = new THREE.ConeGeometry(0.12, 1.5, 4);
  branchC.translate(0, 2.6, 0);
  // Sub-branches
  const subL = new THREE.ConeGeometry(0.06, 0.8, 3);
  subL.rotateZ(0.7);
  subL.translate(-0.7, 2.8, 0.1);
  const subR = new THREE.ConeGeometry(0.06, 0.8, 3);
  subR.rotateZ(-0.7);
  subR.translate(0.7, 2.8, -0.1);
  const branching = mergeGeometries([branchTrunk, branchL, branchR, branchC, subL, subR])!;

  // 2. Sea fan — two-layer fan with veining texture
  const fanA = new THREE.CircleGeometry(1.8, 10, 0, Math.PI);
  fanA.rotateY(0.1);
  fanA.translate(0, 1.0, 0);
  const fanB = new THREE.CircleGeometry(1.8, 10, 0, Math.PI);
  fanB.rotateY(-0.1);
  fanB.translate(0, 1.0, 0);
  // Inner fan layer (slightly smaller, different angle for depth)
  const fanInner = new THREE.CircleGeometry(1.4, 8, 0, Math.PI);
  fanInner.rotateY(0.3);
  fanInner.translate(0, 0.9, 0.05);
  const fanStem = new THREE.CylinderGeometry(0.06, 0.12, 1.8, 5);
  fanStem.translate(0, 0.9, 0);
  const fan = mergeGeometries([fanA, fanB, fanInner, fanStem])!;

  // 3. Tube coral cluster — 3 tubes of varying height
  const tubes = [
    { r1: 0.15, r2: 0.22, h: 2.2, x: 0, z: 0 },
    { r1: 0.12, r2: 0.18, h: 1.6, x: 0.25, z: 0.15 },
    { r1: 0.10, r2: 0.15, h: 1.9, x: -0.18, z: 0.20 },
  ];
  const tubeParts = tubes.flatMap((t) => {
    const body = new THREE.CylinderGeometry(t.r1, t.r2, t.h, 6);
    body.translate(t.x, t.h / 2, t.z);
    const polyp = new THREE.TorusGeometry(t.r1 + 0.02, 0.06, 3, 6);
    polyp.rotateX(Math.PI / 2);
    polyp.translate(t.x, t.h, t.z);
    return [body, polyp];
  });
  const tube = mergeGeometries(tubeParts)!;

  // 4. Rock outcrop — lumpy multi-form base for grounding corals
  const rockMain = new THREE.DodecahedronGeometry(1.2, 0);
  rockMain.scale(1, 0.6, 1); // flatten
  const rockBump1 = new THREE.DodecahedronGeometry(0.7, 0);
  rockBump1.translate(0.6, 0.2, 0.4);
  const rockBump2 = new THREE.IcosahedronGeometry(0.5, 0);
  rockBump2.translate(-0.5, 0.1, -0.3);
  const rockSmall = new THREE.DodecahedronGeometry(0.4, 0);
  rockSmall.translate(0.2, 0.3, -0.6);
  const rock = mergeGeometries([rockMain, rockBump1, rockBump2, rockSmall])!;

  // 5. Brain coral — hemisphere with ridge lines
  const brainBase = new THREE.SphereGeometry(0.9, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  const ridge1 = new THREE.TorusGeometry(0.92, 0.06, 3, 10);
  ridge1.rotateX(Math.PI / 2);
  ridge1.translate(0, 0.1, 0);
  const ridge2 = new THREE.TorusGeometry(0.7, 0.05, 3, 8);
  ridge2.rotateX(Math.PI / 2);
  ridge2.rotateY(Math.PI / 3);
  ridge2.translate(0, 0.25, 0);
  const brain = mergeGeometries([brainBase, ridge1, ridge2])!;

  // 6. Staghorn coral — thicker base with more prongs
  const stagBase = new THREE.CylinderGeometry(0.14, 0.22, 1.2, 5);
  stagBase.translate(0, 0.6, 0);
  const prongs = [
    { rz: 0.1, x: 0, z: 0.05, h: 2.0, r: 0.07 },
    { rz: 0.55, x: -0.4, z: 0, h: 1.7, r: 0.06 },
    { rz: -0.55, x: 0.4, z: 0, h: 1.7, r: 0.06 },
    { rz: 0.3, x: -0.15, z: 0.3, h: 1.4, r: 0.05 },
    { rz: -0.3, x: 0.15, z: -0.3, h: 1.4, r: 0.05 },
  ];
  const stagProngs = prongs.map((p) => {
    const prong = new THREE.ConeGeometry(p.r, p.h, 4);
    prong.rotateZ(p.rz);
    prong.translate(p.x, 1.8, p.z);
    return prong;
  });
  const staghorn = mergeGeometries([stagBase, ...stagProngs])!;

  const allParts = [
    branchTrunk, branchL, branchR, branchC, subL, subR,
    fanA, fanB, fanInner, fanStem,
    ...tubeParts,
    rockMain, rockBump1, rockBump2, rockSmall,
    brainBase, ridge1, ridge2,
    stagBase, ...stagProngs,
  ];
  allParts.forEach((g) => g.dispose());

  return [
    { name: "branching", geometry: branching, color: "#ec4899", emissive: "#ec4899", emissiveIntensity: 0.4, countPerPatch: 3, sways: true },
    { name: "fan", geometry: fan, color: "#8b5cf6", emissive: "#8b5cf6", emissiveIntensity: 0.4, countPerPatch: 2, sways: true, side: THREE.DoubleSide },
    { name: "tube", geometry: tube, color: "#06d6a0", emissive: "#06d6a0", emissiveIntensity: 0.4, countPerPatch: 3, sways: true },
    { name: "rock", geometry: rock, color: "#1e293b", emissive: "#334155", emissiveIntensity: 0.08, countPerPatch: 4, sways: false },
    { name: "brain", geometry: brain, color: "#f97316", emissive: "#f97316", emissiveIntensity: 0.35, countPerPatch: 2, sways: false },
    { name: "staghorn", geometry: staghorn, color: "#fbbf24", emissive: "#fbbf24", emissiveIntensity: 0.35, countPerPatch: 2, sways: true },
  ];
}

export default function CoralField({ tier }: CoralFieldProps) {
  const refsMap = useRef<(THREE.InstancedMesh | null)[]>([]);

  const coralTypes = useMemo(() => buildCoralTypes(), []);

  const isReduced = tier === "reduced";

  // Generate transforms: corals placed in reef patches, on top of rocky surfaces
  const transforms = useMemo(() => {
    const result: THREE.Matrix4[][] = coralTypes.map(() => []);

    for (const patch of REEF_PATCHES) {
      const patchDensity = isReduced ? patch.density * 0.5 : patch.density;

      for (let t = 0; t < coralTypes.length; t++) {
        const type = coralTypes[t];
        const count = Math.ceil(type.countPerPatch * patchDensity);
        const rand = seededRandom(42 + t * 100 + Math.round(patch.cx * 10 + patch.cz));

        for (let i = 0; i < count; i++) {
          const angle = rand() * Math.PI * 2;
          const dist = rand() * patch.r;
          const x = patch.cx + Math.cos(angle) * dist;
          const z = patch.cz + Math.sin(angle) * dist;
          // Slight Y variation to sit on uneven terrain surface
          const y = patch.baseY + (rand() - 0.3) * 1.0;
          const rotY = rand() * Math.PI * 2;
          const s = 0.6 + rand() * 0.7;

          const mat = new THREE.Matrix4();
          const pos = new THREE.Matrix4().makeTranslation(x, y, z);
          const rot = new THREE.Matrix4().makeRotationY(rotY);
          const scl = new THREE.Matrix4().makeScale(s, s, s);
          mat.multiplyMatrices(pos, rot);
          mat.multiply(scl);
          result[t].push(mat);
        }
      }
    }
    return result;
  }, [coralTypes, isReduced]);

  const timeUniform = useMemo(() => ({ value: 0 }), []);

  const materials = useMemo(
    () =>
      coralTypes.map((type) => {
        const isRock = type.name === "rock";
        const mat = new THREE.MeshStandardMaterial({
          color: type.color,
          roughness: isRock ? 0.95 : 0.75,
          metalness: isRock ? 0 : 0.05,
          emissive: type.emissive,
          emissiveIntensity: type.emissiveIntensity,
          side: type.side ?? THREE.FrontSide,
        });

        if (type.sways) {
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
              // Height-weighted gentle sway — base stays anchored
              float coralHeight = clamp(transformed.y / 2.0, 0.0, 1.0);
              float swayAngle = sin(uTime * 0.4 + float(gl_InstanceID) * 0.5) * 0.025 * coralHeight;
              float cs = cos(swayAngle);
              float sn = sin(swayAngle);
              vec3 swayed = transformed;
              swayed.x = transformed.x * cs - transformed.z * sn;
              swayed.z = transformed.x * sn + transformed.z * cs;
              transformed = swayed;`
            );
          };
          mat.customProgramCacheKey = () => "coral-sway-v2";
        }

        return mat;
      }),
    [coralTypes, timeUniform]
  );

  const initialized = useRef(false);
  useMemo(() => { initialized.current = false; }, [transforms]);

  useFrame(({ clock }) => {
    const camY = cameraYRef.current;
    let anyVisible = false;

    for (let t = 0; t < coralTypes.length; t++) {
      const mesh = refsMap.current[t];
      if (!mesh) continue;
      const visible = camY < 2 && camY > -22;
      mesh.visible = visible;
      if (visible) anyVisible = true;
    }

    if (!anyVisible) return;

    if (!initialized.current) {
      let allReady = true;
      for (let t = 0; t < coralTypes.length; t++) {
        const mesh = refsMap.current[t];
        if (!mesh) { allReady = false; continue; }
        for (let i = 0; i < transforms[t].length; i++) {
          mesh.setMatrixAt(i, transforms[t][i]);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }
      if (allReady) initialized.current = true;
    }

    timeUniform.value = clock.getElapsedTime();
  });

  return (
    <group>
      {coralTypes.map((type, t) => {
        const count = transforms[t].length;
        if (count === 0) return null;
        return (
          <instancedMesh
            key={type.name}
            ref={(el) => { refsMap.current[t] = el; }}
            args={[type.geometry, materials[t], count]}
            frustumCulled={false}
          />
        );
      })}
    </group>
  );
}
