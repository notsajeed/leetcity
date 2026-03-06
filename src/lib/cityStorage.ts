import type { LeetCodeStats } from "@/types/leetcode";

const STORAGE_KEY = "leetcity_users";

export interface StoredUser {
  stats: LeetCodeStats;
  addedAt: number;
}

export type CityData = Record<string, StoredUser>;

export function loadCity(): CityData {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function saveUser(stats: LeetCodeStats): CityData {
  const city = loadCity();
  city[stats.username] = { stats, addedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(city));
  return city;
}

export function removeUser(username: string): CityData {
  const city = loadCity();
  delete city[username];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(city));
  return city;
}

// Grid-based slot system
// Layout: blocks of 4 plots arranged around road intersections
// Each plot is PLOT_SIZE units, roads are ROAD_WIDTH units
const PLOT_SIZE = 14;   // size of each building plot
const ROAD_WIDTH = 6;   // road width between plots
const BLOCK_SIZE = PLOT_SIZE * 2 + ROAD_WIDTH; // 2 plots + 1 road per block

// Spiral order of block positions so city grows outward from center
function getSpiralBlocks(): [number, number][] {
  const blocks: [number, number][] = [];
  let x = 0, z = 0, dx = 0, dz = -1;
  const max = 20;
  for (let i = 0; i < max * max; i++) {
    blocks.push([x, z]);
    if (x === z || (x < 0 && x === -z) || (x > 0 && x === 1 - z)) {
      [dx, dz] = [-dz, dx];
    }
    x += dx; z += dz;
  }
  return blocks;
}

// Each block has 4 plots (2x2 within block)
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

// All plot positions in spiral order
function getAllPlots(): [number, number][] {
  const plots: [number, number][] = [];
  for (const [bx, bz] of getSpiralBlocks()) {
    for (const plot of blockToPlots(bx, bz)) {
      plots.push(plot);
    }
  }
  return plots;
}

const ALL_PLOTS = getAllPlots();

export function getUserPosition(index: number): [number, number, number] {
  const [x, z] = ALL_PLOTS[index % ALL_PLOTS.length];
  return [x, 0, z];
}

export { PLOT_SIZE, ROAD_WIDTH, BLOCK_SIZE, ALL_PLOTS };