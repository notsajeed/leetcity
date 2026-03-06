"use client";

import { Suspense, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import Building from "./Building";
import Roads from "./Roads";
import { statsToBuildingConfig } from "@/lib/buildingUtils";
import { getUserPosition } from "@/lib/cityStorage";
import type { LeetCodeStats } from "@/types/leetcode";

// Clear separation eliminates z-fighting entirely

interface SceneProps {
  users: LeetCodeStats[];
  selectedUsername: string | null;
  onSelectUser: (username: string) => void;
}

function Scene({ users, selectedUsername, onSelectUser }: SceneProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    if (!controlsRef.current || !selectedUsername) return;
    const idx = users.findIndex((u) => u.username === selectedUsername);
    if (idx === -1) return;
    const [bx, , bz] = getUserPosition(idx);
    const config = statsToBuildingConfig(users[idx]);
    const to = new THREE.Vector3(bx, config.height * 0.3, bz);
    const from = controlsRef.current.target.clone();
    let frame = 0;
    const animate = () => {
      if (!controlsRef.current) return;
      frame++;
      const t = Math.min(frame / 24, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      controlsRef.current.target.lerpVectors(from, to, ease);
      controlsRef.current.update();
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [selectedUsername, users]);

  return (
    <>
      <fog attach="fog" args={["#020712", 500, 2000]} />
      <ambientLight intensity={1.2} color="#ffffff" />
      <directionalLight
        position={[50, 100, 50]}
        intensity={1.5}
        color="#ffffff"
      />
      <directionalLight
        position={[-50, 60, -50]}
        intensity={0.8}
        color="#aabbff"
      />
      <directionalLight
        position={[0, 30, 80]}
        intensity={0.6}
        color="#ffffff"
      />
      <directionalLight
        position={[0, 30, -80]}
        intensity={0.6}
        color="#ffffff"
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
        <Roads />
        {users.map((stats, index) => {
          const config = statsToBuildingConfig(stats);
          const [bx, , bz] = getUserPosition(index);
          return (
            <Building
              key={stats.username}
              config={config}
              position={[bx, config.height / 2 + 0.02, bz]}
              selected={selectedUsername === stats.username}
              onClick={() => onSelectUser(stats.username)}
            />
          );
        })}
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        panSpeed={2}
        screenSpacePanning={false}
        minDistance={2}
        maxDistance={3000}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate={users.length === 0}
        autoRotateSpeed={0.4}
        makeDefault
      />
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
        camera={{ position: [30, 22, 30], fov: 45, near: 0.01, far: 8000 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          powerPreference: "high-performance",
        }}
        style={{ background: "#020712" }}
        performance={{ min: 0.5 }}
      >
        <Scene
          users={users}
          selectedUsername={selectedUsername}
          onSelectUser={onSelectUser}
        />
      </Canvas>
    </div>
  );
}
