"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cameraYRef } from "./OceanEnvironment";

// ---------------------------------------------------------------------------
// Body geometry: mantle (LatheGeometry) + 2 fins (PlaneGeometry) + 2 eyes (SphereGeometry)
// Merged into a single BufferGeometry → 1 draw call
// ---------------------------------------------------------------------------

function buildSquidBody(): THREE.BufferGeometry {
  // Torpedo profile — 10 control points, mantle oriented along +Y
  const mantleProfile = [
    new THREE.Vector2(0.001, 0.0),
    new THREE.Vector2(0.15,  0.05),
    new THREE.Vector2(0.3,   0.15),
    new THREE.Vector2(0.35,  0.3),
    new THREE.Vector2(0.32,  0.5),
    new THREE.Vector2(0.25,  0.65),
    new THREE.Vector2(0.18,  0.8),
    new THREE.Vector2(0.1,   0.9),
    new THREE.Vector2(0.04,  0.95),
    new THREE.Vector2(0.001, 1.0),
  ];
  const mantleGeom = new THREE.LatheGeometry(mantleProfile, 8);
  mantleGeom.scale(1.5, 4, 1.5);

  // Fins — diamond-shaped, rear of mantle (y ≈ 0)
  const finL = new THREE.PlaneGeometry(0.8, 0.5);
  finL.applyMatrix4(
    new THREE.Matrix4().compose(
      new THREE.Vector3(-0.55, 0.3, 0),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 4)),
      new THREE.Vector3(1, 1, 1),
    ),
  );

  const finR = new THREE.PlaneGeometry(0.8, 0.5);
  finR.applyMatrix4(
    new THREE.Matrix4().compose(
      new THREE.Vector3(0.55, 0.3, 0),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 4)),
      new THREE.Vector3(1, 1, 1),
    ),
  );

  // Eyes — on the sides, roughly at 85% of mantle height
  const eyeL = new THREE.SphereGeometry(0.15, 6, 4);
  eyeL.translate(-0.55, 3.4, 0.3);

  const eyeR = new THREE.SphereGeometry(0.15, 6, 4);
  eyeR.translate(0.55, 3.4, 0.3);

  // Assign vertex colors before merging
  const mantleColor = new THREE.Color("#7C2D12"); // deep red-brown
  const finColor    = new THREE.Color("#A16207"); // lighter amber-brown
  const eyeColor    = new THREE.Color("#FBBF24"); // yellow

  function applyVertexColor(geom: THREE.BufferGeometry, col: THREE.Color) {
    const count = geom.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3]     = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }

  applyVertexColor(mantleGeom, mantleColor);
  applyVertexColor(finL,       finColor);
  applyVertexColor(finR,       finColor);
  applyVertexColor(eyeL,       eyeColor);
  applyVertexColor(eyeR,       eyeColor);

  const merged = mergeGeometries([mantleGeom, finL, finR, eyeL, eyeR])!;
  [mantleGeom, finL, finR, eyeL, eyeR].forEach((g) => g.dispose());
  return merged;
}

// ---------------------------------------------------------------------------
// Tentacle geometry: 10 merged CylinderGeometries with aWaveParams attribute
// for GPU sway — 1 draw call
// ---------------------------------------------------------------------------

