"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { ScreenQuad } from "@react-three/drei";
import * as THREE from "three";
import { cameraYRef } from "./OceanEnvironment";
import { causticGLSL } from "./shaders/caustic";
import { simplexNoise3D } from "./shaders/noise";

/**
 * Combined post-FX: caustic + god rays + chromatic aberration in a single ScreenQuad.
 * Replaces 3 separate draw calls with 1.
 */

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform float uCausticDepth;
uniform vec2 uLightPos;
uniform float uGodRaysDepth;
uniform float uChromaticIntensity;

varying vec2 vUv;

${causticGLSL}
${simplexNoise3D}

void main() {
  vec3 totalColor = vec3(0.0);
  float totalAlpha = 0.0;

  // --- Caustic overlay ---
  if (uCausticDepth > 0.001) {
    float causticValue = caustic(vUv, uTime);
    vec3 causticColor = vec3(0.22, 0.51, 0.97);
    float causticAlpha = causticValue * uCausticDepth * 0.25;
    totalColor += causticColor * causticAlpha;
    totalAlpha += causticAlpha;
  }

  // --- God rays ---
  if (uGodRaysDepth > 0.001) {
    vec2 dir = vUv - uLightPos;
    float dist = length(dir);
    float noise = snoise(vec3(vUv * 3.0, uTime * 0.3));
    float falloff = exp(-dist * 1.2);
    float shaftIntensity = max(0.0, noise * 0.5 + 0.5) * falloff;
    vec3 rayColor = vec3(0.3, 0.55, 0.95);
    float rayAlpha = shaftIntensity * uGodRaysDepth * 1.5;
    totalColor += rayColor * rayAlpha;
    totalAlpha += rayAlpha;
  }

  // --- Chromatic aberration ---
  if (uChromaticIntensity > 0.001) {
    vec2 cDir = vUv - 0.5;
    float cDist = length(cDir);
    float aberration = uChromaticIntensity * cDist * 0.02;
    vec2 rUv = vUv + cDir * aberration;
    vec2 bUv = vUv - cDir * aberration;
    float rMask = smoothstep(0.3, 0.7, length(rUv - 0.5) * 2.0);
    float bMask = smoothstep(0.3, 0.7, length(bUv - 0.5) * 2.0);
    float edgeFactor = smoothstep(0.2, 0.6, cDist);
    vec3 chromColor = vec3(rMask * 0.15, 0.0, bMask * 0.1) * edgeFactor;
    float chromAlpha = uChromaticIntensity * edgeFactor * 0.3;
    totalColor += chromColor;
    totalAlpha += chromAlpha;
  }

  gl_FragColor = vec4(totalColor, totalAlpha);
}
`;

// Reusable vector for sun projection (avoid allocation per frame)
const _sunWorldPos = new THREE.Vector3(0, 20, -5);
const _sunScreenPos = new THREE.Vector3();

export default function CombinedPostFX() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCausticDepth: { value: 0 },
      uLightPos: { value: new THREE.Vector2(0.5, 1.0) },
      uGodRaysDepth: { value: 0 },
      uChromaticIntensity: { value: 0 },
    }),
    []
  );

  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ camera, clock }) => {
    if (!materialRef.current) return;
    const u = materialRef.current.uniforms;
    const camY = cameraYRef.current;

    // Compute effect intensities
    const causticDepth = Math.max(0, Math.min(1, 1.0 + camY / 8));
    const godRaysDepth = Math.max(0, Math.min(1.0, 1.0 + camY * 0.1));
    const chromaticIntensity = Math.max(0, (Math.abs(camY) - 14) / 14);

    // Skip entirely when all effects are near zero (saves full-screen shader pass)
    const allInactive = causticDepth < 0.001 && godRaysDepth < 0.001 && chromaticIntensity < 0.001;
    if (meshRef.current) meshRef.current.visible = !allInactive;
    if (allInactive) return;

    u.uTime.value = clock.getElapsedTime();
    u.uCausticDepth.value = causticDepth;

    // God rays: project sun to screen
    _sunScreenPos.copy(_sunWorldPos).project(camera);
    u.uLightPos.value.set(
      (_sunScreenPos.x + 1) / 2,
      (_sunScreenPos.y + 1) / 2
    );
    u.uGodRaysDepth.value = godRaysDepth;
    u.uChromaticIntensity.value = chromaticIntensity;
  });

  return (
    <ScreenQuad ref={meshRef} renderOrder={998}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        transparent={true}
      />
    </ScreenQuad>
  );
}
