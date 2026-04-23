const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

let accessToken: string | null = null;

export function setToken(token: string) {
  accessToken = token;
}

export function clearToken(): void {
  accessToken = null;
}

export function getToken() {
  return accessToken;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function login(
  email: string,
  password: string
): Promise<{ access_token: string; user: Record<string, unknown> }> {
  const data = await apiFetch<{
    access_token: string;
    user: Record<string, unknown>;
  }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  faculty_name: string | null;
  faculty_code: string | null;
  points: number;
}

export interface CheckinResult {
  status: string;
  usuario: UserProfile;
  sesion: {
    id: string;
    hora_entrada: string;
  };
  ocupacion_actual: number;
  capacidad: number;
  alerta_aforo: boolean;
}

export async function checkin(qrToken: string): Promise<CheckinResult> {
  return apiFetch<CheckinResult>("/api/v1/sessions/checkin", {
    method: "POST",
    body: JSON.stringify({ qr_token: qrToken }),
  });
}
