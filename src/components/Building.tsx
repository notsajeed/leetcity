"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BuildingConfig } from "@/types/leetcode";

interface BuildingProps {
  config: BuildingConfig;
  position?: [number, number, number];
  selected?: boolean;
  onClick?: () => void;
}

// Shared geometries and materials — created once, reused across all buildings
const BOX_GEO = new THREE.BoxGeometry(1, 1, 1);
const WINDOW_GEO = new THREE.BoxGeometry(0.12, 0.18, 0.02);
const CYLINDER_GEO = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6);
const SPHERE_GEO = new THREE.SphereGeometry(0.08, 8, 8);

const BODY_MAT = new THREE.MeshStandardMaterial({
  color: "#0a0f1a",
  roughness: 0.3,
  metalness: 0.7,
});
const BODY_SEL_MAT = new THREE.MeshStandardMaterial({
  color: "#0d1f3a",
  roughness: 0.3,
  metalness: 0.7,
  emissive: new THREE.Color("#001a40"),
  emissiveIntensity: 0.3,
});
const ROOF_MAT = new THREE.MeshStandardMaterial({
  color: "#111827",
  roughness: 0.2,
  metalness: 0.9,
});
const ANTENNA_MAT = new THREE.MeshStandardMaterial({
  color: "#334155",
  metalness: 1,
  roughness: 0.1,
});
const TIP_RED_MAT = new THREE.MeshStandardMaterial({
  color: "#ff2200",
  emissive: new THREE.Color("#ff2200"),
  emissiveIntensity: 3,
});
const TIP_CYAN_MAT = new THREE.MeshStandardMaterial({
  color: "#00aaff",
  emissive: new THREE.Color("#00aaff"),
  emissiveIntensity: 4,
});

const WIN_EASY_MAT = new THREE.MeshStandardMaterial({
  color: "#4488ff",
  emissive: new THREE.Color("#4488ff"),
  emissiveIntensity: 1.2,
  roughness: 0,
  metalness: 0,
});
const WIN_MED_MAT = new THREE.MeshStandardMaterial({
  color: "#00ffcc",
  emissive: new THREE.Color("#00ffcc"),
  emissiveIntensity: 1.6,
  roughness: 0,
  metalness: 0,
});
const WIN_HARD_MAT = new THREE.MeshStandardMaterial({
  color: "#ffaa00",
  emissive: new THREE.Color("#ffaa00"),
  emissiveIntensity: 2.2,
  roughness: 0,
  metalness: 0,
});

interface WindowData {
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
): WindowData[] {
  const result: WindowData[] = [];
  const total = easy + medium + hard || 1;
  const hardRatio = hard / total;
  const mediumRatio = medium / total;

  // Cap floors for performance — max 60 floors regardless of height
  const floors = Math.min(60, Math.max(4, Math.floor(height * 1.2)));

  const sides = [
    { axis: "z" as const, offset: depth / 2 + 0.02, span: width },
    { axis: "z" as const, offset: -(depth / 2 + 0.02), span: width },
    { axis: "x" as const, offset: -(width / 2 + 0.02), span: depth },
    { axis: "x" as const, offset: width / 2 + 0.02, span: depth },
  ];

  for (let floor = 0; floor < floors; floor++) {
    if (Math.random() < 0.15) continue;
    const floorRatio = floor / floors;
    const y = -height / 2 + (floor / floors) * height + 0.1;

    let type: "easy" | "medium" | "hard";
    if (floorRatio >= 1 - hardRatio) type = "hard";
    else if (floorRatio >= mediumRatio * 0.3) type = "medium";
    else type = "easy";

    for (const { axis, offset, span } of sides) {
      // Cap windows per side for perf
      const count = Math.min(6, Math.max(1, Math.floor(span * 1.2)));
      for (let w = 0; w < count; w++) {
        if (Math.random() < 0.2) continue;
        const pos = -span / 2 + ((w + 0.5) / count) * span;
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

export default function Building({
  config,
  position = [0, 0, 0],
  selected = false,
  onClick,
}: BuildingProps) {
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const { height, width, depth, easySolved, mediumSolved, hardSolved } = config;

  // Instanced mesh refs for each window type
  const easyRef = useRef<THREE.InstancedMesh>(null);
  const medRef = useRef<THREE.InstancedMesh>(null);
  const hardRef = useRef<THREE.InstancedMesh>(null);

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

  // Set instanced mesh transforms once on mount
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useMemo(() => {
    const sets: [typeof easyRef, WindowData[]][] = [
      [easyRef, easyWins],
      [medRef, medWins],
      [hardRef, hardWins],
    ];
    // We set positions after mount via useFrame on first frame
  }, [easyWins, medWins, hardWins]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 0.4) * 0.04;

    if (beamRef.current && selected) {
      const mat = beamRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.8;
    }

    // Apply instanced window positions
    const pairs: [React.RefObject<THREE.InstancedMesh | null>, WindowData[]][] =
      [
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
  });

  const beamHeight = height * 0.7;

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
      {/* Main body — single mesh */}
      <mesh
        castShadow
        receiveShadow
        geometry={BOX_GEO}
        material={selected ? BODY_SEL_MAT : BODY_MAT}
        scale={[width, height, depth]}
      />

      {/* Roof */}
      <mesh
        position={[0, height / 2 + 0.15, 0]}
        geometry={BOX_GEO}
        material={ROOF_MAT}
        scale={[width * 0.85, 0.3, depth * 0.85]}
      />

      {/* Antenna */}
      <mesh
        position={[0, height / 2 + 0.6, 0]}
        geometry={CYLINDER_GEO}
        material={ANTENNA_MAT}
      />

      {/* Tip */}
      <mesh
        position={[0, height / 2 + 0.95, 0]}
        geometry={SPHERE_GEO}
        material={selected ? TIP_CYAN_MAT : TIP_RED_MAT}
      />

      {/* Selection beam */}
      {selected && (
        <mesh
          ref={beamRef}
          position={[0, height / 2 + 0.95 + beamHeight / 2, 0]}
        >
          <cylinderGeometry args={[0.05, 0.2, beamHeight, 10, 1, true]} />
          <meshStandardMaterial
            color="#00aaff"
            emissive="#00aaff"
            emissiveIntensity={2}
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Instanced windows — 3 draw calls total for all windows */}
      {easyWins.length > 0 && (
        <instancedMesh
          ref={easyRef}
          args={[WINDOW_GEO, WIN_EASY_MAT, easyWins.length]}
        />
      )}
      {medWins.length > 0 && (
        <instancedMesh
          ref={medRef}
          args={[WINDOW_GEO, WIN_MED_MAT, medWins.length]}
        />
      )}
      {hardWins.length > 0 && (
        <instancedMesh
          ref={hardRef}
          args={[WINDOW_GEO, WIN_HARD_MAT, hardWins.length]}
        />
      )}
    </group>
  );
}
