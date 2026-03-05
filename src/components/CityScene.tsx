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
        <planeGeometry args={[400, 400, 1, 1]} />
        <meshStandardMaterial color="#050a14" roughness={0.9} metalness={0.1} />
      </mesh>
      <gridHelper
        args={[400, 80, "#0a2040", "#0a2040"]}
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
    [30, 0, -20],
    [38, 0, -14],
    [24, 0, -32],
    [44, 0, -30],
    [-20, 0, -40],
    [0, 0, -38],
    [20, 0, -40],
    [-50, 0, -10],
    [50, 0, -10],
    [-46, 0, -42],
    [46, 0, -42],
  ];
  return (
    <>
      {positions.map(([x, y, z], i) => {
        const h =
          2 + Math.abs(Math.sin(i * 1.7)) * 8 + Math.abs(Math.cos(i * 2.3)) * 5;
        const w = 1 + Math.abs(Math.cos(i * 1.1)) * 1.2;
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
        shadows
        camera={{ position: [20, 14, 20], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ background: "#020712" }}
      >
        <fog attach="fog" args={["#020712", 80, 200]} />
        <ambientLight intensity={0.08} color="#1a3a6a" />
        <directionalLight
          position={[5, 20, 5]}
          intensity={0.3}
          color="#aaccff"
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
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
          maxDistance={300}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate={users.length === 0}
          autoRotateSpeed={0.4}
        />
      </Canvas>
    </div>
  );
}
