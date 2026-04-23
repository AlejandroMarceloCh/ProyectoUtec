import axios from "axios";
import { getItem, deleteItem } from "@/lib/storage";

const raw = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
const base = raw.replace(/\/$/, "");
export const API_BASE_URL = `${base}/api/v1`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Interceptor: adjunta el access token a cada request
api.interceptors.request.use(async (config) => {
  const token = await getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await deleteItem("access_token");
      await deleteItem("refresh_token");
    }
    return Promise.reject(error);
  }
);
