"use client";

import { type CityData } from "@/lib/cityStorage";

interface ExplorePanelProps {
  cityData: CityData;
  selectedUsername: string | null;
  onSelectUser: (name: string) => void;
  onRemoveUser: (name: string) => void;
  onClose: () => void;
}

const DIFFICULTY_COLOR = {
  easy: "#00b8a3",
  medium: "#ffc01e",
  hard: "#ff375f",
};

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: "absolute",
    inset: 0,
    zIndex: 30,
    display: "flex",
    justifyContent: "flex-end",
    pointerEvents: "none",
  },
  backdrop: {
    position: "absolute",
    inset: 0,
    background: "rgba(2,7,18,0.55)",
    pointerEvents: "auto",
    cursor: "pointer",
  },
  panel: {
    position: "relative",
    width: "clamp(280px, 35vw, 380px)",
    height: "100%",
    background: "rgba(6,4,14,0.97)",
    borderLeft: "1px solid rgba(200,0,30,0.2)",
    display: "flex",
    flexDirection: "column",
    pointerEvents: "auto",
    animation: "slideInRight 0.28s cubic-bezier(0.22,1,0.36,1) forwards",
    fontFamily: "'JetBrains Mono','Fira Code',monospace",
  },
  header: {
    padding: "18px 20px 14px",
    borderBottom: "1px solid rgba(200,0,30,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
  },
  headerTitle: {
    color: "#ff1133",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.22em",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#550022",
    fontSize: "18px",
    cursor: "pointer",
    lineHeight: 1,
    padding: "2px 6px",
    borderRadius: "3px",
    transition: "color 0.15s",
    fontFamily: "inherit",
  },
  cityStats: {
    padding: "14px 20px",
    borderBottom: "1px solid rgba(200,0,30,0.1)",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px",
    flexShrink: 0,
  },
  statBox: {
    background: "rgba(255,17,51,0.05)",
    border: "1px solid rgba(255,17,51,0.1)",
    borderRadius: "4px",
    padding: "8px 10px",
    textAlign: "center" as const,
  },
  statVal: {
    color: "#ff1133",
    fontSize: "16px",
    fontWeight: 800,
    letterSpacing: "0.04em",
    display: "block",
  },
  statLabel: {
    color: "#440011",
    fontSize: "8px",
    letterSpacing: "0.18em",
    display: "block",
    marginTop: "2px",
  },
  sectionLabel: {
    padding: "12px 20px 6px",
    color: "#440011",
    fontSize: "8px",
    letterSpacing: "0.22em",
    flexShrink: 0,
  },
  userList: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "0 12px 12px",
  },
  userCard: {
    background: "rgba(10,2,5,0.8)",
    border: "1px solid rgba(200,0,30,0.12)",
    borderRadius: "6px",
    padding: "12px 14px",
    marginBottom: "8px",
    cursor: "pointer",
    transition: "border-color 0.18s, background 0.18s",
    position: "relative" as const,
  },
  userCardActive: {
    background: "rgba(255,17,51,0.07)",
    border: "1px solid rgba(255,17,51,0.4)",
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  userName: {
    color: "#ffaaaa",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
  },
  rankBadge: {
    fontSize: "8px",
    letterSpacing: "0.1em",
    padding: "2px 7px",
    borderRadius: "2px",
    background: "rgba(255,17,51,0.12)",
    border: "1px solid rgba(255,17,51,0.2)",
    color: "#ff4455",
  },
  diffRow: {
    display: "flex",
    gap: "8px",
  },
  diffPill: {
    fontSize: "9px",
    letterSpacing: "0.06em",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  diffDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    display: "inline-block",
    flexShrink: 0,
  },
  totalSolved: {
    marginTop: "6px",
    height: "3px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "2px",
    overflow: "hidden" as const,
  },
  progressBar: {
    height: "100%",
    borderRadius: "2px",
    transition: "width 0.6s ease",
  },
  removeBtn: {
    position: "absolute" as const,
    top: "8px",
    right: "8px",
    background: "none",
    border: "none",
    color: "#330010",
    fontSize: "13px",
    cursor: "pointer",
    padding: "2px 5px",
    lineHeight: 1,
    transition: "color 0.15s",
    fontFamily: "inherit",
  },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    color: "#220008",
    fontSize: "9px",
    letterSpacing: "0.2em",
    gap: "8px",
    padding: "40px 20px",
    textAlign: "center" as const,
  },
  emptyIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "1px solid rgba(200,0,30,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#330010",
    fontSize: "16px",
    marginBottom: "4px",
  },
};

