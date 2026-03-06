"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { BLOCK_SIZE, ROAD_WIDTH, PLOT_SIZE } from "@/lib/cityStorage";

const EXTENT = 10; // how many blocks in each direction

// Materials
const ASPHALT_MAT = new THREE.MeshStandardMaterial({
  color: "#0d1117",
  roughness: 0.95,
  metalness: 0.05,
});
const FOOTPATH_MAT = new THREE.MeshStandardMaterial({
  color: "#161d2a",
  roughness: 0.9,
  metalness: 0.0,
});
const DASH_MAT = new THREE.MeshStandardMaterial({
  color: "#ffcc00",
  emissive: new THREE.Color("#ffcc00"),
  emissiveIntensity: 0.8,
  roughness: 0,
});
const SOLID_LINE_MAT = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  emissive: new THREE.Color("#ffffff"),
  emissiveIntensity: 0.5,
  roughness: 0,
});

const FOOTPATH_WIDTH = 1.8;

export default function Roads() {
  const totalLen = (EXTENT * 2 + 1) * BLOCK_SIZE;

  const roads: JSX.Element[] = [];
  const footpaths: JSX.Element[] = [];
  const markings: JSX.Element[] = [];

  for (let i = -EXTENT; i <= EXTENT; i++) {
    const pos = i * BLOCK_SIZE;

    // ── Horizontal road strip (runs along X axis) ──
    roads.push(
      <mesh
        key={`rh_${i}`}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, pos]}
      >
        <planeGeometry args={[totalLen, ROAD_WIDTH]} />
        <primitive object={ASPHALT_MAT} attach="material" />
      </mesh>,
    );

    // ── Vertical road strip (runs along Z axis) ──
    roads.push(
      <mesh
        key={`rv_${i}`}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[pos, 0.02, 0]}
      >
        <planeGeometry args={[ROAD_WIDTH, totalLen]} />
        <primitive object={ASPHALT_MAT} attach="material" />
      </mesh>,
    );

    // ── Footpaths along horizontal roads ──
    for (const side of [-1, 1]) {
      const fpZ = pos + side * (ROAD_WIDTH / 2 + FOOTPATH_WIDTH / 2);
      footpaths.push(
        <mesh
          key={`fph_${i}_${side}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.015, fpZ]}
        >
          <planeGeometry args={[totalLen, FOOTPATH_WIDTH]} />
          <primitive object={FOOTPATH_MAT} attach="material" />
        </mesh>,
      );
    }

    // ── Footpaths along vertical roads ──
    for (const side of [-1, 1]) {
      const fpX = pos + side * (ROAD_WIDTH / 2 + FOOTPATH_WIDTH / 2);
      footpaths.push(
        <mesh
          key={`fpv_${i}_${side}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[fpX, 0.015, 0]}
        >
          <planeGeometry args={[FOOTPATH_WIDTH, totalLen]} />
          <primitive object={FOOTPATH_MAT} attach="material" />
        </mesh>,
      );
    }

    // ── Centre dashes (only on road segments between intersections) ──
    for (let j = -EXTENT; j <= EXTENT; j++) {
      const blockCenter = j * BLOCK_SIZE;
      const segLen = BLOCK_SIZE - ROAD_WIDTH; // skip the intersection box

      // Horizontal dashes
      const numDashes = 4;
      for (let d = 0; d < numDashes; d++) {
        const t = (d + 0.5) / numDashes;
        const dx = blockCenter - segLen / 2 + t * segLen;
        markings.push(
          <mesh
            key={`dh_${i}_${j}_${d}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[dx, 0.04, pos]}
          >
            <planeGeometry args={[(segLen / numDashes) * 0.5, 0.15]} />
            <primitive object={DASH_MAT} attach="material" />
          </mesh>,
        );
      }

      // Vertical dashes
      for (let d = 0; d < numDashes; d++) {
        const t = (d + 0.5) / numDashes;
        const dz = blockCenter - segLen / 2 + t * segLen;
        markings.push(
          <mesh
            key={`dv_${i}_${j}_${d}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[pos, 0.04, dz]}
          >
            <planeGeometry args={[0.15, (segLen / numDashes) * 0.5]} />
            <primitive object={DASH_MAT} attach="material" />
          </mesh>,
        );
      }

      // ── Intersection box — solid asphalt, no markings ──
      // Already covered by the road planes above

      // ── Edge white lines on each road side ──
      // Horizontal road edges
      for (const side of [-1, 1]) {
        const lz = pos + side * (ROAD_WIDTH / 2 - 0.1);
        markings.push(
          <mesh
            key={`elh_${i}_${j}_${side}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[blockCenter, 0.035, lz]}
          >
            <planeGeometry args={[segLen, 0.08]} />
            <primitive object={SOLID_LINE_MAT} attach="material" />
          </mesh>,
        );
      }
      // Vertical road edges
      for (const side of [-1, 1]) {
        const lx = pos + side * (ROAD_WIDTH / 2 - 0.1);
        markings.push(
          <mesh
            key={`elv_${i}_${j}_${side}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[lx, 0.035, blockCenter]}
          >
            <planeGeometry args={[0.08, segLen]} />
            <primitive object={SOLID_LINE_MAT} attach="material" />
          </mesh>,
        );
      }
    }
  }

  return (
    <>
      {roads}
      {footpaths}
      {markings}
    </>
  );
}
