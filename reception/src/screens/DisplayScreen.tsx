import { useEffect, useState, type CSSProperties } from "react";
import { apiFetch } from "../api";

interface RecentItem {
  session_id: string;
  full_name: string;
  email: string;
  faculty_code: string | null;
  faculty_name: string | null;
  points: number;
  hora_entrada: string;
  hora_salida: string | null;
  esta_activa: boolean;
}

interface RecentResponse {
  items: RecentItem[];
  ocupacion_actual: number;
  capacidad: number;
}

const POLL_MS = 1_500;

export function DisplayScreen() {
  const [data, setData] = useState<RecentResponse | null>(null);
  const [flash, setFlash] = useState(false);
  const prevTopId = useState<string | null>(null);

  useEffect(() => {
    let prev: string | null = null;

    const poll = async () => {
      try {
        const res = await apiFetch<RecentResponse>("/api/v1/sessions/recent?limit=5");
        setData(res);

        const topId = res.items[0]?.session_id ?? null;
        if (topId && topId !== prev) {
          prev = topId;
          setFlash(true);
          setTimeout(() => setFlash(false), 1000);
        }
      } catch {}
    };

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, []);

  const last = data?.items[0] ?? null;
  const pct = data ? Math.round((data.ocupacion_actual / data.capacidad) * 100) : 0;
  const isHigh = pct >= 80;
  const isMid = pct >= 60 && pct < 80;

  const now = new Date();
  const timeStr = now.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ ...styles.root, background: flash ? "#0D1F14" : "#0D0D0D", transition: "background 0.4s" }}>
      {/* Top bar */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <GymIcon />
          <span style={styles.headerTitle}>UTEC GYM</span>
          <span style={styles.headerBadge}>RECEPCIÓN</span>
        </div>
        <div style={styles.clock}>
          <span style={styles.clockTime}>{timeStr}</span>
          <span style={styles.clockDate}>{dateStr}</span>
        </div>
      </header>

      <main style={styles.main}>
        {/* Left: last check-in */}
        <section style={styles.leftPanel}>
          <p style={styles.sectionLabel}>ÚLTIMO CHECK-IN</p>

          {last ? (
            <div style={{ ...styles.card, borderColor: flash ? "#22C55E" : "#2A2A2A", transition: "border-color 0.4s" }}>
              <div style={styles.avatar}>
                <span style={styles.avatarText}>
                  {last.full_name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
                </span>
              </div>
              <div style={styles.cardInfo}>
                <h2 style={styles.name}>{last.full_name}</h2>
                <p style={styles.email}>{last.email}</p>
                <div style={styles.badges}>
                  {last.faculty_code && <span style={styles.badge}>{last.faculty_code}</span>}
                  <span style={{
                    ...styles.badge,
                    background: last.esta_activa ? "rgba(34,197,94,0.12)" : "#1C1C1C",
                    color: last.esta_activa ? "#22C55E" : "#7A7A7A",
                  }}>
                    {last.esta_activa ? "● En gym" : "Salió"}
                  </span>
                </div>
              </div>
              <div style={styles.cardRight}>
                <span style={styles.points}>{last.points.toLocaleString()}</span>
                <span style={styles.pointsLabel}>pts</span>
                <span style={styles.entryTime}>
                  {new Date(last.hora_entrada).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ) : (
            <div style={styles.emptyCard}>
              <p style={styles.emptyText}>Sin check-ins aún</p>
            </div>
          )}

          {/* Recent list */}
          {data && data.items.length > 1 && (
            <div style={styles.recentList}>
              <p style={styles.sectionLabel}>ANTERIORES</p>
              {data.items.slice(1).map(item => (
                <div key={item.session_id} style={styles.recentRow}>
                  <span style={styles.recentInitials}>
                    {item.full_name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
                  </span>
                  <span style={styles.recentName}>{item.full_name}</span>
                  <span style={styles.recentFac}>{item.faculty_code ?? "—"}</span>
                  <span style={styles.recentTime}>
                    {new Date(item.hora_entrada).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right: occupancy */}
        <section style={styles.rightPanel}>
          <p style={styles.sectionLabel}>AFORO EN VIVO</p>

          <div style={styles.occCircleWrap}>
            <svg width={220} height={220} viewBox="0 0 220 220">
              <circle cx={110} cy={110} r={90} fill="none" stroke="#1C1C1C" strokeWidth={18} />
              <circle
                cx={110} cy={110} r={90}
                fill="none"
                stroke={isHigh ? "#EF4444" : isMid ? "#F59E0B" : "#22C55E"}
                strokeWidth={18}
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 90}`}
                strokeDashoffset={`${2 * Math.PI * 90 * (1 - pct / 100)}`}
                transform="rotate(-90 110 110)"
                style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.4s" }}
              />
            </svg>
            <div style={styles.occCenter}>
              <span style={styles.occNumber}>{data?.ocupacion_actual ?? 0}</span>
              <span style={styles.occSlash}>/ {data?.capacidad ?? 100}</span>
              <span style={styles.occPct}>{pct}%</span>
            </div>
          </div>

          <p style={{
            ...styles.occStatus,
            color: isHigh ? "#EF4444" : isMid ? "#F59E0B" : "#22C55E",
          }}>
            {isHigh ? "⚠ Aforo alto" : isMid ? "Aforo moderado" : "Aforo normal"}
          </p>

          <div style={styles.occBar}>
            <div style={{
              ...styles.occFill,
              width: `${pct}%`,
              background: isHigh ? "#EF4444" : isMid ? "#F59E0B" : "#22C55E",
            }} />
          </div>
        </section>
      </main>

      <footer style={styles.footer}>
        <span style={styles.footerText}>Actualización automática cada 1.5s · UTEC Gym</span>
        <span style={styles.footerDot} />
        <span style={styles.footerText}>Backend conectado</span>
      </footer>
    </div>
  );
}

function GymIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 100 100" fill="none">
      <rect x={5} y={18} width={14} height={46} rx={4} fill="#00C9D8" />
      <rect x={81} y={18} width={14} height={46} rx={4} fill="#00C9D8" />
      <rect x={19} y={43} width={16} height={8} rx={4} fill="#00C9D8" />
      <rect x={65} y={43} width={16} height={8} rx={4} fill="#00C9D8" />
      <path d="M 35 47 L 35 62 Q 35 78 50 78 Q 65 78 65 62 L 65 47" stroke="#00C9D8" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

const styles: Record<string, CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    fontFamily: "'Inter', sans-serif",
    transition: "background 0.4s",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 40px",
    background: "#141414",
    borderBottom: "1px solid #2A2A2A",
    flexShrink: 0,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  headerTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 20,
    letterSpacing: 4,
    color: "#F5F7FA",
  },
  headerBadge: {
    fontSize: 10,
    fontWeight: 700,
    color: "#00C9D8",
    background: "rgba(0,201,216,0.12)",
    padding: "4px 10px",
    borderRadius: 6,
    letterSpacing: 1.5,
  },
  clock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  clockTime: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 22,
    color: "#F5F7FA",
    letterSpacing: 2,
  },
  clockDate: {
    fontSize: 11,
    color: "#7A7A7A",
    textTransform: "capitalize",
  },
  main: {
    flex: 1,
    display: "flex",
    gap: 0,
    overflow: "hidden",
  },
  leftPanel: {
    flex: 1,
    padding: "32px 40px",
    borderRight: "1px solid #2A2A2A",
    overflow: "auto",
  },
  rightPanel: {
    width: 320,
    flexShrink: 0,
    padding: "32px 32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#7A7A7A",
    letterSpacing: 2,
    marginBottom: 16,
  },
  card: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    background: "#141414",
    border: "1px solid #2A2A2A",
    borderRadius: 20,
    padding: "24px 28px",
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    background: "rgba(0,201,216,0.12)",
    border: "2px solid #00C9D8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 26,
    color: "#00C9D8",
  },
  cardInfo: { flex: 1 },
  name: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 22,
    color: "#F5F7FA",
    margin: 0,
    marginBottom: 4,
  },
  email: { fontSize: 13, color: "#7A7A7A", margin: 0, marginBottom: 8 },
  badges: { display: "flex", gap: 8 },
  badge: {
    fontSize: 11,
    fontWeight: 700,
    color: "#00C9D8",
    background: "rgba(0,201,216,0.12)",
    padding: "3px 10px",
    borderRadius: 6,
  },
  cardRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flexShrink: 0,
  },
  points: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 32,
    color: "#00C9D8",
  },
  pointsLabel: { fontSize: 11, color: "#7A7A7A" },
  entryTime: { fontSize: 12, color: "#4A4A4A", marginTop: 6 },
  emptyCard: {
    background: "#141414",
    border: "1px solid #2A2A2A",
    borderRadius: 20,
    padding: 40,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyText: { color: "#4A4A4A", fontSize: 14 },
  recentList: { marginTop: 8 },
  recentRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "12px 16px",
    borderRadius: 12,
    background: "#141414",
    marginBottom: 8,
  },
  recentInitials: {
    width: 36,
    height: 36,
    borderRadius: 18,
    background: "#1C1C1C",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    color: "#7A7A7A",
    flexShrink: 0,
    textAlign: "center",
    lineHeight: "36px",
  },
  recentName: { flex: 1, fontSize: 14, color: "#D0D0D0", fontWeight: 600 },
  recentFac: { fontSize: 12, color: "#00C9D8", fontWeight: 700, minWidth: 40 },
  recentTime: { fontSize: 12, color: "#4A4A4A" },
  occCircleWrap: {
    position: "relative",
    width: 220,
    height: 220,
    marginBottom: 16,
  },
  occCenter: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  occNumber: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 52,
    color: "#F5F7FA",
    lineHeight: 1,
  },
  occSlash: { fontSize: 14, color: "#7A7A7A", marginTop: 4 },
  occPct: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 18,
    color: "#00C9D8",
    marginTop: 2,
  },
  occStatus: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  occBar: {
    width: "100%",
    height: 6,
    background: "#1C1C1C",
    borderRadius: 999,
    overflow: "hidden",
  },
  occFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.8s ease, background 0.4s",
  },
  footer: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "10px 40px",
    background: "#0A0A0A",
    borderTop: "1px solid #1A1A1A",
  },
  footerText: { fontSize: 11, color: "#3A3A3A" },
  footerDot: { width: 4, height: 4, borderRadius: 2, background: "#3A3A3A" },
};
