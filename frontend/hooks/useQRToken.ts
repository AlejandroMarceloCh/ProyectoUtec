import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const QR_TTL = 14;

export function useQRToken() {
  const { user } = useAuthStore();
  const [countdown, setCountdown] = useState(QR_TTL);

  const { data, refetch, isError, isFetching } = useQuery({
    queryKey: ["qr-token"],
    queryFn: () => api.get("/qr/generate").then((r) => r.data),
    enabled: !!user,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
    retryDelay: 1500,
  });

  useEffect(() => {
    if (!user || !data?.code) return;
    setCountdown(QR_TTL);
    let prefetched = false;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (!prefetched && prev <= 5) {
          prefetched = true;
          refetch();
        }
        if (prev <= 1) return QR_TTL;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [data?.code, user]);

  return {
    token: data?.code as string | undefined,
    countdown,
    isFetching,
    isError,
    refetch,
  };
}
