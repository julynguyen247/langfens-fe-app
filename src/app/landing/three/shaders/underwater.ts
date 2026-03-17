// Exponential² underwater fog GLSL snippets
// Used by: OceanTerrain, CoralField custom ShaderMaterials
// Scene-level fog uses THREE.Fog (linear) — this provides denser fog for custom materials

export const underwaterFogPars = /* glsl */ `
uniform vec3 uFogColor;
uniform float uFogDensity;
`;

export const underwaterFogFragment = /* glsl */ `
float fogDepth = length(vViewPosition);
float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * fogDepth * fogDepth);
fogFactor = clamp(fogFactor, 0.0, 1.0);
gl_FragColor.rgb = mix(gl_FragColor.rgb, uFogColor, fogFactor);
`;
