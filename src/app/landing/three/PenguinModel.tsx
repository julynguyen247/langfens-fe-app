"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";

/**
 * Lottie penguin rendered as a 2D billboard in the 3D scene.
 *
 * Pipeline: lottie-web → hidden DOM container → canvas element → THREE.CanvasTexture → Billboard plane
 *
 * lottie-web's canvas renderer needs a DOM-attached container.
 * We create a hidden div, let lottie create its canvas inside, then use that canvas as texture source.
 */

interface PenguinModelProps {
  scrollProgress: number;
  currentSection: string;
}

// 3D plane size in world units (penguin.json is 766x864 ≈ 0.887:1 aspect)
const PLANE_W = 2.4;
const PLANE_H = 2.7;

export default function PenguinModel({
  scrollProgress,
}: PenguinModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const [ready, setReady] = useState(false);

  const accentColor = useRef(new THREE.Color("#2563EB")).current;

  useEffect(() => {
    let destroyed = false;
    let animInstance: import("lottie-web").AnimationItem | null = null;
    let containerDiv: HTMLDivElement | null = null;

    (async () => {
      const lottie = (await import("lottie-web")).default;
      if (destroyed) return;

      // Create a hidden DOM container — lottie-web needs this attached to the DOM
      containerDiv = document.createElement("div");
      containerDiv.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:512px;height:576px;pointer-events:none;opacity:0;";
      document.body.appendChild(containerDiv);

      // Let lottie-web create and manage its own canvas inside the container
      animInstance = lottie.loadAnimation({
        container: containerDiv,
        renderer: "canvas",
        loop: true,
        autoplay: true,
        path: "/animation/penguin.json",
        rendererSettings: {
          clearCanvas: true,
          preserveAspectRatio: "xMidYMid meet",
        },
      });

      animInstance.addEventListener("DOMLoaded", () => {
        if (destroyed) return;

        // Find the canvas that lottie-web created
        const canvas = containerDiv?.querySelector("canvas");
        if (!canvas) {
          console.warn("PenguinModel: lottie canvas not found");
          return;
        }

        // Create THREE texture from lottie's canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        textureRef.current = texture;
        setReady(true);
      });
    })();

    return () => {
      destroyed = true;
      if (animInstance) animInstance.destroy();
      if (containerDiv && containerDiv.parentNode) {
        containerDiv.parentNode.removeChild(containerDiv);
      }
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
    };
  }, []);

  // Per-frame: update texture + idle bobbing
  useFrame(() => {
    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
    if (groupRef.current) {
      const time = performance.now() * 0.001;
      groupRef.current.position.y = Math.sin(time * 1.2) * 0.12;
    }
  });

  return (
    <group ref={groupRef} scale={1}>
      {/* Lottie penguin billboard */}
      {ready && textureRef.current && (
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <mesh>
            <planeGeometry args={[PLANE_W, PLANE_H]} />
            <meshBasicMaterial
              map={textureRef.current}
              transparent
              alphaTest={0.01}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </Billboard>
      )}

      {/* Accent glow ring behind penguin */}
      <mesh position={[0, 0, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.015, 8, 32]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={0.25}
        />
      </mesh>
    </group>
  );
}
