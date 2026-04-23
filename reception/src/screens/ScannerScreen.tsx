import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { checkin, clearToken, type CheckinResult } from "../api";

interface Props {
  onLogout: () => void;
}

type CamState = "starting" | "active" | "denied" | "unsupported";
type ScanResult =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; data: CheckinResult }
  | { type: "error"; message: string };

const RESET_MS = 4_000;

export function ScannerScreen({ onLogout }: Props) {
  const [camState, setCamState] = useState<CamState>("starting");
  const [result, setResult] = useState<ScanResult>({ type: "idle" });
  const [manualToken, setManualToken] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cooldownRef = useRef(false);

  const handleCheckin = async (token: string) => {
    const clean = token.trim();
    if (!clean || cooldownRef.current) return;
    cooldownRef.current = true;
    setResult({ type: "loading" });
    setManualToken("");
    try {
      const data = await checkin(clean);
      setResult({ type: "success", data });
    } catch (err: any) {
      setResult({ type: "error", message: err.message || "Error desconocido" });
    }
    setTimeout(() => {
      setResult({ type: "idle" });
      cooldownRef.current = false;
    }, RESET_MS);
  };

  useEffect(() => {
    // Check if getUserMedia is available (requires HTTPS on Safari)
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamState("unsupported");
      return;
    }

    const qr = new Html5Qrcode("qr-reader");
    scannerRef.current = qr;

    qr.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decoded) => handleCheckin(decoded),
      () => {}
    )
      .then(() => setCamState("active"))
      .catch((err) => {
        console.error("Camera error:", err);
        setCamState("denied");
      });

    return () => {
      qr.stop().catch(() => {});
      scannerRef.current = null;
    };
  }, []);

  const handleLogout = () => {
    scannerRef.current?.stop().catch(() => {});
    clearToken();
    onLogout();
  };

  const isHttpWarning = camState === "denied" || camState === "unsupported";

  return (
    <div style={styles.root}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <GymIcon />
          <span style={styles.title}>UTEC GYM</span>
          <span style={styles.badge}>SCANNER</span>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>Salir</button>
      </header>

      {/* Camera area */}
      <div style={styles.cameraWrap}>
        {/* The html5-qrcode mounts here — always rendered so the lib can attach */}
        <div
          id="qr-reader"
          style={{
            ...styles.cameraInner,
            display: camState === "active" ? "block" : "none",
          }}
        />

        {/* Starting overlay */}
        {camState === "starting" && (
          <div style={styles.overlay}>
            <div style={styles.spinner} />
            <p style={styles.overlayText}>Iniciando cámara...</p>
          </div>
        )}

        {/* Camera denied / HTTPS warning */}
        {isHttpWarning && (
          <div style={styles.overlay}>
            <div style={styles.warnIcon}>⚠</div>
            <p style={styles.warnTitle}>Cámara no disponible</p>
            <p style={styles.warnSub}>
              Safari requiere <strong>HTTPS</strong> para usar la cámara.{"\n"}
              Usá el input manual de abajo para escanear.
            </p>
          </div>
        )}

        {/* Active camera: corner guides */}
        {camState === "active" && (
          <>
            <div style={{ ...styles.corner, top: 24, left: 24, borderTop: "3px solid #00C9D8", borderLeft: "3px solid #00C9D8" }} />
            <div style={{ ...styles.corner, top: 24, right: 24, borderTop: "3px solid #00C9D8", borderRight: "3px solid #00C9D8" }} />
            <div style={{ ...styles.corner, bottom: 90, left: 24, borderBottom: "3px solid #00C9D8", borderLeft: "3px solid #00C9D8" }} />
            <div style={{ ...styles.corner, bottom: 90, right: 24, borderBottom: "3px solid #00C9D8", borderRight: "3px solid #00C9D8" }} />
          </>
        )}
      </div>

      {/* Bottom panel: result + manual fallback */}
      <div style={styles.bottom}>
        {/* Result banner */}
        {result.type === "loading" && (
          <div style={styles.resultRow}>
            <span style={styles.dot("amber")} />
            <span style={styles.resultText}>Verificando QR...</span>
          </div>
        )}
        {result.type === "idle" && camState === "active" && (
          <div style={styles.resultRow}>
            <span style={{ ...styles.dot("cyan"), animation: "pulse 1.5s infinite" }} />
            <span style={styles.resultText}>Apunta al QR del alumno</span>
          </div>
        )}
        {result.type === "success" && (
          <div style={styles.successBanner}>
            <span style={styles.successIcon}>✓</span>
            <div>
              <p style={styles.successName}>{result.data.usuario.full_name}</p>
              <p style={styles.successSub}>
                {result.data.usuario.faculty_code ?? result.data.usuario.role}
                {" · "}{result.data.ocupacion_actual}/{result.data.capacidad} en gym
              </p>
            </div>
          </div>
        )}
        {result.type === "error" && (
          <div style={styles.errorBanner}>
            <span style={styles.errorIcon}>✕</span>
            <p style={styles.errorMsg}>{result.message}</p>
          </div>
        )}

        {/* Manual input — siempre visible como fallback */}
        <div style={styles.manualWrap}>
          <p style={styles.manualLabel}>
            {isHttpWarning ? "Pegá el token QR manualmente:" : "O pegá el token aquí:"}
          </p>
          <div style={styles.manualRow}>
            <input
              style={styles.manualInput}
              placeholder="eyJhbG..."
              value={manualToken}
              onChange={e => setManualToken(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCheckin(manualToken)}
            />
            <button
              style={styles.manualBtn}
              onClick={() => handleCheckin(manualToken)}
              disabled={!manualToken.trim()}
            >
              Verificar
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
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
      <path d="M35 47 L35 62 Q35 78 50 78 Q65 78 65 62 L65 47"
        stroke="#00C9D8" strokeWidth={8} strokeLinecap="round" fill="none" />
    </svg>
  );
}

