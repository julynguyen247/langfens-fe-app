"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cameraYRef } from "../OceanEnvironment";

// ---------------------------------------------------------------------------
// Sub-component 1: SeaTurtle
// ---------------------------------------------------------------------------

interface SeaTurtleProps {
  index: number;
}

const TURTLE_CONFIGS = [
  { baseY: -3, centerX: 5, centerZ: -3, offset: 0, visibleWhen: (camY: number) => camY < 0 && camY > -10 },
  { baseY: -5, centerX: -6, centerZ: 2, offset: Math.PI, visibleWhen: (camY: number) => camY < -2 && camY > -10 },
] as const;

// Precomputed geometries shared across turtle instances
const _shellDomeGeom = new THREE.SphereGeometry(0.55, 10, 6);

const _shellRimGeom = new THREE.TorusGeometry(0.58, 0.06, 4, 12);

const _centralScuteGeom = new THREE.BoxGeometry(0.12, 0.06, 0.7);

const _lateralScuteGeom = new THREE.BoxGeometry(0.25, 0.04, 0.5);

const _plastronGeom = new THREE.CircleGeometry(0.5, 8);

const _headGeom = new THREE.SphereGeometry(0.16, 8, 5);

const _beakGeom = new THREE.ConeGeometry(0.06, 0.1, 5);

const _eyeScleraGeom = new THREE.SphereGeometry(0.045, 4, 3);

const _eyePupilGeom = new THREE.SphereGeometry(0.025, 4, 2);

// Paddle-shaped flippers (PlaneGeometry, DoubleSide) — more anatomical than cones
const _frontFlipperGeom = (() => {
  const geom = new THREE.PlaneGeometry(0.55, 0.18, 3, 1);
  // Taper tip end
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    if (x > 0) pos.setY(i, pos.getY(i) * (1 - (x / 0.275) * 0.5));
  }
  geom.computeVertexNormals();
  return geom;
})();

const _rearFlipperGeom = (() => {
  const geom = new THREE.PlaneGeometry(0.3, 0.14, 2, 1);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    if (x > 0) pos.setY(i, pos.getY(i) * (1 - (x / 0.15) * 0.4));
  }
  geom.computeVertexNormals();
  return geom;
})();

const _tailGeom = new THREE.ConeGeometry(0.06, 0.2, 4);

// Pre-merged turtle geometries (reduces draw calls)
// Merge shell: dome + rim + central scute + 2 lateral scutes (5→1 DC)
const _mergedShellGeom = (() => {
  const dome = _shellDomeGeom.clone();
  dome.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(0, 0.12, 0), new THREE.Quaternion(), new THREE.Vector3(1.1, 0.55, 1.3),
  ));
  const rim = _shellRimGeom.clone();
  rim.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(0, 0.04, 0.05),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)),
    new THREE.Vector3(1.1, 0.5, 1.3),
  ));
  const central = _centralScuteGeom.clone();
  central.translate(0, 0.38, 0);
  const latL = _lateralScuteGeom.clone();
  latL.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(-0.22, 0.34, 0),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.15)),
    new THREE.Vector3(1, 1, 1),
  ));
  const latR = _lateralScuteGeom.clone();
  latR.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(0.22, 0.34, 0),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.15)),
    new THREE.Vector3(1, 1, 1),
  ));
  const merged = mergeGeometries([dome, rim, central, latL, latR])!;
  [dome, rim, central, latL, latR].forEach((g) => g.dispose());
  return merged;
})();

// Merge neck + tail (both skinMat) → 2 DC → 1 DC
const _neckGeom = new THREE.CylinderGeometry(0.08, 0.12, 0.15, 6);

const _mergedNeckTailGeom = (() => {
  const neck = _neckGeom.clone();
  neck.translate(0, 0.02, 0.72);
  const tail = _tailGeom.clone();
  tail.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(0, -0.02, -0.7),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)),
    new THREE.Vector3(1, 0.5, 1),
  ));
  const merged = mergeGeometries([neck, tail])!;
  [neck, tail].forEach((g) => g.dispose());
  return merged;
})();

// Merge head + beak in animated head group (2→1 DC)
const _mergedHeadGeom = (() => {
  const head = _headGeom.clone();
  head.scale(0.85, 0.8, 1.4);
  const beak = _beakGeom.clone();
  beak.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(0, -0.06, 0.22),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2 - 0.3, 0, 0)),
    new THREE.Vector3(1.2, 0.6, 1),
  ));
  const merged = mergeGeometries([head, beak])!;
  [head, beak].forEach((g) => g.dispose());
  return merged;
})();

// Merge eye scleras in head group (2→1 DC)
const _mergedTurtleEyeScleraGeom = (() => {
  const left = _eyeScleraGeom.clone();
  left.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(-0.13, 0.04, 0.06),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.4, 0)),
    new THREE.Vector3(1, 1, 1),
  ));
  const right = _eyeScleraGeom.clone();
  right.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(0.13, 0.04, 0.06),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.4, 0)),
    new THREE.Vector3(1, 1, 1),
  ));
  const merged = mergeGeometries([left, right])!;
  [left, right].forEach((g) => g.dispose());
  return merged;
})();

// Merge eye pupils in head group (2→1 DC)
const _mergedTurtleEyePupilGeom = (() => {
  const left = _eyePupilGeom.clone();
  left.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(-0.14, 0.04, 0.09),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.4, 0)),
    new THREE.Vector3(1, 1, 1),
  ));
  const right = _eyePupilGeom.clone();
  right.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(0.14, 0.04, 0.09),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.4, 0)),
    new THREE.Vector3(1, 1, 1),
  ));
  const merged = mergeGeometries([left, right])!;
  [left, right].forEach((g) => g.dispose());
  return merged;
})();

