import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export interface UserMetrics {
  stats: {
    total_sesiones: number;
    horas_totales: number;
    sesiones_este_mes: number;
  };
  ranking: {
    posicion: number;
    total_usuarios: number;
  };
  occupancy: {
    ocupacion_actual: number;
    capacidad: number;
    porcentaje: number;
  };
}

export function useUserMetrics() {
  const { user } = useAuthStore();

  const { data, isLoading, isError, refetch } = useQuery<UserMetrics>({
    queryKey: ["user-metrics"],
    queryFn: async () => {
      const [stats, ranking, occupancy] = await Promise.all([
        api.get("/users/me/stats").then((r) => r.data),
        api.get("/users/me/ranking").then((r) => r.data),
        api.get("/sessions/occupancy").then((r) => r.data),
      ]);
      return { stats, ranking, occupancy };
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  return {
    metrics: data,
    isLoading,
    isError,
    refetch,
  };
}
