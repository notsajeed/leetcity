"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import Building from "./Building";
import { statsToBuildingConfig } from "@/lib/buildingUtils";
import type { LeetCodeStats } from "@/types/leetcode";

function Ground() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      receiveShadow
    >
      <planeGeometry args={[400, 400, 1, 1]} />
      <meshStandardMaterial color="#050a14" roughness={0.9} metalness={0.1} />
    </mesh>
  );
}

function GridOverlay() {
  return (
    <gridHelper
      args={[400, 80, "#0a2040", "#0a2040"]}
      position={[0, 0.01, 0]}
    />
  );
}

function BackgroundBuildings() {
  const positions: [number, number, number][] = [
    [-8, 0, -6],
    [-12, 0, -4],
    [-6, 0, -10],
    [-14, 0, -10],
    [-18, 0, -7],
    [-20, 0, -14],
    [-9, 0, -18],
    [8, 0, -6],
    [12, 0, -4],
    [6, 0, -10],
    [14, 0, -10],
    [18, 0, -7],
    [20, 0, -14],
    [9, 0, -18],
    [-10, 0, -14],
    [0, 0, -12],
    [10, 0, -14],
    [-4, 0, -8],
    [4, 0, -8],
    [-25, 0, -10],
    [25, 0, -10],
    [-22, 0, -20],
    [22, 0, -20],
    [0, 0, -22],
    [-14, 0, -24],
    [14, 0, -24],
  ];

  return (
    <>
      {positions.map(([x, y, z], i) => {
        const h =
          1.5 +
          Math.abs(Math.sin(i * 1.7)) * 6 +
          Math.abs(Math.cos(i * 2.3)) * 4;
        const w = 0.8 + Math.abs(Math.cos(i * 1.1)) * 0.8;
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

interface CitySceneProps {
  stats: LeetCodeStats | null;
  isLoading: boolean;
}

export default function CityScene({ stats, isLoading }: CitySceneProps) {
  const config = stats ? statsToBuildingConfig(stats) : null;

  // Push camera back based on building height so it always fits in view
  const camDistance = config ? Math.max(14, config.height * 1.4) : 14;
  const camHeight = config ? Math.max(8, config.height * 0.6) : 8;

  // Fog starts well beyond the plane edges
  const fogNear = 60;
  const fogFar = 180;

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        shadows
        camera={{ position: [camDistance, camHeight, camDistance], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ background: "#020712" }}
      >
        <fog attach="fog" args={["#020712", fogNear, fogFar]} />
        <ambientLight intensity={0.08} color="#1a3a6a" />
        <directionalLight
          position={[5, 20, 5]}
          intensity={0.3}
          color="#aaccff"
          castShadow
          shadow-mapSize={[2048, 2048]}
        />

        {/* Neon accent lights — scale with building */}
        <pointLight
          position={[-4, 3, 0]}
          intensity={2}
          color="#ff6600"
          distance={20}
        />
        <pointLight
          position={[4, 3, 0]}
          intensity={2}
          color="#00ccff"
          distance={20}
        />
        <pointLight
          position={[0, 1, 4]}
          intensity={1}
          color="#00ffaa"
          distance={14}
        />

        <Stars
          radius={120}
          depth={60}
          count={4000}
          factor={4}
          fade
          speed={0.4}
        />

        <Suspense fallback={null}>
          <Ground />
          <GridOverlay />
          <BackgroundBuildings />

          {config && !isLoading && (
            <Building config={config} position={[0, config.height / 2, 0]} />
          )}

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
          maxDistance={300}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate={!stats && !isLoading}
          autoRotateSpeed={0.4}
          target={[0, config ? config.height * 0.4 : 2, 0]}
        />
      </Canvas>
    </div>
  );
}
