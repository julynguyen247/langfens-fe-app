"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cameraYRef } from "./OceanEnvironment";

// LatheGeometry profile: 10-point whale silhouette (tail tip to nose)
const WHALE_PROFILE = [
  new THREE.Vector2(0, -3.5),      // 0: tail tip
  new THREE.Vector2(0.12, -3.0),   // 1: peduncle start (very narrow)
  new THREE.Vector2(0.18, -2.3),   // 2: peduncle mid
  new THREE.Vector2(0.42, -1.2),   // 3: body widens
  new THREE.Vector2(0.65, -0.2),   // 4: near-widest (belly)
  new THREE.Vector2(0.70, 0.5),    // 5: widest midsection
  new THREE.Vector2(0.55, 1.2),    // 6: narrows toward head
  new THREE.Vector2(0.50, 1.8),    // 7: lower jaw
  new THREE.Vector2(0.72, 2.3),    // 8: melon (forehead bulge)
  new THREE.Vector2(0, 3.0),       // 9: rostrum tip
];

// Fresnel edge-glow shader
const whaleVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const whaleFragmentShader = /* glsl */ `
uniform float uTime;
uniform float uGlowIntensity;
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
  float fresnel = 1.0 - abs(dot(vNormal, vViewDir));
  fresnel = pow(fresnel, 3.0);
  vec3 bodyColor = vec3(0.06, 0.06, 0.14);
  float pulse = 0.85 + sin(uTime * 0.4) * 0.15;
  vec3 glowColor = vec3(0.2, 0.4, 0.9) * fresnel * uGlowIntensity * pulse;
  vec3 finalColor = bodyColor + glowColor;
  float alpha = 0.55 + fresnel * 0.35;
  gl_FragColor = vec4(finalColor, alpha);
}
`;

// Precomputed geometries
const _whaleBodyGeom = new THREE.LatheGeometry(WHALE_PROFILE, 10);
const _flukeGeom = (() => {
  const geom = new THREE.PlaneGeometry(1.8, 0.8, 4, 2); // 4 width segments for notch
  const posAttr = geom.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    // Curve trailing edge downward for scoop shape
    posAttr.setZ(i, posAttr.getZ(i) - Math.abs(x) ** 2 * 0.15);
    // Center notch: pull center trailing-edge vertices backward
    if (Math.abs(x) < 0.2 && y < -0.2) {
      posAttr.setY(i, y + 0.25);
    }
    // Serrated trailing edge
    if (y < -0.1) {
      posAttr.setZ(i, posAttr.getZ(i) + Math.sin(x * 8) * 0.02);
    }
  }
  geom.computeVertexNormals();
  return geom;
})();

// Tubercle bumps on the rostrum (humpback signature feature)
const _tubercleGeom = (() => {
  const bumps: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const rowOffset = (i % 2) * 0.12;
    const bump = new THREE.SphereGeometry(0.06, 3, 2);
    bump.translate(
      Math.cos(angle) * (0.4 + rowOffset),
      2.2 + (i / 10) * 0.6,
      Math.sin(angle) * (0.4 + rowOffset)
    );
    bumps.push(bump);
  }
  const merged = mergeGeometries(bumps);
  bumps.forEach(b => b.dispose());
  return merged;
})();

// Dorsal hump (the "humpback" feature — a raised mound before the dorsal fin)
const _dorsalHumpGeom = new THREE.SphereGeometry(0.15, 4, 3);
const _pectoralGeom = (() => {
  const geom = new THREE.PlaneGeometry(2.5, 0.5, 5, 1); // 5 width segments
  const posAttr = geom.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    // Quadratic taper (more organic than linear)
    const t = (x + 1.25) / 2.5;
    const taper = 1.0 - t * t * 0.8;
    posAttr.setY(i, posAttr.getY(i) * taper);
    // Leading edge tubercle bumps (unique to humpbacks)
    if (posAttr.getY(i) > 0) {
      posAttr.setZ(i, posAttr.getZ(i) + Math.sin(x * 4) * 0.02);
    }
  }
  geom.computeVertexNormals();
  return geom;
})();
const _dorsalGeom = (() => {
  const geom = new THREE.PlaneGeometry(0.4, 0.6, 1, 1);
  // Pinch top to triangle
  const posAttr = geom.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    if (posAttr.getY(i) > 0) {
      posAttr.setX(i, posAttr.getX(i) * 0.1);
    }
  }
  geom.computeVertexNormals();
  return geom;
})();

