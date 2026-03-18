"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cameraYRef } from "./OceanEnvironment";

const SEAGULL_COUNT = 6;

const SEAGULL_CONFIGS = [
  { radius: 15, speed: 0.08, baseY: 18, phase: 0 },
  { radius: 20, speed: 0.06, baseY: 17, phase: 1.0 },
  { radius: 12, speed: 0.1,  baseY: 19, phase: 2.1 },
  { radius: 18, speed: 0.07, baseY: 16, phase: 3.2 },
  { radius: 14, speed: 0.09, baseY: 20, phase: 4.3 },
  { radius: 22, speed: 0.05, baseY: 17.5, phase: 5.5 },
] as const;

/* ------------------------------------------------------------------ */
/*  Build merged seagull geometry                                       */
/* ------------------------------------------------------------------ */
function buildSeagullGeometry(): THREE.BufferGeometry {
  // Body: cone rotated to horizontal (pointing along X axis)
  const body = new THREE.ConeGeometry(0.04, 0.25, 4);
  body.rotateZ(Math.PI / 2);

  // Left wing: plane translated to left side, slight upward angle
  const leftWing = new THREE.PlaneGeometry(0.3, 0.06);
  leftWing.rotateX(-0.2); // slight upward angle
  leftWing.translate(-0.18, 0.02, 0);

  // Right wing: plane translated to right side, slight upward angle
  const rightWing = new THREE.PlaneGeometry(0.3, 0.06);
  rightWing.rotateX(-0.2); // slight upward angle
  rightWing.translate(0.18, 0.02, 0);

  // Tail: small plane at rear
  const tail = new THREE.PlaneGeometry(0.08, 0.05);
  tail.translate(-0.14, 0, 0);

  const parts = [body, leftWing, rightWing, tail];
  const merged = mergeGeometries(parts);

  // Vertex colors: white body (#F8FAFC), gray wingtips (#94A3B8)
  if (merged) {
    const posAttr = merged.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);
    const bodyColor = new THREE.Color("#F8FAFC");
    const tiptColor = new THREE.Color("#94A3B8");
    const tmp = new THREE.Color();

    for (let i = 0; i < posAttr.count; i++) {
      const xDist = Math.abs(posAttr.getX(i));
      // Wing tips are further from center (> 0.18 units out)
      const t = Math.min(1, Math.max(0, (xDist - 0.1) / 0.2));
      tmp.copy(bodyColor).lerp(tiptColor, t);
      colors[i * 3]     = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    merged.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }

  parts.forEach((g) => g.dispose());
  return merged ?? new THREE.ConeGeometry(0.04, 0.25, 4);
}

/* ------------------------------------------------------------------ */
/*  Seagulls component                                                  */
/* ------------------------------------------------------------------ */
export default function Seagulls() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const frameCounter = useRef(0);

  const geometry = useMemo(() => buildSeagullGeometry(), []);

  const timeUniform = useMemo(() => ({ value: 0 }), []);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.6,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = timeUniform;
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        `uniform float uTime;\nvoid main() {`
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float wingDist = abs(transformed.x);
        float flapAmount = wingDist * wingDist * 0.8;
        transformed.y += sin(uTime * 3.0 + float(gl_InstanceID) * 1.5) * flapAmount;`
      );
    };
    mat.customProgramCacheKey = () => "seagull-flap";
    return mat;
  }, [timeUniform]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const camY = cameraYRef.current;
    mesh.visible = camY > 5;
    if (!mesh.visible) return;

    // Frame-skip: update every 3rd frame
    frameCounter.current++;
    if (frameCounter.current % 3 !== 0) return;

    const t = clock.getElapsedTime();
    timeUniform.value = t;

    for (let i = 0; i < SEAGULL_COUNT; i++) {
      const cfg = SEAGULL_CONFIGS[i];
      const angle = t * cfg.speed + cfg.phase;

      const x = Math.cos(angle) * cfg.radius;
      const z = Math.sin(angle) * cfg.radius;
      const y = cfg.baseY + Math.sin(t * 0.3 + cfg.phase) * 0.8;

      dummy.position.set(x, y, z);

      // Heading follows orbit direction (tangent to circle)
      const headingAngle = angle + Math.PI / 2;
      dummy.rotation.set(0, headingAngle, 0);

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, SEAGULL_COUNT]}
      frustumCulled={false}
    />
  );
}