// Materials shared across turtles
const _shellMat = new THREE.MeshStandardMaterial({ color: "#15803d", roughness: 0.55, metalness: 0.05, emissive: "#15803d", emissiveIntensity: 0.15 });

const _skinMat = new THREE.MeshStandardMaterial({ color: "#059669", roughness: 0.5, emissive: "#059669", emissiveIntensity: 0.12, side: THREE.DoubleSide });

const _plastronMat = new THREE.MeshStandardMaterial({ color: "#FEF3C7", roughness: 0.6, emissive: "#FEF3C7", emissiveIntensity: 0.05, side: THREE.DoubleSide });

const _turtleEyeWhiteMat = new THREE.MeshBasicMaterial({ color: "#FFFFFF" });

const _turtleEyePupilMat = new THREE.MeshBasicMaterial({ color: "#1E293B" });

export function SeaTurtle({ index }: SeaTurtleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const frontLeftRef = useRef<THREE.Group>(null);
  const frontRightRef = useRef<THREE.Group>(null);
  const rearLeftRef = useRef<THREE.Group>(null);
  const rearRightRef = useRef<THREE.Group>(null);

  const config = TURTLE_CONFIGS[index];
  const prevPos = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    const time = clock.getElapsedTime();
    const visible = config.visibleWhen(cameraYRef.current);
    group.visible = visible;
    if (!visible) return;

    // Elliptical swimming path
    const strokeCycle = time * 1.2;
    const strokePhase = strokeCycle % (Math.PI * 2);
    const x = config.centerX + Math.sin(time * 0.15 + config.offset) * 12;
    const y = config.baseY + Math.sin(time * 0.2 + config.offset) * 2 + Math.sin(strokePhase) * 0.08;
    const z = config.centerZ + Math.cos(time * 0.15 + config.offset) * 8;
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

    // Body undulation
    group.rotation.x = Math.sin(strokePhase + Math.PI * 0.25) * 0.04;
    group.rotation.z = Math.sin(strokePhase * 0.5) * 0.02;

    // Front flippers: asymmetric stroke (fast down, slow up)
    const frontStroke = Math.sin(strokePhase);
    const downPower = frontStroke > 0 ? frontStroke * 1.0 : frontStroke * 0.5;
    if (frontLeftRef.current) {
      frontLeftRef.current.rotation.z = -downPower * 0.5;
      frontLeftRef.current.rotation.x = Math.cos(strokePhase) * 0.15;
    }
    if (frontRightRef.current) {
      frontRightRef.current.rotation.z = downPower * 0.5;
      frontRightRef.current.rotation.x = Math.cos(strokePhase) * 0.15;
    }

    // Rear flippers: counter-phase stabilizers
    const rearPhase = strokeCycle + Math.PI * 0.5;
    const rearStroke = Math.sin(rearPhase) * 0.25;
    if (rearLeftRef.current) {
      rearLeftRef.current.rotation.x = rearStroke;
      rearLeftRef.current.rotation.z = Math.sin(rearPhase * 0.5) * 0.1;
    }
    if (rearRightRef.current) {
      rearRightRef.current.rotation.x = rearStroke;
      rearRightRef.current.rotation.z = -Math.sin(rearPhase * 0.5) * 0.1;
    }

    // Head look-around
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(time * 0.4) * 0.15;
      headRef.current.rotation.x = Math.sin(time * 0.6) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Merged shell: dome + rim + scutes (5→1 DC) */}
      <mesh geometry={_mergedShellGeom} material={_shellMat} />
      {/* Plastron (belly) */}
      <mesh geometry={_plastronGeom} material={_plastronMat} position={[0, -0.08, 0.05]} scale={[1.1, 1, 1.3]} rotation={[Math.PI / 2, 0, 0]} />
      {/* Merged neck + tail (2→1 DC) */}
      <mesh geometry={_mergedNeckTailGeom} material={_skinMat} />

      {/* Head — animated */}
      <group ref={headRef} position={[0, 0.06, 0.85]}>
        {/* Merged head + beak (2→1 DC) */}
        <mesh geometry={_mergedHeadGeom} material={_skinMat} />
        {/* Merged eyes (4→2 DC) */}
        <mesh geometry={_mergedTurtleEyeScleraGeom} material={_turtleEyeWhiteMat} />
        <mesh geometry={_mergedTurtleEyePupilGeom} material={_turtleEyePupilMat} />
      </group>

      {/* Flippers — animated */}
      <group ref={frontLeftRef} position={[-0.5, -0.04, 0.35]} rotation={[0, -0.3, 0]}>
        <mesh geometry={_frontFlipperGeom} material={_skinMat} position={[-0.22, 0, 0]} />
      </group>
      <group ref={frontRightRef} position={[0.5, -0.04, 0.35]} rotation={[0, 0.3, 0]}>
        <mesh geometry={_frontFlipperGeom} material={_skinMat} position={[0.22, 0, 0]} rotation={[0, Math.PI, 0]} />
      </group>
      <group ref={rearLeftRef} position={[-0.4, -0.06, -0.45]} rotation={[0, -0.5, 0]}>
        <mesh geometry={_rearFlipperGeom} material={_skinMat} position={[-0.1, 0, 0]} />
      </group>
      <group ref={rearRightRef} position={[0.4, -0.06, -0.45]} rotation={[0, 0.5, 0]}>
        <mesh geometry={_rearFlipperGeom} material={_skinMat} position={[0.1, 0, 0]} rotation={[0, Math.PI, 0]} />
      </group>
    </group>
  );
}
