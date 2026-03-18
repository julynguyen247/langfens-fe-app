"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cameraYRef } from "./OceanEnvironment";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uWindDir;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;
  varying float vWaveHeight;

  // Gerstner-approximation FBM wave function - 4 octaves
  // Peaked crests, flat troughs via half-frequency subtraction
  float wave(vec2 p, float t) {
    float h = 0.0;
    float amp = 0.7;
    float freq = 0.12;
    float sharpness = 0.35;
    vec2 dir = normalize(uWindDir);

    for (int i = 0; i < 4; i++) {
      float speed = 0.8 / (1.0 + float(i) * 0.3);
      float phase = dot(p * freq, dir) + t * speed;
      float s = sin(phase);
      // Peaked crests, flat troughs
      h += (s - sharpness * abs(sin(phase * 0.5))) * amp;
      // Rotate direction 30 degrees each octave
      dir = vec2(dir.x * 0.866 - dir.y * 0.5, dir.x * 0.5 + dir.y * 0.866);
      amp *= 0.5;
      freq *= 2.0;
    }
    return h;
  }

  void main() {
    vec3 pos = position;
    float h = wave(pos.xz, uTime);
    pos.y += h;
    vWaveHeight = h;

    // Compute normal via partial derivatives (tighter epsilon for detail)
    float eps = 0.3;
    float hL = wave(pos.xz + vec2(-eps, 0.0), uTime);
    float hR = wave(pos.xz + vec2(eps, 0.0), uTime);
    float hD = wave(pos.xz + vec2(0.0, -eps), uTime);
    float hU = wave(pos.xz + vec2(0.0, eps), uTime);
    vec3 localNormal = normalize(vec3(hL - hR, 2.0 * eps, hD - hU));

    vUv = uv;
    vNormal = normalize(normalMatrix * localNormal);

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    vViewDir = cameraPosition - worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  uniform float uCameraY;
  uniform float uTime;
  uniform vec3 uFogColor;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;
  varying float vWaveHeight;

  // Cheap 2D hash noise for surface ripples
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float rippleNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Sky color lookup for faked reflection (matched to darkened SkyDome)
  vec3 skyColor(vec3 dir) {
    float t = clamp(dir.y, 0.0, 1.0);
    vec3 horizon = vec3(0.22, 0.42, 0.60);   // #386B99 — matches SkyDome horizon
    vec3 midSky  = vec3(0.18, 0.38, 0.58);   // #2E6194 — matches SkyDome midSky
    vec3 zenith  = vec3(0.12, 0.28, 0.52);   // #1F478A — matches SkyDome zenith
    vec3 col = mix(horizon, midSky, smoothstep(0.0, 0.3, t));
    col = mix(col, zenith, smoothstep(0.3, 0.8, t));
    return col;
  }

  void main() {
    vec3 viewDir = normalize(vViewDir);
    vec3 normal = normalize(vNormal);

    // High-frequency normal perturbation (tiny surface ripples)
    float rippleScale = 8.0;
    float rippleStrength = 0.08;
    float rTime = uTime * 0.5;
    vec2 rUv = vWorldPos.xz * rippleScale;
    float nx = rippleNoise(rUv + vec2(rTime, 0.0))
             - rippleNoise(rUv - vec2(rTime, 0.0));
    float nz = rippleNoise(rUv + vec2(0.0, rTime))
             - rippleNoise(rUv - vec2(0.0, rTime));
    // Fade ripples with distance to prevent aliasing
    float rippleFade = 1.0 - smoothstep(20.0, 50.0, length(vViewDir));
    normal = normalize(normal + vec3(nx, 0.0, nz) * rippleStrength * rippleFade);

    // Fresnel effect
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);

    // Water colors (brighter deep color)
    vec3 deepColor = vec3(0.04, 0.12, 0.25);
    vec3 shallowColor = vec3(0.055, 0.647, 0.914);

    // Foam detection: wave crests + steep normals
    float foamThreshold = 0.25;
    float foamHeight = smoothstep(foamThreshold, foamThreshold + 0.15, vWaveHeight);
    float normalSteepness = 1.0 - abs(normal.y);
    float foamSteep = smoothstep(0.15, 0.45, normalSteepness);
    float foam = foamHeight * foamSteep;
    vec3 foamColor = vec3(0.85, 0.92, 0.97);

    // Edge fade: smooth alpha falloff at plane boundaries to prevent hard line
    float edgeX = 1.0 - smoothstep(70.0, 98.0, abs(vWorldPos.x));
    float edgeZ = 1.0 - smoothstep(70.0, 98.0, abs(vWorldPos.z));
    float edgeFade = edgeX * edgeZ;

    if (uCameraY > 0.0) {
      // === ABOVE WATER VIEW ===
      vec3 reflectedDir = reflect(-viewDir, normal);
      vec3 reflColor = skyColor(reflectedDir);

      // Wave-height-based color variation (crests lighter)
      float depthMix = smoothstep(-0.3, 0.3, vWaveHeight);
      vec3 waterCol = mix(deepColor, shallowColor, depthMix * 0.3 + 0.2);

      vec3 color = mix(waterCol, reflColor, fresnel * 0.7 + 0.3);

      // Subsurface scattering approximation
      float sss = pow(max(dot(normalize(vec3(0.5, 0.8, -0.3)), -viewDir), 0.0), 4.0) * 0.15;
      color += shallowColor * sss;

      // Apply foam (subtle white wash at crests)
      color = mix(color, foamColor, foam * 0.4);

      // Distance fade — blend toward current fog color at plane edges
      float distFromCamera = length(vViewDir);
      float distFade = smoothstep(20.0, 60.0, distFromCamera);
      color = mix(color, uFogColor, distFade);

      // Alpha fades with distance — prevents bright reflective band at horizon
      float alphaDistFade = 1.0 - smoothstep(25.0, 60.0, distFromCamera);
      float alpha = (fresnel * 0.4 + 0.6) * uOpacity * edgeFade * alphaDistFade;
      gl_FragColor = vec4(color, alpha);
    } else {
      // === BELOW WATER VIEW (Snell's Window) ===
      float cosAngle = dot(viewDir, vec3(0.0, 1.0, 0.0));
      float criticalAngle = 0.667;
      float windowEdge = smoothstep(criticalAngle - 0.05, criticalAngle + 0.05, cosAngle);

      vec3 skyDir = vec3(normal.x * 0.3, 1.0, normal.z * 0.3);
      vec3 skyCol = skyColor(normalize(skyDir));
      vec3 darkReflect = vec3(0.04, 0.06, 0.10);
      vec3 color = mix(darkReflect, skyCol, windowEdge);

      // Foam visible from below as bright patches
      color += foamColor * foam * 0.2;

      float depthFade = clamp(1.0 + uCameraY / 5.0, 0.0, 1.0);
      color *= depthFade;

      float alpha = (0.5 + fresnel * 0.3) * uOpacity * edgeFade;
      gl_FragColor = vec4(color, alpha);
    }
  }
