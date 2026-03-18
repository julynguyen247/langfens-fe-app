"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cameraYRef } from "./OceanEnvironment";

const ISOPOD_COUNT = 2;

// Module-level scratch objects — allocated once, reused every frame
const _yAxis = new THREE.Vector3(0, 1, 0);
const _matrix = new THREE.Matrix4();
const _position = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);

const ISOPOD_CONFIGS = [
  { baseX: -3, baseZ: -5, speed: 0.03, heading: 0.5 },
  { baseX: 5, baseZ: -8, speed: 0.025, heading: 2.0 },
] as const;

// ---------------------------------------------------------------------------
// Merged geometry — built once at module level, shared across instances
// ---------------------------------------------------------------------------

const _isopodGeom = (() => {
  const parts: THREE.BufferGeometry[] = [];

  // ── Body segments ──────────────────────────────────────────────────────────
  // 7 flattened spheres: head → 5 mid segments → tail
  const segmentDefs = [
    { radius: 0.18, z: 0.00 },   // head
    { radius: 0.16, z: 0.22 },   // seg 1
    { radius: 0.15, z: 0.42 },   // seg 2
    { radius: 0.14, z: 0.60 },   // seg 3
    { radius: 0.13, z: 0.77 },   // seg 4
    { radius: 0.12, z: 0.92 },   // seg 5
    { radius: 0.08, z: 1.04 },   // tail
  ];

  const bodyColor = new THREE.Color("#57534E");
  const ventralColor = new THREE.Color("#78716C");

  for (const { radius, z } of segmentDefs) {
    const seg = new THREE.SphereGeometry(radius, 6, 4);

    // Flatten on Y (dorso-ventral compression)
    seg.applyMatrix4(new THREE.Matrix4().makeScale(1, 0.6, 1));
    seg.translate(0, 0, z);

    // Vertex colors — lighter on ventral (bottom) vertices
    const posAttr = seg.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(posAttr.count * 3);
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      // Below body center = ventral = lighter
      const c = y < -0.02 ? ventralColor : bodyColor;
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    seg.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    parts.push(seg);
  }

  // ── Antennae ───────────────────────────────────────────────────────────────
  // 2 thin cylinders at front (head end, Z≈0), angled outward
  const antennaColor = new THREE.Color("#44403C");

  const antennaLeft = new THREE.CylinderGeometry(0.005, 0.003, 0.4, 3);
  antennaLeft.applyMatrix4(
    new THREE.Matrix4().compose(
      new THREE.Vector3(-0.14, 0.04, -0.22),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2 + 0.3, 0, -0.4)),
      new THREE.Vector3(1, 1, 1)
    )
  );
  {
    const posAttr = antennaLeft.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(posAttr.count * 3);
    colors.fill(0); // will set below
    for (let i = 0; i < posAttr.count; i++) {
      colors[i * 3]     = antennaColor.r;
      colors[i * 3 + 1] = antennaColor.g;
      colors[i * 3 + 2] = antennaColor.b;
    }
    antennaLeft.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }
  parts.push(antennaLeft);

  const antennaRight = new THREE.CylinderGeometry(0.005, 0.003, 0.4, 3);
  antennaRight.applyMatrix4(
    new THREE.Matrix4().compose(
      new THREE.Vector3(0.14, 0.04, -0.22),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2 + 0.3, 0, 0.4)),
      new THREE.Vector3(1, 1, 1)
    )
  );
  {
    const posAttr = antennaRight.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(posAttr.count * 3);
    for (let i = 0; i < posAttr.count; i++) {
      colors[i * 3]     = antennaColor.r;
      colors[i * 3 + 1] = antennaColor.g;
      colors[i * 3 + 2] = antennaColor.b;
    }
    antennaRight.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }
  parts.push(antennaRight);

  // ── Legs ───────────────────────────────────────────────────────────────────
  // 7 pairs of legs (14 PlaneGeometries), one pair per body segment
  // Positioned along the sides, angled downward
  const legColor = new THREE.Color("#292524");

  for (let pair = 0; pair < 7; pair++) {
    const segZ = segmentDefs[pair].z;
    const segR = segmentDefs[pair].radius;

    for (const side of [-1, 1]) {
      const leg = new THREE.PlaneGeometry(0.08, 0.02);
      leg.applyMatrix4(
        new THREE.Matrix4().compose(
          new THREE.Vector3(side * (segR + 0.03), -0.06, segZ),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, side * 0.5)),
          new THREE.Vector3(1, 1, 1)
        )
      );

      const posAttr = leg.attributes.position as THREE.BufferAttribute;
      const colors = new Float32Array(posAttr.count * 3);
      for (let i = 0; i < posAttr.count; i++) {
        colors[i * 3]     = legColor.r;
        colors[i * 3 + 1] = legColor.g;
        colors[i * 3 + 2] = legColor.b;
      }
      leg.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      parts.push(leg);
    }
  }

  const merged = mergeGeometries(parts, false)!;
  parts.forEach((g) => g.dispose());

  // Center body roughly — tail end at +Z, head at 0
  merged.translate(0, 0, -0.52);

  return merged;
})();

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GiantIsopod() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const frameCounter = useRef(0);

  // Shared time uniform for GPU leg animation
  const timeUniform = useMemo(() => ({ value: 0 }), []);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      emissive: new THREE.Color("#333333"),
      emissiveIntensity: 0.2,
      roughness: 0.85,
      metalness: 0.05,
    });

    // GPU leg animation — only vertices below body center (legs / ventral)
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = timeUniform;
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        `uniform float uTime;\nvoid main() {`
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        // Only animate vertices below body center (legs)
        if (transformed.y < -0.05) {
          float legPhase = transformed.z * 8.0; // phase varies by Z position
          transformed.y += sin(uTime * 2.0 + legPhase) * 0.02;
          transformed.x += sin(uTime * 2.0 + legPhase + 1.57) * 0.01;
        }`
      );
    };
    mat.customProgramCacheKey = () => "isopod-legs";

    return mat;
  }, [timeUniform]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Visibility: only visible in abyss zone (camY < -30), fade in over 5 units
    const camY = cameraYRef.current;
    const opacity = Math.min(Math.max((-30 - camY) / 5, 0), 1);
    const visible = opacity > 0;

    mesh.visible = visible;
    if (!visible) return;

    // Frame-skip: update every 3rd frame (isopods move very slowly)
    frameCounter.current++;
    if (frameCounter.current % 3 !== 0) {
      // Still update time uniform every frame for smooth GPU animation
      timeUniform.value = clock.getElapsedTime();
      return;
    }

    const t = clock.getElapsedTime();
    timeUniform.value = t;

    for (let i = 0; i < ISOPOD_COUNT; i++) {
      const cfg = ISOPOD_CONFIGS[i];

      // Very slow crawl pattern: elliptical path on ocean floor
      const x = cfg.baseX + Math.sin(t * cfg.speed) * 3;
      const z = cfg.baseZ + Math.cos(t * cfg.speed) * 2;
      const y = -39; // just above ocean floor at Y=-42

      _position.set(x, y, z);

      // Heading: face the direction of movement
      const dx = Math.cos(t * cfg.speed) * 3 * cfg.speed;
      const dz = -Math.sin(t * cfg.speed) * 2 * cfg.speed;
      const angle = Math.atan2(dx, dz) + cfg.heading;
      _quaternion.setFromAxisAngle(_yAxis, angle);

      _matrix.compose(_position, _quaternion, _scale);
      mesh.setMatrixAt(i, _matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    // Sync material opacity with fade
    if (mat.opacity !== opacity) {
      mat.transparent = opacity < 1;
      mat.opacity = opacity;
    }
  });

  // Reference to material for opacity sync inside useFrame
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mat = material;

  return (
    <instancedMesh
      ref={meshRef}
      args={[_isopodGeom, material, ISOPOD_COUNT]}
      frustumCulled={false}
      renderOrder={510}
    />
  );
}
