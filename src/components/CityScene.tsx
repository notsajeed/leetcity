"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import Building from "./Building";
import { statsToBuildingConfig } from "@/lib/buildingUtils";
import { getUserPosition } from "@/lib/cityStorage";
import type { LeetCodeStats } from "@/types/leetcode";

function Ground() {
  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[2000, 2000, 1, 1]} />
        <meshStandardMaterial color="#050a14" roughness={0.9} metalness={0.1} />
      </mesh>
      <gridHelper
        args={[2000, 200, "#0a2040", "#0a2040"]}
        position={[0, 0.01, 0]}
      />
    </>
  );
}

function BackgroundBuildings() {
  const positions: [number, number, number][] = [
    [-30, 0, -20],
    [-38, 0, -14],
    [-24, 0, -32],
    [-44, 0, -30],
    [-18, 0, -7],
    [-20, 0, -14],
    [-9, 0, -18],
    [30, 0, -20],
    [38, 0, -14],
    [24, 0, -32],
    [44, 0, -30],
    [18, 0, -7],
    [20, 0, -14],
    [9, 0, -18],
    [-10, 0, -14],
    [0, 0, -12],
    [10, 0, -14],
    [-4, 0, -8],
    [4, 0, -8],
    [-50, 0, -10],
    [50, 0, -10],
    [-46, 0, -42],
    [46, 0, -42],
    [0, 0, -22],
    [-14, 0, -24],
    [14, 0, -24],
  ];
  return (
    <>
      {positions.map(([x, y, z], i) => {
        const h =
          2 + Math.abs(Math.sin(i * 1.7)) * 8 + Math.abs(Math.cos(i * 2.3)) * 5;
        const w = 1 + Math.abs(Math.cos(i * 1.1)) * 1.2;
        return (
          <mesh key={i} position={[x, h / 2, z]}>
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
  users: LeetCodeStats[];
  selectedUsername: string | null;
  onSelectUser: (username: string) => void;
}

export default function CityScene({
  users,
  selectedUsername,
  onSelectUser,
}: CitySceneProps) {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        shadows={false}
        camera={{ position: [20, 14, 20], fov: 45, far: 5000 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          powerPreference: "high-performance",
        }}
        style={{ background: "#020712" }}
        performance={{ min: 0.5 }}
      >
        {/* Push fog way out so full buildings are always visible */}
        <fog attach="fog" args={["#020712", 300, 1200]} />

        <ambientLight intensity={0.08} color="#1a3a6a" />
        <directionalLight
          position={[5, 20, 5]}
          intensity={0.3}
          color="#aaccff"
        />
        <pointLight
          position={[-4, 3, 0]}
          intensity={2}
          color="#ff6600"
          distance={40}
        />
        <pointLight
          position={[4, 3, 0]}
          intensity={2}
          color="#00ccff"
          distance={40}
        />

        <Stars
          radius={800}
          depth={200}
          count={5000}
          factor={6}
          fade
          speed={0.3}
        />

        <Suspense fallback={null}>
          <Ground />
          <BackgroundBuildings />

          {users.map((stats, index) => {
            const config = statsToBuildingConfig(stats);
            const [bx, , bz] = getUserPosition(stats.username, index);
            return (
              <Building
                key={stats.username}
                config={config}
                position={[bx, config.height / 2, bz]}
                selected={selectedUsername === stats.username}
                onClick={() => onSelectUser(stats.username)}
              />
            );
          })}
        </Suspense>

        <OrbitControls
          enablePan={true}
          minDistance={4}
          maxDistance={2000}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate={users.length === 0}
          autoRotateSpeed={0.4}
        />
      </Canvas>
    </div>
  );
}
