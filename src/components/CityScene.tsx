"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Stars, Fog } from "@react-three/drei";
import * as THREE from "three";
import Building from "./Building";
import { statsToBuildingConfig } from "@/lib/buildingUtils";
import type { LeetCodeStats } from "@/types/leetcode";

// Ground grid plane
function Ground() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      receiveShadow
    >
      <planeGeometry args={[60, 60, 40, 40]} />
      <meshStandardMaterial
        color="#050a14"
        roughness={0.8}
        metalness={0.2}
        wireframe={false}
      />
    </mesh>
  );
}

// Glowing grid lines overlay
function GridOverlay() {
  return (
    <gridHelper args={[60, 40, "#0a2040", "#0a2040"]} position={[0, 0.01, 0]} />
  );
}

// Background decorative buildings (filler city)
function BackgroundBuildings() {
  const positions: [number, number, number][] = [
    [-8, 0, -6],
    [-12, 0, -4],
    [-6, 0, -10],
    [-14, 0, -10],
    [8, 0, -6],
    [12, 0, -4],
    [6, 0, -10],
    [14, 0, -10],
    [-10, 0, -14],
    [0, 0, -12],
    [10, 0, -14],
    [-4, 0, -8],
    [4, 0, -8],
  ];

  return (
    <>
      {positions.map(([x, y, z], i) => {
        const h = 1.5 + Math.sin(i * 1.7) * 3 + Math.cos(i * 2.3) * 2;
        const w = 0.8 + Math.cos(i * 1.1) * 0.6;
        return (
          <mesh key={i} position={[x, h / 2, z]} castShadow>
            <boxGeometry args={[w, h, w]} />
            <meshStandardMaterial
              color="#060d1a"
              roughness={0.5}
              metalness={0.5}
            />
          </mesh>
        );
      })}
    </>
  );
}

// Slowly rotating camera rig for idle animation
function AutoRotate({ enabled }: { enabled: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!enabled) return;
    state.camera.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 14;
    state.camera.position.z = Math.cos(state.clock.elapsedTime * 0.1) * 14;
    state.camera.lookAt(0, 2, 0);
  });
  return null;
}

interface CitySceneProps {
  stats: LeetCodeStats | null;
  isLoading: boolean;
}

export default function CityScene({ stats, isLoading }: CitySceneProps) {
  const config = stats ? statsToBuildingConfig(stats) : null;

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        shadows
        camera={{ position: [10, 8, 14], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ background: "#020712" }}
      >
        {/* Atmosphere */}
        <fog attach="fog" args={["#020712", 20, 50]} />
        <ambientLight intensity={0.08} color="#1a3a6a" />
        <directionalLight
          position={[5, 20, 5]}
          intensity={0.3}
          color="#aaccff"
          castShadow
          shadow-mapSize={[2048, 2048]}
        />

        {/* Neon accent lights */}
        <pointLight
          position={[-4, 3, 0]}
          intensity={2}
          color="#ff6600"
          distance={12}
        />
        <pointLight
          position={[4, 3, 0]}
          intensity={2}
          color="#00ccff"
          distance={12}
        />
        <pointLight
          position={[0, 1, 4]}
          intensity={1}
          color="#00ffaa"
          distance={8}
        />

        <Stars
          radius={80}
          depth={50}
          count={3000}
          factor={3}
          fade
          speed={0.5}
        />

        <Suspense fallback={null}>
          <Ground />
          <GridOverlay />
          <BackgroundBuildings />

          {/* Main building */}
          {config && !isLoading && (
            <Building config={config} position={[0, config.height / 2, 0]} />
          )}

          {/* Loading placeholder */}
          {isLoading && (
            <mesh position={[0, 2, 0]}>
              <boxGeometry args={[1.5, 4, 1.5]} />
              <meshStandardMaterial
                color="#0a1a3a"
                emissive="#003366"
                emissiveIntensity={0.5}
                roughness={0.5}
              />
            </mesh>
          )}
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={35}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate={!stats && !isLoading}
          autoRotateSpeed={0.4}
        />
      </Canvas>
    </div>
  );
}
