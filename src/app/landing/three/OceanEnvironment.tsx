"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export const cameraYRef = { current: 10 };

interface OceanEnvironmentProps {
  scrollProgress: number;
}

const DEPTH_CURVE = [
  { scroll: 0.00, y:  10, fogNear: 15, fogFar: 40 },
  { scroll: 0.12, y:   4, fogNear: 12, fogFar: 35 },
  { scroll: 0.55, y:  -2, fogNear:  8, fogFar: 25 },
  { scroll: 0.88, y: -10, fogNear:  5, fogFar: 18 },
  { scroll: 0.96, y:  -5, fogNear:  8, fogFar: 25 },
  { scroll: 1.00, y:  10, fogNear: 15, fogFar: 40 },
];

const FOG_COLORS = [
  { scroll: 0.0, color: new THREE.Color("#0c4a6e") },
  { scroll: 0.5, color: new THREE.Color("#041e35") },
  { scroll: 0.8, color: new THREE.Color("#0a0a1a") },
  { scroll: 1.0, color: new THREE.Color("#0c4a6e") },
];

const LIGHTING_CURVE = [
  { scroll: 0.0,  dir: 0.8,  ambient: 0.4  },
  { scroll: 0.12, dir: 0.6,  ambient: 0.3  },
  { scroll: 0.55, dir: 0.4,  ambient: 0.25 },
  { scroll: 0.88, dir: 0.05, ambient: 0.1  },
  { scroll: 0.96, dir: 0.4,  ambient: 0.25 },
  { scroll: 1.0,  dir: 0.8,  ambient: 0.4  },
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
    cameraYRef.current = THREE.MathUtils.lerp(cameraYRef.current, targetY, delta * 2);
    camera.position.y = cameraYRef.current;
    camera.lookAt(0, cameraYRef.current, 0);

    if (fogRef.current) {
      fogRef.current.near = THREE.MathUtils.lerp(depth.from.fogNear, depth.to.fogNear, depth.t);
      fogRef.current.far = THREE.MathUtils.lerp(depth.from.fogFar, depth.to.fogFar, depth.t);
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
      <fog ref={fogRef} attach="fog" args={["#0c4a6e", 15, 40]} />
      <ambientLight ref={ambientRef} intensity={0.4} color="#2563EB" />
      <directionalLight ref={dirKeyRef} position={[2, 18, 4]} intensity={0.8} color="#3B82F6" />
      <directionalLight ref={dirFillRef} position={[-3, 8, 2]} intensity={0.15} color="#06D6A0" />
    </>
  );
}
