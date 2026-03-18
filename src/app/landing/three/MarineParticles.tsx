"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { DeviceTier } from "@/app/components/effects/useDeviceCapability";
import { cameraYRef } from "./OceanEnvironment";

interface MarineParticlesProps {
  tier: DeviceTier;
}

// --- Layer 1: Plankton (all tiers) ---

function PlanktonLayer() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const frameCounter = useRef(0);

  const positions = useMemo(() => {
    const count = 300;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 40; // X: [-20, 20]
      arr[i * 3 + 1] = Math.random() * -23 + 3; // Y: [-20, 3]
      arr[i * 3 + 2] = Math.random() * -20 + 5; // Z: [-15, 5]
    }
    return arr;
  }, []);

  const basePositions = useMemo(() => new Float32Array(positions), [positions]);

  useFrame(({ clock }) => {
    // Hide plankton above water
    if (pointsRef.current) {
      pointsRef.current.visible = cameraYRef.current < 2;
    }
    if (cameraYRef.current >= 2) return;

    // Frame-skip: plankton wobble is imperceptible at 30fps
    frameCounter.current++;
    if (frameCounter.current % 2 !== 0) return;

    const time = clock.getElapsedTime();
    const geom = pointsRef.current?.geometry;
    if (!geom) return;

    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < 300; i++) {
      arr[i * 3 + 1] =
        basePositions[i * 3 + 1] +
        Math.sin(time * 0.3 + i * 0.1) * 0.002 * (i + 1);
    }
    posAttr.needsUpdate = true;

    // Opacity increases with depth
    if (materialRef.current) {
      const rawOpacity = 0.6 + Math.max(0, -cameraYRef.current) * 0.04;
      materialRef.current.opacity = Math.min(rawOpacity, 0.9);
    }
  });

  return (
    <points ref={pointsRef} renderOrder={500}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={300}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.18}
        color="#06d6a0"
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        opacity={0.6}
      />
    </points>
  );
}

// --- Layer 2: Fish Schools (full tier only) ---

