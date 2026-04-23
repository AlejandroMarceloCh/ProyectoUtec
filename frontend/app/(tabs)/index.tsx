import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Alert, Animated, StyleSheet, Dimensions } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { GlowView } from "@/components/ui/GlowView";
import { PulseRing } from "@/components/ui/PulseRing";
import { colors } from "@/constants/theme";

const QR_TTL = 30;
const { width } = Dimensions.get("window");
const QR_SIZE = Math.min(width * 0.55, 220);

function CountdownBar({ seconds }: { seconds: number }) {
  const pct = seconds / QR_TTL;
  const color = seconds > 12 ? colors.primary : seconds > 6 ? colors.warning : colors.error;
  return (
    <View style={s.barTrack}>
      <Animated.View style={[s.barFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

/** Animated pulsing dot for active session */
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
    <View style={s.dotWrap}>
      <Animated.View style={[s.dotRing, { transform: [{ scale }], opacity }]} />
      <View style={s.dot} />
    </View>
  );
}

export default function QRScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [countdown, setCountdown] = useState(QR_TTL);

  const { data: qrData, refetch: refreshQR } = useQuery({
    queryKey: ["qr-token"],
    queryFn: () => api.get("/qr/generate").then((r) => r.data),
    enabled: !!user,
    staleTime: Infinity,
    gcTime: Infinity,
  });

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
      queryClient.invalidateQueries({ queryKey: ["history"] });
      Alert.alert("¡Listo!", "Salida registrada correctamente.");
    },
    onError: () => Alert.alert("Error", "No se pudo registrar la salida."),
  });

  useEffect(() => {
    if (!user) return;
    setCountdown(QR_TTL);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refreshQR();
          return QR_TTL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [qrData, user]);

  const borderColor =
    countdown > 12 ? colors.primary : countdown > 6 ? colors.warning : colors.error;
  const isExpiring = countdown <= 8;

  const session = sessionData?.sesion;
  const sessionMinutes = session
    ? Math.floor((Date.now() - new Date(session.hora_entrada).getTime()) / 60000)
    : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={s.scroll}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.greeting}>Bienvenido</Text>
          <Text style={s.name}>{user?.full_name}</Text>
        </View>
        <Logo size={36} color={colors.primary} />
      </View>

      {/* QR Card */}
      <Card glow style={s.qrCard}>
        <GlowView
          color={borderColor}
          radius={QR_SIZE * 0.7}
          intensity={isExpiring ? 0.3 : 0.18}
          breathe
        >
          <PulseRing
            size={QR_SIZE + 32}
            color={borderColor}
            rings={isExpiring ? 3 : 2}
            duration={isExpiring ? 1400 : 2400}
          >
            <View
              style={[
                s.qrWrap,
                {
                  borderColor,
                  width: QR_SIZE + 32,
                  height: QR_SIZE + 32,
                  borderRadius: 20,
                },
              ]}
            >
              {qrData?.qr_token ? (
                <QRCode
                  value={qrData.qr_token}
                  size={QR_SIZE}
                  color={colors.text}
                  backgroundColor={colors.surface}
                />
              ) : (
                <Skeleton width={QR_SIZE} height={QR_SIZE} borderRadius={12} />
              )}
            </View>
          </PulseRing>
        </GlowView>

        <CountdownBar seconds={countdown} />
        <Text style={s.countdownText}>
          {countdown > 6
            ? `Renueva en ${countdown}s`
            : countdown > 0
            ? `Expira en ${countdown}s`
            : "Renovando..."}
        </Text>
      </Card>

      {/* Active Session */}
      {sessionData?.tiene_sesion_activa ? (
        <Card glow style={s.sessionCard}>
          <View style={s.sessionHeader}>
            <View style={s.sessionBadge}>
              <ActiveDot />
              <Text style={s.activeText}>SESIÓN ACTIVA</Text>
            </View>
            <Text style={s.sessionTime}>
              {sessionMinutes !== null ? `${sessionMinutes} min` : "—"}
            </Text>
          </View>
          <Text style={s.entryTime}>
            Entrada: {session ? new Date(session.hora_entrada).toLocaleTimeString("es-PE") : "—"}
          </Text>
          <Button
            label="Registrar salida"
            onPress={() => checkoutMutation.mutate()}
            loading={checkoutMutation.isPending}
          />
        </Card>
      ) : (
        <Card style={s.sessionCard}>
          <EmptyState
            illustration="no-active"
            title="Sin sesión activa"
            subtitle="Muestra tu QR en la entrada del gym"
          />
        </Card>
      )}

      {/* Stats row */}
      <View style={s.statsRow}>
        <GlowView color={colors.primary} radius={48} intensity={0.15} breathe style={{ flex: 1 }}>
          <Card style={s.statCard}>
            <Text style={s.statValue}>{user?.points ?? 0}</Text>
            <Text style={s.statLabel}>Puntos</Text>
          </Card>
        </GlowView>
        <View style={{ width: 12 }} />
        <Card style={[s.statCard, { flex: 1 }]}>
          <Text style={[s.statValue, { color: colors.muted }]}>—</Text>
          <Text style={s.statLabel}>Rank</Text>
        </Card>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontFamily: "Inter-Regular",
    fontSize: 13,
    color: colors.muted,
  },
  name: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 22,
    color: colors.text,
    marginTop: 2,
  },
  qrCard: {
    alignItems: "center",
    paddingVertical: 28,
    marginBottom: 16,
  },
  qrWrap: {
    padding: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  barTrack: {
    width: "80%",
    height: 3,
    backgroundColor: colors.surface2,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 20,
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
  },
  countdownText: {
    fontFamily: "Inter-Medium",
    fontSize: 11,
    color: colors.muted,
    marginTop: 8,
  },
  sessionCard: {
    marginBottom: 16,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sessionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dotWrap: {
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
    position: "absolute",
  },
  dotRing: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.success,
    position: "absolute",
  },
  activeText: {
    fontFamily: "Inter-Bold",
    fontSize: 12,
    color: colors.success,
    letterSpacing: 1,
  },
  sessionTime: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 20,
    color: colors.primary,
  },
  entryTime: {
    fontFamily: "Inter-Regular",
    fontSize: 12,
    color: colors.muted,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: "row",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
  },
  statValue: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 28,
    color: colors.primary,
  },
  statLabel: {
    fontFamily: "Inter-Regular",
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
});
