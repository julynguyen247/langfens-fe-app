"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { DeviceTier } from "@/app/components/effects/useDeviceCapability";
import { cameraYRef } from "./OceanEnvironment";

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

function SeaTurtle({ index }: SeaTurtleProps) {
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

// ---------------------------------------------------------------------------
// Sub-component 2: MantaRay
// ---------------------------------------------------------------------------

// Generate manta ray body — concave front edge, pointed wing tips, airfoil thickness
function generateMantaBody(): THREE.BufferGeometry {
  const cols = 13; // U spanwise
  const rows = 9;  // V chordwise (increased for curved front edge)
  const halfSpan = 2.0;
  const bodyLength = 2.5;

  // Width profile: concave front (scooped leading edge), widest at 25%
  const widthCurve = [0.05, 0.25, 0.7, 1.0, 0.85, 0.55, 0.25, 0.08, 0.02];

  const vertices: number[] = [];
  const indices: number[] = [];
  const uCoords: number[] = [];
  const colors: number[] = [];

  const dorsalColor = new THREE.Color("#1e3a5f");
  const ventralColor = new THREE.Color("#c0d1e0");
  const tempColor = new THREE.Color();

  for (let row = 0; row < rows; row++) {
    const v = row / (rows - 1); // 0..1 nose to tail
    const width = widthCurve[row];

    for (let col = 0; col < cols; col++) {
      const u = (col / (cols - 1)) * 2 - 1; // -1..1 left to right
      const x = u * width * halfSpan;

      // Front edge curves forward at center (concave scooped leading edge)
      const frontCurve = row < 3 ? (1 - Math.abs(u)) * 0.3 * (1 - row / 3) : 0;
      const z = (v - 0.25) * bodyLength - frontCurve;

      // Thicker camber (airfoil cross-section)
      const camber = (1 - u * u) * 0.22 * Math.sin(v * Math.PI);
      // Wing droop at tips (cubic for smooth rolloff)
      const droop = -(Math.abs(u) ** 3) * 0.1;
      // Sharper wing tip sweep
      const sweep = (Math.abs(u) ** 1.5) * 0.5;
      const y = camber + droop;

      vertices.push(x, y, z + sweep);
      uCoords.push(u);

      // Vertex colors: edges lighter (ventral), center dark (dorsal)
      const edgeFactor = Math.abs(u);
      tempColor.copy(dorsalColor).lerp(ventralColor, edgeFactor * 0.4);
      colors.push(tempColor.r, tempColor.g, tempColor.b);
    }
  }

  // Build triangle indices
  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < cols - 1; col++) {
      const a = row * cols + col;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute("aUCoord", new THREE.Float32BufferAttribute(uCoords, 1));
  geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

// Precomputed manta geometries
const _mantaBodyGeom = generateMantaBody();
const _cephalicFinGeom = new THREE.ConeGeometry(0.08, 0.5, 4);
const _mantaTailGeom = new THREE.CylinderGeometry(0.03, 0.005, 2.0, 4, 4);
// Mouth opening — dark recessed area at front of body
const _mantaMouthGeom = new THREE.PlaneGeometry(0.35, 0.08);

function MantaRay() {
  const groupRef = useRef<THREE.Group>(null);
  const prevPos = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  const timeUniform = useMemo(() => ({ value: 0 }), []);

  const bodyMaterial = useMemo(() => {
    const mat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      emissive: "#1e3a5f",
      emissiveIntensity: 0.15,
      shininess: 60,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    // GPU wing undulation via onBeforeCompile
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = timeUniform;
      shader.vertexShader = "attribute float aUCoord;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `#include <common>
        uniform float uTime;`
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float absU = abs(aUCoord);
        // Progressive wave: center still, tips flap
        float amplitude = absU * absU * 0.6;
        float phase = uTime * 2.0 - absU * 1.5;
        float wave = sin(phase) * amplitude;
        // Tip twist for rowing motion
        float twist = sin(uTime * 2.0 - absU * 2.0) * absU * absU * 0.15;
        transformed.y += wave;
        transformed.z += twist * sign(aUCoord);`
      );
    };
    mat.customProgramCacheKey = () => "manta-undulate";
    return mat;
  }, [timeUniform]);

  const skinMat = useMemo(
    () => new THREE.MeshPhongMaterial({
      color: "#1e3a5f",
      emissive: "#1e3a5f",
      emissiveIntensity: 0.15,
      shininess: 40,
    }),
    []
  );

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const time = clock.getElapsedTime();
    const camY = cameraYRef.current;
    const visible = camY < -6 && camY > -16;
    group.visible = visible;
    if (!visible) return;

    // Lissajous swim path (non-repeating)
    const x = Math.sin(time * 0.1) * 15;
    const y = -10 + Math.sin(time * 0.2) * 1.5;
    const z = Math.cos(time * 0.07) * 10;
    group.position.set(x, y, z);

    // Heading + banking
    if (initialized.current) {
      const dx = x - prevPos.current.x;
      const dz = z - prevPos.current.z;
      if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001) {
        const targetY = Math.atan2(dx, dz);
        group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetY, delta * 3);
        // Bank into turns
        const headingDelta = targetY - group.rotation.y;
        group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, -headingDelta * 0.3, delta * 3);
      }
    }
    prevPos.current.set(x, y, z);
    initialized.current = true;

    timeUniform.value = time;
  });

  return (
    <group ref={groupRef}>
      {/* Diamond body with GPU wing undulation */}
      <mesh geometry={_mantaBodyGeom} material={bodyMaterial} />

      {/* Mouth — wide dark frontal opening */}
      <mesh geometry={_mantaMouthGeom} position={[0, -0.03, -0.65]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#020208" side={THREE.DoubleSide} />
      </mesh>

      {/* Left cephalic fin */}
      <mesh
        geometry={_cephalicFinGeom}
        material={skinMat}
        position={[-0.2, 0.05, -0.75]}
        rotation={[Math.PI * 0.6, 0.15, -0.3]}
      />
      {/* Right cephalic fin */}
      <mesh
        geometry={_cephalicFinGeom}
        material={skinMat}
        position={[0.2, 0.05, -0.75]}
        rotation={[Math.PI * 0.6, -0.15, 0.3]}
      />

      {/* Tail */}
      <mesh
        geometry={_mantaTailGeom}
        material={skinMat}
        position={[0, -0.02, 1.75]}
        rotation={[-Math.PI / 2 + 0.1, 0, 0]}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Sub-component 3: FishSchool (InstancedMesh)
// ---------------------------------------------------------------------------

interface FishSchoolProps {
  schoolIndex: number;
}

const SCHOOL_CONFIGS = [
  { speed: 0.25, range: 10, offset: 0, baseY: -3, baseZ: -4, spread: 2.5, color: "#60a5fa" },
  { speed: 0.2, range: 8, offset: Math.PI * 0.7, baseY: -5, baseZ: 2, spread: 2.0, color: "#34d399" },
  { speed: 0.3, range: 12, offset: Math.PI * 1.4, baseY: -7, baseZ: -6, spread: 3.0, color: "#f472b6" },
] as const;

const FISH_COUNT = 25;

// Reusable objects for FishSchool — hoisted to avoid GC pressure (225 allocs/frame → 0)
const _fishUpAxis = new THREE.Vector3(0, 1, 0);
const _fishPos = new THREE.Vector3();
const _fishScale = new THREE.Vector3(1, 1, 1);

function FishSchool({ schoolIndex }: FishSchoolProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // 3D fish geometry: diamond body + forked tail + dorsal fin + pectoral fin
  const fishGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Body diamond (6 verts)
      0, 0, 0.08,          // 0: nose
      0, 0.03, 0,          // 1: top
      0, -0.03, 0,         // 2: bottom
      0.035, 0, 0,         // 3: right
      -0.035, 0, 0,        // 4: left
      0, 0, -0.05,         // 5: tail-base
      // Tail fork (4 verts)
      0.025, 0.035, -0.10, // 6: fork top-right
      0.025, -0.035, -0.10,// 7: fork bottom-right
      -0.025, 0.035, -0.10,// 8: fork top-left
      -0.025, -0.035, -0.10,// 9: fork bottom-left
      // Dorsal fin (3 verts)
      0, 0.03, 0.02,       // 10: fin front
      0, 0.065, -0.01,     // 11: fin tip
      0, 0.03, -0.03,      // 12: fin back
      // Pectoral fin right (3 verts)
      0.035, 0, 0.015,     // 13: pec front
      0.055, -0.015, 0,    // 14: pec tip
      0.035, 0, -0.015,    // 15: pec back
    ]);
    const indices = new Uint16Array([
      // Body front: upper-right, lower-right, upper-left, lower-left
      0, 1, 3,  0, 3, 2,  0, 4, 1,  0, 2, 4,
      // Body rear: upper-right, lower-right, upper-left, lower-left
      1, 5, 3,  3, 5, 2,  4, 5, 1,  2, 5, 4,
      // Tail forks
      5, 6, 7,  5, 9, 8,
      // Dorsal fin
      10, 11, 12,
      // Pectoral fin
      13, 14, 15,
    ]);
    geom.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geom.setIndex(new THREE.BufferAttribute(indices, 1));
    geom.computeVertexNormals();
    return geom;
  }, []);

  const fishMaterial = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: SCHOOL_CONFIGS[schoolIndex].color,
        emissive: SCHOOL_CONFIGS[schoolIndex].color,
        emissiveIntensity: 0.25,
        shininess: 40,
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
      tempQuat.setFromAxisAngle(_fishUpAxis, fishAngle);

      tempMatrix.compose(
        _fishPos.set(fx, fy, fz),
        tempQuat,
        _fishScale
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
