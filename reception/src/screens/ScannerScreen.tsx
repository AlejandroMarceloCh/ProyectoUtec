import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { checkin, clearToken, type CheckinResult } from "../api";

interface Props {
  onLogout: () => void;
}

type ScanState =
  | { type: "idle" }
  | { type: "scanning" }
  | { type: "loading" }
  | { type: "success"; data: CheckinResult }
  | { type: "error"; message: string };

const RESET_MS = 4_000;

export function ScannerScreen({ onLogout }: Props) {
  const [state, setState] = useState<ScanState>({ type: "idle" });
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cooldownRef = useRef(false);

  const startScanner = () => {
    if (scannerRef.current) return;
    const qr = new Html5Qrcode("qr-reader");
    scannerRef.current = qr;

    qr.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 260, height: 260 } },
      async (decodedText) => {
        if (cooldownRef.current) return;
        cooldownRef.current = true;
        setState({ type: "loading" });

        try {
          const result = await checkin(decodedText.trim());
          setState({ type: "success", data: result });
        } catch (err: any) {
          setState({ type: "error", message: err.message || "Error desconocido" });
        }

        setTimeout(() => {
          setState({ type: "scanning" });
          cooldownRef.current = false;
        }, RESET_MS);
      },
      () => {}
    ).then(() => setState({ type: "scanning" }))
     .catch(() => setState({ type: "error", message: "No se pudo acceder a la cámara. Permite el acceso en Safari." }));
  };

  const stopScanner = () => {
    scannerRef.current?.stop().catch(() => {});
    scannerRef.current = null;
  };

  useEffect(() => {
    startScanner();
    return () => stopScanner();
  }, []);

  const handleLogout = () => {
    stopScanner();
    clearToken();
    onLogout();
  };

  const s = state;

  return (
    <div style={styles.root}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <GymIcon />
          <span style={styles.headerTitle}>UTEC GYM</span>
          <span style={styles.headerBadge}>SCANNER</span>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>Salir</button>
      </header>

      {/* Camera viewfinder */}
      <div style={styles.cameraWrap}>
        <div id="qr-reader" style={styles.cameraBox} />
        {/* Overlay corners */}
        <div style={{ ...styles.corner, top: 0, left: 0, borderTop: "3px solid #00C9D8", borderLeft: "3px solid #00C9D8" }} />
        <div style={{ ...styles.corner, top: 0, right: 0, borderTop: "3px solid #00C9D8", borderRight: "3px solid #00C9D8" }} />
        <div style={{ ...styles.corner, bottom: 0, left: 0, borderBottom: "3px solid #00C9D8", borderLeft: "3px solid #00C9D8" }} />
        <div style={{ ...styles.corner, bottom: 0, right: 0, borderBottom: "3px solid #00C9D8", borderRight: "3px solid #00C9D8" }} />
      </div>

      {/* Status bar */}
      <div style={styles.statusBar}>
        {s.type === "idle" && <StatusMsg color="#7A7A7A" text="Iniciando cámara..." />}
        {s.type === "scanning" && <StatusMsg color="#00C9D8" text="Apunta al QR del alumno" pulse />}
        {s.type === "loading" && <StatusMsg color="#F59E0B" text="Verificando..." />}
        {s.type === "success" && (
          <div style={styles.successBanner}>
            <span style={styles.successIcon}>✓</span>
            <div>
              <p style={styles.successName}>{s.data.usuario.full_name}</p>
              <p style={styles.successSub}>
                {s.data.usuario.faculty_code ?? s.data.usuario.role} · {s.data.ocupacion_actual}/{s.data.capacidad} en gym
              </p>
            </div>
          </div>
        )}
        {s.type === "error" && (
          <div style={styles.errorBanner}>
            <span style={styles.errorIcon}>✕</span>
            <p style={styles.errorMsg}>{s.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusMsg({ color, text, pulse }: { color: string; text: string; pulse?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 8, height: 8, borderRadius: 4, background: color,
        animation: pulse ? "pulse 1.5s infinite" : undefined,
      }} />
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color }}>{text}</span>
    </div>
  );
}

function GymIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 100 100" fill="none">
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
    height: "100dvh",
    background: "#0D0D0D",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    background: "#141414",
    borderBottom: "1px solid #2A2A2A",
    flexShrink: 0,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  headerTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: 3,
    color: "#F5F7FA",
  },
  headerBadge: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 9,
    fontWeight: 700,
    color: "#00C9D8",
    background: "rgba(0,201,216,0.12)",
    padding: "3px 8px",
    borderRadius: 5,
    letterSpacing: 1.5,
  },
  logoutBtn: {
    background: "transparent",
    color: "#7A7A7A",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid #2A2A2A",
  },
  cameraWrap: {
    position: "relative",
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#000",
  },
  cameraBox: {
    width: "100%",
    height: "100%",
    maxWidth: 500,
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
  },
  statusBar: {
    flexShrink: 0,
    minHeight: 80,
    background: "#141414",
    borderTop: "1px solid #2A2A2A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px 20px",
  },
  successBanner: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
  },
  successIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    background: "rgba(34,197,94,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    color: "#22C55E",
    flexShrink: 0,
    textAlign: "center",
    lineHeight: "44px",
  },
  successName: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 17,
    color: "#22C55E",
    margin: 0,
  },
  successSub: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    color: "#7A7A7A",
    marginTop: 3,
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
  },
  errorIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    background: "rgba(239,68,68,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    color: "#EF4444",
    flexShrink: 0,
    textAlign: "center",
    lineHeight: "44px",
  },
  errorMsg: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    color: "#EF4444",
    margin: 0,
  },
};
