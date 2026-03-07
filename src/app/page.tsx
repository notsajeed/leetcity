"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import StatsPanel from "@/components/StatsPanel";
import {
  loadCity,
  saveUser,
  removeUser,
  type CityData,
} from "@/lib/cityStorage";
import type { LeetCodeStats } from "@/types/leetcode";

const CityScene = dynamic(() => import("@/components/CityScene"), {
  ssr: false,
});

export default function Home() {
  const [username, setUsername] = useState("");
  const [cityData, setCityData] = useState<CityData>({});
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load city from DB on mount
  useEffect(() => {
    loadCity().then(setCityData);
  }, []);

  const users = Object.values(cityData).map((u) => u.stats);
  const selectedStats = selectedUsername
    ? (cityData[selectedUsername]?.stats ?? null)
    : null;

  const fetchAndAdd = useCallback(async () => {
    const name = username.trim();
    if (!name) return;

    // If already in city, just select it
    if (cityData[name]) {
      setSelectedUsername(name);
      setUsername("");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/leetcode?user=${encodeURIComponent(name)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "User not found");
        return;
      }

      const updated = await saveUser(data as LeetCodeStats);
      setCityData(updated);
      setSelectedUsername(name);
      setUsername("");
    } catch (e: any) {
      setError(e.message ?? "Network error");
    } finally {
      setIsLoading(false);
    }
  }, [username, cityData]);

  const handleRemove = async (name: string) => {
    const updated = await removeUser(name);
    setCityData(updated);
    if (selectedUsername === name) setSelectedUsername(null);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") fetchAndAdd();
  };

  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        background: "#020712",
        overflow: "hidden",
        position: "relative",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}
    >
      {/* 3D Canvas */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <CityScene
          users={users}
          selectedUsername={selectedUsername}
          onSelectUser={setSelectedUsername}
        />
      </div>

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
              color: "#ff1133",
              fontSize: "18px",
              fontWeight: "800",
              letterSpacing: "0.05em",
            }}
          >
            LEET
          </span>
          <span
            style={{
              color: "#cc0022",
              fontSize: "18px",
              fontWeight: "800",
              letterSpacing: "0.05em",
            }}
          >
            CITY
          </span>
          <span
            style={{
              color: "#440011",
              fontSize: "10px",
              marginLeft: "8px",
              letterSpacing: "0.15em",
            }}
          >
            v0.2
          </span>
        </div>

        {/* Search */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKey}
            style={{
              background: "rgba(20,0,5,0.9)",
              border: "1px solid rgba(200,0,30,0.3)",
              borderRadius: "4px",
              color: "#ffaaaa",
              fontSize: "13px",
              padding: "8px 14px",
              outline: "none",
              width: "200px",
              fontFamily: "inherit",
              letterSpacing: "0.05em",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(255,0,51,0.7)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(200,0,30,0.3)")}
          />
          <button
            onClick={fetchAndAdd}
            disabled={isLoading || !username.trim()}
            style={{
              background: isLoading
                ? "rgba(80,0,15,0.4)"
                : "rgba(180,0,30,0.2)",
              border: "1px solid rgba(255,0,51,0.4)",
              borderRadius: "4px",
              color: isLoading ? "#550011" : "#ff1133",
              fontSize: "11px",
              letterSpacing: "0.15em",
              padding: "8px 18px",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!isLoading && username.trim())
                e.currentTarget.style.background = "rgba(200,0,30,0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isLoading
                ? "rgba(80,0,15,0.4)"
                : "rgba(180,0,30,0.2)";
            }}
          >
            {isLoading ? "SCANNING..." : "ADD TO CITY"}
          </button>
        </div>
      </div>

      {/* Stats panel — bottom left */}
      {selectedStats && (
        <div
          style={{
            position: "absolute",
            bottom: "28px",
            left: "28px",
            zIndex: 20,
            animation: "fadeUp 0.3s ease forwards",
          }}
        >
          <StatsPanel stats={selectedStats} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            position: "absolute",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            background: "rgba(40,5,5,0.9)",
            border: "1px solid rgba(255,50,50,0.3)",
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
      {users.length === 0 && !isLoading && (
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
          ADD A LEETCODE USERNAME TO BUILD YOUR CITY
        </div>
      )}

      {/* Controls */}
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
        DRAG TO ORBIT · SCROLL TO ZOOM
        <br />
        CLICK BUILDING TO INSPECT
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden; }
        input::placeholder { color: #440011; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #550011; border-radius: 2px; }
      `}</style>
    </main>
  );
}
