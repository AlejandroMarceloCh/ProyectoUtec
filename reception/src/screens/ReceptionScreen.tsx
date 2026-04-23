import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { checkin, clearToken, type CheckinResult, type UserProfile } from "../api";

interface Props {
  onLogout: () => void;
}

type ScanState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; data: CheckinResult }
  | { type: "error"; message: string };

const RESET_MS = 5_000;

export function ReceptionScreen({ onLogout }: Props) {
  const [state, setState] = useState<ScanState>({ type: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const refocusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Always keep input focused
  useEffect(() => {
    refocusInput();
    const interval = setInterval(refocusInput, 1_000);
    window.addEventListener("click", refocusInput);
    return () => {
      clearInterval(interval);
      window.removeEventListener("click", refocusInput);
    };
  }, [refocusInput]);

  const resetAfterDelay = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setState({ type: "idle" });
      bufferRef.current = "";
      if (inputRef.current) inputRef.current.value = "";
      refocusInput();
    }, RESET_MS);
  }, [refocusInput]);

  const handleScan = useCallback(
    async (token: string) => {
      const clean = token.trim();
      if (!clean) return;

      setState({ type: "loading" });
      try {
        const result = await checkin(clean);
        setState({ type: "success", data: result });
      } catch (err: any) {
        setState({ type: "error", message: err.message || "Error desconocido" });
      }
      if (inputRef.current) inputRef.current.value = "";
      resetAfterDelay();
    },
    [resetAfterDelay]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleScan(inputRef.current?.value ?? "");
      }
    },
    [handleScan]
  );

  const handleLogout = () => {
    clearToken();
    onLogout();
  };

  return (
    <div style={styles.root}>
      {/* Top bar */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <svg width={28} height={28} viewBox="0 0 100 100" fill="none">
            <rect x={5} y={18} width={14} height={46} rx={4} fill="#00C9D8" />
            <rect x={81} y={18} width={14} height={46} rx={4} fill="#00C9D8" />
            <rect x={19} y={43} width={16} height={8} rx={4} fill="#00C9D8" />
            <rect x={65} y={43} width={16} height={8} rx={4} fill="#00C9D8" />
            <path d="M 35 47 L 35 62 Q 35 78 50 78 Q 65 78 65 62 L 65 47" stroke="#00C9D8" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span style={styles.headerTitle}>UTEC GYM</span>
          <span style={styles.headerBadge}>RECEPCIÓN</span>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Cerrar sesión
        </button>
      </header>

      {/* Hidden scanner input */}
      <input
        ref={inputRef}
        onKeyDown={handleKeyDown}
        style={styles.hiddenInput}
        autoFocus
        aria-label="Scanner input"
      />

      {/* Main display area */}
      <main style={styles.main}>
        {state.type === "idle" && <IdleView />}
        {state.type === "loading" && <LoadingView />}
        {state.type === "success" && <SuccessView data={state.data} />}
        {state.type === "error" && <ErrorView message={state.message} />}
      </main>
    </div>
  );
}

/* ── Sub-views ── */

function IdleView() {
  return (
    <div style={styles.stateWrap}>
      <div style={styles.scannerIcon}>
        <svg width={80} height={80} viewBox="0 0 24 24" fill="none">
          <path d="M3 7V5a2 2 0 012-2h2" stroke="#00C9D8" strokeWidth={1.5} strokeLinecap="round" />
          <path d="M17 3h2a2 2 0 012 2v2" stroke="#00C9D8" strokeWidth={1.5} strokeLinecap="round" />
          <path d="M21 17v2a2 2 0 01-2 2h-2" stroke="#00C9D8" strokeWidth={1.5} strokeLinecap="round" />
          <path d="M7 21H5a2 2 0 01-2-2v-2" stroke="#00C9D8" strokeWidth={1.5} strokeLinecap="round" />
          <line x1={4} y1={12} x2={20} y2={12} stroke="#00C9D840" strokeWidth={1} />
        </svg>
      </div>
      <h2 style={styles.stateTitle}>Esperando escaneo...</h2>
      <p style={styles.stateSubtitle}>
        Apunta el scanner al QR del alumno
      </p>
    </div>
  );
}

function LoadingView() {
  return (
    <div style={styles.stateWrap}>
      <div style={{ ...styles.pulse, animation: "pulse 0.8s infinite" }} />
      <h2 style={styles.stateTitle}>Verificando QR...</h2>
    </div>
  );
}