`;

export default function WaterSurface() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uCameraY: { value: 15 },
      uWindDir: { value: new THREE.Vector2(0.7, 0.3) },
      uFogColor: { value: new THREE.Color("#2A4A6A") },
    }),
    []
  );

  useFrame((state) => {
    if (!materialRef.current) return;

    // Water visible only near surface: fade in as camera approaches Y=0
    // Above: visible when camY < 12, fades in gradually, full opacity at camY=2
    // Below: visible when camY > -20, fully gone by camY <= -23
    const camY = cameraYRef.current;
    const aboveFade = camY > 0 ? Math.max(0, Math.min(1, (12 - camY) / 10)) : 1;
    const belowFade = camY < 0 ? Math.max(0, Math.min(1, 1 - (Math.abs(camY) - 20) / 3)) : 1;
    const opacity = aboveFade * belowFade;

    // Skip rendering entirely when fully transparent
    if (meshRef.current) {
      meshRef.current.visible = opacity > 0.001;
    }
    if (opacity <= 0.001) return;

    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.uCameraY.value = cameraYRef.current;
    materialRef.current.uniforms.uOpacity.value = opacity;

    // Sync fog color so water edge blends seamlessly with background
    const fog = state.scene.fog as THREE.Fog | null;
    if (fog) {
      materialRef.current.uniforms.uFogColor.value.copy(fog.color);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[200, 200, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
