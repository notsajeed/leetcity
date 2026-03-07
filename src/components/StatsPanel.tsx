"use client";

import { useRef } from "react";
import type { LeetCodeStats } from "@/types/leetcode";

interface StatsPanelProps {
  stats: LeetCodeStats;
}

function getRank(total: number): { title: string; subtitle: string } {
  if (total >= 2000) return { title: "LEGENDARY", subtitle: "Elite Coder" };
  if (total >= 1000) return { title: "MASTER", subtitle: "Code Master" };
  if (total >= 500) return { title: "DIAMOND", subtitle: "Sharp Mind" };
  if (total >= 200) return { title: "GOLD", subtitle: "Rising Star" };
  if (total >= 50) return { title: "SILVER", subtitle: "Apprentice" };
  return { title: "BRONZE", subtitle: "Initiate" };
}

async function downloadCard(cardEl: HTMLElement, username: string) {
  const { width, height } = cardEl.getBoundingClientRect();

  // Collect all styles including @imports
  const styleSheets = Array.from(document.styleSheets);
  let cssText = "";
  for (const sheet of styleSheets) {
    try {
      const rules = Array.from(sheet.cssRules || []);
      cssText += rules.map((r) => r.cssText).join("\n");
    } catch {
      /* cross-origin sheet, skip */
    }
  }

  // Clone the node and inline computed styles on every element
  const clone = cardEl.cloneNode(true) as HTMLElement;
  const origEls = cardEl.querySelectorAll("*");
  const cloneEls = clone.querySelectorAll("*");
  origEls.forEach((orig, i) => {
    const computed = window.getComputedStyle(orig as HTMLElement);
    (cloneEls[i] as HTMLElement).style.cssText = computed.cssText;
    // Explicitly carry over animation-produced opacity / transform
    (cloneEls[i] as HTMLElement).style.opacity = computed.opacity;
  });
  // Also inline computed on root
  const rootComputed = window.getComputedStyle(cardEl);
  clone.style.cssText = rootComputed.cssText;
  clone.style.margin = "0";
  clone.style.position = "static";
  clone.style.animation = "none";

  const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width * 2}" height="${height * 2}">
      <defs>
        <style>${cssText}</style>
      </defs>
      <foreignObject width="${width * 2}" height="${height * 2}" transform="scale(2)">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;overflow:hidden;">
          ${clone.outerHTML}
        </div>
      </foreignObject>
    </svg>`;

  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const link = document.createElement("a");
    link.download = `leetcity-${username}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  img.src = url;
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const total = stats.easy + stats.medium + stats.hard || 1;
  const rank = getRank(stats.total);

  const difficulties = [
    {
      label: "EASY",
      value: stats.easy,
      color: "#ff4466",
      dark: "#880018",
      pct: (stats.easy / total) * 100,
    },
    {
      label: "MEDIUM",
      value: stats.medium,
      color: "#ff2244",
      dark: "#cc0022",
      pct: (stats.medium / total) * 100,
    },
    {
      label: "HARD",
      value: stats.hard,
      color: "#ff0033",
      dark: "#aa0011",
      pct: (stats.hard / total) * 100,
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes borderPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes scanline {
          0%   { top: -60px; }
          100% { top: 110%; }
        }
        @keyframes hpBlink {
          0%, 90%, 100% { opacity: 1; }
          95% { opacity: 0.3; }
        }
        @keyframes redShimmer {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .sp-card {
          width: 300px;
          position: relative;
          border-radius: 14px;
          padding: 1.5px;
          background: linear-gradient(135deg, #ff0033, #550011, #ff0033, #330008, #ff0033);
          background-size: 300% 300%;
          animation: cardIn 0.45s cubic-bezier(0.16,1,0.3,1) both, redShimmer 5s ease infinite;
          box-shadow: 0 0 0 1px #ff003318, 0 0 40px #ff003335, 0 0 90px #aa001518, 0 24px 60px rgba(0,0,0,0.85);
        }

        .sp-inner {
          border-radius: 13px;
          /* Lighter inner bg for readability */
          background: linear-gradient(160deg, #220008 0%, #160005 40%, #1a0007 70%, #0e0003 100%);
          padding: 22px;
          position: relative;
          overflow: hidden;
        }

        /* Subtle noise texture for depth */
        .sp-inner::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 150px 150px;
          opacity: 0.15;
          pointer-events: none;
        }

        .sp-scanline {
          position: absolute;
          left: 0; right: 0; height: 55px;
          background: linear-gradient(180deg, transparent, rgba(255,40,60,0.05), transparent);
          animation: scanline 3.5s linear infinite;
          pointer-events: none; z-index: 0;
        }

        .sp-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,30,50,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,30,50,0.05) 1px, transparent 1px);
          background-size: 24px 24px;
          pointer-events: none; z-index: 0;
        }

        /* Top-left glow orb */
        .sp-glow-orb {
          position: absolute;
          top: -30px; left: -30px;
          width: 120px; height: 120px;
          background: radial-gradient(circle, rgba(255,0,51,0.18) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }

        .sp-content { position: relative; z-index: 1; }

        .sp-corner {
          position: absolute; width: 14px; height: 14px;
          border-color: #ff3355; border-style: solid;
          animation: borderPulse 2s ease-in-out infinite;
        }
        .sp-tl { top: 10px; left: 10px; border-width: 2px 0 0 2px; border-radius: 2px 0 0 0; }
        .sp-tr { top: 10px; right: 10px; border-width: 2px 2px 0 0; border-radius: 0 2px 0 0; }
        .sp-bl { bottom: 10px; left: 10px; border-width: 0 0 2px 2px; border-radius: 0 0 0 2px; }
        .sp-br { bottom: 10px; right: 10px; border-width: 0 2px 2px 0; border-radius: 0 0 2px 0; }

        .sp-topbar {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 16px;
        }

        .sp-rank {
          font-family: 'Orbitron', monospace; font-size: 8px; font-weight: 700;
          letter-spacing: 0.25em; color: #ff4466;
          background: rgba(255,40,70,0.12);
          border: 1px solid rgba(255,40,70,0.35);
          border-radius: 3px; padding: 3px 9px;
        }

        .sp-hp {
          font-family: 'Share Tech Mono', monospace; font-size: 9px;
          color: #882233; letter-spacing: 0.05em;
          animation: hpBlink 4s ease-in-out infinite;
        }
        .sp-hp span { color: #ff4466; font-size: 12px; font-weight: bold; }

        .sp-name {
          font-family: 'Orbitron', monospace; font-weight: 900; font-size: 19px;
          color: #ffffff; letter-spacing: 0.02em;
          text-shadow: 0 0 20px #ff003360, 0 2px 4px rgba(0,0,0,0.8);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-bottom: 3px;
        }

        .sp-sub {
          font-family: 'Share Tech Mono', monospace; font-size: 8px;
          color: #772233; letter-spacing: 0.18em; margin-bottom: 18px;
        }

        .sp-total-box {
          display: flex; align-items: center; gap: 14px; padding: 14px;
          margin-bottom: 18px;
          background: rgba(255,20,50,0.08);
          border: 1px solid rgba(255,40,60,0.18);
          border-radius: 10px; position: relative; overflow: hidden;
        }
        .sp-total-box::after {
          content: '';
          position: absolute; top: 0; left: 0; bottom: 0; width: 3px;
          background: linear-gradient(180deg, #ff3355, #770011);
          border-radius: 2px 0 0 2px;
        }

        .sp-total-num {
          font-family: 'Orbitron', monospace; font-size: 48px; font-weight: 900;
          line-height: 1; color: #fff; letter-spacing: -0.04em;
          text-shadow: 0 0 24px #ff003370, 0 2px 8px rgba(0,0,0,0.6);
        }

        .sp-total-meta { display: flex; flex-direction: column; gap: 2px; }

        .sp-total-label {
          font-family: 'Share Tech Mono', monospace; font-size: 7px;
          letter-spacing: 0.2em; color: #883344; text-transform: uppercase;
        }

        .sp-total-sub {
          font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 600;
          color: #ff4466; letter-spacing: 0.08em;
        }

        .sp-bars-title {
          font-family: 'Share Tech Mono', monospace; font-size: 7px;
          letter-spacing: 0.22em; color: #662233; margin-bottom: 10px;
        }

        .sp-bar-row {
          display: flex; align-items: center; gap: 8px; margin-bottom: 9px;
        }

        .sp-bar-lbl {
          font-family: 'Orbitron', monospace; font-size: 7px; font-weight: 700;
          letter-spacing: 0.1em; width: 48px; flex-shrink: 0;
        }

        .sp-bar-track {
          flex: 1; height: 5px;
          background: rgba(255,40,60,0.1);
          border-radius: 99px; overflow: hidden;
        }

        .sp-bar-fill {
          height: 100%; border-radius: 99px;
          transition: width 1.4s cubic-bezier(0.16,1,0.3,1);
        }

        .sp-bar-count {
          font-family: 'Share Tech Mono', monospace; font-size: 9px;
          color: #883344; width: 28px; text-align: right; flex-shrink: 0;
        }

        .sp-hr {
          height: 1px; margin: 16px 0;
          background: linear-gradient(90deg, transparent, rgba(255,40,60,0.25), transparent);
        }

        .sp-bottom { display: flex; gap: 6px; }

        .sp-stat-box {
          flex: 1; padding: 10px 8px; border-radius: 8px; text-align: center;
          background: rgba(255,30,50,0.07);
          border: 1px solid rgba(255,40,60,0.14);
        }

        .sp-sbox-label {
          font-family: 'Share Tech Mono', monospace; font-size: 6.5px;
          letter-spacing: 0.15em; color: #772233;
          margin-bottom: 4px; text-transform: uppercase;
        }

        .sp-sbox-val {
          font-family: 'Orbitron', monospace; font-size: 15px; font-weight: 700;
          color: #ff4466;
          text-shadow: 0 0 8px rgba(255,40,70,0.6);
          line-height: 1;
        }

        /* Download button */
        .sp-dl-btn {
          width: 100%; margin-top: 14px;
          font-family: 'Orbitron', monospace; font-size: 8px; font-weight: 700;
          letter-spacing: 0.2em; color: #ff4466;
          background: rgba(255,30,50,0.08);
          border: 1px solid rgba(255,40,60,0.25);
          border-radius: 6px; padding: 9px;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .sp-dl-btn:hover {
          background: rgba(255,30,50,0.16);
          border-color: rgba(255,40,60,0.5);
          color: #ff6677;
        }
        .sp-dl-btn svg { flex-shrink: 0; }
      `}</style>

      <div className="sp-card">
        <div className="sp-inner" ref={cardRef}>
          <div className="sp-scanline" />
          <div className="sp-grid" />
          <div className="sp-glow-orb" />
          <div className="sp-corner sp-tl" />
          <div className="sp-corner sp-tr" />
          <div className="sp-corner sp-bl" />
          <div className="sp-corner sp-br" />

          <div className="sp-content">
            <div className="sp-topbar">
              <div className="sp-rank">{rank.title}</div>
              <div className="sp-hp">
                HP <span>{stats.total}</span>
              </div>
            </div>

            <div className="sp-name">{stats.username}</div>
            <div className="sp-sub">// {rank.subtitle.toUpperCase()}</div>

            <div className="sp-total-box">
              <div className="sp-total-num">{stats.total.toLocaleString()}</div>
              <div className="sp-total-meta">
                <div className="sp-total-label">Problems</div>
                <div className="sp-total-label">Solved</div>
                <div className="sp-total-sub">{rank.subtitle}</div>
              </div>
            </div>

            <div className="sp-bars-title">— DIFFICULTY BREAKDOWN —</div>
            {difficulties.map((d) => (
              <div className="sp-bar-row" key={d.label}>
                <div className="sp-bar-lbl" style={{ color: d.color }}>
                  {d.label}
                </div>
                <div className="sp-bar-track">
                  <div
                    className="sp-bar-fill"
                    style={{
                      width: `${d.pct}%`,
                      background: `linear-gradient(90deg, ${d.dark}, ${d.color})`,
                      boxShadow: `0 0 8px ${d.color}80`,
                    }}
                  />
                </div>
                <div className="sp-bar-count">{d.value}</div>
              </div>
            ))}

            <div className="sp-hr" />

            <div className="sp-bottom">
              <div className="sp-stat-box">
                <div className="sp-sbox-label">Streak</div>
                <div className="sp-sbox-val">{stats.streak}</div>
              </div>
              <div className="sp-stat-box">
                <div className="sp-sbox-label">Easy %</div>
                <div className="sp-sbox-val">
                  {Math.round((stats.easy / total) * 100)}
                </div>
              </div>
              <div className="sp-stat-box">
                <div className="sp-sbox-label">Hard %</div>
                <div className="sp-sbox-val">
                  {Math.round((stats.hard / total) * 100)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download button — outside card so it doesn't appear in screenshot */}
      <button
        className="sp-dl-btn"
        onClick={() =>
          cardRef.current && downloadCard(cardRef.current, stats.username)
        }
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        SAVE CARD
      </button>
    </>
  );
}
