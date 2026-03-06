"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BuildingConfig } from "@/types/leetcode";

interface BuildingProps {
  config: BuildingConfig;
  position?: [number, number, number];
  selected?: boolean;
  onClick?: () => void;
}

// Shared geometry — windows are bigger and square-ish for readability
const BODY_GEO = new THREE.BoxGeometry(1, 1, 1);
// Window: wider, taller, more visible
const WIN_GEO = new THREE.BoxGeometry(0.5, 0.6, 0.08);
const CYLINDER_GEO = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6);
const SPHERE_GEO = new THREE.SphereGeometry(0.1, 8, 8);

// Bright, saturated, clearly distinct window materials
const WIN_EASY_MAT = new THREE.MeshStandardMaterial({
  color: "#00aaff",
  emissive: new THREE.Color("#00aaff"),
  emissiveIntensity: 3,
  roughness: 0,
  metalness: 0,
});
const WIN_MED_MAT = new THREE.MeshStandardMaterial({
  color: "#ff9900",
  emissive: new THREE.Color("#ff9900"),
  emissiveIntensity: 3,
  roughness: 0,
  metalness: 0,
});
const WIN_HARD_MAT = new THREE.MeshStandardMaterial({
  color: "#ff2255",
  emissive: new THREE.Color("#ff2255"),
  emissiveIntensity: 3.5,
  roughness: 0,
  metalness: 0,
});
const BODY_MAT = new THREE.MeshStandardMaterial({
  color: "#111827",
  roughness: 0.4,
  metalness: 0.6,
});
const BODY_SEL_MAT = new THREE.MeshStandardMaterial({
  color: "#0d2040",
  roughness: 0.4,
  metalness: 0.6,
  emissive: new THREE.Color("#003060"),
  emissiveIntensity: 0.5,
});
const ROOF_MAT = new THREE.MeshStandardMaterial({
  color: "#1e293b",
  roughness: 0.2,
  metalness: 0.9,
});
const ANTENNA_MAT = new THREE.MeshStandardMaterial({
  color: "#475569",
  metalness: 1,
  roughness: 0.1,
});
const TIP_RED_MAT = new THREE.MeshStandardMaterial({
  color: "#ff2200",
  emissive: new THREE.Color("#ff2200"),
  emissiveIntensity: 4,
});
const TIP_CYAN_MAT = new THREE.MeshStandardMaterial({
  color: "#00ddff",
  emissive: new THREE.Color("#00ddff"),
  emissiveIntensity: 5,
});

interface WinData {
  x: number;
  y: number;
  z: number;
  type: "easy" | "medium" | "hard";
}

function buildWindows(
  height: number,
  width: number,
  depth: number,
  easy: number,
  medium: number,
  hard: number,
): WinData[] {
  const result: WinData[] = [];
  const total = easy + medium + hard || 1;
  const hardRatio = hard / total;
  const medRatio = medium / total;

  const floors = Math.min(50, Math.max(3, Math.floor(height / 1.4)));
  // Windows per row based on building face width — spaced 1.2 units apart
  const winsPerRowFront = Math.max(1, Math.floor((width - 0.5) / 1.2));
  const winsPerRowSide = Math.max(1, Math.floor((depth - 0.5) / 1.2));

  const sides = [
    {
      axis: "z" as const,
      offset: depth / 2 + 0.05,
      count: winsPerRowFront,
      span: width,
    },
    {
      axis: "z" as const,
      offset: -(depth / 2 + 0.05),
      count: winsPerRowFront,
      span: width,
    },
    {
      axis: "x" as const,
      offset: width / 2 + 0.05,
      count: winsPerRowSide,
      span: depth,
    },
    {
      axis: "x" as const,
      offset: -(width / 2 + 0.05),
      count: winsPerRowSide,
      span: depth,
    },
  ];

  for (let floor = 0; floor < floors; floor++) {
    if (Math.random() < 0.08) continue; // rarely skip a whole floor
    const floorRatio = floor / floors;
    const y = -height / 2 + ((floor + 0.6) / floors) * height;

    let type: "easy" | "medium" | "hard";
    if (floorRatio >= 1 - hardRatio) type = "hard";
    else if (floorRatio >= 1 - hardRatio - medRatio) type = "medium";
    else type = "easy";

    for (const { axis, offset, count, span } of sides) {
      for (let w = 0; w < count; w++) {
        if (Math.random() < 0.12) continue; // occasional dark window
        const pos = -span / 2 + 0.8 + w * 1.2;
        result.push({
          x: axis === "z" ? pos : offset,
          y,
          z: axis === "z" ? offset : pos,
          type,
        });
      }
    }
  }
  return result;
}

