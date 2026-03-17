"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export const cameraYRef = { current: 10 };

interface OceanEnvironmentProps {
  scrollProgress: number;
}

// Fog near/far — higher values = less fog = more 3D elements visible
const DEPTH_CURVE = [
  { scroll: 0.00, y:  10, fogNear: 20, fogFar: 50 },
  { scroll: 0.12, y:   4, fogNear: 16, fogFar: 45 },
  { scroll: 0.55, y:  -2, fogNear: 10, fogFar: 30 },
  { scroll: 0.78, y:  -8, fogNear:  6, fogFar: 20 },
  { scroll: 0.88, y:  -4, fogNear: 10, fogFar: 30 },
  { scroll: 0.94, y:   4, fogNear: 16, fogFar: 45 },
  { scroll: 1.00, y:  10, fogNear: 20, fogFar: 50 },
];

// Fog + scene background colors — DARK palette matching --ocean-bg (#040B14)
// Surface is slightly brighter blue-navy, deep is near-black
const FOG_COLORS = [
  { scroll: 0.0,  color: new THREE.Color("#061525") },  // surface: dark navy with blue hint
  { scroll: 0.5,  color: new THREE.Color("#040B14") },  // mid: original ocean-bg
  { scroll: 0.75, color: new THREE.Color("#020609") },  // deep: near-black
  { scroll: 0.88, color: new THREE.Color("#040B14") },  // rise: back to mid
  { scroll: 0.94, color: new THREE.Color("#061525") },  // surface again
  { scroll: 1.0,  color: new THREE.Color("#061525") },
];

// Lighting — reduced to match dark theme; just enough to illuminate 3D elements
const LIGHTING_CURVE = [
  { scroll: 0.0,  dir: 0.5,  ambient: 0.25 },
  { scroll: 0.12, dir: 0.4,  ambient: 0.2  },
  { scroll: 0.55, dir: 0.25, ambient: 0.15 },
  { scroll: 0.78, dir: 0.05, ambient: 0.08 },
  { scroll: 0.88, dir: 0.2,  ambient: 0.12 },
  { scroll: 0.94, dir: 0.4,  ambient: 0.2  },
  { scroll: 1.0,  dir: 0.5,  ambient: 0.25 },
];

function interpolateKeyframes<T extends { scroll: number }>(
  keyframes: T[],
  progress: number
): { from: T; to: T; t: number } {
  let fromIdx = 0;
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (progress >= keyframes[i].scroll && progress <= keyframes[i + 1].scroll) {
      fromIdx = i;
      break;
    }
  }
  if (progress >= keyframes[keyframes.length - 1].scroll) {
    fromIdx = keyframes.length - 2;
  }
  const from = keyframes[fromIdx];
  const to = keyframes[fromIdx + 1];
  const range = to.scroll - from.scroll;
  const raw = range > 0 ? (progress - from.scroll) / range : 0;
  const t = raw * raw * (3 - 2 * raw);
  return { from, to, t };
}

export default function OceanEnvironment({ scrollProgress }: OceanEnvironmentProps) {
  const { camera, scene } = useThree();
  const fogRef = useRef<THREE.Fog>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirKeyRef = useRef<THREE.DirectionalLight>(null);
  const dirFillRef = useRef<THREE.DirectionalLight>(null);
  const tempColor = useRef(new THREE.Color()).current;

  useFrame((_, delta) => {
    const depth = interpolateKeyframes(DEPTH_CURVE, scrollProgress);
    const targetY = THREE.MathUtils.lerp(depth.from.y, depth.to.y, depth.t);
    cameraYRef.current = THREE.MathUtils.lerp(cameraYRef.current, targetY, delta * 4);
    camera.position.y = cameraYRef.current;
    camera.lookAt(0, cameraYRef.current, 0);

    if (fogRef.current) {
      // Fog near/far respond to target (not smoothed camera) for instant atmosphere change
      const targetNear = THREE.MathUtils.lerp(depth.from.fogNear, depth.to.fogNear, depth.t);
      const targetFar = THREE.MathUtils.lerp(depth.from.fogFar, depth.to.fogFar, depth.t);
      fogRef.current.near = THREE.MathUtils.lerp(fogRef.current.near, targetNear, delta * 5);
      fogRef.current.far = THREE.MathUtils.lerp(fogRef.current.far, targetFar, delta * 5);
      const fogC = interpolateKeyframes(FOG_COLORS, scrollProgress);
      tempColor.copy(fogC.from.color).lerp(fogC.to.color, fogC.t);
      fogRef.current.color.copy(tempColor);
      if (scene.background instanceof THREE.Color) {
        scene.background.copy(tempColor);
      } else {
        scene.background = tempColor.clone();
      }
    }

    const light = interpolateKeyframes(LIGHTING_CURVE, scrollProgress);
    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(light.from.ambient, light.to.ambient, light.t);
    }
    if (dirKeyRef.current) {
      dirKeyRef.current.intensity = THREE.MathUtils.lerp(light.from.dir, light.to.dir, light.t);
      dirKeyRef.current.position.set(2, cameraYRef.current + 8, 4);
    }
    if (dirFillRef.current) {
      dirFillRef.current.intensity = THREE.MathUtils.lerp(light.from.dir * 0.2, light.to.dir * 0.2, light.t);
      dirFillRef.current.position.set(-3, cameraYRef.current - 2, 2);
    }
  });

  return (
    <>
      <fog ref={fogRef} attach="fog" args={["#061525", 20, 50]} />
      <ambientLight ref={ambientRef} intensity={0.25} color="#1e3a5f" />
      <directionalLight ref={dirKeyRef} position={[2, 18, 4]} intensity={0.5} color="#1e40af" />
      <directionalLight ref={dirFillRef} position={[-3, 8, 2]} intensity={0.1} color="#065f46" />
    </>
  );
}
