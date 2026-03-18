"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cameraYRef } from "./OceanEnvironment";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DOLPHIN_COUNT = 3;
const PHASE_OFFSETS = [0, 2.1, 4.2];
const CENTER_X = -5;
const CENTER_Z = -8;
const ORBIT_RADIUS = 4;
const JUMP_AMPLITUDE = 3;
const ORBIT_SPEED = 0.15;

// ---------------------------------------------------------------------------
// Hoisted reusable objects — zero GC pressure
// ---------------------------------------------------------------------------

const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);
const _mat4 = new THREE.Matrix4();
const _euler = new THREE.Euler();

// ---------------------------------------------------------------------------
// Cross-section lofted dolphin body geometry
// ---------------------------------------------------------------------------

/**
 * Cross-section stations along the body (Z axis: nose at +Z, tail at -Z).
 * Each station defines an ellipse: { z, rx (half-width), ry (half-height), yOffset (vertical shift) }
 * The yOffset creates the melon bulge and the distinct dolphin profile.
 */
const BODY_STATIONS = [
  // Rostrum (beak) — thin, elongated snout
  { z: 1.2,  rx: 0.015, ry: 0.012, yOff: -0.02 },
  { z: 1.05, rx: 0.03,  ry: 0.025, yOff: -0.01 },
  { z: 0.9,  rx: 0.055, ry: 0.04,  yOff: 0.0 },
  // Melon (forehead) — bulges upward
  { z: 0.75, rx: 0.10,  ry: 0.10,  yOff: 0.03 },
  { z: 0.6,  rx: 0.14,  ry: 0.13,  yOff: 0.04 },
  // Head → body transition
  { z: 0.4,  rx: 0.17,  ry: 0.14,  yOff: 0.03 },
  // Pectoral area (widest)
  { z: 0.15, rx: 0.19,  ry: 0.15,  yOff: 0.02 },
  // Mid body (max girth)
  { z: -0.1, rx: 0.20,  ry: 0.155, yOff: 0.01 },
  // Rear body — narrowing
  { z: -0.35, rx: 0.17, ry: 0.13,  yOff: 0.0 },
  { z: -0.55, rx: 0.13, ry: 0.10,  yOff: -0.01 },
  // Peduncle (tail stock) — very narrow, slightly taller than wide
  { z: -0.75, rx: 0.06, ry: 0.055, yOff: -0.01 },
  { z: -0.9,  rx: 0.03, ry: 0.035, yOff: -0.005 },
  // Tail tip
  { z: -1.0,  rx: 0.015, ry: 0.02, yOff: 0.0 },
];

const RING_SEGMENTS = 8; // vertices per cross-section ring

