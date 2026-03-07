import type { LeetCodeStats } from "@/types/leetcode";

export interface StoredUser { stats: LeetCodeStats; addedAt: number; }
export type CityData = Record<string, StoredUser>;

export async function loadCity(): Promise<CityData> {
  try {
    const res = await fetch("/api/city");
    if (!res.ok) return {};
    const text = await res.text();
    if (!text || text === "null") return {};
    return JSON.parse(text);
  } catch { return {}; }
}

export async function saveUser(stats: LeetCodeStats): Promise<CityData> {
  const res = await fetch("/api/city", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "save", username: stats.username, stats }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to save");
  }
  return res.json();
}

export async function removeUser(username: string): Promise<CityData> {
  const res = await fetch("/api/city", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "remove", username }),
  });
  return res.json();
}

export const PLOT_SIZE  = 14;
export const ROAD_WIDTH = 6;
export const BLOCK_SIZE = PLOT_SIZE * 2 + ROAD_WIDTH;

function getSpiralBlocks(): [number, number][] {
  const blocks: [number, number][] = [];
  let x = 0, z = 0, dx = 0, dz = -1;
  const max = 20;
  for (let i = 0; i < max * max; i++) {
    blocks.push([x, z]);
    if (x === z || (x < 0 && x === -z) || (x > 0 && x === 1 - z)) [dx, dz] = [-dz, dx];
    x += dx; z += dz;
  }
  return blocks;
}

function blockToPlots(bx: number, bz: number): [number, number][] {
  const cx = bx * BLOCK_SIZE;
  const cz = bz * BLOCK_SIZE;
  const half = PLOT_SIZE / 2 + ROAD_WIDTH / 2;
  return [
    [cx - half, cz - half],
    [cx + half, cz - half],
    [cx - half, cz + half],
    [cx + half, cz + half],
  ];
}

const ALL_PLOTS: [number, number][] = getSpiralBlocks().flatMap(([bx, bz]) => blockToPlots(bx, bz));

export function getUserPosition(index: number): [number, number, number] {
  const [x, z] = ALL_PLOTS[index % ALL_PLOTS.length];
  return [x, 0, z];
}

export { ALL_PLOTS };