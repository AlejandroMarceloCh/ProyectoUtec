import { create } from "zustand";
import { setItem, getItem, deleteItem } from "@/lib/storage";
import { api } from "@/lib/api";

export type UserRole = "student" | "trainer" | "utec_staff" | "admin_staff";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  faculty_id: string | null;
  points: number;
  preferred_days_per_week?: number | null;
  preferred_minutes_per_session?: number | null;
  sexo?: string | null;
  current_streak?: number;
  max_streak?: number;
}

export interface RegisterPrefs {
  preferred_days_per_week?: number;
  preferred_minutes_per_session?: number;
  sexo?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, facultyId?: string, prefs?: RegisterPrefs) => Promise<void>;
  setUser: (u: AuthUser) => void;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    await setItem("access_token", data.access_token);
    await setItem("refresh_token", data.refresh_token);
    // Decodificar el payload del JWT para obtener el user_id (sin librería externa)
    const payload = JSON.parse(atob(data.access_token.split(".")[1]));
    set({ accessToken: data.access_token });
    // Fetch del perfil completo
    const me = await api.get("/users/me");
    set({ user: me.data });
  },

  setUser: (u) => set({ user: u }),

  register: async (email, password, fullName, facultyId, prefs) => {
    const { data } = await api.post("/auth/register", {
      email,
      password,
      full_name: fullName,
      ...(facultyId ? { faculty_id: facultyId } : {}),
      ...(prefs ?? {}),
    });
    await setItem("access_token", data.access_token);
    await setItem("refresh_token", data.refresh_token);
    set({ accessToken: data.access_token });
    const me = await api.get("/users/me");
    set({ user: me.data });
  },

  logout: async () => {
    await deleteItem("access_token");
    await deleteItem("refresh_token");
    set({ user: null, accessToken: null });
  },

  loadFromStorage: async () => {
    try {
      const token = await getItem("access_token");
      if (!token) return set({ isLoading: false });
      set({ accessToken: token });
      const me = await api.get("/users/me");
      set({ user: me.data, isLoading: false });
      api.get("/qr/generate").catch(() => {});
      api.get("/sessions/me/active").catch(() => {});
    } catch {
      await deleteItem("access_token");
      set({ user: null, accessToken: null, isLoading: false });
    }
  },
}));