function SuccessView({ data }: { data: CheckinResult }) {
  const u = data.usuario;
  const initials = u.full_name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const time = new Date(data.sesion.hora_entrada).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const pct = data.capacidad > 0 ? Math.round((data.ocupacion_actual / data.capacidad) * 100) : 0;

  return (
    <div style={{ ...styles.stateWrap, animation: "slideUp 0.35s ease" }}>
      {/* Green check */}
      <div style={styles.checkCircle}>
        <svg width={48} height={48} viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="#22C55E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2 style={{ ...styles.stateTitle, color: "#22C55E", marginBottom: 32 }}>
        Entrada registrada
      </h2>

      {/* Profile card */}
      <div style={styles.profileCard}>
        <div style={styles.avatar}>
          <span style={styles.avatarText}>{initials}</span>
        </div>
        <div style={styles.profileInfo}>
          <h3 style={styles.profileName}>{u.full_name}</h3>
          <p style={styles.profileEmail}>{u.email}</p>
          <div style={styles.badgeRow}>
            {u.faculty_name && (
              <span style={styles.facultyBadge}>{u.faculty_code || u.faculty_name}</span>
            )}
            <span style={styles.roleBadge}>{u.role === "student" ? "Estudiante" : u.role}</span>
          </div>
        </div>
        <div style={styles.profileRight}>
          <span style={styles.pointsValue}>{u.points}</span>
          <span style={styles.pointsLabel}>pts</span>
        </div>
      </div>

      {/* Occupancy bar */}
      <div style={styles.occBar}>
        <div style={styles.occInfo}>
          <span style={styles.occText}>{data.ocupacion_actual} / {data.capacidad}</span>
          <span style={styles.occText}>{pct}% del aforo</span>
        </div>
        <div style={styles.occTrack}>
          <div
            style={{
              ...styles.occFill,
              width: `${Math.min(pct, 100)}%`,
              background: pct < 60 ? "#22C55E" : pct < 80 ? "#F59E0B" : "#EF4444",
            }}
          />
        </div>
        {data.alerta_aforo && (
          <p style={styles.occAlert}>⚠ Aforo alto</p>
        )}
      </div>

      <p style={styles.timeText}>Hora de entrada: {time}</p>
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <div style={{ ...styles.stateWrap, animation: "slideUp 0.3s ease" }}>
      <div style={styles.errorCircle}>
        <svg width={48} height={48} viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="#EF4444" strokeWidth={2.5} strokeLinecap="round" />
        </svg>
      </div>
      <h2 style={{ ...styles.stateTitle, color: "#EF4444" }}>Acceso denegado</h2>
      <p style={styles.stateSubtitle}>{message}</p>
    </div>
  );
}

/* ── Styles ── */

const styles: Record<string, CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#0D0D0D",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 32px",
    background: "#141414",
    borderBottom: "1px solid #2A2A2A",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: 4,
    color: "#F5F7FA",
  },
  headerBadge: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 10,
    fontWeight: 700,
    color: "#00C9D8",
    background: "rgba(0,201,216,0.12)",
    padding: "4px 10px",
    borderRadius: 6,
    letterSpacing: 1.5,
  },
  logoutBtn: {
    background: "transparent",
    color: "#7A7A7A",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #2A2A2A",
    transition: "color 0.2s",
  },
  hiddenInput: {
    position: "absolute",
    left: -9999,
    opacity: 0,
    width: 1,
    height: 1,
  },
  main: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  stateWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center" as const,
    maxWidth: 480,
    width: "100%",
  },
  scannerIcon: {
    marginBottom: 24,
    opacity: 0.8,
    animation: "pulse 2.5s infinite",
  },
  stateTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 28,
    color: "#F5F7FA",
    letterSpacing: 1,
    marginBottom: 8,
  },
  stateSubtitle: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 15,
    color: "#7A7A7A",
  },
  pulse: {
    width: 56,
    height: 56,
    borderRadius: 28,
    background: "#00C9D8",
    marginBottom: 20,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    background: "rgba(34,197,94,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  errorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    background: "rgba(239,68,68,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  profileCard: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    background: "#141414",
    border: "1px solid #00C9D8",
    borderRadius: 20,
    padding: "24px 28px",
    width: "100%",
    animation: "glow 2.5s infinite",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    fontSize: 22,
    color: "#00C9D8",
  },
  profileInfo: {
    flex: 1,
    textAlign: "left" as const,
  },
  profileName: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 20,
    color: "#F5F7FA",
    margin: 0,
  },
  profileEmail: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    color: "#7A7A7A",
    marginTop: 3,
  },
  badgeRow: {
    display: "flex",
    gap: 8,
    marginTop: 8,
  },
  facultyBadge: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    color: "#00C9D8",
    background: "rgba(0,201,216,0.15)",
    padding: "3px 10px",
    borderRadius: 6,
  },
  roleBadge: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    fontWeight: 600,
    color: "#7A7A7A",
    background: "#1C1C1C",
    padding: "3px 10px",
    borderRadius: 6,
  },
  profileRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flexShrink: 0,
  },
  pointsValue: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 28,
    color: "#00C9D8",
  },
  pointsLabel: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    color: "#7A7A7A",
  },
  occBar: {
    width: "100%",
    marginTop: 20,
    padding: "16px 20px",
    background: "#141414",
    border: "1px solid #2A2A2A",
    borderRadius: 14,
  },
  occInfo: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  occText: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    color: "#7A7A7A",
  },
  occTrack: {
    width: "100%",
    height: 6,
    background: "#1C1C1C",
    borderRadius: 999,
    overflow: "hidden",
  },
  occFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.5s ease",
  },
  occAlert: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    color: "#F59E0B",
    marginTop: 8,
  },
  timeText: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    color: "#7A7A7A",
    marginTop: 16,
  },
};
