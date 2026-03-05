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

// Deterministic position from username string — same user always same spot
export function getUserPosition(username: string, index: number): [number, number, number] {
  // Hash the username into a consistent grid slot
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  }

  // Spiral outward from center so first users are close, later ones spread out
  const ring = Math.floor(Math.sqrt(index / Math.PI)) + 1;
  const angle = (hash % 360) * (Math.PI / 180);
  const radius = ring * 12 + (hash % 5);

  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  return [x, 0, z];
}