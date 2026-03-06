"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import Building from "./Building";
import Roads from "./Roads";
import { statsToBuildingConfig } from "@/lib/buildingUtils";
import { getUserPosition } from "@/lib/cityStorage";
import type { LeetCodeStats } from "@/types/leetcode";

const GROUND_MAT = new THREE.MeshStandardMaterial({
  color: "#050810",
  roughness: 1,
  metalness: 0,
});

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[8000, 8000]} />
      <primitive object={GROUND_MAT} attach="material" />
    </mesh>
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
        camera={{ position: [30, 22, 30], fov: 45, far: 8000 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          powerPreference: "high-performance",
        }}
        style={{ background: "#020712" }}
        performance={{ min: 0.5 }}
      >
        <fog attach="fog" args={["#020712", 400, 1600]} />

        <ambientLight intensity={0.5} color="#c8d8ff" />
        <directionalLight
          position={[40, 80, 40]}
          intensity={1.0}
          color="#ffffff"
        />
        <directionalLight
          position={[-30, 40, -30]}
          intensity={0.4}
          color="#aabbff"
        />
        <directionalLight
          position={[0, 20, 80]}
          intensity={0.4}
          color="#ddeeff"
        />

        <Stars
          radius={1200}
          depth={300}
          count={6000}
          factor={7}
          fade
          speed={0.3}
        />

        <Suspense fallback={null}>
          <Ground />
          <Roads />

          {users.map((stats, index) => {
            const config = statsToBuildingConfig(stats);
            const [bx, , bz] = getUserPosition(index);
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
          minDistance={6}
          maxDistance={3000}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate={users.length === 0}
          autoRotateSpeed={0.4}
        />
      </Canvas>
    </div>
  );
}
