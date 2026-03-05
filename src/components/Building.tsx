"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BuildingConfig } from "../app/types/leetcode";

interface WindowLight {
  x: number;
  y: number;
  z: number;
  color: string;
  intensity: number;
  side: "front" | "back" | "left" | "right";
}

interface BuildingProps {
  config: BuildingConfig;
  position?: [number, number, number];
}

export default function Building({
  config,
  position = [0, 0, 0],
}: BuildingProps) {
  const groupRef = useRef<THREE.Group>(null);

  const {
    height,
    width,
    depth,
    easySolved,
    mediumSolved,
    hardSolved,
    totalSolved,
  } = config;

  // Slow idle bob
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 0.4) * 0.04;
    }
  });

  const windows = useMemo<WindowLight[]>(() => {
    const result: WindowLight[] = [];
    const total = easySolved + mediumSolved + hardSolved || 1;
    const floors = Math.max(4, Math.floor(height * 2));

    const sides: Array<{
      side: WindowLight["side"];
      axis: "x" | "z";
      offset: number;
    }> = [
      { side: "front", axis: "z", offset: depth / 2 + 0.02 },
      { side: "back", axis: "z", offset: -(depth / 2 + 0.02) },
      { side: "left", axis: "x", offset: -(width / 2 + 0.02) },
      { side: "right", axis: "x", offset: width / 2 + 0.02 },
    ];

    for (let floor = 0; floor < floors; floor++) {
      const floorRatio = floor / floors;
      const y = -height / 2 + (floor / floors) * height + 0.1;

      // Determine color by difficulty zone
      const hardRatio = hardSolved / total;
      const mediumRatio = mediumSolved / total;

      let color: string;
      let intensity: number;

      if (floorRatio >= 1 - hardRatio) {
        // Hard zone — amber glow
        color = Math.random() > 0.3 ? "#ffaa00" : "#ff6600";
        intensity = 2.0 + Math.random() * 1.5;
      } else if (
        floorRatio >= mediumRatio * 0.5 &&
        floorRatio < 1 - hardRatio
      ) {
        // Medium zone — cyan
        color = Math.random() > 0.3 ? "#00ffcc" : "#00aaff";
        intensity = 1.2 + Math.random() * 0.8;
      } else {
        // Easy zone — blue
        color = Math.random() > 0.4 ? "#4488ff" : "#2255cc";
        intensity = 0.8 + Math.random() * 0.6;
      }

      // Skip some windows randomly for realism
      if (Math.random() < 0.25) continue;

      for (const { side, axis, offset } of sides) {
        // Number of windows per floor per side based on width/depth
        const count =
          axis === "z" ? Math.floor(width * 1.5) : Math.floor(depth * 1.5);

        for (let w = 0; w < Math.max(1, count); w++) {
          if (Math.random() < 0.2) continue;

          const spread = axis === "z" ? width : depth;
          const pos = -spread / 2 + ((w + 0.5) / Math.max(1, count)) * spread;

          result.push({
            x: axis === "z" ? pos : offset,
            y,
            z: axis === "z" ? offset : pos,
            color,
            intensity,
            side,
          });
        }
      }
    }

    return result;
  }, [config]);

  return (
    <group ref={groupRef} position={position}>
      {/* Main building body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#0a0f1a" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Slight top chamfer / roof detail */}
      <mesh position={[0, height / 2 + 0.15, 0]} castShadow>
        <boxGeometry args={[width * 0.85, 0.3, depth * 0.85]} />
        <meshStandardMaterial color="#111827" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Antenna on top */}
      <mesh position={[0, height / 2 + 0.6, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
        <meshStandardMaterial color="#334155" metalness={1} roughness={0.1} />
      </mesh>

      {/* Antenna tip glow */}
      <mesh position={[0, height / 2 + 0.95, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial
          color="#ff2200"
          emissive="#ff2200"
          emissiveIntensity={3}
        />
      </mesh>

      {/* Windows */}
      {windows.map((win, i) => (
        <mesh key={i} position={[win.x, win.y, win.z]}>
          <boxGeometry args={[0.12, 0.18, 0.02]} />
          <meshStandardMaterial
            color={win.color}
            emissive={win.color}
            emissiveIntensity={win.intensity}
            roughness={0.0}
            metalness={0.0}
          />
        </mesh>
      ))}
    </group>
  );
}
