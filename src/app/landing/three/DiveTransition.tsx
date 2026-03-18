"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { ScreenQuad } from "@react-three/drei";
import * as THREE from "three";
import { cameraYRef } from "./OceanEnvironment";

// ---------------------------------------------------------------------------
// Part 1 — Refraction ScreenQuad Overlay
// ---------------------------------------------------------------------------

const refractionVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const refractionFragmentShader = /* glsl */ `
uniform float uTime;
uniform float uIntensity;

varying vec2 vUv;

void main() {
  // Screen-space refraction distortion
  vec2 distortion = vec2(
    sin(vUv.y * 30.0 + uTime * 4.0) * 0.008,
    cos(vUv.x * 25.0 + uTime * 3.5) * 0.006
  ) * uIntensity;

  // Tint color — underwater blue-green
  vec3 tintColor = vec3(0.02, 0.12, 0.25);

  // Edge darkening for underwater vignette
  vec2 center = vUv - 0.5;
  float vignette = 1.0 - dot(center, center) * 1.5;
  vignette = clamp(vignette, 0.0, 1.0);

  // Combine: distortion pattern visible as color variation
  float pattern = sin(vUv.x * 20.0 + distortion.x * 100.0 + uTime * 2.0) *
                  sin(vUv.y * 15.0 + distortion.y * 80.0 + uTime * 1.5);
  pattern = pattern * 0.5 + 0.5;

  vec3 color = tintColor * (0.8 + pattern * 0.4);
  float alpha = uIntensity * (1.0 - vignette * 0.5) * 0.4;

  gl_FragColor = vec4(color, alpha);
}
`;

// ---------------------------------------------------------------------------
// Part 2 — Bubble Burst Particles
// ---------------------------------------------------------------------------

const BUBBLE_COUNT = 60;

interface BubbleData {
  velocity: Float32Array;  // upward speed per bubble
  drift: Float32Array;     // X/Z drift per bubble (interleaved x, z)
  size: Float32Array;      // size per bubble
  life: Float32Array;      // life timer per bubble (units risen)
  active: boolean;
}

function initBubbleData(): BubbleData {
  const velocity = new Float32Array(BUBBLE_COUNT);
  const drift = new Float32Array(BUBBLE_COUNT * 2);
  const size = new Float32Array(BUBBLE_COUNT);
  const life = new Float32Array(BUBBLE_COUNT);

  for (let i = 0; i < BUBBLE_COUNT; i++) {
    velocity[i] = 1 + Math.random() * 3;
    drift[i * 2] = (Math.random() - 0.5) * 0.04;
    drift[i * 2 + 1] = (Math.random() - 0.5) * 0.04;
    size[i] = 0.02 + Math.random() * 0.06;
    life[i] = 0;
  }

  return { velocity, drift, size, life, active: false };
}

function resetBubble(positions: THREE.BufferAttribute, data: BubbleData, index: number) {
  positions.setXYZ(
    index,
    (Math.random() - 0.5) * 6,  // X: -3 to 3
    0,                            // Y: water surface
    (Math.random() - 0.5) * 6   // Z: -3 to 3
  );
  data.velocity[index] = 1 + Math.random() * 3;
  data.drift[index * 2] = (Math.random() - 0.5) * 0.04;
  data.drift[index * 2 + 1] = (Math.random() - 0.5) * 0.04;
  data.size[index] = 0.02 + Math.random() * 0.06;
  data.life[index] = 0;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DiveTransition() {
  // --- Refraction overlay ---
  const refractionRef = useRef<THREE.ShaderMaterial>(null);

  const refractionUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
    }),
    []
  );

  // --- Bubble burst ---
  const pointsRef = useRef<THREE.Points>(null);
  const groupRef = useRef<THREE.Group>(null);
  const bubbleData = useRef<BubbleData>(initBubbleData());

  const bubbleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(BUBBLE_COUNT * 3);
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((_, delta) => {
    const camY = cameraYRef.current;
    const rawIntensity = Math.max(0, 1 - Math.abs(camY) / 3);
    const intensity = rawIntensity * rawIntensity; // ease in/out

    // --- Update refraction overlay (skip when invisible) ---
    if (refractionRef.current) {
      refractionRef.current.uniforms.uIntensity.value = intensity;
      if (intensity > 0.001) {
        refractionRef.current.uniforms.uTime.value += delta;
      }
    }

    // --- Update bubble particles ---
    if (groupRef.current) {
      groupRef.current.visible = intensity > 0;
    }

    if (pointsRef.current && intensity > 0.1) {
      const positions = bubbleGeometry.getAttribute("position") as THREE.BufferAttribute;
      const data = bubbleData.current;
      const time = refractionRef.current?.uniforms.uTime.value ?? 0;

      if (!data.active) {
        // First activation: reset all bubbles
        for (let i = 0; i < BUBBLE_COUNT; i++) {
          resetBubble(positions, data, i);
        }
        data.active = true;
      }

      for (let i = 0; i < BUBBLE_COUNT; i++) {
        const y = positions.getY(i);
        data.life[i] += data.velocity[i] * delta;

        if (data.life[i] > 5) {
          // Bubble has risen too far — reset it
          resetBubble(positions, data, i);
        } else {
          // Rise
          const newY = y + data.velocity[i] * delta;
          // Wobble
          const wobbleX = Math.sin(time * 3 + i) * 0.02;
          const wobbleZ = Math.cos(time * 2.7 + i * 1.3) * 0.02;

          positions.setXYZ(
            i,
            positions.getX(i) + data.drift[i * 2] * delta + wobbleX * delta,
            newY,
            positions.getZ(i) + data.drift[i * 2 + 1] * delta + wobbleZ * delta
          );
        }
      }

      positions.needsUpdate = true;
    } else if (bubbleData.current.active && intensity <= 0.1) {
      bubbleData.current.active = false;
    }
  });

  return (
    <group>
      {/* Refraction ScreenQuad overlay */}
      <ScreenQuad renderOrder={995}>
        <shaderMaterial
          ref={refractionRef}
          vertexShader={refractionVertexShader}
          fragmentShader={refractionFragmentShader}
          uniforms={refractionUniforms}
          depthTest={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          transparent={true}
        />
      </ScreenQuad>

      {/* Bubble burst particles */}
      <group ref={groupRef} visible={false}>
        <points ref={pointsRef} geometry={bubbleGeometry}>
          <pointsMaterial
            color="#a0d8ef"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            size={0.08}
            sizeAttenuation={true}
          />
        </points>
      </group>
    </group>
  );
}
