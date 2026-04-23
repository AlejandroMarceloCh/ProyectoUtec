import { useState, type CSSProperties, type FormEvent } from "react";
import { login } from "../api";

interface Props {
  onSuccess: () => void;
}

export function LoginScreen({ onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email.trim().toLowerCase(), password);
      const role = data.user?.role as string;
      if (!["admin_staff", "trainer", "utec_staff"].includes(role)) {
        setError("Solo personal autorizado puede acceder a recepción.");
        setLoading(false);
        return;
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        {/* Logo */}
        <svg width={72} height={72} viewBox="0 0 100 100" fill="none">
          <rect x={5} y={18} width={14} height={46} rx={4} fill="#00C9D8" />
          <rect x={81} y={18} width={14} height={46} rx={4} fill="#00C9D8" />
          <rect x={19} y={43} width={16} height={8} rx={4} fill="#00C9D8" />
          <rect x={65} y={43} width={16} height={8} rx={4} fill="#00C9D8" />
          <path
            d="M 35 47 L 35 62 Q 35 78 50 78 Q 65 78 65 62 L 65 47"
            stroke="#00C9D8"
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>

        <h1 style={styles.title}>UTEC GYM</h1>
        <p style={styles.subtitle}>Recepción — Acceso del personal</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="correo@utec.edu.pe"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            autoFocus
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#0D0D0D",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "#141414",
    border: "1px solid #2A2A2A",
    borderRadius: 20,
    padding: "48px 40px",
    maxWidth: 400,
    width: "90%",
    animation: "fadeIn 0.5s ease",
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 28,
    letterSpacing: 6,
    color: "#F5F7FA",
    marginTop: 16,
  },
  subtitle: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    color: "#7A7A7A",
    marginTop: 6,
    marginBottom: 32,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    width: "100%",
  },
  input: {
    background: "#1C1C1C",
    border: "1px solid #2A2A2A",
    borderRadius: 12,
    padding: "14px 16px",
    color: "#F5F7FA",
    fontSize: 14,
    transition: "border-color 0.2s",
  },
  error: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: 600,
    textAlign: "center" as const,
  },
  btn: {
    background: "#00C9D8",
    color: "#0D0D0D",
    fontWeight: 700,
    fontSize: 15,
    borderRadius: 14,
    padding: "14px 0",
    cursor: "pointer",
    marginTop: 4,
    transition: "opacity 0.2s",
  },
};
