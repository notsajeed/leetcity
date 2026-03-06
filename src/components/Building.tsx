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
  axis: "x" | "z";
}

const COL_STEP = 1.0;
const ROW_STEP = 1.0;
const WIN_W = 0.82;
const WIN_H = 0.82;
const WIN_D = 0.15;
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
      offset: d / 2 + WIN_D / 2 + 0.01,
      cols: Math.max(1, Math.floor((w - MARGIN * 2) / COL_STEP)),
    },
    {
      axis: "z" as const,
      offset: -(d / 2 + WIN_D / 2 + 0.01),
      cols: Math.max(1, Math.floor((w - MARGIN * 2) / COL_STEP)),
    },
    {
      axis: "x" as const,
      offset: w / 2 + WIN_D / 2 + 0.01,
      cols: Math.max(1, Math.floor((d - MARGIN * 2) / COL_STEP)),
    },
    {
      axis: "x" as const,
      offset: -(w / 2 + WIN_D / 2 + 0.01),
      cols: Math.max(1, Math.floor((d - MARGIN * 2) / COL_STEP)),
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

// Body material pushes surface BACK so windows always win depth test
const makeBodyMat = (color: string, emissive?: string) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: 0.6,
    metalness: 0.3,
    ...(emissive
      ? { emissive: new THREE.Color(emissive), emissiveIntensity: 0.3 }
      : {}),
    polygonOffset: true,
    polygonOffsetFactor: 8,
    polygonOffsetUnits: 8,
  });

const BODY_MAT = makeBodyMat("#080e1a");
const BODY_SEL_MAT = makeBodyMat("#0a1628", "#001840");

// Window geometries — Z-facing and X-facing
const WIN_GEO_Z = new THREE.BoxGeometry(WIN_W, WIN_H, WIN_D);
const WIN_GEO_X = new THREE.BoxGeometry(WIN_D, WIN_H, WIN_W);

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

  const wc = useRef<{
    ez: WinData[];
    ex: WinData[];
    mz: WinData[];
    mx: WinData[];
    hz: WinData[];
    hx: WinData[];
  } | null>(null);

  if (!wc.current) {
    const all = buildWindows(h, w, d, easySolved, mediumSolved, hardSolved);
    wc.current = {
      ez: all.filter((x) => x.type === "easy" && x.axis === "z"),
      ex: all.filter((x) => x.type === "easy" && x.axis === "x"),
      mz: all.filter((x) => x.type === "medium" && x.axis === "z"),
      mx: all.filter((x) => x.type === "medium" && x.axis === "x"),
      hz: all.filter((x) => x.type === "hard" && x.axis === "z"),
      hx: all.filter((x) => x.type === "hard" && x.axis === "x"),
    };
  }

  useEffect(() => {
    if (!wc.current) return;
    const pairs: [React.RefObject<THREE.InstancedMesh | null>, WinData[]][] = [
      [easyZRef, wc.current.ez],
      [easyXRef, wc.current.ex],
      [medZRef, wc.current.mz],
      [medXRef, wc.current.mx],
      [hardZRef, wc.current.hz],
      [hardXRef, wc.current.hx],
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

  const w_ = wc.current!;
  const beamH = h * 0.7;

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
      {/* Body — polygonOffset pushes it behind windows */}
      <mesh scale={[w, h, d]} material={selected ? BODY_SEL_MAT : BODY_MAT}>
        <boxGeometry />
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

      {/* Z-face windows */}
      {w_.ez.length > 0 && (
        <instancedMesh
          ref={easyZRef}
          args={[WIN_GEO_Z, MAT_EASY, w_.ez.length]}
          frustumCulled={false}
        />
      )}
      {w_.mz.length > 0 && (
        <instancedMesh
          ref={medZRef}
          args={[WIN_GEO_Z, MAT_MED, w_.mz.length]}
          frustumCulled={false}
        />
      )}
      {w_.hz.length > 0 && (
        <instancedMesh
          ref={hardZRef}
          args={[WIN_GEO_Z, MAT_HARD, w_.hz.length]}
          frustumCulled={false}
        />
      )}

      {/* X-face windows */}
      {w_.ex.length > 0 && (
        <instancedMesh
          ref={easyXRef}
          args={[WIN_GEO_X, MAT_EASY, w_.ex.length]}
          frustumCulled={false}
        />
      )}
      {w_.mx.length > 0 && (
        <instancedMesh
          ref={medXRef}
          args={[WIN_GEO_X, MAT_MED, w_.mx.length]}
          frustumCulled={false}
        />
      )}
      {w_.hx.length > 0 && (
        <instancedMesh
          ref={hardXRef}
          args={[WIN_GEO_X, MAT_HARD, w_.hx.length]}
          frustumCulled={false}
        />
      )}
    </group>
  );
}