function buildSquidTentacles(): {
  geometry: THREE.BufferGeometry;
  timeUniform: { value: number };
} {
  const allPos: number[] = [];
  const allIdx: number[] = [];
  const allWave: number[] = []; // [tentaclePhase, heightNorm, 0, 0]
  let offset = 0;

  for (let t = 0; t < 10; t++) {
    const isFeeding = t >= 8;
    const length = isFeeding ? 3.0 : 1.8;
    const radius = 0.3 + (t / 10) * 0.15;
    const angle = (t / 10) * Math.PI * 2;

    const cyl = new THREE.CylinderGeometry(0.02, 0.008, length, 3, 6);
    cyl.translate(
      Math.cos(angle) * radius,
      -length / 2,
      Math.sin(angle) * radius,
    );

    const pos = cyl.attributes.position as THREE.BufferAttribute;
    for (let v = 0; v < pos.count; v++) {
      allPos.push(pos.getX(v), pos.getY(v), pos.getZ(v));
      // heightNorm: 0 at attachment point (top), 1 at tip (bottom)
      const localY = pos.getY(v) + length / 2;
      const heightNorm = Math.max(0, Math.min(1, -localY / length + 0.5));
      allWave.push(t * 1.2, heightNorm, 0, 0);
    }

    if (cyl.index) {
      for (let j = 0; j < cyl.index.count; j++) {
        allIdx.push(cyl.index.getX(j) + offset);
      }
    }
    offset += pos.count;
    cyl.dispose();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(allPos, 3));
  geo.setAttribute("aWaveParams", new THREE.Float32BufferAttribute(allWave, 4));
  if (allIdx.length) geo.setIndex(allIdx);
  geo.computeVertexNormals();

  // Vertex colors: lighter tentacle color
  const colors = new Float32Array((allPos.length / 3) * 3);
  const col = new THREE.Color("#A16207");
  for (let i = 0; i < allPos.length / 3; i++) {
    colors[i * 3]     = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const timeUniform = { value: 0 };
  return { geometry: geo, timeUniform };
}

// ---------------------------------------------------------------------------
// Module-level precomputed geometries (built once, shared forever)
// ---------------------------------------------------------------------------

const _bodyGeom = buildSquidBody();
const _tentacleResult = buildSquidTentacles();
const _tentacleGeom = _tentacleResult.geometry;
const _tentacleTimeUniform = _tentacleResult.timeUniform;

// Body material — vertex colors, semi-transparent, Phong for depth shading
const _bodyMat = new THREE.MeshPhongMaterial({
  vertexColors: true,
  transparent: true,
  opacity: 0.85,
  shininess: 30,
  emissive: new THREE.Color("#3B0F04"),
  emissiveIntensity: 0.2,
  side: THREE.DoubleSide,
});

// Tentacle material — GPU wave sway via onBeforeCompile
const _tentacleMat = (() => {
  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = _tentacleTimeUniform;
    shader.vertexShader = shader.vertexShader.replace(
      "void main() {",
      `uniform float uTime;\nattribute vec4 aWaveParams;\nvoid main() {`,
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      float tPhase = aWaveParams.x;
      float hNorm = aWaveParams.y;
      float amp = hNorm * hNorm * 0.3;
      float wave = sin(uTime * 0.8 + tPhase + hNorm * 3.0);
      transformed.x += wave * amp;
      transformed.z += wave * amp * 0.5;`,
    );
  };
  mat.customProgramCacheKey = () => "squid-tentacle";
  return mat;
})();

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const BASE_X = 5;
const BASE_Y = -10;
const BASE_Z = -10;

export default function GiantSquid() {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef  = useRef<THREE.Mesh>(null);
  const frameCounter = useRef(0);
  const prevDriftX = useRef(BASE_X);
  const prevDriftZ = useRef(BASE_Z);
  const initialized = useRef(false);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    const camY = cameraYRef.current;

    // Visibility window: twilight zone  -4 … -18
    const alpha =
      Math.max(0, Math.min(1, (-4 - camY) / 3)) *
      Math.max(0, Math.min(1, (camY + 18) / 3));

    group.visible = alpha > 0;
    if (!group.visible) return;

    // Frame-skip — update every 2nd frame
    frameCounter.current++;
    if (frameCounter.current % 2 !== 0) return;

    const t = clock.getElapsedTime();

    // Slow Lissajous drift
    const x = BASE_X + Math.sin(t * 0.08) * 4;
    const y = BASE_Y + Math.sin(t * 0.12) * 1.5;
    const z = BASE_Z + Math.cos(t * 0.06) * 3;
    group.position.set(x, y, z);

    // Heading rotation follows drift direction
    if (initialized.current) {
      const dx = x - prevDriftX.current;
      const dz = z - prevDriftZ.current;
      if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001) {
        group.rotation.y = Math.atan2(dx, dz);
      }
    }
    prevDriftX.current = x;
    prevDriftZ.current = z;
    initialized.current = true;

    // Opacity fade in/out with depth
    (_bodyMat as THREE.MeshPhongMaterial).opacity = 0.85 * alpha;
    (_tentacleMat as THREE.MeshBasicMaterial).opacity = 0.6 * alpha;

    // Mantle pulse — subtle breathing along Y
    const bodyMesh = bodyRef.current;
    if (bodyMesh) {
      bodyMesh.scale.y = 1 + Math.sin(t * 1.2) * 0.05;
    }

    // Update tentacle GPU time uniform
    _tentacleTimeUniform.value = t;
  });

  return (
    <group ref={groupRef}>
      {/* Body: mantle + fins + eyes (1 draw call) */}
      <mesh ref={bodyRef} geometry={_bodyGeom} material={_bodyMat} />

      {/* Tentacles: 10 merged cylinders, GPU wave sway (1 draw call) */}
      <mesh geometry={_tentacleGeom} material={_tentacleMat} />
    </group>
  );
}
