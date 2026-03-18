"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cameraYRef } from "./OceanEnvironment";

// ---------------------------------------------------------------------------
// Swordfish config
// ---------------------------------------------------------------------------

const SWORDFISH_CONFIGS = [
  { baseX: -8, baseY: -8, baseZ: -6, speed: 0.4, range: 15, phase: 0 },
  { baseX: 6, baseY: -10, baseZ: -4, speed: 0.35, range: 12, phase: Math.PI },
] as const;

const SWORDFISH_COUNT = SWORDFISH_CONFIGS.length;

// ---------------------------------------------------------------------------
// Geometry — built once at module load
// ---------------------------------------------------------------------------

const _swordfishGeom = (() => {
  // 1. Body — LatheGeometry with sleek swordfish profile
  const lathePoints = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.03,  0.1),
    new THREE.Vector2(0.08,  0.2),
    new THREE.Vector2(0.12,  0.4),
    new THREE.Vector2(0.1,   0.6),
    new THREE.Vector2(0.06,  0.8),
    new THREE.Vector2(0.03,  0.9),
    new THREE.Vector2(0.001, 1.0),
  ];
  const bodyGeom = new THREE.LatheGeometry(lathePoints, 6);
  // Scale: elongated along Z, Y is the lathe axis (maps to body length)
  bodyGeom.applyMatrix4(
    new THREE.Matrix4().makeScale(1, 3, 1)
  );
  // Rotate so the body points along +Z (forward)
  // LatheGeometry is built along Y; rotate -90° around X so body points along +Z
  bodyGeom.applyMatrix4(
    new THREE.Matrix4().makeRotationX(-Math.PI / 2)
  );
  // Center body along Z so it spans roughly [-1.5, 1.5]
  bodyGeom.computeBoundingBox();
  const bb = bodyGeom.boundingBox!;
  const centerZ = (bb.min.z + bb.max.z) / 2;
  bodyGeom.translate(0, 0, -centerZ);

  // 2. Sword/bill — ConeGeometry pointing forward (+Z)
  const swordGeom = new THREE.ConeGeometry(0.015, 0.8, 4);
  // ConeGeometry points along +Y; rotate -90° around X to point along +Z
  swordGeom.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  // Recompute bounding box for body to find snout tip position
  bodyGeom.computeBoundingBox();
  const snoutZ = bodyGeom.boundingBox!.max.z;
  // Position tip so it extends forward from the snout
  swordGeom.translate(0, 0, snoutZ + 0.4);

  // 3. Dorsal fin — tall sail, on top of body
  const dorsalGeom = new THREE.PlaneGeometry(0.15, 0.4);
  dorsalGeom.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  // Rotate 90° around Z so it stands vertically (height along Y)
  dorsalGeom.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2));
  // Place it on top, toward front-center
  const bodyMaxY = 0.12; // approximate half-thickness at center
  dorsalGeom.translate(0, bodyMaxY + 0.2, -0.3);

  // 4. Tail fin — forked, vertical, at rear
  const tailGeom = new THREE.PlaneGeometry(0.25, 0.15);
  // Stand it vertical (default plane is XY, which is correct for a vertical fin)
  bodyGeom.computeBoundingBox();
  const tailZ = bodyGeom.boundingBox!.min.z;
  tailGeom.translate(0, 0, tailZ - 0.05);

  // 5. Pectoral fins — one each side
  const pectoralLGeom = new THREE.PlaneGeometry(0.1, 0.06);
  // Tilt slightly downward
  pectoralLGeom.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.3));
  pectoralLGeom.translate(-0.14, 0, -0.1);

  const pectoralRGeom = new THREE.PlaneGeometry(0.1, 0.06);
  pectoralRGeom.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.3));
  pectoralRGeom.translate(0.14, 0, -0.1);

  // Apply DoubleSide-friendly normal computation before merge
  dorsalGeom.computeVertexNormals();
  tailGeom.computeVertexNormals();
  pectoralLGeom.computeVertexNormals();
  pectoralRGeom.computeVertexNormals();

  // Merge all parts
  const merged = mergeGeometries([
    bodyGeom,
    swordGeom,
    dorsalGeom,
    tailGeom,
    pectoralLGeom,
    pectoralRGeom,
  ])!;

  // Vertex colors based on Y position (dorsal = dark blue, mid = silver, ventral = white)
  merged.computeBoundingBox();
  const mergedBB = merged.boundingBox!;
  const minY = mergedBB.min.y;
  const maxY = mergedBB.max.y;
  const yRange = maxY - minY || 1;

  const posAttr = merged.attributes.position as THREE.BufferAttribute;
  const colorArr = new Float32Array(posAttr.count * 3);
  const topColor    = new THREE.Color("#1E3A5F"); // dark blue
  const midColor    = new THREE.Color("#CBD5E1"); // silver
  const bottomColor = new THREE.Color("#F1F5F9"); // white
  const tmp = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const y = posAttr.getY(i);
    const t = (y - minY) / yRange; // 0 = bottom, 1 = top
    if (t >= 0.5) {
      // Top half: silver → dark blue
      tmp.copy(midColor).lerp(topColor, (t - 0.5) * 2);
    } else {
      // Bottom half: white → silver
      tmp.copy(bottomColor).lerp(midColor, t * 2);
    }
    colorArr[i * 3]     = tmp.r;
    colorArr[i * 3 + 1] = tmp.g;
    colorArr[i * 3 + 2] = tmp.b;
  }

  merged.setAttribute("color", new THREE.Float32BufferAttribute(colorArr, 3));
  merged.computeVertexNormals();

  // Dispose temporaries
  [bodyGeom, swordGeom, dorsalGeom, tailGeom, pectoralLGeom, pectoralRGeom].forEach((g) =>
    g.dispose()
  );

  return merged;
})();

