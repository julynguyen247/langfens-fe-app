"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { DeviceTier } from "@/app/components/effects/useDeviceCapability";
import { cameraYRef } from "./OceanEnvironment";

// ---------------------------------------------------------------------------
// Sub-component 1: SeaTurtle
// ---------------------------------------------------------------------------

interface SeaTurtleProps {
  index: number;
}

const TURTLE_CONFIGS = [
  { baseY: 2, centerX: 5, centerZ: -3, offset: 0, visibleWhen: (camY: number) => camY > -4 },
  { baseY: -4, centerX: -6, centerZ: 2, offset: Math.PI, visibleWhen: (camY: number) => camY < 2 },
] as const;

function SeaTurtle({ index }: SeaTurtleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const flipperRefs = useRef<(THREE.Mesh | null)[]>([]);

  const config = TURTLE_CONFIGS[index];

  // Precompute flipper layout: [localX, localZ] offsets for 4 flippers
  const flipperOffsets = useMemo(
    () => [
      { x: 0.4, z: 0.25 },   // front-right
      { x: -0.4, z: 0.25 },  // front-left
      { x: 0.35, z: -0.3 },  // back-right
      { x: -0.35, z: -0.3 }, // back-left
    ],
    []
  );

  // Temp vectors for heading computation
  const prevPos = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    const time = clock.getElapsedTime();

    // Visibility based on camera Y
    const visible = config.visibleWhen(cameraYRef.current);
    group.visible = visible;
    if (!visible) return;

    // Elliptical swimming path
    const x = config.centerX + Math.sin(time * 0.15 + config.offset) * 12;
    const y = config.baseY + Math.sin(time * 0.2 + config.offset) * 2;
    const z = config.centerZ + Math.cos(time * 0.15 + config.offset) * 8;

    group.position.set(x, y, z);

    // Rotate to face movement direction
    if (initialized.current) {
      const dx = x - prevPos.current.x;
      const dz = z - prevPos.current.z;
      if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001) {
        group.rotation.y = Math.atan2(dx, dz);
      }
    }
    prevPos.current.set(x, y, z);
    initialized.current = true;

    // Flipper animation
    for (let f = 0; f < 4; f++) {
      const flipper = flipperRefs.current[f];
      if (flipper) {
        flipper.rotation.z = Math.sin(time * 2 + f) * 0.4;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body — squished sphere */}
      <mesh scale={[1, 0.4, 1]}>
        <sphereGeometry args={[0.6, 8, 6]} />
        <meshBasicMaterial color="#059669" transparent opacity={0.8} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.05, 0.65]}>
        <sphereGeometry args={[0.15, 6, 4]} />
        <meshBasicMaterial color="#059669" transparent opacity={0.8} />
      </mesh>

      {/* 4 Flippers */}
      {flipperOffsets.map((off, f) => (
        <mesh
          key={f}
          ref={(el) => {
            flipperRefs.current[f] = el;
          }}
          position={[off.x, -0.05, off.z]}
        >
          <boxGeometry args={[0.5, 0.05, 0.2]} />
          <meshBasicMaterial color="#059669" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Sub-component 2: MantaRay
// ---------------------------------------------------------------------------

function MantaRay() {
  const meshRef = useRef<THREE.Mesh>(null);
  const prevPos = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  // Store base positions for vertex deformation
  const basePositions = useMemo(() => {
    const geom = new THREE.PlaneGeometry(3, 1.5, 4, 2);
    return new Float32Array(geom.attributes.position.array);
  }, []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = clock.getElapsedTime();

    // Visibility: only when camera is between -6 and 4
    const camY = cameraYRef.current;
    const visible = camY > -6 && camY < 4;
    mesh.visible = visible;
    if (!visible) return;

    // Large slow circular path
    const x = Math.sin(time * 0.1) * 15;
    const y = -2;
    const z = Math.cos(time * 0.1) * 10;

    mesh.position.set(x, y, z);

    // Rotate to face movement direction
    if (initialized.current) {
      const dx = x - prevPos.current.x;
      const dz = z - prevPos.current.z;
      if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001) {
        mesh.rotation.y = Math.atan2(dx, dz);
      }
    }
    prevPos.current.set(x, y, z);
    initialized.current = true;

    // Wing undulation — deform vertices along X edges
    const posAttr = mesh.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const count = posAttr.count;

    for (let i = 0; i < count; i++) {
      const baseX = basePositions[i * 3];
      const baseY = basePositions[i * 3 + 1];

      // Undulate based on distance from center (X axis)
      const distFromCenter = Math.abs(baseX);
      const wave = Math.sin(time * 1.5 + distFromCenter * 2) * 0.3 * (distFromCenter / 1.5);

      arr[i * 3] = baseX;
      arr[i * 3 + 1] = baseY + wave;
      arr[i * 3 + 2] = basePositions[i * 3 + 2];
    }
    posAttr.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[3, 1.5, 4, 2]} />
      <meshBasicMaterial
        color="#1e3a5f"
        side={THREE.DoubleSide}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Sub-component 3: FishSchool (InstancedMesh)
// ---------------------------------------------------------------------------

interface FishSchoolProps {
  schoolIndex: number;
}

const SCHOOL_CONFIGS = [
  { speed: 0.25, range: 10, offset: 0, baseY: 1, baseZ: -4, spread: 2.5, color: "#60a5fa" },
  { speed: 0.2, range: 8, offset: Math.PI * 0.7, baseY: -3, baseZ: 2, spread: 2.0, color: "#60a5fa" },
  { speed: 0.3, range: 12, offset: Math.PI * 1.4, baseY: -6, baseZ: -6, spread: 3.0, color: "#60a5fa" },
] as const;

const FISH_COUNT = 20;

function FishSchool({ schoolIndex }: FishSchoolProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Triangle geometry for each fish
  const fishGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    // Small triangle: ~0.15 size
    const vertices = new Float32Array([
      0, 0.075, 0,      // top
      -0.06, -0.075, 0,  // bottom-left
      0.06, -0.075, 0,   // bottom-right
    ]);
    geom.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geom.computeVertexNormals();
    return geom;
  }, []);

  const fishMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: SCHOOL_CONFIGS[schoolIndex].color,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [schoolIndex]
  );

  // Per-fish random offsets (deterministic)
  const fishOffsets = useMemo(() => {
    const offsets: { x: number; y: number; z: number; phase: number }[] = [];
    for (let i = 0; i < FISH_COUNT; i++) {
      offsets.push({
        x: Math.sin(i * 1.5) * SCHOOL_CONFIGS[schoolIndex].spread,
        y: Math.cos(i * 2.3) * SCHOOL_CONFIGS[schoolIndex].spread * 0.5,
        z: Math.sin(i * 3.7) * SCHOOL_CONFIGS[schoolIndex].spread,
        phase: i * 0.8,
      });
    }
    return offsets;
  }, [schoolIndex]);

  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = clock.getElapsedTime();
    const cfg = SCHOOL_CONFIGS[schoolIndex];

    // Shared school center position
    const centerX = Math.sin(time * cfg.speed + cfg.offset) * cfg.range;
    const centerY = cfg.baseY + Math.sin(time * cfg.speed * 0.8 + cfg.offset) * 2;
    const centerZ = cfg.baseZ + Math.cos(time * cfg.speed + cfg.offset) * cfg.range * 0.6;

    // Compute school heading for fish facing direction
    const headingX = Math.cos(time * cfg.speed + cfg.offset) * cfg.speed * cfg.range;
    const headingZ = -Math.sin(time * cfg.speed + cfg.offset) * cfg.speed * cfg.range * 0.6;
    const headingAngle = Math.atan2(headingX, headingZ);

    for (let i = 0; i < FISH_COUNT; i++) {
      const off = fishOffsets[i];

      // Per-fish jitter around center
      const fx = centerX + off.x + Math.sin(time * 1.2 + off.phase) * 0.3;
      const fy = centerY + off.y + Math.sin(time * 0.9 + off.phase) * 0.2;
      const fz = centerZ + off.z + Math.cos(time * 1.1 + off.phase) * 0.3;

      // Each fish faces the school direction with slight individual variation
      const fishAngle = headingAngle + Math.sin(time + off.phase) * 0.2;
      tempQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), fishAngle);

      tempMatrix.compose(
        new THREE.Vector3(fx, fy, fz),
        tempQuat,
        new THREE.Vector3(1, 1, 1)
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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SeaCreatures({ tier }: { tier: DeviceTier }) {
  if (tier !== "full") return null;
  return (
    <group>
      <SeaTurtle index={0} />
      <SeaTurtle index={1} />
      <MantaRay />
      <FishSchool schoolIndex={0} />
      <FishSchool schoolIndex={1} />
      <FishSchool schoolIndex={2} />
    </group>
  );
}
