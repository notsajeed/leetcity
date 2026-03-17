"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import StatsPanel from "@/components/StatsPanel";
import ExplorePanel from "@/components/ExplorePanel";
import FlyMode from "@/components/FlyMode";
import { SceneProvider } from "@/components/SceneContext";
import { loadCity, saveUser, removeUser, type CityData } from "@/lib/cityStorage";
import type { LeetCodeStats } from "@/types/leetcode";

const CityScene = dynamic(() => import("@/components/CityScene"), { ssr: false });

type UIMode = "default" | "explore" | "fly";

const BTN_BASE: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(200,0,30,0.25)",
  borderRadius: "4px",
  color: "#660011",
  fontSize: "9px",
  fontWeight: 800,
  letterSpacing: "0.18em",
  padding: "6px 13px",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  gap: "5px",
  transition: "border-color 0.18s, color 0.18s, background 0.18s",
  whiteSpace: "nowrap" as const,
  flexShrink: 0,
};
const BTN_ACTIVE: React.CSSProperties = {
  borderColor: "rgba(255,17,51,0.55)",
  color: "#ff1133",
  background: "rgba(255,17,51,0.07)",
};

const IconExplore = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="0.9"/>
    <path d="M5.5 1.5V5.5L7.5 7.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
  </svg>
);
const IconFly = () => (
  <svg width="12" height="11" viewBox="0 0 12 11" fill="none">
    <path d="M1 6 L5 4 L10 1.5 L8 5.5 L10 6 L7 8 L7.5 10 L5 8.5 L1 9.5 L3 7 Z"
      stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round" fill="none"/>
  </svg>
);

