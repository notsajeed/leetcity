"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import StatsPanel from "@/components/StatsPanel";
import type { LeetCodeStats } from "@/types/leetcode";

// Must be dynamic — Three.js is client-only
const CityScene = dynamic(() => import("@/components/CityScene"), {
  ssr: false,
});

export default function Home() {
  const [username, setUsername] = useState("");
  const [stats, setStats] = useState<LeetCodeStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!username.trim()) return;
    setIsLoading(true);
    setError(null);
    setStats(null);

    try {
      const res = await fetch(
        `/api/leetcode?user=${encodeURIComponent(username.trim())}`,
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setStats(data);
    } catch {
      setError("Network error — is LeetCode reachable?");
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") fetchStats();
  };

  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        background: "#020712",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          padding: "20px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background:
            "linear-gradient(180deg, rgba(2,7,18,0.95) 0%, transparent 100%)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
          <span
            style={{
              color: "#00aaff",
              fontSize: "18px",
              fontWeight: "800",
              letterSpacing: "0.05em",
            }}
          >
            LEET
          </span>
          <span
            style={{
              color: "#ffaa00",
              fontSize: "18px",
              fontWeight: "800",
              letterSpacing: "0.05em",
            }}
          >
            CITY
          </span>
          <span
            style={{
              color: "#334d6e",
              fontSize: "10px",
              marginLeft: "8px",
              letterSpacing: "0.15em",
            }}
          >
            v0.1
          </span>
        </div>

        {/* Search */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#334d6e",
                fontSize: "11px",
                pointerEvents: "none",
              }}
            >
              $
            </span>
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKey}
              style={{
                background: "rgba(10, 20, 40, 0.8)",
                border: "1px solid rgba(0, 170, 255, 0.25)",
                borderRadius: "2px",
                color: "#e2e8f0",
                fontSize: "13px",
                padding: "8px 14px 8px 26px",
                outline: "none",
                width: "200px",
                fontFamily: "inherit",
                letterSpacing: "0.05em",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(0, 170, 255, 0.6)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(0, 170, 255, 0.25)")
              }
            />
          </div>

          <button
            onClick={fetchStats}
            disabled={isLoading || !username.trim()}
            style={{
              background: isLoading
                ? "rgba(0, 80, 160, 0.3)"
                : "rgba(0, 120, 255, 0.15)",
              border: "1px solid rgba(0, 170, 255, 0.4)",
              borderRadius: "2px",
              color: isLoading ? "#334d6e" : "#00aaff",
              fontSize: "11px",
              letterSpacing: "0.15em",
              padding: "8px 18px",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                (e.target as HTMLButtonElement).style.background =
                  "rgba(0, 120, 255, 0.3)";
                (e.target as HTMLButtonElement).style.boxShadow =
                  "0 0 12px rgba(0,170,255,0.2)";
              }
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background =
                "rgba(0, 120, 255, 0.15)";
              (e.target as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            {isLoading ? "SCANNING..." : "GENERATE"}
          </button>
        </div>
      </div>

      {/* 3D Canvas - full screen */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <CityScene stats={stats} isLoading={isLoading} />
      </div>

      {/* Stats overlay - bottom left */}
      {stats && (
        <div
          style={{
            position: "absolute",
            bottom: "28px",
            left: "28px",
            zIndex: 20,
            animation: "fadeUp 0.4s ease forwards",
          }}
        >
          <StatsPanel stats={stats} />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          style={{
            position: "absolute",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            background: "rgba(40, 5, 5, 0.9)",
            border: "1px solid rgba(255, 50, 50, 0.3)",
            borderRadius: "2px",
            color: "#ff6666",
            fontSize: "11px",
            letterSpacing: "0.1em",
            padding: "10px 20px",
          }}
        >
          ERROR: {error}
        </div>
      )}

      {/* Idle hint */}
      {!stats && !isLoading && !error && (
        <div
          style={{
            position: "absolute",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            color: "#1e3a5f",
            fontSize: "10px",
            letterSpacing: "0.2em",
            textAlign: "center",
          }}
        >
          ENTER A LEETCODE USERNAME TO BUILD YOUR CITY
        </div>
      )}

      {/* Controls hint */}
      <div
        style={{
          position: "absolute",
          bottom: "28px",
          right: "28px",
          zIndex: 20,
          color: "#1e3a5f",
          fontSize: "9px",
          letterSpacing: "0.12em",
          lineHeight: "1.8",
          textAlign: "right",
        }}
      >
        DRAG TO ORBIT
        <br />
        SCROLL TO ZOOM
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden; }
        input::placeholder { color: #1e3a5f; }
      `}</style>
    </main>
  );
}
