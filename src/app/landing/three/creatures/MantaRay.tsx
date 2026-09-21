"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cameraYRef } from "../OceanEnvironment";

// ---------------------------------------------------------------------------
// Sub-component 2: MantaRay
// ---------------------------------------------------------------------------

// Generate manta ray body — concave front edge, pointed wing tips, airfoil thickness
function generateMantaBody(): THREE.BufferGeometry {
  const cols = 13; // U spanwise
  const rows = 9;  // V forrdwise (increased for curved front edge)
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

export function MantaRay() {
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
