"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cameraYRef } from "./OceanEnvironment";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_Y = -35;
const BASE_X = 0;
const BASE_Z = -8;

// ---------------------------------------------------------------------------
// Body geometry: torpedo mantle + 2 bioluminescent eyes (merged → 1 draw call)
// ---------------------------------------------------------------------------

const _colossalBodyGeom = (() => {
  // Torpedo mantle via LatheGeometry — scaled 3x from a regular giant squid
  const profile = [
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

  const mantle = new THREE.LatheGeometry(profile, 8);
  // Scale: [4, 10, 4] — massive torpedo body
  mantle.applyMatrix4(
    new THREE.Matrix4().compose(
      new THREE.Vector3(0, 0, 0),
      new THREE.Quaternion(),
      new THREE.Vector3(4, 10, 4),
    ),
  );

  // Vertex color: dark crimson (#450A0A) for mantle
  const mantleColor = new THREE.Color("#450A0A");
  const mantleCount = mantle.attributes.position.count;
  const mantleColors = new Float32Array(mantleCount * 3);
  for (let i = 0; i < mantleCount; i++) {
    mantleColors[i * 3 + 0] = mantleColor.r;
    mantleColors[i * 3 + 1] = mantleColor.g;
    mantleColors[i * 3 + 2] = mantleColor.b;
  }
  mantle.setAttribute("color", new THREE.BufferAttribute(mantleColors, 3));

  // 2 large eyes: glowing green (#4ADE80), SphereGeometry(0.4, 6, 4)
  const eyeLeft = new THREE.SphereGeometry(0.4, 6, 4);
  eyeLeft.applyMatrix4(
    new THREE.Matrix4().compose(
      new THREE.Vector3(-1.0, 2.0, 1.0),
      new THREE.Quaternion(),
      new THREE.Vector3(1, 1, 1),
    ),
  );

  const eyeRight = new THREE.SphereGeometry(0.4, 6, 4);
  eyeRight.applyMatrix4(
    new THREE.Matrix4().compose(
      new THREE.Vector3(1.0, 2.0, 1.0),
      new THREE.Quaternion(),
      new THREE.Vector3(1, 1, 1),
    ),
  );

  const eyeColor = new THREE.Color("#4ADE80");
  for (const eye of [eyeLeft, eyeRight]) {
    const count = eye.attributes.position.count;
    const cols = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      cols[i * 3 + 0] = eyeColor.r;
      cols[i * 3 + 1] = eyeColor.g;
      cols[i * 3 + 2] = eyeColor.b;
    }
    eye.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  }

  const merged = mergeGeometries([mantle, eyeLeft, eyeRight])!;
  [mantle, eyeLeft, eyeRight].forEach((g) => g.dispose());
  return merged;
})();

// ---------------------------------------------------------------------------
// Tentacle geometry: 10 merged cylinders with aWaveParams (→ 1 draw call)
// ---------------------------------------------------------------------------

/**
 * Build a single tapered cylinder tentacle and bake aWaveParams into it.
 * @param length - tentacle length
 * @param radiusTop - tip radius
 * @param radiusBottom - base radius
 * @param spread - horizontal offset from center
 * @param angle - rotation around Y axis (radians)
 * @param phase - individual wave phase for GPU sway
 */
function buildTentacle(
  length: number,
  radiusTop: number,
  radiusBottom: number,
  spread: number,
  angle: number,
  phase: number,
): THREE.BufferGeometry {
  const segments = 8; // height segments for smooth sway
  const geom = new THREE.CylinderGeometry(radiusTop, radiusBottom, length, 5, segments);

  const posAttr = geom.attributes.position as THREE.BufferAttribute;
  const count = posAttr.count;

  // hNorm: 0 at base (attached to mantle), 1 at tip — used for wave amplitude scaling
  const waveParams = new Float32Array(count * 4);

  for (let i = 0; i < count; i++) {
    const rawY = posAttr.getY(i); // range: [-length/2 .. +length/2]
    // Tentacles point upward from the mantle apex; base at bottom, tip at top.
    // hNorm = 0 at base (-length/2), 1 at tip (+length/2).
    const hNorm = (rawY + length * 0.5) / length;
    waveParams[i * 4 + 0] = phase;     // tPhase
    waveParams[i * 4 + 1] = hNorm;     // hNorm
    waveParams[i * 4 + 2] = 0;         // unused
    waveParams[i * 4 + 3] = 0;         // unused
  }
  geom.setAttribute("aWaveParams", new THREE.BufferAttribute(waveParams, 4));

  // Vertex color: black (#0C0A09)
  const col = new THREE.Color("#0C0A09");
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    colors[i * 3 + 0] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  // Position: spread around mantle base (top of mantle is at y = 10 in local space)
  // Tentacles reach upward → cylinder sits above the apex at y ~= 10
  const offsetX = Math.cos(angle) * spread;
  const offsetZ = Math.sin(angle) * spread;
  geom.applyMatrix4(
    new THREE.Matrix4().compose(
      new THREE.Vector3(offsetX, 10 + length * 0.5, offsetZ),
      new THREE.Quaternion(),
      new THREE.Vector3(1, 1, 1),
    ),
  );

  return geom;
}