export default function ExplorePanel({
  cityData,
  selectedUsername,
  onSelectUser,
  onRemoveUser,
  onClose,
}: ExplorePanelProps) {
  const users = Object.values(cityData).map((u) => u.stats);

  const totalSolved = users.reduce((s, u) => s + (u.totalSolved ?? 0), 0);
  const totalEasy = users.reduce((s, u) => s + (u.easySolved ?? 0), 0);
  const totalHard = users.reduce((s, u) => s + (u.hardSolved ?? 0), 0);

  const maxSolved = Math.max(...users.map((u) => u.totalSolved ?? 0), 1);

  return (
    <div style={S.overlay}>
      <div style={S.backdrop} onClick={onClose} />
      <div style={S.panel}>
        {/* Header */}
        <div style={S.header}>
          <span style={S.headerTitle}>EXPLORE CITY</span>
          <button
            style={S.closeBtn}
            onClick={onClose}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ff1133")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#550022")}
          >
            ✕
          </button>
        </div>

        {/* City aggregate stats */}
        {users.length > 0 && (
          <div style={S.cityStats}>
            <div style={S.statBox}>
              <span style={S.statVal}>{users.length}</span>
              <span style={S.statLabel}>CITIZENS</span>
            </div>
            <div style={S.statBox}>
              <span style={S.statVal}>{totalSolved.toLocaleString()}</span>
              <span style={S.statLabel}>SOLVED</span>
            </div>
            <div style={S.statBox}>
              <span style={S.statVal}>{totalHard}</span>
              <span style={S.statLabel}>HARD ACs</span>
            </div>
          </div>
        )}

        <div style={S.sectionLabel}>
          {users.length > 0
            ? `${users.length} BUILDING${users.length !== 1 ? "S" : ""} IN CITY`
            : "NO CITIZENS YET"}
        </div>

        {/* User list */}
        {users.length === 0 ? (
          <div style={S.emptyState}>
            <div style={S.emptyIcon}>⬡</div>
            ADD A LEETCODE USERNAME
            <br />
            TO POPULATE YOUR CITY
          </div>
        ) : (
          <div style={S.userList}>
            {users
              .sort((a, b) => (b.totalSolved ?? 0) - (a.totalSolved ?? 0))
              .map((u) => {
                const isActive = u.username === selectedUsername;
                const pct = Math.round(
                  ((u.totalSolved ?? 0) / maxSolved) * 100
                );
                return (
                  <div
                    key={u.username}
                    style={{
                      ...S.userCard,
                      ...(isActive ? S.userCardActive : {}),
                    }}
                    onClick={() => {
                      onSelectUser(u.username);
                      onClose();
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor =
                          "rgba(255,17,51,0.28)";
                        e.currentTarget.style.background =
                          "rgba(255,17,51,0.04)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor =
                          "rgba(200,0,30,0.12)";
                        e.currentTarget.style.background =
                          "rgba(10,2,5,0.8)";
                      }
                    }}
                  >
                    <button
                      style={S.removeBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveUser(u.username);
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#ff4455")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#330010")
                      }
                      title="Remove user"
                    >
                      ✕
                    </button>

                    <div style={S.userRow}>
                      <span style={S.userName}>{u.username}</span>
                      {u.ranking && (
                        <span style={S.rankBadge}>
                          #{u.ranking.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div style={S.diffRow}>
                      {(
                        [
                          ["easy", u.easySolved ?? 0, DIFFICULTY_COLOR.easy],
                          [
                            "medium",
                            u.mediumSolved ?? 0,
                            DIFFICULTY_COLOR.medium,
                          ],
                          ["hard", u.hardSolved ?? 0, DIFFICULTY_COLOR.hard],
                        ] as [string, number, string][]
                      ).map(([label, count, color]) => (
                        <span key={label} style={S.diffPill}>
                          <span
                            style={{ ...S.diffDot, background: color }}
                          />
                          <span style={{ color: "#888", fontSize: "9px" }}>
                            {count}
                          </span>
                        </span>
                      ))}
                      <span
                        style={{
                          marginLeft: "auto",
                          color: "#ff4455",
                          fontSize: "10px",
                          fontWeight: 700,
                        }}
                      >
                        {u.totalSolved ?? 0}
                      </span>
                    </div>

                    <div style={S.totalSolved}>
                      <div
                        style={{
                          ...S.progressBar,
                          width: `${pct}%`,
                          background: isActive ? "#ff1133" : "#330010",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}