function HomeInner() {
  const [username, setUsername]                 = useState("");
  const [cityData, setCityData]                 = useState<CityData>({});
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading]               = useState(false);
  const [error, setError]                       = useState<string | null>(null);
  const [mode, setMode]                         = useState<UIMode>("default");

  useEffect(() => { loadCity().then(setCityData); }, []);

  const users         = Object.values(cityData).map((u) => u.stats);
  const selectedStats = selectedUsername ? (cityData[selectedUsername]?.stats ?? null) : null;

  const fetchAndAdd = useCallback(async () => {
    const name = username.trim();
    if (!name) return;
    if (cityData[name]) { setSelectedUsername(name); setUsername(""); return; }
    setIsLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/leetcode?user=${encodeURIComponent(name)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "User not found"); return; }
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

  const handleKey    = (e: React.KeyboardEvent) => { if (e.key === "Enter") fetchAndAdd(); };
  const toggleMode   = (m: UIMode) => setMode((prev) => (prev === m ? "default" : m));

  const isFlying = mode === "fly";

  return (
    <main style={{
      width: "100vw", height: "100vh", background: "#020712",
      overflow: "hidden", position: "relative",
      fontFamily: "'JetBrains Mono','Fira Code',monospace",
    }}>

      {/* 3D Canvas — hidden (not unmounted) while flying so ScenePublisher keeps running */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        visibility: isFlying ? "hidden" : "visible",
        pointerEvents: isFlying ? "none" : "auto",
      }}>
        <CityScene
          users={users}
          selectedUsername={selectedUsername}
          onSelectUser={setSelectedUsername}
        />
      </div>

      {/* TOP BAR — hidden in fly mode (FlyMode has its own) */}
      {!isFlying && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
          padding: "clamp(10px,2.5vw,18px) clamp(14px,4vw,28px)",
          display: "flex", alignItems: "center", gap: "clamp(8px,1.5vw,16px)",
          background: "linear-gradient(180deg,rgba(2,7,18,0.97) 0%,transparent 100%)",
        }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "2px", flexShrink: 0 }}>
            <span style={{ color: "#ff1133", fontSize: "clamp(13px,3.5vw,17px)", fontWeight: 800, letterSpacing: "0.05em" }}>LEET</span>
            <span style={{ color: "#cc0022", fontSize: "clamp(13px,3.5vw,17px)", fontWeight: 800, letterSpacing: "0.05em" }}>CITY</span>
            <span style={{ color: "#440011", fontSize: "9px", marginLeft: "6px", letterSpacing: "0.15em" }}>v0.2</span>
          </div>

          <div style={{ width: "1px", height: "18px", background: "rgba(200,0,30,0.2)", flexShrink: 0 }} />

          {/* Search */}
          <div style={{ display: "flex", gap: "6px", alignItems: "center", width: "clamp(160px,22vw,260px)", flexShrink: 0 }}>
            <input
              type="text" placeholder="username" value={username}
              onChange={(e) => setUsername(e.target.value)} onKeyDown={handleKey}
              style={{ background: "rgba(20,0,5,0.9)", border: "1px solid rgba(200,0,30,0.3)", borderRadius: "4px", color: "#ffaaaa", fontSize: "12px", padding: "7px 10px", outline: "none", flex: 1, minWidth: 0, fontFamily: "inherit", letterSpacing: "0.05em", transition: "border-color 0.2s" }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(255,0,51,0.7)")}
              onBlur={(e)  => (e.target.style.borderColor = "rgba(200,0,30,0.3)")}
            />
            <button onClick={fetchAndAdd} disabled={isLoading || !username.trim()}
              style={{ background: isLoading ? "rgba(80,0,15,0.4)" : "rgba(180,0,30,0.2)", border: "1px solid rgba(255,0,51,0.4)", borderRadius: "4px", color: isLoading ? "#550011" : "#ff1133", fontSize: "10px", letterSpacing: "0.1em", padding: "7px 10px", cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap", transition: "all 0.2s" }}>
              {isLoading ? "..." : "ADD"}
            </button>
          </div>

          <div style={{ width: "1px", height: "18px", background: "rgba(200,0,30,0.2)", flexShrink: 0 }} />

          <button onClick={() => toggleMode("explore")}
            style={{ ...BTN_BASE, ...(mode === "explore" ? BTN_ACTIVE : {}) }}
            onMouseEnter={(e) => { if (mode !== "explore") { e.currentTarget.style.borderColor = "rgba(255,17,51,0.45)"; e.currentTarget.style.color = "#ff3344"; }}}
            onMouseLeave={(e) => { if (mode !== "explore") { e.currentTarget.style.borderColor = "rgba(200,0,30,0.25)"; e.currentTarget.style.color = "#660011"; }}}>
            <IconExplore /> EXPLORE
          </button>

          <button onClick={() => toggleMode("fly")}
            style={{ ...BTN_BASE, ...(mode === "fly" ? BTN_ACTIVE : {}) }}
            onMouseEnter={(e) => { if (mode !== "fly") { e.currentTarget.style.borderColor = "rgba(255,17,51,0.45)"; e.currentTarget.style.color = "#ff3344"; }}}
            onMouseLeave={(e) => { if (mode !== "fly") { e.currentTarget.style.borderColor = "rgba(200,0,30,0.25)"; e.currentTarget.style.color = "#660011"; }}}>
            <IconFly /> FLY
          </button>

          <div style={{ flex: 1 }} />

          <img src="/leetcitylogo.png" alt="LeetCity Logo"
            style={{ height: "clamp(26px,4.5vw,40px)", width: "auto", objectFit: "contain", flexShrink: 0 }} />
        </div>
      )}

      {/* Stats panel */}
      {selectedStats && mode === "default" && (
        <div style={{ position: "absolute", bottom: "clamp(14px,3vw,28px)", left: "clamp(14px,3vw,28px)", zIndex: 20, animation: "fadeUp 0.3s ease forwards", maxWidth: "360px" }}>
          <StatsPanel stats={selectedStats} />
        </div>
      )}

      {/* Error */}
      {error && !isFlying && (
        <div style={{ position: "absolute", bottom: "clamp(14px,3vw,28px)", left: "50%", transform: "translateX(-50%)", zIndex: 20, background: "rgba(40,5,5,0.9)", border: "1px solid rgba(255,50,50,0.3)", borderRadius: "2px", color: "#ff6666", fontSize: "11px", letterSpacing: "0.1em", padding: "10px 20px", whiteSpace: "nowrap" }}>
          ERROR: {error}
        </div>
      )}

      {/* Idle hint */}
      {users.length === 0 && !isLoading && mode === "default" && (
        <div style={{ position: "absolute", bottom: "clamp(14px,3vw,28px)", left: "50%", transform: "translateX(-50%)", zIndex: 20, color: "#1e3a5f", fontSize: "clamp(8px,2.5vw,10px)", letterSpacing: "0.2em", textAlign: "center", whiteSpace: "nowrap" }}>
          ADD A LEETCODE USERNAME TO BUILD YOUR CITY
        </div>
      )}

      {/* Controls hint */}
      {mode === "default" && (
        <div style={{ position: "absolute", bottom: "clamp(14px,3vw,28px)", right: "clamp(14px,3vw,28px)", zIndex: 20, color: "#1e3a5f", fontSize: "9px", letterSpacing: "0.12em", lineHeight: "1.8", textAlign: "right" }}>
          DRAG TO ORBIT · SCROLL TO ZOOM<br />CLICK BUILDING TO INSPECT
        </div>
      )}

      {/* Explore panel */}
      {mode === "explore" && (
        <ExplorePanel
          cityData={cityData}
          selectedUsername={selectedUsername}
          onSelectUser={setSelectedUsername}
          onRemoveUser={handleRemove}
          onClose={() => setMode("default")}
        />
      )}

      {/* Fly mode */}
      {isFlying && <FlyMode onClose={() => setMode("default")} />}

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
        * { box-sizing:border-box; margin:0; padding:0; }
        body { overflow:hidden; }
        input::placeholder { color:#440011; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#550011; border-radius:2px; }
      `}</style>
    </main>
  );
}

export default function Home() {
  return (
    <SceneProvider>
      <HomeInner />
    </SceneProvider>
  );
}