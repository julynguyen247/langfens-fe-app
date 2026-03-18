"use client";

import React, { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
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

  const parts = useMemo(() => {
    let body: THREE.BufferGeometry | null = null;
    let wingL: THREE.BufferGeometry | null = null;
    let wingR: THREE.BufferGeometry | null = null;

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const name = child.name;
      if (name.includes("PenguinBody")) body = child.geometry;
      else if (name.includes("PenguinWingL")) wingL = child.geometry;
      else if (name.includes("PenguinWingR")) wingR = child.geometry;
    });

    return { body, wingL, wingR };
  }, [scene]);

  // Body material: vertex colors + emissive for dark ocean visibility
  const bodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        emissive: "#555555",
        emissiveIntensity: 0.5,
        roughness: 0.6,
      }),
    []
  );

  // Wing material: dark with emissive
  const wingMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1E293B",
        emissive: "#1E293B",
        emissiveIntensity: 0.4,
        roughness: 0.6,
      }),
    []
  );

  const scale = 0.55;

  if (!parts.body) return null;

  return (
    <group ref={penguinRef}>
      <group scale={[scale, scale, scale]} rotation={[0, Math.PI, 0]}>
        {/* Body — single vertex-colored mesh, eyes/beak/belly all baked in */}
        {parts.body && (
          <mesh geometry={parts.body} material={bodyMat} />
        )}

        {/* Left Wing */}
        <group ref={leftWingRef}>
          {parts.wingL && (
            <mesh geometry={parts.wingL} material={wingMat} />
          )}
        </group>

        {/* Right Wing */}
        <group ref={rightWingRef}>
          {parts.wingR && (
            <mesh geometry={parts.wingR} material={wingMat} />
          )}
        </group>
      </group>
    </group>
  );
}
