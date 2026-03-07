"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { BLOCK_SIZE, ROAD_WIDTH } from "@/lib/cityStorage";

const EXTENT = 10;
const FOOTPATH_WIDTH = 1.8;
const TOTAL = (EXTENT * 2 + 1) * BLOCK_SIZE;
const TEX_SIZE = 2048;

function makeRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_SIZE;
  canvas.height = TEX_SIZE;
  const ctx = canvas.getContext("2d")!;

  const scale = TEX_SIZE / TOTAL;
  const roadPx = ROAD_WIDTH * scale;
  const footPx = FOOTPATH_WIDTH * scale;
  const blockPx = BLOCK_SIZE * scale;
  const halfTex = TEX_SIZE / 2;

  // Base — near black with red tint
  ctx.fillStyle = "#080203";
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

  // Draw all horizontal and vertical roads + footpaths
  for (let i = -EXTENT; i <= EXTENT; i++) {
    const center = halfTex + i * blockPx;

    // Footpaths — dark red-tinted stone
    ctx.fillStyle = "#140508";
    // Horizontal footpaths
    ctx.fillRect(0, center - roadPx / 2 - footPx, TEX_SIZE, footPx);
    ctx.fillRect(0, center + roadPx / 2, TEX_SIZE, footPx);
    // Vertical footpaths
    ctx.fillRect(center - roadPx / 2 - footPx, 0, footPx, TEX_SIZE);
    ctx.fillRect(center + roadPx / 2, 0, footPx, TEX_SIZE);

    // Asphalt road — slightly red-tinted dark
    ctx.fillStyle = "#0e0406";
    ctx.fillRect(0, center - roadPx / 2, TEX_SIZE, roadPx);
    ctx.fillRect(center - roadPx / 2, 0, roadPx, TEX_SIZE);
  }

  // Road markings
  for (let i = -EXTENT; i <= EXTENT; i++) {
    const roadCenter = halfTex + i * blockPx;

    for (let j = -EXTENT; j <= EXTENT; j++) {
      const blockCenter = halfTex + j * blockPx;
      const segLen = (BLOCK_SIZE - ROAD_WIDTH) * scale;
      const segStart = blockCenter - segLen / 2;

      // Red centre dashes — horizontal road
      const numDashes = 4;
      ctx.fillStyle = "#cc0022";
      for (let d = 0; d < numDashes; d++) {
        const t0 = d / numDashes;
        const t1 = (d + 0.45) / numDashes;
        const x0 = segStart + t0 * segLen;
        const x1 = segStart + t1 * segLen;
        ctx.fillRect(x0, roadCenter - 1.5, x1 - x0, 3);
      }

      // Red centre dashes — vertical road
      for (let d = 0; d < numDashes; d++) {
        const t0 = d / numDashes;
        const t1 = (d + 0.45) / numDashes;
        const z0 = segStart + t0 * segLen;
        const z1 = segStart + t1 * segLen;
        ctx.fillRect(roadCenter - 1.5, z0, 3, z1 - z0);
      }

      // Dim red edge lines
      ctx.fillStyle = "rgba(180,0,30,0.3)";
      ctx.fillRect(segStart, roadCenter - roadPx / 2 + 1, segLen, 2);
      ctx.fillRect(segStart, roadCenter + roadPx / 2 - 3, segLen, 2);
      ctx.fillRect(roadCenter - roadPx / 2 + 1, segStart, 2, segLen);
      ctx.fillRect(roadCenter + roadPx / 2 - 3, segStart, 2, segLen);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export default function Roads() {
  const texture = useMemo(() => {
    if (typeof window === "undefined") return null;
    return makeRoadTexture();
  }, []);

  if (!texture) return null;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <planeGeometry args={[TOTAL, TOTAL]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.95}
        metalness={0.05}
        depthWrite={false}
      />
    </mesh>
  );
}
