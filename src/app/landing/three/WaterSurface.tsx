"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cameraYRef } from "./OceanEnvironment";

const vertexShader = /* glsl */ `
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec3 pos = position;
    pos.y += sin(pos.x * 0.3 + uTime) * 0.6 + sin(pos.z * 0.5 + uTime * 0.7) * 0.375;

    // Partial derivatives of wave displacement for normal computation
    // wave = sin(x*0.3 + t)*0.6 + sin(z*0.5 + t*0.7)*0.375
    float dx = cos(pos.x * 0.3 + uTime) * 0.3 * 0.6;
    float dz = cos(pos.z * 0.5 + uTime * 0.7) * 0.5 * 0.375;
    // For heightfield y=f(x,z), normal = normalize(-df/dx, 1, -df/dz)
    vec3 localNormal = normalize(vec3(-dx, 1.0, -dz));

    vUv = uv;
    vNormal = normalize(normalMatrix * localNormal);

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vViewDir = cameraPosition - worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec3 viewDir = normalize(vViewDir);
    vec3 normal = normalize(vNormal);

    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.0);

    vec3 colorA = vec3(0.055, 0.647, 0.914); // #0ea5e9
    vec3 colorB = vec3(0.220, 0.741, 0.973); // #38bdf8
    vec3 color = mix(colorA, colorB, fresnel);

    float alpha = (fresnel * 0.6 + 0.15) * uOpacity;

    gl_FragColor = vec4(color, alpha);
  }
`;

export default function WaterSurface() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 1 },
    }),
    []
  );

  useFrame((state) => {
    if (!materialRef.current) return;

    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    const distance = Math.abs(12.0 - cameraYRef.current);
    const opacity = Math.max(0, Math.min(1, 1 - (distance - 2) / 18));
    materialRef.current.uniforms.uOpacity.value = opacity;
  });

  return (
    <mesh position={[0, 12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[100, 100, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