const _colossalTentacleGeom = (() => {
  const parts: THREE.BufferGeometry[] = [];

  // 8 regular tentacles: length 6.0, radius 0.12→0.04
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    // Spread varies slightly per tentacle for organic look
    const spread = 0.8 + Math.sin(i * 1.3) * 0.2; // 0.8-1.0 range, clamped near 1.2 max
    const clampedSpread = Math.min(spread + 0.2 * (i % 3), 1.2);
    const phase = i * (Math.PI * 2 / 8);
    parts.push(buildTentacle(6.0, 0.04, 0.12, clampedSpread, angle, phase));
  }

  // 2 club tentacles (longer, thicker): length 8.0
  // Club tentacles positioned between regular tentacles, top pair
  for (let i = 0; i < 2; i++) {
    const angle = (i / 2) * Math.PI * 2 + Math.PI * 0.25;
    const phase = i * Math.PI + 0.4;
    parts.push(buildTentacle(8.0, 0.015, 0.04, 0.6, angle, phase));
  }

  const merged = mergeGeometries(parts)!;
  parts.forEach((g) => g.dispose());
  return merged;
})();

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

// Body material: MeshStandardMaterial with vertex colors + eye glow
const _colossalBodyMat = new THREE.MeshStandardMaterial({
  vertexColors: true,
  emissive: "#4ADE80",
  emissiveIntensity: 0.3,
  roughness: 0.7,
  transparent: true,
  opacity: 0.8,
});

// Tentacle material: MeshBasicMaterial with GPU sway via onBeforeCompile
const _tentacleTimeUniform = { value: 0 };

const _colossalTentacleMat = (() => {
  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
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
    float hNorm  = aWaveParams.y;
    float amp    = hNorm * hNorm * 0.6;
    float wave   = sin(uTime * 0.5 + tPhase + hNorm * 2.5);
    transformed.x += wave * amp;
    transformed.z += wave * amp * 0.4;`,
    );
  };
  mat.customProgramCacheKey = () => "colossal-tentacle";

  return mat;
})();

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ColossalSquid() {
  const groupRef = useRef<THREE.Group>(null);
  const frameCountRef = useRef(0);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    const camY = cameraYRef.current;

    // Visibility: only show when camera is deep enough (camY < -28)
    // Fade in with clamp((-28 - camY) / 5, 0, 1)
    const opacity = Math.min(Math.max((-28 - camY) / 5, 0), 1);

    if (opacity <= 0) {
      group.visible = false;
      return;
    }
    group.visible = true;

    // Skip every other frame for performance
    frameCountRef.current++;
    if (frameCountRef.current % 2 !== 0) return;

    const t = clock.getElapsedTime();

    // Apply opacity to both materials
    _colossalBodyMat.opacity = 0.8 * opacity;
    _colossalTentacleMat.opacity = 0.5 * opacity;

    // Nearly stationary — very slow vertical drift
    const y = BASE_Y + Math.sin(t * 0.06) * 1.0;
    group.position.set(BASE_X, y, BASE_Z);

    // Eye glow pulse: oscillate emissive intensity between 0.2 and 0.5
    _colossalBodyMat.emissiveIntensity = 0.2 + Math.sin(t * 0.4) * 0.15;

    // Update tentacle GPU sway time
    _tentacleTimeUniform.value = t;
  });

  return (
    <group ref={groupRef}>
      {/* Draw call 1: merged mantle + 2 eyes */}
      <mesh
        geometry={_colossalBodyGeom}
        material={_colossalBodyMat}
        frustumCulled={false}
      />
      {/* Draw call 2: merged 10 tentacles with GPU sway */}
      <mesh
        geometry={_colossalTentacleGeom}
        material={_colossalTentacleMat}
        frustumCulled={false}
        renderOrder={500}
      />
    </group>
  );
}
