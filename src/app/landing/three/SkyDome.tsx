"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cameraYRef } from "./OceanEnvironment";
import { simplexNoise3D } from "./shaders/noise";

/* ── Sky hemisphere shader ─────────────────────────────────── */

const skyVertexShader = /* glsl */ `
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragmentShader = /* glsl */ `
  uniform vec3 uSunDirection;
  uniform float uOpacity;

  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    // Normalize Y to 0..1 across the hemisphere
    float h = normalize(vPosition).y;

    // Sky gradient colors — deep navy tones for text readability
    vec3 zenith  = vec3(0.12, 0.28, 0.52);   // #1F478A — deep blue
    vec3 midSky  = vec3(0.18, 0.38, 0.58);   // #2E6194 — muted sky
    vec3 horizon = vec3(0.22, 0.42, 0.60);   // #386B99 — soft horizon
    vec3 below   = vec3(0.039, 0.086, 0.157); // #0A1628

    // Blend through the gradient bands — wider transition at horizon
    vec3 color = below;
    color = mix(color, horizon, smoothstep(-0.15, 0.2, h));
    color = mix(color, midSky,  smoothstep(0.15, 0.5, h));
    color = mix(color, zenith,  smoothstep(0.5, 0.85, h));

    // Sun glow — brighten around the sun direction
    float sunDot = max(dot(normalize(vPosition), uSunDirection), 0.0);
    float sunGlow = pow(sunDot, 32.0) * 0.3 + pow(sunDot, 8.0) * 0.1;
    color += vec3(0.7, 0.85, 1.0) * sunGlow;

    // Cut sky dome below horizon — let scene fog/background show through
    float horizonFade = smoothstep(-0.01, 0.08, h);
    gl_FragColor = vec4(color, uOpacity * horizonFade);
  }
`;

/* ── Cloud layer shader ────────────────────────────────────── */

const cloudVertexShader = /* glsl */ `
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const cloudFragmentShader = /* glsl */ `
  ${simplexNoise3D}

  uniform float uTime;
  uniform float uOpacity;

  varying vec3 vWorldPosition;

  void main() {
    float noise = 0.0;
    float scale = 0.003;
    float amplitude = 0.5;

    // 2 octaves of simplex noise (reduced from 4 for performance)
    for (int i = 0; i < 2; i++) {
      noise += snoise(vec3(
        vWorldPosition.x * scale + uTime * 0.008,
        vWorldPosition.z * scale + uTime * 0.006,
        uTime * 0.003
      )) * amplitude;
      scale *= 2.0;
      amplitude *= 0.5;
    }

    // Shape clouds from noise
    float cloud = smoothstep(0.1, 0.6, noise);

    // White, wispy, translucent
    float alpha = cloud * 0.35 * uOpacity;
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
  }
`;

/* ── Component ─────────────────────────────────────────────── */

export default function SkyDome() {
  const groupRef = useRef<THREE.Group>(null);
  const skyMatRef = useRef<THREE.ShaderMaterial>(null);
  const cloud1MatRef = useRef<THREE.ShaderMaterial>(null);
  const cloud2MatRef = useRef<THREE.ShaderMaterial>(null);

  const skyGeo = useMemo(
    () => new THREE.SphereGeometry(80, 16, 16, 0, Math.PI * 2, 0, Math.PI),
    []
  );

  const cloudGeo = useMemo(() => new THREE.PlaneGeometry(200, 200), []);

  const sunDir = useMemo(
    () => new THREE.Vector3(0.5, 0.8, -0.3).normalize(),
    []
  );

  const skyUniforms = useMemo(
    () => ({
      uSunDirection: { value: sunDir },
      uOpacity: { value: 1.0 },
    }),
    [sunDir]
  );

  const cloud1Uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 1.0 },
    }),
    []
  );

  const cloud2Uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 1.0 },
    }),
    []
  );

  useFrame((_, delta) => {
    // Fade based on camera Y: fully visible at Y>=3, fades out, gone at Y<=-2
    const opacity = THREE.MathUtils.clamp((cameraYRef.current + 2) / 5, 0, 1);

    // Skip rendering entirely when fully transparent
    if (groupRef.current) {
      groupRef.current.visible = opacity > 0.001;
    }
    if (opacity <= 0.001) return;

    // Update cloud time
    if (cloud1MatRef.current) {
      cloud1MatRef.current.uniforms.uTime.value += delta;
    }
    if (cloud2MatRef.current) {
      cloud2MatRef.current.uniforms.uTime.value += delta * 0.8;
    }

    if (skyMatRef.current) {
      skyMatRef.current.uniforms.uOpacity.value = opacity;
    }
    if (cloud1MatRef.current) {
      cloud1MatRef.current.uniforms.uOpacity.value = opacity;
    }
    if (cloud2MatRef.current) {
      cloud2MatRef.current.uniforms.uOpacity.value = opacity;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Sky hemisphere */}
      <mesh geometry={skyGeo} position={[0, 0, 0]}>
        <shaderMaterial
          ref={skyMatRef}
          vertexShader={skyVertexShader}
          fragmentShader={skyFragmentShader}
          uniforms={skyUniforms}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Cloud layer 1 (higher) */}
      <mesh
        geometry={cloudGeo}
        position={[0, 15, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <shaderMaterial
          ref={cloud1MatRef}
          vertexShader={cloudVertexShader}
          fragmentShader={cloudFragmentShader}
          uniforms={cloud1Uniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Cloud layer 2 (lower) */}
      <mesh
        geometry={cloudGeo}
        position={[0, 12, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <shaderMaterial
          ref={cloud2MatRef}
          vertexShader={cloudVertexShader}
          fragmentShader={cloudFragmentShader}
          uniforms={cloud2Uniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