export default function WhaleSilhouette() {
  const groupRef = useRef<THREE.Group>(null);
  const innerGroupRef = useRef<THREE.Group>(null);
  const flukeLeftRef = useRef<THREE.Mesh>(null);
  const flukeRightRef = useRef<THREE.Mesh>(null);
  const pecLeftRef = useRef<THREE.Mesh>(null);
  const pecRightRef = useRef<THREE.Mesh>(null);
  const prevPos = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  const bodyUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uGlowIntensity: { value: 1.0 },
    }),
    []
  );

  const bodyMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: whaleVertexShader,
        fragmentShader: whaleFragmentShader,
        uniforms: bodyUniforms,
        transparent: true,
        side: THREE.FrontSide,
        depthWrite: true,
      }),
    [bodyUniforms]
  );

  const finMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: whaleVertexShader,
        fragmentShader: whaleFragmentShader,
        uniforms: {
          uTime: bodyUniforms.uTime,
          uGlowIntensity: { value: 1.2 },
        },
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [bodyUniforms]
  );

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const time = clock.getElapsedTime();

    // Visibility: deep zone only
    const camY = cameraYRef.current;
    const visible = camY < -18 && camY > -27;
    group.visible = visible;
    if (!visible) return;

    // Slow majestic orbit (wider path for massive feel)
    const x = Math.sin(time * 0.035) * 30;
    const y = -22;
    const z = Math.cos(time * 0.035) * 18 - 22;
    group.position.set(x, y, z);

    // Smoothed heading rotation
    if (initialized.current) {
      const dx = x - prevPos.current.x;
      const dz = z - prevPos.current.z;
      if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001) {
        const targetRotY = Math.atan2(dx, dz);
        group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotY, delta * 0.5);
      }
    }
    prevPos.current.set(x, y, z);
    initialized.current = true;

    // Tail flukes: UP/DOWN (horizontal movement, not side-to-side)
    const flukeAngle = Math.sin(time * 0.25) * 0.12;
    if (flukeLeftRef.current) flukeLeftRef.current.rotation.x = flukeAngle;
    if (flukeRightRef.current) flukeRightRef.current.rotation.x = flukeAngle;

    // Body pitch synced to tail
    if (innerGroupRef.current) {
      innerGroupRef.current.rotation.x = -Math.PI / 2 + Math.sin(time * 0.25) * 0.015;
    }

    // Pectoral fin subtle animation
    if (pecLeftRef.current) {
      pecLeftRef.current.rotation.z = 0.3 + Math.sin(time * 0.15 + 1.0) * 0.03;
    }
    if (pecRightRef.current) {
      pecRightRef.current.rotation.z = -0.3 - Math.sin(time * 0.15 + 1.0) * 0.03;
    }

    // Update shader time
    bodyUniforms.uTime.value = time;
  });

  return (
    <group ref={groupRef} scale={[2.5, 2.5, 2.5]}>
      {/* Body oriented so Y+ (nose) points toward Z+ (forward) */}
      <group ref={innerGroupRef} rotation={[-Math.PI / 2, 0, 0]} scale={[1.0, 0.75, 1.3]}>
        <mesh geometry={_whaleBodyGeom} material={bodyMaterial} />
      </group>

      {/* Tail flukes: HORIZONTAL with center gap (notch) */}
      <mesh
        ref={flukeLeftRef}
        geometry={_flukeGeom}
        material={finMaterial}
        position={[-0.4, 0, -3.5]}
        rotation={[-Math.PI / 2, 0, -0.15]}
      />
      <mesh
        ref={flukeRightRef}
        geometry={_flukeGeom}
        material={finMaterial}
        position={[0.4, 0, -3.5]}
        rotation={[-Math.PI / 2, 0, 0.15]}
      />

      {/* Pectoral fins: long, swept */}
      <mesh
        ref={pecLeftRef}
        geometry={_pectoralGeom}
        material={finMaterial}
        position={[-0.7, -0.1, 0.8]}
        rotation={[0, 0, 0.3]}
      />
      <mesh
        ref={pecRightRef}
        geometry={_pectoralGeom}
        material={finMaterial}
        position={[0.7, -0.1, 0.8]}
        rotation={[0, 0, -0.3]}
      />

      {/* Tubercle bumps on rostrum (humpback signature) */}
      {_tubercleGeom && (
        <group rotation={[-Math.PI / 2, 0, 0]} scale={[1.0, 0.75, 1.3]}>
          <mesh geometry={_tubercleGeom} material={bodyMaterial} />
        </group>
      )}

      {/* Dorsal hump (the "humpback" — raised mound before dorsal fin) */}
      <mesh
        geometry={_dorsalHumpGeom}
        material={finMaterial}
        position={[0, 0.6, -1.1]}
        scale={[1.5, 0.6, 1.2]}
      />

      {/* Dorsal fin: small triangle */}
      <mesh
        geometry={_dorsalGeom}
        material={finMaterial}
        position={[0, 0.65, -1.5]}
        rotation={[0.2, 0, 0]}
      />
    </group>
  );
}
