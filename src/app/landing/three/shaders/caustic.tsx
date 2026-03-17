import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { ScreenQuad } from "@react-three/drei";
import * as THREE from "three";
import { cameraYRef } from "../OceanEnvironment";

export const causticGLSL = /* glsl */ `
float caustic(vec2 uv, float time) {
  vec2 p = uv * 8.0;
  float c1 = sin(p.x * 1.2 + time) * sin(p.y * 0.9 + time * 0.7);
  float c2 = sin(p.x * 0.8 - time * 0.5) * sin(p.y * 1.3 + time * 0.4);
  return smoothstep(0.0, 0.5, (c1 + c2) * 0.5 + 0.5);
}
`;

const overlayVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const overlayFragmentShader = /* glsl */ `
uniform float uTime;
uniform float uDepthFactor;
varying vec2 vUv;

${causticGLSL}

void main() {
  float causticValue = caustic(vUv, uTime);
  vec3 color = vec3(0.22, 0.51, 0.97);
  float alpha = causticValue * uDepthFactor * 0.06;
  gl_FragColor = vec4(color * alpha, alpha);
}
`;

export function CausticOverlay3D() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDepthFactor: { value: 0 },
    }),
    []
  );

  useFrame((_, delta) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value += delta;
    materialRef.current.uniforms.uDepthFactor.value = Math.max(
      0,
      Math.min(1, (cameraYRef.current + 2) / 12)
    );
  });

  return (
    <ScreenQuad renderOrder={998}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={overlayVertexShader}
        fragmentShader={overlayFragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        transparent={true}
      />
    </ScreenQuad>
  );
}
