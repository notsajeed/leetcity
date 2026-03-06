"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BuildingConfig } from "@/types/leetcode";

interface BuildingProps {
  config: BuildingConfig;
  position?: [number, number, number];
  selected?: boolean;
  onClick?: () => void;
}

interface WinData {
  x: number;
  y: number;
  z: number;
  type: "easy" | "medium" | "hard";
  axis: "x" | "z"; // which face this window is on
}

const COL_STEP = 1.0;
const ROW_STEP = 1.0;
const WIN_W = 0.82;
const WIN_H = 0.82;
const WIN_D = 0.12;
const MARGIN = 0.15;

function buildWindows(
  h: number,
  w: number,
  d: number,
  easy: number,
  med: number,
  hard: number,
): WinData[] {
  const result: WinData[] = [];
  const total = easy + med + hard || 1;
  const hardR = hard / total;
  const medR = med / total;
  const rowsH = Math.max(1, Math.floor((h - MARGIN * 2) / ROW_STEP));

  const faces = [
    {
      axis: "z" as const,
      offset: d / 2 + WIN_D / 2,
      cols: Math.max(1, Math.floor((w - MARGIN * 2) / COL_STEP)),
      faceSpan: w,
    },
    {
      axis: "z" as const,
      offset: -(d / 2 + WIN_D / 2),
      cols: Math.max(1, Math.floor((w - MARGIN * 2) / COL_STEP)),
      faceSpan: w,
    },
    {
      axis: "x" as const,
      offset: w / 2 + WIN_D / 2,
      cols: Math.max(1, Math.floor((d - MARGIN * 2) / COL_STEP)),
      faceSpan: d,
    },
    {
      axis: "x" as const,
      offset: -(w / 2 + WIN_D / 2),
      cols: Math.max(1, Math.floor((d - MARGIN * 2) / COL_STEP)),
      faceSpan: d,
    },
  ];

  for (const { axis, offset, cols } of faces) {
    const startX = -((cols - 1) * COL_STEP) / 2;
    const startY = -h / 2 + MARGIN + ROW_STEP / 2;

    for (let row = 0; row < rowsH; row++) {
      const fr = row / rowsH;
      const y = startY + row * ROW_STEP;
      if (y + WIN_H / 2 > h / 2 - MARGIN) continue;

      const type: "easy" | "medium" | "hard" =
        fr >= 1 - hardR ? "hard" : fr >= 1 - hardR - medR ? "medium" : "easy";

      for (let col = 0; col < cols; col++) {
        if (Math.random() < 0.08) continue;
        const along = startX + col * COL_STEP;
        result.push({
          x: axis === "z" ? along : offset,
          y,
          z: axis === "z" ? offset : along,
          type,
          axis,
        });
      }
    }
  }
  return result;
}

// Two geometries — one for Z-facing, one for X-facing (rotated 90°)
const WIN_GEO_Z = new THREE.BoxGeometry(WIN_W, WIN_H, WIN_D); // protrudes along Z
const WIN_GEO_X = new THREE.BoxGeometry(WIN_D, WIN_H, WIN_W); // protrudes along X

const MAT_EASY = new THREE.MeshStandardMaterial({
  color: "#00aaff",
  emissive: new THREE.Color("#00aaff"),
  emissiveIntensity: 3.5,
  roughness: 0,
  metalness: 0,
});
const MAT_MED = new THREE.MeshStandardMaterial({
  color: "#ff9900",
  emissive: new THREE.Color("#ff9900"),
  emissiveIntensity: 3.5,
  roughness: 0,
  metalness: 0,
});
const MAT_HARD = new THREE.MeshStandardMaterial({
  color: "#ff2255",
  emissive: new THREE.Color("#ff2255"),
  emissiveIntensity: 4.0,
  roughness: 0,
  metalness: 0,
});

const dummy = new THREE.Object3D();

