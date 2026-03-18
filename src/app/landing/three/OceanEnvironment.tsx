"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollStore } from "../hooks/useScrollStore";

export const cameraYRef = { current: 15 };

// Fog near/far — higher values = less fog = more 3D elements visible
const DEPTH_CURVE = [
  { scroll: 0.00, y:  15, fogNear: 40, fogFar: 100 },
  { scroll: 0.05, y:   5, fogNear: 30, fogFar: 80 },
  { scroll: 0.10, y:  -2, fogNear: 20, fogFar: 60 },
  { scroll: 0.28, y:  -8, fogNear: 12, fogFar: 40 },
  { scroll: 0.40, y: -14, fogNear:  8, fogFar: 30 },
  { scroll: 0.50, y: -20, fogNear:  6, fogFar: 25 },
  { scroll: 0.58, y: -25, fogNear:  6, fogFar: 25 },
  { scroll: 0.72, y: -32, fogNear:  5, fogFar: 22 },
  { scroll: 0.88, y: -38, fogNear:  6, fogFar: 25 },
  { scroll: 1.00, y: -42, fogNear:  8, fogFar: 30 },
];

// Fog + scene background colors — sky above water, dark palette underwater
const FOG_COLORS = [
  { scroll: 0.0,  color: new THREE.Color("#2A4A6A") },
  { scroll: 0.04, color: new THREE.Color("#1E3A5C") },
  { scroll: 0.07, color: new THREE.Color("#152D48") },
  { scroll: 0.10, color: new THREE.Color("#0a2540") },
  { scroll: 0.28, color: new THREE.Color("#061525") },
  { scroll: 0.40, color: new THREE.Color("#080818") },
  { scroll: 0.50, color: new THREE.Color("#060612") },
  { scroll: 0.58, color: new THREE.Color("#05050E") },
  { scroll: 0.72, color: new THREE.Color("#04040A") },
  { scroll: 0.88, color: new THREE.Color("#030308") },
  { scroll: 1.0,  color: new THREE.Color("#030308") },
];

// Lighting — bright above water, fades through depth zones
const LIGHTING_CURVE = [
  { scroll: 0.0,  dir: 0.8,  ambient: 0.6  },
  { scroll: 0.05, dir: 0.75, ambient: 0.55 },
  { scroll: 0.10, dir: 0.7,  ambient: 0.5  },
  { scroll: 0.15, dir: 0.6,  ambient: 0.4  },
  { scroll: 0.28, dir: 0.2,  ambient: 0.2  },
  { scroll: 0.40, dir: 0.0,  ambient: 0.15 },
  { scroll: 0.50, dir: 0.0,  ambient: 0.12 },
  { scroll: 0.58, dir: 0.0,  ambient: 0.10 },
  { scroll: 0.72, dir: 0.0,  ambient: 0.10 },
  { scroll: 0.88, dir: 0.0,  ambient: 0.12 },
  { scroll: 1.0,  dir: 0.0,  ambient: 0.12 },
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

export default function OceanEnvironment() {
  const { camera, scene } = useThree();
  const fogRef = useRef<THREE.Fog>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirKeyRef = useRef<THREE.DirectionalLight>(null);
  const dirFillRef = useRef<THREE.DirectionalLight>(null);
  const tempColor = useRef(new THREE.Color()).current;

  useFrame((_, delta) => {
    const scrollProgress = useScrollStore.getState().scrollProgress;
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
      <fog ref={fogRef} attach="fog" args={["#4A7DA8", 30, 80]} />
      <ambientLight ref={ambientRef} intensity={0.45} color="#2563EB" />
      <directionalLight ref={dirKeyRef} position={[2, 23, 4]} intensity={0.7} color="#3B82F6" />
      <directionalLight ref={dirFillRef} position={[-3, 8, 2]} intensity={0.1} color="#065f46" />
    </>
  );
}