function FishSchoolLayer() {
  const pointsRef = useRef<THREE.Points>(null);
  const frameCounter = useRef(0);

  const positions = useMemo(() => {
    const count = 50;
    const arr = new Float32Array(count * 3);
    // Initial positions don't matter much since useFrame overrides them
    for (let i = 0; i < count; i++) {
      arr[i * 3] = 0;
      arr[i * 3 + 1] = 0;
      arr[i * 3 + 2] = 0;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    // Visibility check first — early exit if not visible
    if (pointsRef.current) {
      pointsRef.current.visible = cameraYRef.current < 0;
    }
    if (!pointsRef.current?.visible) return;

    // Frame-skip: update every 2nd frame, matching PlanktonLayer pattern
    frameCounter.current++;
    if (frameCounter.current % 2 !== 0) return;

    const geom = pointsRef.current.geometry;
    const time = clock.getElapsedTime();
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < 50; i++) {
      arr[i * 3] =
        Math.sin(time * 0.3) * 10 + Math.sin(i * 2.0) * 3;
      arr[i * 3 + 1] =
        Math.sin(time * 0.2 + i * 1.5) * 3 - 4;
      arr[i * 3 + 2] =
        Math.cos(time * 0.25 + i * 0.8) * 6 - 5;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} renderOrder={500}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={50}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        color="#94a3b8"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// --- Layer 3: Jellyfish (full tier only) ---

const JELLYFISH_COLORS = ["#a78bfa", "#ec4899"] as const;
const JELLYFISH_ORGAN_COLORS = ["#c084fc", "#fb7185"] as const;

interface JellyfishData {
  x: number;
  y: number;
  z: number;
  color: string;
  organColor: string;
}

// Precomputed geometries shared across all jellyfish
const _bellProfile = [
  new THREE.Vector2(0.001, 0.65),
  new THREE.Vector2(0.25, 0.60),
  new THREE.Vector2(0.55, 0.45),
  new THREE.Vector2(0.78, 0.20),
  new THREE.Vector2(0.75, 0.00),
  new THREE.Vector2(0.70, -0.06),
  new THREE.Vector2(0.68, -0.10),
  new THREE.Vector2(0.72, -0.13),
  new THREE.Vector2(0.60, -0.15),
];
const _bellGeom = new THREE.LatheGeometry(_bellProfile, 12);
const _organGeom = new THREE.SphereGeometry(0.06, 3, 2);
const _oralArmGeom = new THREE.PlaneGeometry(0.08, 0.5, 1, 4);

// Pre-merge 4 organ spheres into a single geometry (4 DC → 1 DC per jellyfish)
const _mergedOrganGeom = (() => {
  const positions: [number, number, number][] = [
    [0.08, 0.2, 0.04], [-0.08, 0.2, 0.04],
    [0.08, 0.2, -0.04], [-0.08, 0.2, -0.04],
  ];
  const parts: THREE.BufferGeometry[] = [];
  for (const pos of positions) {
    const g = _organGeom.clone();
    g.scale(1, 1, 1.8);
    g.translate(pos[0], pos[1], pos[2]);
    parts.push(g);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((g) => g.dispose());
  return merged;
})();

// Pre-merge 4 oral arms into a single geometry (4 DC → 1 DC per jellyfish)
const _mergedArmGeom = (() => {
  const parts: THREE.BufferGeometry[] = [];
  for (let a = 0; a < 4; a++) {
    const angle = (a / 4) * Math.PI * 2;
    const g = _oralArmGeom.clone();
    const mat = new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(Math.PI + (a % 2) * 0.1, 0, Math.sin(a * 1.5) * 0.1)
    );
    g.applyMatrix4(mat);
    g.translate(Math.cos(angle) * 0.08, -0.15, Math.sin(angle) * 0.08);
    parts.push(g);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((g) => g.dispose());
  return merged;
})();

// Tentacle config: 10 tentacles with staggered lengths and radii
const TENTACLE_CONFIG = [
  { angle: 0, length: 1.4, radius: 0.55 },
  { angle: 0.63, length: 1.0, radius: 0.58 },
  { angle: 1.26, length: 1.3, radius: 0.52 },
  { angle: 1.88, length: 0.8, radius: 0.60 },
  { angle: 2.51, length: 1.2, radius: 0.54 },
  { angle: 3.14, length: 1.1, radius: 0.57 },
  { angle: 3.77, length: 1.4, radius: 0.53 },
  { angle: 4.40, length: 0.9, radius: 0.59 },
  { angle: 5.03, length: 1.3, radius: 0.56 },
  { angle: 5.65, length: 1.0, radius: 0.51 },
];

// Pre-created shared materials (2 color variants instead of ~30 inline instances)
const _bellMaterials = JELLYFISH_COLORS.map(
  (c) =>
    new THREE.MeshStandardMaterial({
      color: c, emissive: c, emissiveIntensity: 0.5,
      transparent: true, opacity: 0.45, side: THREE.DoubleSide,
      roughness: 0.3, depthWrite: false,
    }),
);
const _organMaterials = JELLYFISH_ORGAN_COLORS.map(
  (c) =>
    new THREE.MeshStandardMaterial({
      color: c, emissive: c, emissiveIntensity: 0.8,
      transparent: true, opacity: 0.7,
    }),
);
const _armMaterials = JELLYFISH_COLORS.map(
  (c) =>
    new THREE.MeshStandardMaterial({
      color: c, emissive: c, emissiveIntensity: 0.4,
      transparent: true, opacity: 0.55, roughness: 0.5,
    }),
);

// Merged tentacle geometry per jellyfish — all 10 tentacles baked into one BufferGeometry
// with a custom `aWaveParams` attribute encoding per-tentacle phase + height for GPU animation
function buildMergedTentacleGeometry(colorIndex: number) {
  const merged = new THREE.BufferGeometry();
  const allPos: number[] = [];
  const allIdx: number[] = [];
  const allWaveParams: number[] = []; // [jellyfishPhase, tentaclePhase, heightNorm, 0]
  let vertexOffset = 0;

  for (let t = 0; t < TENTACLE_CONFIG.length; t++) {
    const tc = TENTACLE_CONFIG[t];
    const cyl = new THREE.CylinderGeometry(0.003, 0.001, tc.length, 3, 5);
    cyl.translate(
      Math.cos(tc.angle) * tc.radius,
      -0.1 - tc.length / 2,
      Math.sin(tc.angle) * tc.radius,
    );

    const pos = cyl.attributes.position;
    const idx = cyl.index;

    // Copy positions and compute wave params per vertex
    for (let v = 0; v < pos.count; v++) {
      const x = pos.getX(v);
      const y = pos.getY(v);
      const z = pos.getZ(v);
      allPos.push(x, y, z);

      // heightNorm: 0 at top of tentacle, 1 at bottom
      const localY = y - (-0.1 - tc.length / 2);
      const heightNorm = Math.max(0, Math.min(1, (-localY + tc.length / 2) / tc.length));
      allWaveParams.push(t * 1.5, heightNorm, 0, 0);
    }

    if (idx) {
      for (let j = 0; j < idx.count; j++) {
        allIdx.push(idx.getX(j) + vertexOffset);
      }
    }
    vertexOffset += pos.count;
    cyl.dispose();
  }

  merged.setAttribute("position", new THREE.Float32BufferAttribute(allPos, 3));
  merged.setAttribute("aWaveParams", new THREE.Float32BufferAttribute(allWaveParams, 4));
  if (allIdx.length) merged.setIndex(allIdx);
  merged.computeVertexNormals();

  return merged;
}

// Pre-build merged tentacle geometries (one per color variant, though geometry is identical)
const _mergedTentacleGeom = buildMergedTentacleGeometry(0);

// GPU-driven tentacle material with wave animation in vertex shader
function createTentacleMaterial(color: string) {
  const mat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.25, depthWrite: false,
  });
  const timeUniform = { value: 0 };
  const jellyIndexUniform = { value: 0 };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = timeUniform;
    shader.uniforms.uJellyIndex = jellyIndexUniform;
    shader.vertexShader = shader.vertexShader.replace(
      "void main() {",
      `uniform float uTime;
       uniform float uJellyIndex;
       attribute vec4 aWaveParams;
       void main() {`,
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       float tentaclePhase = aWaveParams.x;
       float heightNorm = aWaveParams.y;
       float amplitude = heightNorm * heightNorm * 0.15;
       float wave = sin(uTime * 1.2 + uJellyIndex * 2.0 + tentaclePhase + heightNorm * 4.0);
       transformed.x += wave * amplitude;
       transformed.z += wave * amplitude * 0.4;`,
    );
  };
  mat.customProgramCacheKey = () => "jelly-tentacle-" + color;
  return { mat, timeUniform, jellyIndexUniform };
}

const _tentacleMats = JELLYFISH_COLORS.map((c) => createTentacleMaterial(c));

function JellyfishLayer() {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const bellRefs = useRef<(THREE.Mesh | null)[]>([]);
  const organRefs = useRef<(THREE.Mesh | null)[]>([]);
  const rootRef = useRef<THREE.Group>(null);

  const jellyfish = useMemo<JellyfishData[]>(() => {
    const data: JellyfishData[] = [];
    const seeds = [0.2, 0.7, 0.4, 0.9, 0.1, 0.6];
    for (let i = 0; i < 12; i++) {
      data.push({
        x: (seeds[i % seeds.length] - 0.5) * 30,
        y: i < 6 ? -9 - seeds[(i + 3) % seeds.length] * 5 : -6 - seeds[(i + 1) % seeds.length] * 3,
        z: (seeds[(i + 1) % seeds.length] - 0.5) * 30,
        color: JELLYFISH_COLORS[i % 2],
        organColor: JELLYFISH_ORGAN_COLORS[i % 2],
      });
    }
    return data;
  }, []);

  const baseYs = useMemo(() => jellyfish.map((j) => j.y), [jellyfish]);
  const baseXs = useMemo(() => jellyfish.map((j) => j.x), [jellyfish]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const visible = cameraYRef.current < -3;

    if (rootRef.current) rootRef.current.visible = visible;
    if (!visible) return;

    // Update shared time uniforms (2 updates instead of 720 CPU vertex ops)
    for (const tm of _tentacleMats) {
      tm.timeUniform.value = time;
    }

    for (let i = 0; i < 12; i++) {
      const group = groupRefs.current[i];
      if (!group) continue;

      // Bounded sinusoidal drift
      group.position.y = baseYs[i] + Math.sin(time * 0.4 + i * 1.3) * 1.5;
      group.position.x = baseXs[i] + Math.sin(time * 0.15 + i * 0.7) * 0.5;

      // Bell contraction: Y shrinks while XZ expands (mushroom pulse)
      const pulse = Math.sin(time * 1.5 + i * 2.0);
      const bellScaleY = 1.0 - pulse * 0.12;
      const bellScaleXZ = 1.0 + pulse * 0.06;
      group.scale.set(bellScaleXZ, bellScaleY, bellScaleXZ);

      // Bell emissive/opacity pulse
      const bell = bellRefs.current[i];
      if (bell) {
        const mat = bell.material as THREE.MeshStandardMaterial;
        mat.opacity = 0.45 + Math.sin(time * 1.2 + i * 1.5) * 0.15;
        mat.emissiveIntensity = 0.5 + Math.sin(time * 1.5 + i * 2.0 + 0.5) * 0.2;
      }

      // Organ counter-pulse (direct set — merged mesh, no traverse)
      const organMesh = organRefs.current[i] as unknown as THREE.Mesh;
      if (organMesh?.material) {
        (organMesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.8 - Math.sin(time * 1.5 + i * 2.0) * 0.2;
      }
    }
  });

  return (
    <group ref={rootRef}>
      {jellyfish.map((jf, i) => {
        const colorIdx = i % 2;
        return (
          <group
            key={i}
            ref={(el) => { groupRefs.current[i] = el; }}
            position={[jf.x, jf.y, jf.z]}
          >
            {/* Bell */}
            <mesh
              ref={(el) => { bellRefs.current[i] = el; }}
              geometry={_bellGeom}
              material={_bellMaterials[colorIdx]}
            />

            {/* Internal organ — merged 4-lobe horseshoe (1 draw call) */}
            <mesh
              ref={(el) => { organRefs.current[i] = el as unknown as THREE.Mesh; }}
              geometry={_mergedOrganGeom}
              material={_organMaterials[colorIdx]}
            />

            {/* Merged oral arms (1 draw call) */}
            <mesh
              geometry={_mergedArmGeom}
              material={_armMaterials[colorIdx]}
            />

            {/* Merged tentacles — single draw call, GPU-animated */}
            <mesh
              geometry={_mergedTentacleGeom}
              material={_tentacleMats[colorIdx].mat}
              onBeforeRender={() => {
                _tentacleMats[colorIdx].jellyIndexUniform.value = i;
              }}
            />
          </group>
        );
      })}
    </group>
  );
}

// --- Layer 4: Bioluminescence (full tier, Midnight+ zones) ---

const BIOLUM_COUNT = 230;
const BIOLUM_COLORS = [
  new THREE.Color("#06D6A0"), // teal
  new THREE.Color("#8B5CF6"), // purple
  new THREE.Color("#0EA5E9"), // deep blue
  new THREE.Color("#F59E0B"), // warm amber
];

function BioluminescenceLayer() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const frameCounter = useRef(0);

  const { positions, colors, phases } = useMemo(() => {
    const pos = new Float32Array(BIOLUM_COUNT * 3);
    const col = new Float32Array(BIOLUM_COUNT * 3);
    const ph = new Float32Array(BIOLUM_COUNT);

    for (let i = 0; i < BIOLUM_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;     // X: [-25, 25]
      pos[i * 3 + 1] = -14 - Math.random() * 26;    // Y: [-14, -40] (Midnight → Abyss)
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;  // Z: [-20, 20]

      const c = BIOLUM_COLORS[i % BIOLUM_COLORS.length];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      ph[i] = Math.random() * Math.PI * 2; // random phase for twinkle
    }

    return { positions: pos, colors: col, phases: ph };
  }, []);

  const basePositions = useMemo(() => new Float32Array(positions), [positions]);

  useFrame(({ clock }) => {
    const points = pointsRef.current;
    if (!points) return;

    const camY = cameraYRef.current;

    // Only visible in deep zones (camY < -12)
    points.visible = camY < -12;
    if (!points.visible) return;

    // Frame-skip: update every 3rd frame
    frameCounter.current++;
    if (frameCounter.current % 3 !== 0) return;

    const time = clock.getElapsedTime();

    // Gentle drift animation
    const posAttr = points.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < BIOLUM_COUNT; i++) {
      arr[i * 3] = basePositions[i * 3] + Math.sin(time * 0.2 + phases[i]) * 0.5;
      arr[i * 3 + 1] = basePositions[i * 3 + 1] + Math.sin(time * 0.15 + phases[i] * 2) * 0.3;
    }
    posAttr.needsUpdate = true;

    // Twinkle: pulse size
    if (materialRef.current) {
      materialRef.current.size = 0.25 + Math.sin(time * 0.8) * 0.08;
      // Brighter as camera goes deeper
      const depthFactor = Math.min(1, Math.max(0, (-camY - 12) / 8));
      materialRef.current.opacity = 0.4 + depthFactor * 0.4;
    }
  });

  return (
    <points ref={pointsRef} renderOrder={510}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={BIOLUM_COUNT}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={BIOLUM_COUNT}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.25}
        vertexColors
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
}

// --- Main component ---

export default function MarineParticles({ tier }: MarineParticlesProps) {
  return (
    <group>
      <PlanktonLayer />
      {tier === "full" && <FishSchoolLayer />}
      {tier === "full" && <JellyfishLayer />}
      {tier === "full" && <BioluminescenceLayer />}
    </group>
  );
}
