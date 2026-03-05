import type { LeetCodeStats, BuildingConfig } from "../types/leetcode";

export function statsToBuildingConfig(stats: LeetCodeStats): BuildingConfig {
  const height = Math.max(3, Math.min(30, stats.total * 0.08));
  const width = Math.max(1.5, Math.min(6, 1.5 + stats.streak * 0.05));
  const depth = Math.max(1.5, Math.min(6, 1.5 + stats.medium * 0.03));

  return {
    height,
    width,
    depth,
    easySolved: stats.easy,
    mediumSolved: stats.medium,
    hardSolved: stats.hard,
    totalSolved: stats.total,
    streak: stats.streak,
  };
}

export function getDifficultyColor(
  floor: number,
  totalFloors: number,
  easy: number,
  medium: number,
  hard: number
): { color: string; emissive: string; intensity: number } {
  const total = easy + medium + hard || 1;
  const hardRatio = hard / total;
  const mediumRatio = medium / total;

  const floorRatio = floor / totalFloors;

  if (floorRatio > 1 - hardRatio) {
    // Top floors = hard (bright amber/gold)
    return { color: "#ffaa00", emissive: "#ff8800", intensity: 2.5 };
  } else if (floorRatio > mediumRatio === false && floorRatio > 1 - hardRatio - mediumRatio) {
    // Middle floors = medium (cyan)
    return { color: "#00ffcc", emissive: "#00ddaa", intensity: 1.8 };
  } else {
    // Bottom floors = easy (soft blue)
    return { color: "#4499ff", emissive: "#2266cc", intensity: 1.2 };
  }
}