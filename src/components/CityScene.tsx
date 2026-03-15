"use client";

import { useSharedScene } from "@/components/SceneContext";
import { Suspense, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import Building from "./Building";
import Roads from "./Roads";
import { statsToBuildingConfig } from "@/lib/buildingUtils";
import { getUserPosition } from "@/lib/cityStorage";
import type { LeetCodeStats } from "@/types/leetcode";
interface SceneProps {
  users: LeetCodeStats[];
  selectedUsername: string | null;
  onSelectUser: (username: string) => void;
}

// Tiny component that lives inside Canvas so it can call useThree()
// and publish the R3F-managed scene into our shared context.
function ScenePublisher() {
  const { scene } = useThree();
  const { sceneRef } = useSharedScene();

  useEffect(() => {
    sceneRef.current = scene;
    return () => {
      sceneRef.current = null;
    };
  }, [scene, sceneRef]);

  return null;
}

function Scene({ users, selectedUsername, onSelectUser }: SceneProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (!controlsRef.current || !selectedUsername) return;
    const idx = users.findIndex((u) => u.username === selectedUsername);
    if (idx === -1) return;
    const [bx, , bz] = getUserPosition(idx);
    const config = statsToBuildingConfig(users[idx]);

    const targetTo   = new THREE.Vector3(bx, config.height * 0.4, bz);
    const targetFrom = controlsRef.current.target.clone();
    const camOffset  = new THREE.Vector3(
      config.width * 3 + 12,
      config.height * 0.6 + 8,
      config.depth * 3 + 12,
    );
    const camTo   = targetTo.clone().add(camOffset);
    const camFrom = camera.position.clone();

    let frame = 0;
    const FRAMES = 50;
    const animate = () => {
      if (!controlsRef.current) return;
      frame++;
      const t    = Math.min(frame / FRAMES, 1);
      const ease = 1 - Math.pow(1 - t, 4);
      controlsRef.current.target.lerpVectors(targetFrom, targetTo, ease);
      camera.position.lerpVectors(camFrom, camTo, ease);
      controlsRef.current.update();
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [selectedUsername, users, camera]);

  return (
    <>
      {/* Publishes this R3F scene into SceneContext so FlyMode can read it */}
      <ScenePublisher />

      <fog attach="fog" args={["#020712", 500, 2000]} />
      <ambientLight intensity={1.2} color="#ffffff" />
      <directionalLight position={[50, 100, 50]}   intensity={1.5} color="#ffffff" />
      <directionalLight position={[-50, 60, -50]}  intensity={0.8} color="#aabbff" />
      <directionalLight position={[0, 30, 80]}     intensity={0.6} color="#ffffff" />
      <directionalLight position={[0, 30, -80]}    intensity={0.6} color="#ffffff" />

      <Stars radius={1200} depth={300} count={6000} factor={7} fade speed={0.3} />

      <Suspense fallback={null}>
        <Roads />
        {users.map((stats, index) => {
          const config      = statsToBuildingConfig(stats);
          const [bx, , bz]  = getUserPosition(index);
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
        autoRotate={true}
        autoRotateSpeed={selectedUsername ? 1.2 : 0.4}
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
         <ScenePublisher /> 
        <Scene
          users={users}
          selectedUsername={selectedUsername}
          onSelectUser={onSelectUser}
        /> 
        
      </Canvas>
    </div>
  );
}