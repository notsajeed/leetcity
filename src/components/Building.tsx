"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BuildingConfig } from "@/types/leetcode";

interface WindowLight {
  x: number;
  y: number;
  z: number;
  color: string;
  intensity: number;
}

interface BuildingProps {
  config: BuildingConfig;
  position?: [number, number, number];
  selected?: boolean;
  onClick?: () => void;
}

export default function Building({
  config,
  position = [0, 0, 0],
  selected = false,
  onClick,
}: BuildingProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { height, width, depth, easySolved, mediumSolved, hardSolved } = config;

  useFrame((state) => {
    if (!groupRef.current) return;
    const bob = Math.sin(state.clock.elapsedTime * 0.4) * 0.04;
    groupRef.current.position.y = position[1] + bob;

    // Pulse scale when selected
    if (selected) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.012;
      groupRef.current.scale.setScalar(pulse);
    } else {
      groupRef.current.scale.setScalar(1);
    }
  });

  const windows = useMemo<WindowLight[]>(() => {
    const result: WindowLight[] = [];
    const total = easySolved + mediumSolved + hardSolved || 1;
    const floors = Math.max(4, Math.floor(height * 2));

    const sides = [
      { axis: "z" as const, offset: depth / 2 + 0.02, span: width },
      { axis: "z" as const, offset: -(depth / 2 + 0.02), span: width },
      { axis: "x" as const, offset: -(width / 2 + 0.02), span: depth },
      { axis: "x" as const, offset: width / 2 + 0.02, span: depth },
    ];

    for (let floor = 0; floor < floors; floor++) {
      if (Math.random() < 0.2) continue;
      const floorRatio = floor / floors;
      const y = -height / 2 + (floor / floors) * height + 0.1;

      const hardRatio = hardSolved / total;
      const mediumRatio = mediumSolved / total;

      let color: string;
      let intensity: number;

      if (floorRatio >= 1 - hardRatio) {
        color = Math.random() > 0.3 ? "#ffaa00" : "#ff6600";
        intensity = 2.0 + Math.random() * 1.5;
      } else if (floorRatio >= mediumRatio * 0.3) {
        color = Math.random() > 0.3 ? "#00ffcc" : "#00aaff";
        intensity = 1.2 + Math.random() * 0.8;
      } else {
        color = Math.random() > 0.4 ? "#4488ff" : "#2255cc";
        intensity = 0.8 + Math.random() * 0.6;
      }

      for (const { axis, offset, span } of sides) {
        const count = Math.max(1, Math.floor(span * 1.5));
        for (let w = 0; w < count; w++) {
          if (Math.random() < 0.2) continue;
          const pos = -span / 2 + ((w + 0.5) / count) * span;
          result.push({
            x: axis === "z" ? pos : offset,
            y,
            z: axis === "z" ? offset : pos,
            color,
            intensity,
          });
        }
      }
    }
    return result;
  }, [config]);

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      {/* Selection ring on ground */}
      {selected && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -height / 2 + 0.05, 0]}
        >
          <ringGeometry
            args={[
              Math.max(width, depth) * 0.8,
              Math.max(width, depth) * 1.1,
              32,
            ]}
          />
          <meshStandardMaterial
            color="#00aaff"
            emissive="#00aaff"
            emissiveIntensity={2}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}

      {/* Main body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={selected ? "#0d1f3a" : "#0a0f1a"}
          roughness={0.3}
          metalness={0.7}
          emissive={selected ? "#001a40" : "#000000"}
          emissiveIntensity={selected ? 0.3 : 0}
        />
      </mesh>

      {/* Roof */}
      <mesh position={[0, height / 2 + 0.15, 0]} castShadow>
        <boxGeometry args={[width * 0.85, 0.3, depth * 0.85]} />
        <meshStandardMaterial color="#111827" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Antenna */}
      <mesh position={[0, height / 2 + 0.6, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
        <meshStandardMaterial color="#334155" metalness={1} roughness={0.1} />
      </mesh>
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
            roughness={0}
            metalness={0}
          />
        </mesh>
      ))}
    </group>
  );
}
