"use client";

/**
 * Underwater 3D environment: fog, lighting, and subtle ground plane.
 * Kept minimal for performance.
 */
export default function OceanEnvironment() {
  return (
    <>
      {/* Fog for depth fade — starts at 8 so penguin (at z=0-2) is clearly visible from camera (z=5) */}
      <fog attach="fog" args={["#040B14", 8, 30]} />

      {/* Cool blue ambient light */}
      <ambientLight intensity={0.3} color="#2563EB" />

      {/* Key light from above (simulating surface light) */}
      <directionalLight
        position={[2, 8, 4]}
        intensity={0.6}
        color="#3B82F6"
      />

      {/* Subtle fill from below (underwater caustic bounce) */}
      <directionalLight
        position={[-3, -2, 2]}
        intensity={0.15}
        color="#06D6A0"
      />

      {/* Ground plane (very dark, barely visible) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          color="#040B14"
          transparent
          opacity={0.5}
        />
      </mesh>
    </>
  );
}
