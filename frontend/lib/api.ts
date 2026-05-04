import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getItem, setItem, deleteItem } from "@/lib/storage";

const raw = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
const base = raw.replace(/\/$/, "");
export const API_BASE_URL = `${base}/api/v1`;

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const refresh = await getItem("refresh_token");
      if (!refresh) return null;
      const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refresh });
      const newAccess: string | undefined = res.data?.access_token;
      if (!newAccess) return null;
      await setItem("access_token", newAccess);
      if (res.data?.refresh_token) await setItem("refresh_token", res.data.refresh_token);
      return newAccess;
    } catch {
      return null;
    } finally {
      setTimeout(() => { refreshPromise = null; }, 0);
    }
  })();
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const url: string = error.config?.url ?? "";
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh");
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && !isAuthEndpoint && original && !original._retry) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return api.request(original);
      }
      await deleteItem("access_token");
      await deleteItem("refresh_token");
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(error);
  }
);
