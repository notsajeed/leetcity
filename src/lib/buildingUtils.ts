import type { LeetCodeStats, BuildingConfig } from "@/types/leetcode";

export function statsToBuildingConfig(stats: LeetCodeStats): BuildingConfig {
  // Logarithmic scaling — gracefully handles 1 to 3000+ problems
  // log10(10)=1, log10(100)=2, log10(1000)=3, log10(3000)≈3.5
  const height = stats.total > 0
    ? Math.max(4, 4 + Math.log10(stats.total + 1) * 16)
    : 4;

  const width = stats.streak > 0
    ? Math.max(1.8, 1.8 + Math.log10(stats.streak + 1) * 2.5)
    : 1.8;

  const depth = stats.medium > 0
    ? Math.max(1.8, 1.8 + Math.log10(stats.medium + 1) * 2.0)
    : 1.8;

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