const styles: Record<string, any> = {
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
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: 3,
    color: "#F5F7FA",
  },
  badge: {
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
    padding: "6px 14px",
    borderRadius: 8,
    border: "1px solid #2A2A2A",
  },
  cameraWrap: {
    flex: 1,
    position: "relative",
    background: "#000",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 0,
  },
  cameraInner: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 32,
    background: "#0D0D0D",
  },
  spinner: {
    width: 44,
    height: 44,
    border: "3px solid #2A2A2A",
    borderTop: "3px solid #00C9D8",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  overlayText: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 15,
    color: "#7A7A7A",
  },
  warnIcon: {
    fontSize: 40,
    color: "#F59E0B",
  },
  warnTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 18,
    color: "#F5F7FA",
    margin: 0,
  },
  warnSub: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    color: "#7A7A7A",
    textAlign: "center",
    lineHeight: 1.6,
    whiteSpace: "pre-line",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
  },
  bottom: {
    flexShrink: 0,
    background: "#141414",
    borderTop: "1px solid #2A2A2A",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  resultRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  dot: (color: "cyan" | "amber") => ({
    width: 8,
    height: 8,
    borderRadius: 4,
    background: color === "cyan" ? "#00C9D8" : "#F59E0B",
    flexShrink: 0,
  }),
  resultText: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    color: "#7A7A7A",
  },
  successBanner: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  successIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    background: "rgba(34,197,94,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    color: "#22C55E",
    flexShrink: 0,
    textAlign: "center",
    lineHeight: "40px",
  },
  successName: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 16,
    color: "#22C55E",
    margin: 0,
  },
  successSub: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    color: "#7A7A7A",
    marginTop: 2,
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    background: "rgba(239,68,68,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    color: "#EF4444",
    flexShrink: 0,
    textAlign: "center",
    lineHeight: "40px",
  },
  errorMsg: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    color: "#EF4444",
    margin: 0,
  },
  manualWrap: {
    borderTop: "1px solid #2A2A2A",
    paddingTop: 12,
  },
  manualLabel: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    color: "#4A4A4A",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  manualRow: {
    display: "flex",
    gap: 8,
  },
  manualInput: {
    flex: 1,
    background: "#1C1C1C",
    border: "1px solid #2A2A2A",
    borderRadius: 10,
    padding: "10px 14px",
    color: "#F5F7FA",
    fontSize: 13,
    fontFamily: "monospace",
    outline: "none",
  },
  manualBtn: {
    background: "#00C9D8",
    color: "#0D0D0D",
    fontFamily: "'Inter', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    cursor: "pointer",
    flexShrink: 0,
  },
};
