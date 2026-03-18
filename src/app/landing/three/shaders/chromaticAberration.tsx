import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { ScreenQuad } from "@react-three/drei";
import * as THREE from "three";
import { cameraYRef } from "../OceanEnvironment";

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform float uIntensity;
varying vec2 vUv;

void main() {
  // Offset UV for each color channel
  vec2 dir = vUv - 0.5;
  float dist = length(dir);

  // Chromatic aberration: shift R and B channels outward from center
  float aberration = uIntensity * dist * 0.02;

  // Red shifts outward, blue shifts inward
  vec2 rUv = vUv + dir * aberration;
  vec2 gUv = vUv;
  vec2 bUv = vUv - dir * aberration;

  // Since we can't sample the scene texture (no postprocessing lib),
  // create a subtle color fringe overlay instead
  float rMask = smoothstep(0.3, 0.7, length(rUv - 0.5) * 2.0);
  float bMask = smoothstep(0.3, 0.7, length(bUv - 0.5) * 2.0);

  // Edge-only color fringing
  float edgeFactor = smoothstep(0.2, 0.6, dist);

  vec3 color = vec3(
    rMask * 0.15,   // red fringe at edges
    0.0,
    bMask * 0.1     // blue fringe at edges
  ) * edgeFactor;

  float alpha = uIntensity * edgeFactor * 0.3;

  gl_FragColor = vec4(color, alpha);
}
`;

export function ChromaticAberrationOverlay() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uIntensity: { value: 0 },
    }),
    []
  );

  useFrame(() => {
    if (!materialRef.current) return;

    materialRef.current.uniforms.uIntensity.value = Math.max(
      0,
      (Math.abs(cameraYRef.current) - 14) / 14
    );
  });

  return (
    <ScreenQuad renderOrder={996}>
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
