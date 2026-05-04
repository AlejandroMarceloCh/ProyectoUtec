import { useEffect, useRef } from "react";
import { View, Text, ScrollView, Alert, Animated, Platform } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ds/Button";
import { Card } from "@/components/ds/Card";
import { EmptyState } from "@/components/ds/EmptyState";
import { AccessPass } from "@/components/domain/AccessPass";
import { useQRToken } from "@/hooks/useQRToken";
import { useUserMetrics } from "@/hooks/useUserMetrics";

function ActiveDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.6, duration: 800, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={{ width: 12, height: 12, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: "#5EEAA0",
          position: "absolute",
          transform: [{ scale }],
          opacity,
        }}
      />
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#5EEAA0", position: "absolute" }} />
    </View>
  );
}

export default function QRScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { token, countdown, isFetching, isError, refetch } = useQRToken();
  const { metrics } = useUserMetrics();

  const { data: sessionData } = useQuery({
    queryKey: ["active-session"],
    queryFn: () => api.get("/sessions/me/active").then((r) => r.data),
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const checkoutMutation = useMutation({
    mutationFn: () => api.post("/sessions/checkout", { method: "manual" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-session"] });
      queryClient.invalidateQueries({ queryKey: ["user-metrics"] });
      Alert.alert("¡Listo!", "Salida registrada correctamente.");
    },
    onError: () => Alert.alert("Error", "No se pudo registrar la salida."),
  });

  useEffect(() => {
    if (Platform.OS !== "web" || typeof navigator === "undefined") return;
    let lock: { release: () => Promise<void> } | null = null;
    (async () => {
      try {
        const wl = (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock;
        if (wl) lock = await wl.request("screen");
      } catch {}
    })();
    return () => { try { lock?.release(); } catch {} };
  }, []);

  const session = sessionData?.sesion;
  const sessionMinutes = session
    ? Math.floor((Date.now() - new Date(session.hora_entrada).getTime()) / 60000)
    : null;

  return (
    <ScrollView
      className="flex-1 bg-ds-bg-base"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 }}
    >
      {/* Header — Identidad del alumno */}
      <View className="mb-6">
        <Text className="font-ds-text text-[13px] text-ds-fg-mute">Mi Acceso</Text>
        <Text className="font-ds-display text-[24px] text-ds-fg-hi mt-0.5">{user?.full_name}</Text>
        {user?.email && (
          <Text className="font-ds-text text-[12px] text-ds-fg-dim mt-1">{user.email}</Text>
        )}
      </View>

      {/* QR Card */}
      <AccessPass
        token={token}
        countdown={countdown}
        isFetching={isFetching}
        isError={isError}
        onRetry={refetch}
      />

      {/* Stats Grid — Sesiones, Puntos, Ranking, Aforo */}
      <View className="grid grid-cols-2 gap-3 mb-4">
        {/* Sesiones Totales */}
        <Card variant="surface" className="items-center py-4">
          <Text className="font-ds-display text-[20px] text-ds-brand-cyan">
            {metrics?.stats.total_sesiones ?? "—"}
          </Text>
          <Text className="font-ds-text text-[10px] text-ds-fg-mute mt-1">Sesiones</Text>
        </Card>

        {/* Puntos */}
        <Card variant="brand" className="items-center py-4">
          <Text className="font-ds-display text-[20px] text-ds-fg-hi">
            {user?.points ?? 0}
          </Text>
          <Text className="font-ds-text text-[10px] text-ds-fg-mute mt-1">Puntos</Text>
        </Card>

        {/* Ranking */}
        <Card variant="surface" className="items-center py-4">
          <Text className="font-ds-display text-[20px] text-ds-brand-cyan">
            #{metrics?.ranking.posicion ?? "—"}
          </Text>
          <Text className="font-ds-text text-[10px] text-ds-fg-mute mt-1">Ranking</Text>
        </Card>

        {/* Aforo */}
        <Card variant="surface" className="items-center py-4">
          <Text className="font-ds-display text-[20px] text-ds-fg-base">
            {metrics?.occupancy.ocupacion_actual ?? "—"}/{metrics?.occupancy.capacidad ?? "—"}
          </Text>
          <Text className="font-ds-text text-[10px] text-ds-fg-mute mt-1">Disponible</Text>
        </Card>
      </View>

      {/* Active Session */}
      {sessionData?.tiene_sesion_activa ? (
        <Card variant="surface" className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <ActiveDot />
              <Text className="font-ds-text-sb text-[12px] text-ds-success tracking-widest">
                SESIÓN ACTIVA
              </Text>
            </View>
            <Text className="font-ds-display text-[20px] text-ds-brand-cyan">
              {sessionMinutes !== null ? `${sessionMinutes} min` : "—"}
            </Text>
          </View>
          <Text className="font-ds-text text-[12px] text-ds-fg-mute mb-4">
            Entrada:{" "}
            {session ? new Date(session.hora_entrada).toLocaleTimeString("es-PE") : "—"}
          </Text>
          <Button
            variant="ghost"
            size="md"
            fullWidth
            loading={checkoutMutation.isPending}
            onPress={() => checkoutMutation.mutate()}
          >
            Registrar salida
          </Button>
        </Card>
      ) : (
        <Card variant="surface" className="mb-4">
          <EmptyState
            title="Sin sesión activa"
            description="Muestra tu QR en la entrada del gym"
          />
        </Card>
      )}
    </ScrollView>
  );
}