const dummy = new THREE.Object3D();

export default function Building({
  config,
  position = [0, 0, 0],
  selected = false,
  onClick,
}: BuildingProps) {
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const easyRef = useRef<THREE.InstancedMesh>(null);
  const medRef = useRef<THREE.InstancedMesh>(null);
  const hardRef = useRef<THREE.InstancedMesh>(null);

  const { height, width, depth, easySolved, mediumSolved, hardSolved } = config;

  const windows = useMemo(
    () =>
      buildWindows(height, width, depth, easySolved, mediumSolved, hardSolved),
    [height, width, depth, easySolved, mediumSolved, hardSolved],
  );
  const easyWins = useMemo(
    () => windows.filter((w) => w.type === "easy"),
    [windows],
  );
  const medWins = useMemo(
    () => windows.filter((w) => w.type === "medium"),
    [windows],
  );
  const hardWins = useMemo(
    () => windows.filter((w) => w.type === "hard"),
    [windows],
  );

  // Set instanced positions once
  useEffect(() => {
    const pairs: [React.RefObject<THREE.InstancedMesh | null>, WinData[]][] = [
      [easyRef, easyWins],
      [medRef, medWins],
      [hardRef, hardWins],
    ];
    for (const [ref, wins] of pairs) {
      if (!ref.current) continue;
      wins.forEach((w, i) => {
        dummy.position.set(w.x, w.y, w.z);
        dummy.updateMatrix();
        ref.current!.setMatrixAt(i, dummy.matrix);
      });
      ref.current.instanceMatrix.needsUpdate = true;
    }
  }, [easyWins, medWins, hardWins]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 0.4) * 0.04;
    }
    if (beamRef.current && selected) {
      const mat = beamRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.8;
    }
  });

  const beamH = height * 0.7;

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
      {/* Body */}
      <mesh
        geometry={BODY_GEO}
        material={selected ? BODY_SEL_MAT : BODY_MAT}
        scale={[width, height, depth]}
      />

      {/* Roof ledge */}
      <mesh
        position={[0, height / 2 + 0.2, 0]}
        geometry={BODY_GEO}
        material={ROOF_MAT}
        scale={[width + 0.3, 0.4, depth + 0.3]}
      />

      {/* Antenna */}
      <mesh
        position={[0, height / 2 + 0.8, 0]}
        geometry={CYLINDER_GEO}
        material={ANTENNA_MAT}
      />

      {/* Tip */}
      <mesh
        position={[0, height / 2 + 1.25, 0]}
        geometry={SPHERE_GEO}
        material={selected ? TIP_CYAN_MAT : TIP_RED_MAT}
      />

      {/* Selection beam */}
      {selected && (
        <mesh ref={beamRef} position={[0, height / 2 + 1.25 + beamH / 2, 0]}>
          <cylinderGeometry args={[0.05, 0.25, beamH, 10, 1, true]} />
          <meshStandardMaterial
            color="#00ddff"
            emissive="#00ddff"
            emissiveIntensity={2}
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Instanced windows — 3 draw calls total */}
      {easyWins.length > 0 && (
        <instancedMesh
          ref={easyRef}
          args={[WIN_GEO, WIN_EASY_MAT, easyWins.length]}
        />
      )}
      {medWins.length > 0 && (
        <instancedMesh
          ref={medRef}
          args={[WIN_GEO, WIN_MED_MAT, medWins.length]}
        />
      )}
      {hardWins.length > 0 && (
        <instancedMesh
          ref={hardRef}
          args={[WIN_GEO, WIN_HARD_MAT, hardWins.length]}
        />
      )}
    </group>
  );
}
