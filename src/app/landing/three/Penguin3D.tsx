"use client";

import React, { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PENGUIN_PATH = "/models/penguin.glb";
useGLTF.preload(PENGUIN_PATH, true);

interface Penguin3DProps {
  penguinRef: React.RefObject<THREE.Group | null>;
  headRef: React.RefObject<THREE.Group | null>;
  leftWingRef: React.RefObject<THREE.Group | null>;
  rightWingRef: React.RefObject<THREE.Group | null>;
  bodyRef?: React.RefObject<THREE.Mesh | null>;
}

/**
 * Tux penguin — 3 meshes:
 * - PenguinBody: single mesh with vertex colors (body+belly+eyes+beak+feet baked in)
 * - PenguinWingL / PenguinWingR: separate for flap animation
 * headRef is accepted but unused (eyes baked into body, no head animation)
 */
export default function Penguin3D({
  penguinRef,
  leftWingRef,
  rightWingRef,
}: Penguin3DProps) {
  const { scene } = useGLTF(PENGUIN_PATH, true);
  const timeUniform = useMemo(() => ({ value: 0 }), []);

  useFrame(({ clock }) => {
    timeUniform.value = clock.getElapsedTime();
  });

  const parts = useMemo(() => {
    let body: THREE.BufferGeometry | null = null;
    let wingL: THREE.BufferGeometry | null = null;
    let wingR: THREE.BufferGeometry | null = null;
    let bodyMat: THREE.Material | null = null;
    let wingLMat: THREE.Material | null = null;
    let wingRMat: THREE.Material | null = null;
    
    const bodyPos = new THREE.Vector3();
    const wingLPos = new THREE.Vector3();
    const wingRPos = new THREE.Vector3();

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const name = child.name;
      if (name.includes("PenguinBody")) {
        body = child.geometry;
        bodyMat = Array.isArray(child.material) ? child.material[0] : child.material;
        bodyPos.copy(child.position);
      } else if (name.includes("PenguinWingL")) {
        wingL = child.geometry;
        wingLMat = Array.isArray(child.material) ? child.material[0] : child.material;
        wingLPos.copy(child.position);
      } else if (name.includes("PenguinWingR")) {
        wingR = child.geometry;
        wingRMat = Array.isArray(child.material) ? child.material[0] : child.material;
        wingRPos.copy(child.position);
      }
    });

    // Clone materials and add emissive glow for dark ocean
    const updateMat = (mat: THREE.Material | null, isWing = false) => {
      if (!mat) return null;
      const m = mat.clone() as THREE.MeshStandardMaterial;
      m.emissive = new THREE.Color("#1e293b"); // Sleek cool blue
      m.emissiveIntensity = 0.5;
      m.roughness = 0.25;
      m.metalness = 0.1;
      if (isWing) m.color = new THREE.Color("#111827");
      
      // Inject custom vertex shader to make the body physically flex and bend like a real swimming animal
      if (!isWing) {
        m.onBeforeCompile = (shader) => {
          shader.uniforms.uTime = timeUniform;
          shader.vertexShader = `
            uniform float uTime;
            ${shader.vertexShader}
          `;
          shader.vertexShader = shader.vertexShader.replace(
            `#include <begin_vertex>`,
            `
            #include <begin_vertex>
            // Flex the body left/right based on Z axis (undulation)
            // We multiply by position.z so the center (shoulders) stays still and the wings don't detach
            float flexAmount = sin(uTime * 8.0 - position.z * 4.0) * 0.12 * position.z;
            transformed.x += flexAmount;
            
            // Subtle breathing / organic squish
            transformed.y *= 1.0 + sin(uTime * 2.0) * 0.015;
            transformed.z *= 1.0 - sin(uTime * 2.0) * 0.01;
            `
          );
        };
      }
      return m;
    };

    return {
      body,
      wingL,
      wingR,
      bodyMat: updateMat(bodyMat, false),
      wingLMat: updateMat(wingLMat, true),
      wingRMat: updateMat(wingRMat, true),
      bodyPos,
      wingLPos,
      wingRPos
    };
  }, [scene]);

  const scale = 0.55;

  if (!parts.body) return null;

  return (
    <group ref={penguinRef}>
      <group scale={[scale, scale, scale]} rotation={[0, Math.PI, 0]}>
        {parts.body && parts.bodyMat && (
          <mesh geometry={parts.body} material={parts.bodyMat} position={parts.bodyPos} />
        )}

        <group ref={leftWingRef} position={parts.wingLPos}>
          {parts.wingL && parts.wingLMat && (
            <mesh geometry={parts.wingL} material={parts.wingLMat} />
          )}
        </group>

        <group ref={rightWingRef} position={parts.wingRPos}>
          {parts.wingR && parts.wingRMat && (
            <mesh geometry={parts.wingR} material={parts.wingRMat} />
          )}
        </group>
      </group>
    </group>
  );
}