export default function Building({
  config,
  position = [0, 0, 0],
  selected = false,
  onClick,
}: BuildingProps) {
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  // 6 instanced meshes: easy-z, easy-x, med-z, med-x, hard-z, hard-x
  const easyZRef = useRef<THREE.InstancedMesh>(null);
  const easyXRef = useRef<THREE.InstancedMesh>(null);
  const medZRef = useRef<THREE.InstancedMesh>(null);
  const medXRef = useRef<THREE.InstancedMesh>(null);
  const hardZRef = useRef<THREE.InstancedMesh>(null);
  const hardXRef = useRef<THREE.InstancedMesh>(null);

  const {
    height: h,
    width: w,
    depth: d,
    easySolved,
    mediumSolved,
    hardSolved,
  } = config;

  const wins = useRef<{
    ez: WinData[];
    ex: WinData[];
    mz: WinData[];
    mx: WinData[];
    hz: WinData[];
    hx: WinData[];
  } | null>(null);

  if (!wins.current) {
    const all = buildWindows(h, w, d, easySolved, mediumSolved, hardSolved);
    wins.current = {
      ez: all.filter((w) => w.type === "easy" && w.axis === "z"),
      ex: all.filter((w) => w.type === "easy" && w.axis === "x"),
      mz: all.filter((w) => w.type === "medium" && w.axis === "z"),
      mx: all.filter((w) => w.type === "medium" && w.axis === "x"),
      hz: all.filter((w) => w.type === "hard" && w.axis === "z"),
      hx: all.filter((w) => w.type === "hard" && w.axis === "x"),
    };
  }

  useEffect(() => {
    if (!wins.current) return;
    const pairs: [React.RefObject<THREE.InstancedMesh | null>, WinData[]][] = [
      [easyZRef, wins.current.ez],
      [easyXRef, wins.current.ex],
      [medZRef, wins.current.mz],
      [medXRef, wins.current.mx],
      [hardZRef, wins.current.hz],
      [hardXRef, wins.current.hx],
    ];
    for (const [ref, ws] of pairs) {
      if (!ref.current) continue;
      ws.forEach((win, i) => {
        dummy.position.set(win.x, win.y, win.z);
        dummy.updateMatrix();
        ref.current!.setMatrixAt(i, dummy.matrix);
      });
      ref.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  useFrame((state) => {
    if (groupRef.current)
      groupRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 0.4) * 0.04;
    if (beamRef.current && selected) {
      const mat = beamRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.8;
    }
  });

  const beamH = h * 0.7;
  const wc = wins.current!;

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
      {/* Body — near-black so window gaps read as black borders */}
      <mesh scale={[w, h, d]}>
        <boxGeometry />
        <meshStandardMaterial
          color={selected ? "#0a1628" : "#080e1a"}
          roughness={0.6}
          metalness={0.3}
          emissive={selected ? "#001840" : "#000000"}
          emissiveIntensity={selected ? 0.3 : 0}
        />
      </mesh>

      {/* Roof */}
      <mesh position={[0, h / 2 + 0.2, 0]} scale={[w + 0.3, 0.35, d + 0.3]}>
        <boxGeometry />
        <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Antenna */}
      <mesh position={[0, h / 2 + 0.75, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.7, 6]} />
        <meshStandardMaterial color="#334155" metalness={1} roughness={0.1} />
      </mesh>

      {/* Tip */}
      <mesh position={[0, h / 2 + 1.15, 0]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial
          color={selected ? "#00ddff" : "#ff2200"}
          emissive={selected ? "#00ddff" : "#ff2200"}
          emissiveIntensity={selected ? 5 : 4}
        />
      </mesh>

      {/* Selection beam */}
      {selected && (
        <mesh ref={beamRef} position={[0, h / 2 + 1.15 + beamH / 2, 0]}>
          <cylinderGeometry args={[0.05, 0.22, beamH, 10, 1, true]} />
          <meshStandardMaterial
            color="#00ddff"
            emissive="#00ddff"
            emissiveIntensity={2}
            transparent
            opacity={0.13}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Z-face windows (front + back) */}
      {wc.ez.length > 0 && (
        <instancedMesh
          ref={easyZRef}
          args={[WIN_GEO_Z, MAT_EASY, wc.ez.length]}
          frustumCulled={false}
        />
      )}
      {wc.mz.length > 0 && (
        <instancedMesh
          ref={medZRef}
          args={[WIN_GEO_Z, MAT_MED, wc.mz.length]}
          frustumCulled={false}
        />
      )}
      {wc.hz.length > 0 && (
        <instancedMesh
          ref={hardZRef}
          args={[WIN_GEO_Z, MAT_HARD, wc.hz.length]}
          frustumCulled={false}
        />
      )}

      {/* X-face windows (left + right) — rotated geometry */}
      {wc.ex.length > 0 && (
        <instancedMesh
          ref={easyXRef}
          args={[WIN_GEO_X, MAT_EASY, wc.ex.length]}
          frustumCulled={false}
        />
      )}
      {wc.mx.length > 0 && (
        <instancedMesh
          ref={medXRef}
          args={[WIN_GEO_X, MAT_MED, wc.mx.length]}
          frustumCulled={false}
        />
      )}
      {wc.hx.length > 0 && (
        <instancedMesh
          ref={hardXRef}
          args={[WIN_GEO_X, MAT_HARD, wc.hx.length]}
          frustumCulled={false}
        />
      )}
    </group>
  );
}
