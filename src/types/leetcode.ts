export interface SubmissionStat {
  difficulty: "All" | "Easy" | "Medium" | "Hard";
  count: number;
}

export interface LeetCodeStats {
  easy: number;
  medium: number;
  hard: number;
  total: number;
  streak: number;
  username: string;
}

export interface BuildingConfig {
  height: number;
  width: number;
  depth: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalSolved: number;
  streak: number;
}