// ---------------------------------------------------------------------------
// Shared material
// ---------------------------------------------------------------------------

const _swordfishMat = new THREE.MeshPhongMaterial({
  vertexColors: true,
  emissive: "#1E3A5F",
  emissiveIntensity: 0.15,
  shininess: 80,
  transparent: true,
  opacity: 0.9,
  side: THREE.DoubleSide,
});

// ---------------------------------------------------------------------------
// Hoisted reusable objects — zero GC per frame
// ---------------------------------------------------------------------------

const _sfMatrix  = new THREE.Matrix4();
const _sfQuat    = new THREE.Quaternion();
const _sfEuler   = new THREE.Euler();
const _sfPos     = new THREE.Vector3();
const _sfScale   = new THREE.Vector3(1, 1, 1);

// ---------------------------------------------------------------------------
// Swordfish component (InstancedMesh, 2 instances)
// ---------------------------------------------------------------------------

export default function Swordfish() {
  const meshRef    = useRef<THREE.InstancedMesh>(null);
  const frameCount = useRef(0);

  // Per-instance previous positions for heading calculation
  const prevPositions = useMemo(
    () => Array.from({ length: SWORDFISH_COUNT }, () => new THREE.Vector3()),
    []
  );
  const initialized = useRef(false);

  useFrame(({ clock }, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Visibility: twilight zone depth
    const camY = cameraYRef.current;
    const visible = camY < -4 && camY > -16;

    // Fade opacity by depth proximity to edges
    if (visible) {
      const fadeIn  = Math.min(1, (-4 - camY) / 2);   // 0→1 as camY goes from -4 to -6
      const fadeOut = Math.min(1, (camY + 16) / 2);    // 0→1 as camY goes from -16 to -14
      _swordfishMat.opacity = Math.min(fadeIn, fadeOut) * 0.9;
    }

    mesh.visible = visible;
    if (!visible) return;

    // Frame-skip: update every 2nd frame (fast fish, imperceptible at 30fps update)
    frameCount.current++;
    if (frameCount.current % 2 !== 0) return;

    const time = clock.getElapsedTime();

    for (let i = 0; i < SWORDFISH_COUNT; i++) {
      const cfg = SWORDFISH_CONFIGS[i];

      // Fast linear swim path with sinusoidal weaving
      const x = cfg.baseX + Math.sin(time * cfg.speed + cfg.phase) * cfg.range;
      const y = cfg.baseY + Math.sin(time * cfg.speed * 0.6 + cfg.phase + 1.0) * 1.5;
      const z = cfg.baseZ + Math.cos(time * cfg.speed * 0.8 + cfg.phase) * cfg.range * 0.5;

      _sfPos.set(x, y, z);

      // Heading + banking rotation (same pattern as MantaRay)
      if (initialized.current) {
        const prev = prevPositions[i];
        const dx = x - prev.x;
        const dz = z - prev.z;

        if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001) {
          const heading      = Math.atan2(dx, dz);
          const headingDelta = heading - _sfEuler.y;
          _sfEuler.set(0, heading, -headingDelta * 0.3);
          _sfQuat.setFromEuler(_sfEuler);
        }
      }

      prevPositions[i].set(x, y, z);

      _sfMatrix.compose(_sfPos, _sfQuat, _sfScale);
      mesh.setMatrixAt(i, _sfMatrix);
    }

    initialized.current = true;
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[_swordfishGeom, _swordfishMat, SWORDFISH_COUNT]}
      frustumCulled={false}
      renderOrder={410}
    />
  );
}