function buildDolphinBody(): THREE.BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];

  const stationCount = BODY_STATIONS.length;

  // Generate ring vertices for each station
  for (let s = 0; s < stationCount; s++) {
    const st = BODY_STATIONS[s];
    for (let r = 0; r < RING_SEGMENTS; r++) {
      const angle = (r / RING_SEGMENTS) * Math.PI * 2;
      const x = Math.cos(angle) * st.rx;
      // Dorsal-ventral asymmetry: top half slightly flatter, bottom rounder
      const yBase = Math.sin(angle) * st.ry;
      const dorsalFactor = angle > 0 && angle < Math.PI ? 0.85 : 1.1; // top flatter, bottom fuller
      const y = yBase * dorsalFactor + st.yOff;

      vertices.push(x, y, st.z);

      // Approximate normal (outward from center at this station)
      const nx = Math.cos(angle);
      const ny = Math.sin(angle) * dorsalFactor;
      const len = Math.sqrt(nx * nx + ny * ny);
      normals.push(nx / len, ny / len, 0);
    }
  }

  // Connect adjacent rings with triangle strips
  for (let s = 0; s < stationCount - 1; s++) {
    for (let r = 0; r < RING_SEGMENTS; r++) {
      const curr = s * RING_SEGMENTS + r;
      const next = s * RING_SEGMENTS + ((r + 1) % RING_SEGMENTS);
      const currNext = (s + 1) * RING_SEGMENTS + r;
      const nextNext = (s + 1) * RING_SEGMENTS + ((r + 1) % RING_SEGMENTS);

      indices.push(curr, currNext, next);
      indices.push(next, currNext, nextNext);
    }
  }

  // Cap the nose (first ring → center point)
  const noseCenterIdx = vertices.length / 3;
  const noseStation = BODY_STATIONS[0];
  vertices.push(0, noseStation.yOff, noseStation.z + 0.02);
  normals.push(0, 0, 1);
  for (let r = 0; r < RING_SEGMENTS; r++) {
    const next = (r + 1) % RING_SEGMENTS;
    indices.push(noseCenterIdx, next, r);
  }

  // Cap the tail (last ring → center point)
  const tailCenterIdx = vertices.length / 3;
  const tailStation = BODY_STATIONS[stationCount - 1];
  vertices.push(0, tailStation.yOff, tailStation.z - 0.02);
  normals.push(0, 0, -1);
  const tailRingStart = (stationCount - 1) * RING_SEGMENTS;
  for (let r = 0; r < RING_SEGMENTS; r++) {
    const next = (r + 1) % RING_SEGMENTS;
    indices.push(tailCenterIdx, tailRingStart + r, tailRingStart + next);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Dorsal fin — swept-back triangular shape on top of body.
 * Built as a thin extruded triangle.
 */
function buildDorsalFin(): THREE.BufferGeometry {
  const verts = new Float32Array([
    // Base front (on body)
    0, 0.15, 0.05,
    // Tip (highest point, slightly swept back)
    0, 0.32, -0.08,
    // Base rear (on body)
    0, 0.14, -0.18,
    // Slight thickness for visibility
    0.01, 0.15, 0.05,
    0.01, 0.31, -0.08,
    0.01, 0.14, -0.18,
  ]);
  const idx = new Uint16Array([
    0, 1, 2, // left face
    3, 5, 4, // right face
    0, 3, 4, 0, 4, 1, // front edge
    1, 4, 5, 1, 5, 2, // rear edge
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Pectoral fin — swept-back paddle shape.
 */
function buildPectoralFin(side: 1 | -1): THREE.BufferGeometry {
  const verts = new Float32Array([
    // Base (where fin meets body)
    side * 0.16, -0.02, 0.12,
    side * 0.17, -0.04, 0.0,
    // Tip (swept back and outward)
    side * 0.35, -0.08, -0.05,
    // Trailing edge
    side * 0.20, -0.05, -0.08,
  ]);
  const idx = new Uint16Array([0, 1, 2, 1, 3, 2]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Tail flukes — horizontal crescent shape (unlike fish tails which are vertical).
 */
function buildTailFlukes(): THREE.BufferGeometry {
  const verts = new Float32Array([
    // Center (where flukes meet peduncle)
    0, 0, -0.98,
    // Left fluke tip
    -0.28, 0.02, -1.15,
    // Left fluke trailing edge
    -0.15, 0, -1.25,
    // Right fluke tip
    0.28, 0.02, -1.15,
    // Right fluke trailing edge
    0.15, 0, -1.25,
    // Notch center (between flukes)
    0, 0.01, -1.18,
    // Slight thickness top
    0, 0.025, -0.98,
    -0.25, 0.04, -1.15,
    0.25, 0.04, -1.15,
  ]);
  const idx = new Uint16Array([
    // Bottom faces
    0, 1, 5,  // left fluke inner
    1, 2, 5,  // left fluke outer
    0, 5, 3,  // right fluke inner
    5, 4, 3,  // right fluke outer
    // Top faces
    6, 5, 7,
    7, 5, 2,
    6, 8, 5,
    5, 8, 4,
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Build complete dolphin geometry with vertex colors.
 */
function buildDolphinGeometry(): THREE.BufferGeometry {
  const body = buildDolphinBody();
  const dorsal = buildDorsalFin();
  const pecLeft = buildPectoralFin(-1);
  const pecRight = buildPectoralFin(1);
  const flukes = buildTailFlukes();

  const merged = mergeGeometries([body, dorsal, pecLeft, pecRight, flukes])!;
  [body, dorsal, pecLeft, pecRight, flukes].forEach((g) => g.dispose());

  // Apply vertex colors: dark gray dorsal → white ventral
  const posAttr = merged.attributes.position as THREE.BufferAttribute;
  const normalAttr = merged.attributes.normal as THREE.BufferAttribute;
  const count = posAttr.count;
  const colors = new Float32Array(count * 3);

  const dorsalColor = new THREE.Color("#475569");  // slate-600
  const sideColor = new THREE.Color("#94A3B8");    // slate-400
  const ventralColor = new THREE.Color("#E2E8F0"); // slate-200
  const finColor = new THREE.Color("#64748B");     // slate-500
  const temp = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const ny = normalAttr.getY(i);
    const px = posAttr.getX(i);

    // Fin detection: vertices far from center X are fins
    const isFin = Math.abs(px) > 0.22 || posAttr.getY(i) > 0.20;

    if (isFin) {
      temp.copy(finColor);
    } else if (ny > 0.3) {
      // Dorsal (top)
      temp.copy(dorsalColor);
    } else if (ny < -0.3) {
      // Ventral (bottom) — white belly
      temp.copy(ventralColor);
    } else {
      // Side — blend between dorsal and ventral
      const t = (ny + 0.3) / 0.6; // 0 at ventral edge, 1 at dorsal edge
      temp.copy(ventralColor).lerp(dorsalColor, t);
    }

    colors[i * 3] = temp.r;
    colors[i * 3 + 1] = temp.g;
    colors[i * 3 + 2] = temp.b;
  }

  merged.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  merged.computeVertexNormals();

  // Orient dolphin: nose pointing +Z (forward swimming direction)
  // Already oriented correctly (nose at +Z, tail at -Z)

  return merged;
}

// Pre-build geometry at module level
const _dolphinGeom = buildDolphinGeometry();

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Dolphins() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const frameCounter = useRef(0);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.35,
        metalness: 0.05,
        emissive: new THREE.Color("#555555"),
        emissiveIntensity: 0.2,
        side: THREE.DoubleSide,
      }),
    []
  );

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const camY = cameraYRef.current;
    mesh.visible = camY > -5;
    if (!mesh.visible) return;

    // Frame-skip: update every 2nd frame
    frameCounter.current++;
    if (frameCounter.current % 2 !== 0) return;

    const time = clock.getElapsedTime();

    for (let i = 0; i < DOLPHIN_COUNT; i++) {
      const phase = PHASE_OFFSETS[i];

      // Orbit position (slow ellipse around center)
      const x = CENTER_X + Math.cos(time * ORBIT_SPEED + phase) * ORBIT_RADIUS;
      const z = CENTER_Z + Math.sin(time * ORBIT_SPEED * 0.7 + phase) * ORBIT_RADIUS * 0.6;

      // Jump arc
      const jumpSpeed = 0.8;
      const y = Math.sin(time * jumpSpeed + phase) * JUMP_AMPLITUDE;

      // Pitch from arc derivative — nose UP when rising, nose DOWN when falling
      // In Three.js: negative X rotation = nose up (+Z tips toward +Y)
      const dydt = Math.cos(time * jumpSpeed + phase) * JUMP_AMPLITUDE * jumpSpeed;
      const pitchAngle = THREE.MathUtils.clamp(-Math.atan2(dydt, 2.5), -Math.PI / 2.5, Math.PI / 2.5);

      // Yaw from orbit tangent
      const tangentX = -Math.sin(time * ORBIT_SPEED + phase) * ORBIT_RADIUS * ORBIT_SPEED;
      const tangentZ = Math.cos(time * ORBIT_SPEED * 0.7 + phase) * ORBIT_RADIUS * 0.6 * ORBIT_SPEED * 0.7;
      const yawAngle = Math.atan2(tangentX, tangentZ);

      // Slight roll into the arc for natural feel
      const rollAngle = dydt * 0.04;

      _euler.set(pitchAngle, yawAngle, rollAngle, "YXZ");
      _quat.setFromEuler(_euler);

      _pos.set(x, y, z);
      _scale.set(1, 1, 1);
      _mat4.compose(_pos, _quat, _scale);
      mesh.setMatrixAt(i, _mat4);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[_dolphinGeom, material, DOLPHIN_COUNT]}
      frustumCulled={false}
      renderOrder={410}
    />
  );
}
