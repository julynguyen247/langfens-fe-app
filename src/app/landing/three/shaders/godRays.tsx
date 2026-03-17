import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { ScreenQuad } from "@react-three/drei";
import * as THREE from "three";
import { cameraYRef } from "../OceanEnvironment";
import { simplexNoise3D } from "./noise";

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform vec2 uLightPos;
uniform float uTime;
uniform float uDepthFactor;
varying vec2 vUv;

${simplexNoise3D}

void main() {
  vec2 dir = vUv - uLightPos;
  float dist = length(dir);

  float noise = snoise(vec3(vUv * 3.0, uTime * 0.3));
  float falloff = exp(-dist * 2.0);
  float shaftIntensity = max(0.0, noise * 0.5 + 0.5) * falloff;

  vec3 color = vec3(0.22, 0.51, 0.97);
  float alpha = shaftIntensity * uDepthFactor * 0.25;

  gl_FragColor = vec4(color * alpha, alpha);
}
`;

export function GodRaysOverlay() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const sunWorldPos = useRef(new THREE.Vector3(0, 20, -5));

  const uniforms = useMemo(
    () => ({
      uLightPos: { value: new THREE.Vector2(0.5, 1.0) },
      uTime: { value: 0 },
      uDepthFactor: { value: 0 },
    }),
    []
  );

  useFrame(({ camera, clock }) => {
    if (!materialRef.current) return;

    const sunScreen = sunWorldPos.current.clone().project(camera);
    materialRef.current.uniforms.uLightPos.value.set(
      (sunScreen.x + 1) / 2,
      (sunScreen.y + 1) / 2
    );

    materialRef.current.uniforms.uTime.value = clock.getElapsedTime();

    materialRef.current.uniforms.uDepthFactor.value = Math.max(
      0,
      Math.min(0.3, cameraYRef.current * 0.05 + 0.1)
    );
  });

  return (
    <ScreenQuad renderOrder={999}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        transparent={true}
      />
    </ScreenQuad>
  );
}
