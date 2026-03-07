"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { BLOCK_SIZE, ROAD_WIDTH } from "@/lib/cityStorage";

const EXTENT = 80;
const FOOTPATH_WIDTH = 1.8;
const TOTAL = (EXTENT * 2 + 1) * BLOCK_SIZE;
const TEX_SIZE = 512; // one crisp block cell

function makeTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_SIZE;
  canvas.height = TEX_SIZE;
  const ctx = canvas.getContext("2d")!;

  const scale = TEX_SIZE / BLOCK_SIZE;
  const roadPx = ROAD_WIDTH * scale;
  const footPx = FOOTPATH_WIDTH * scale;
  const half = TEX_SIZE / 2;

  // Base
  ctx.fillStyle = "#080203";
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

  // Footpaths
  ctx.fillStyle = "#140508";
  ctx.fillRect(0, half - roadPx / 2 - footPx, TEX_SIZE, footPx);
  ctx.fillRect(0, half + roadPx / 2, TEX_SIZE, footPx);
  ctx.fillRect(half - roadPx / 2 - footPx, 0, footPx, TEX_SIZE);
  ctx.fillRect(half + roadPx / 2, 0, footPx, TEX_SIZE);

  // Asphalt
  ctx.fillStyle = "#0e0406";
  ctx.fillRect(0, half - roadPx / 2, TEX_SIZE, roadPx);
  ctx.fillRect(half - roadPx / 2, 0, roadPx, TEX_SIZE);

  // Centre dashes
  const numDashes = 4;
  const segLen = TEX_SIZE - roadPx;
  const segStart = roadPx / 2;
  ctx.fillStyle = "#cc0022";
  for (let d = 0; d < numDashes; d++) {
    const t0 = d / numDashes;
    const t1 = (d + 0.45) / numDashes;
    ctx.fillRect(segStart + t0 * segLen, half - 1.5, (t1 - t0) * segLen, 3);
    ctx.fillRect(half - 1.5, segStart + t0 * segLen, 3, (t1 - t0) * segLen);
  }

  // Edge lines
  ctx.fillStyle = "rgba(180,0,30,0.3)";
  ctx.fillRect(segStart, half - roadPx / 2 + 1, segLen, 2);
  ctx.fillRect(segStart, half + roadPx / 2 - 3, segLen, 2);
  ctx.fillRect(half - roadPx / 2 + 1, segStart, 2, segLen);
  ctx.fillRect(half + roadPx / 2 - 3, segStart, 2, segLen);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(EXTENT * 2 + 1, EXTENT * 2 + 1); // one repeat per block
  tex.anisotropy = 16; // keeps it sharp at grazing angles
  tex.needsUpdate = true;
  return tex;
}

export default function Roads() {
  const texture = useMemo(() => {
    if (typeof window === "undefined") return null;
    return makeTileTexture();
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
