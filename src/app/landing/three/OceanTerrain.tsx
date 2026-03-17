"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { simplexNoise3D } from "./shaders/noise";
import { underwaterFogPars, underwaterFogFragment } from "./shaders/underwater";
import { causticGLSL } from "./shaders/caustic";
import { cameraYRef } from "./OceanEnvironment";

const vertexShader = /* glsl */ `
uniform float uTime;
varying vec3 vWorldPos;
varying vec3 vViewPosition;

${simplexNoise3D}

void main() {
  vec3 pos = position;
  pos.y += snoise(vec3(pos.xz * 0.05 + uTime * 0.02, 0.0)) * 3.0;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vViewPosition = -mvPosition.xyz;
  vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform float uCausticIntensity;
${underwaterFogPars}
${causticGLSL}
varying vec3 vWorldPos;
varying vec3 vViewPosition;

void main() {
  gl_FragColor = vec4(0.04, 0.086, 0.157, 1.0);
  float c = caustic(vWorldPos.xz * 0.1, uTime * 0.5);
  gl_FragColor.rgb += vec3(0.22, 0.51, 0.97) * c * uCausticIntensity;
  ${underwaterFogFragment}
}
`;

export default function OceanTerrain() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { scene } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uFogColor: { value: new THREE.Color("#0c4a6e") },
      uFogDensity: { value: 0.02 },
      uCausticIntensity: { value: 0.0 },
    }),
    []
  );

  useFrame((_, delta) => {
    if (!materialRef.current) return;

    materialRef.current.uniforms.uTime.value += delta;

    // Denser fog the deeper the camera goes
    const density = 0.02 + Math.max(0, -cameraYRef.current) * 0.005;
    materialRef.current.uniforms.uFogDensity.value = density;

    // Sync fog color with scene fog
    if (scene.fog && scene.fog instanceof THREE.Fog) {
      materialRef.current.uniforms.uFogColor.value.copy(scene.fog.color);
    }

    // Caustic intensity: bright near surface, fades to zero at depth
    materialRef.current.uniforms.uCausticIntensity.value = Math.max(
      0,
      Math.min(0.15, (cameraYRef.current + 2) * 0.015)
    );
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -15, 0]}>
      <planeGeometry args={[80, 80, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}
