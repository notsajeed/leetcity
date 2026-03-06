import type { LeetCodeStats, BuildingConfig } from "@/types/leetcode";

export function statsToBuildingConfig(stats: LeetCodeStats): BuildingConfig {
  // Pure linear — 50 looks tiny, 500 looks 10x taller, 3000 is a skyscraper
  // 1 solved = 0.06 units of height, cap at 120 so 2000+ stays sane
  const height = Math.max(1.5, Math.min(120, stats.total * 0.06));

  // Width from streak — linear, small streaks = thin, long streaks = wide
  const width = Math.max(1.2, Math.min(8, 1.2 + stats.streak * 0.06));

  // Depth from medium problems
  const depth = Math.max(1.2, Math.min(8, 1.2 + stats.medium * 0.025));

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