"use client";

import type { LeetCodeStats } from "@/types/leetcode";

interface StatsPanelProps {
  stats: LeetCodeStats;
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  const total = stats.easy + stats.medium + stats.hard || 1;

  const bars = [
    {
      label: "EASY",
      value: stats.easy,
      color: "#4488ff",
      pct: (stats.easy / total) * 100,
    },
    {
      label: "MEDIUM",
      value: stats.medium,
      color: "#00ffcc",
      pct: (stats.medium / total) * 100,
    },
    {
      label: "HARD",
      value: stats.hard,
      color: "#ffaa00",
      pct: (stats.hard / total) * 100,
    },
  ];

  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        background: "rgba(2, 7, 18, 0.85)",
        border: "1px solid rgba(0, 180, 255, 0.2)",
        borderRadius: "2px",
        padding: "20px 24px",
        minWidth: "240px",
        backdropFilter: "blur(12px)",
        boxShadow:
          "0 0 30px rgba(0, 100, 255, 0.1), inset 0 0 20px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            color: "#00aaff",
            fontSize: "10px",
            letterSpacing: "0.2em",
            marginBottom: "4px",
          }}
        >
          // CITIZEN
        </div>
        <div
          style={{
            color: "#e2e8f0",
            fontSize: "20px",
            fontWeight: "700",
            letterSpacing: "0.05em",
          }}
        >
          {stats.username}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          background: "linear-gradient(90deg, #00aaff33, transparent)",
          marginBottom: "16px",
        }}
      />

      {/* Total */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            color: "#64748b",
            fontSize: "9px",
            letterSpacing: "0.2em",
            marginBottom: "2px",
          }}
        >
          TOTAL SOLVED
        </div>
        <div
          style={{
            color: "#ffffff",
            fontSize: "32px",
            fontWeight: "800",
            lineHeight: 1,
          }}
        >
          {stats.total}
        </div>
      </div>

      {/* Difficulty bars */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        {bars.map((bar) => (
          <div key={bar.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  color: bar.color,
                  fontSize: "9px",
                  letterSpacing: "0.15em",
                }}
              >
                {bar.label}
              </span>
              <span style={{ color: "#94a3b8", fontSize: "9px" }}>
                {bar.value}
              </span>
            </div>
            <div
              style={{
                height: "3px",
                background: "rgba(255,255,255,0.06)",
                borderRadius: "1px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${bar.pct}%`,
                  background: bar.color,
                  borderRadius: "1px",
                  boxShadow: `0 0 6px ${bar.color}`,
                  transition: "width 1s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          background: "linear-gradient(90deg, #ff660033, transparent)",
          marginBottom: "16px",
        }}
      />

      {/* Streak */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: stats.streak > 0 ? "#ff6600" : "#334155",
            boxShadow: stats.streak > 0 ? "0 0 8px #ff6600" : "none",
          }}
        />
        <div>
          <div
            style={{
              color: "#64748b",
              fontSize: "9px",
              letterSpacing: "0.15em",
            }}
          >
            STREAK
          </div>
          <div
            style={{
              color: stats.streak > 0 ? "#ff9944" : "#475569",
              fontSize: "16px",
              fontWeight: "700",
            }}
          >
            {stats.streak} days
          </div>
        </div>
      </div>

      {/* Building hint */}
      <div
        style={{
          marginTop: "16px",
          padding: "10px",
          background: "rgba(0,20,50,0.5)",
          borderRadius: "2px",
          border: "1px solid rgba(0,100,200,0.15)",
        }}
      >
        <div
          style={{
            color: "#334d6e",
            fontSize: "8px",
            letterSpacing: "0.12em",
            lineHeight: "1.6",
          }}
        >
          HEIGHT ← total solved
          <br />
          WIDTH ← streak
          <br />
          AMBER FLOORS ← hard
          <br />
          CYAN FLOORS ← medium
          <br />
          BLUE FLOORS ← easy
        </div>
      </div>
    </div>
  );
}
