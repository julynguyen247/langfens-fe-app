"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { DeviceTier } from "@/app/components/effects/useDeviceCapability";
import { cameraYRef } from "./OceanEnvironment";

interface KelpForestProps {
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
/*  Kelp cluster spots — each is a patch rooted on a rocky ledge       */
/* ------------------------------------------------------------------ */
const KELP_CLUSTERS = [
  // { center, radius, count, baseY (ledge depth), maxHeight }
  { cx: -10, cz: -12, r: 4, count: 6, baseY: -14, maxH: 10 },
  { cx: 8, cz: -18, r: 5, count: 7, baseY: -16, maxH: 12 },
  { cx: -4, cz: -22, r: 3, count: 5, baseY: -18, maxH: 10 },
  { cx: 14, cz: -8, r: 4, count: 5, baseY: -12, maxH: 8 },
  { cx: -16, cz: -16, r: 5, count: 6, baseY: -15, maxH: 11 },
  { cx: 2, cz: -28, r: 4, count: 4, baseY: -20, maxH: 8 },
] as const;

interface StrandData {
  x: number;
  z: number;
  baseY: number;
  height: number;
  rotY: number;
  scaleXZ: number;
}

/* ------------------------------------------------------------------ */
/*  Build a single kelp strand geometry with fronds + pneumatocysts    */
/* ------------------------------------------------------------------ */
function buildKelpGeometry(): THREE.BufferGeometry {
  // Stipe: tapered cylinder, 12 Y segments for smooth sway
  const stipe = new THREE.CylinderGeometry(0.04, 0.08, 1, 6, 12);

  // 6 frond blades at alternating angles, spaced along the stipe
  const frondData = [
    { y: 0.0, rx: 0.2, ry: 0, w: 0.28, h: 0.35 },
    { y: 0.12, rx: -0.15, ry: 1.05, w: 0.25, h: 0.30 },
    { y: 0.22, rx: 0.18, ry: 2.09, w: 0.30, h: 0.38 },
    { y: 0.30, rx: -0.12, ry: 3.14, w: 0.22, h: 0.28 },
    { y: 0.38, rx: 0.1, ry: 4.19, w: 0.26, h: 0.32 },
    { y: 0.44, rx: -0.08, ry: 5.24, w: 0.20, h: 0.25 },
  ];

  const fronds = frondData.map((f) => {
    const frond = new THREE.PlaneGeometry(f.w, f.h, 2, 3);
    frond.rotateY(f.ry);
    frond.rotateX(f.rx);
    frond.translate(0, f.y, 0);
    return frond;
  });

  // Pneumatocysts (gas bladders) — small spheres at frond junctions
  const bladders = [0.12, 0.30, 0.44].map((y) => {
    const bladder = new THREE.SphereGeometry(0.035, 4, 3);
    bladder.translate(0.06, y, 0);
    return bladder;
  });

  // Holdfast — flared cone at base gripping the rock
  const holdfast = new THREE.CylinderGeometry(0.02, 0.14, 0.12, 6);
  holdfast.translate(0, -0.5, 0);

  const allParts = [stipe, ...fronds, ...bladders, holdfast];
  const merged = mergeGeometries(allParts);

  // Vertex colors: dark olive at base → bright green-teal at top
  if (merged) {
    const posAttr = merged.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);
    const baseColor = new THREE.Color("#0a3d2e");
    const midColor = new THREE.Color("#1a7a58");
    const tipColor = new THREE.Color("#3de8a0");
    const tmp = new THREE.Color();

    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      const t = Math.max(0, Math.min(1, (y + 0.5) / 1.0));
      if (t < 0.5) {
        tmp.copy(baseColor).lerp(midColor, t * 2);
      } else {
        tmp.copy(midColor).lerp(tipColor, (t - 0.5) * 2);
      }
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    merged.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }

  allParts.forEach((g) => g.dispose());
  return merged ?? new THREE.BoxGeometry(0.08, 1, 0.08, 1, 8, 1);
}

export default function KelpForest({ tier }: KelpForestProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const initialized = useRef(false);

  if (tier === "minimal") return null;
  const isReduced = tier === "reduced";

  // Generate strand data from clusters
  const strands = useMemo(() => {
    const rand = seededRandom(1337);
    const data: StrandData[] = [];

    for (const cluster of KELP_CLUSTERS) {
      const n = isReduced ? Math.ceil(cluster.count * 0.5) : cluster.count;
      for (let i = 0; i < n; i++) {
        const angle = rand() * Math.PI * 2;
        const dist = rand() * cluster.r;
        data.push({
          x: cluster.cx + Math.cos(angle) * dist,
          z: cluster.cz + Math.sin(angle) * dist,
          baseY: cluster.baseY + (rand() - 0.5) * 1.5,
          height: cluster.maxH * (0.6 + rand() * 0.4),
          rotY: rand() * Math.PI * 2,
          scaleXZ: 0.7 + rand() * 0.5,
        });
      }
    }
    return data;
  }, [isReduced]);

  const count = strands.length;

  const baseMatrices = useMemo(() => {
    return strands.map((s) => {
      const mat = new THREE.Matrix4();
      // Position: base sits at baseY, kelp grows upward
      const pos = new THREE.Matrix4().makeTranslation(
        s.x,
        s.baseY + s.height / 2,
        s.z
      );
      const rot = new THREE.Matrix4().makeRotationY(s.rotY);
      const scl = new THREE.Matrix4().makeScale(s.scaleXZ, s.height, s.scaleXZ);
      mat.multiplyMatrices(pos, rot);
      mat.multiply(scl);
      return mat;
    });
  }, [strands]);

  const geometry = useMemo(() => buildKelpGeometry(), []);

  const timeUniform = useMemo(() => ({ value: 0 }), []);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.75,
      emissive: "#0d7a5f",
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

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
        // Height-dependent sway — top sways more, base stays anchored
        float normalizedY = clamp((transformed.y + 0.5) / 1.0, 0.0, 1.0);
        float swayWeight = normalizedY * normalizedY; // quadratic — rooted at base

        // Multi-frequency ocean current sway
        float current1 = sin(uTime * 0.6 + float(gl_InstanceID) * 0.7) * 0.12;
        float current2 = sin(uTime * 0.25 + float(gl_InstanceID) * 1.3) * 0.06;
        float crossCurrent = sin(uTime * 0.4 + float(gl_InstanceID) * 0.9) * 0.04;

        float swayX = (current1 + current2) * swayWeight;
        float swayZ = crossCurrent * swayWeight;

        transformed.x += swayX;
        transformed.z += swayZ;

        // Frond flutter on plane vertices
        float flutter = sin(uTime * 2.5 + transformed.x * 12.0 + float(gl_InstanceID) * 2.1) * 0.015;
        transformed.x += flutter * normalizedY;`
      );
    };
    mat.customProgramCacheKey = () => "kelp-sway-v3";
    return mat;
  }, [timeUniform]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const camY = cameraYRef.current;
    mesh.visible = camY < 2 && camY > -22;
    if (!mesh.visible) return;

    if (!initialized.current) {
      for (let i = 0; i < strands.length; i++) {
        mesh.setMatrixAt(i, baseMatrices[i]);
      }
      mesh.instanceMatrix.needsUpdate = true;
      initialized.current = true;
    }

    timeUniform.value = clock.getElapsedTime();
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}
