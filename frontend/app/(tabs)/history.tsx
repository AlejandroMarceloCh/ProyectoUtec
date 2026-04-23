import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { colors } from "@/constants/theme";
import { useAuthStore } from "@/store/auth";

type Session = {
  id: string;
  hora_entrada: string;
  hora_salida: string | null;
  metodo_salida: "manual" | "geofence_timeout" | "auto_kill" | null;
  duracion_minutos: number | null;
  puntos_otorgados: number | null;
  esta_activa: boolean;
};

const METHOD_LABEL: Record<string, string> = {
  manual: "Manual",
  geofence_timeout: "Geofence",
  auto_kill: "Auto",
};

const METHOD_COLOR: Record<string, string> = {
  manual: colors.success,
  geofence_timeout: colors.primary,
  auto_kill: colors.error,
};

function SessionCard({ session }: { session: Session }) {
  const entrada = new Date(session.hora_entrada);
  const fecha = entrada.toLocaleDateString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const hora = entrada.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const method = session.metodo_salida;
  const isAutoKill = method === "auto_kill";
  const isActive = session.esta_activa;

  return (
    <View style={[s.sessionCard, isActive && s.sessionCardActive]}>
      {/* Left accent bar */}
      <View
        style={[
          s.accentBar,
          {
            backgroundColor: isActive
              ? colors.success
              : method
              ? METHOD_COLOR[method]
              : colors.border,
          },
        ]}
      />

      <View style={s.sessionBody}>
        <View style={s.sessionRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.sessionDate}>
              {fecha} · {hora}
            </Text>
            <Text style={s.sessionDuration}>
              {isActive
                ? "En curso..."
                : session.duracion_minutos !== null
                ? `${session.duracion_minutos} min`
                : "—"}
            </Text>
          </View>

          <View style={{ alignItems: "flex-end", gap: 4 }}>
            {isActive && (
              <View style={[s.badge, { backgroundColor: colors.success + "20" }]}>
                <Text style={[s.badgeText, { color: colors.success }]}>ACTIVA</Text>
              </View>
            )}
            {method && !isActive && (
              <View style={[s.badge, { backgroundColor: METHOD_COLOR[method] + "18" }]}>
                <Text style={[s.badgeText, { color: METHOD_COLOR[method] }]}>
                  {METHOD_LABEL[method]}
                </Text>
              </View>
            )}
          </View>
        </View>

        {!isActive && session.puntos_otorgados !== null && (
          <View style={s.pointsRow}>
            <Text
              style={[
                s.points,
                { color: isAutoKill ? colors.warning : colors.primary },
              ]}
            >
              +{session.puntos_otorgados} pts
            </Text>
            {isAutoKill && (
              <Text style={s.penalty}>(penalización −20%)</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function LoadingSkeleton() {
  return (
    <View style={{ gap: 10 }}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[s.sessionCard, { overflow: "hidden" }]}>
          <View style={[s.accentBar, { backgroundColor: colors.border }]} />
          <View style={[s.sessionBody, { gap: 8 }]}>
            <Skeleton width="55%" height={14} />
            <Skeleton width="28%" height={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function HistoryScreen() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: () => api.get("/sessions/me/history").then((r) => r.data),
    enabled: !!user,
    staleTime: 60_000,
  });

  const sessions: Session[] = data?.sessions ?? [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={s.scroll}
    >
      <Text style={s.pageTitle}>Mis sesiones</Text>

      {isLoading && <LoadingSkeleton />}

      {!isLoading && sessions.length === 0 && (
        <Card>
          <EmptyState
            illustration="no-sessions"
            title="Aún no tienes sesiones"
            subtitle="Escanea tu QR en la entrada del gym"
          />
        </Card>
      )}

      {sessions.map((ses) => (
        <SessionCard key={ses.id} session={ses} />
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
  },
  pageTitle: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 28,
    color: colors.text,
    marginBottom: 20,
    letterSpacing: 1,
  },
  sessionCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    overflow: "hidden",
  },
  sessionCardActive: {
    borderColor: colors.success + "50",
    backgroundColor: "#0D1A14",
  },
  accentBar: {
    width: 3,
    alignSelf: "stretch",
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  sessionBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  sessionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sessionDate: {
    fontFamily: "Inter-SemiBold",
    fontSize: 14,
    color: colors.text,
    textTransform: "capitalize",
  },
  sessionDuration: {
    fontFamily: "SpaceGrotesk-Medium",
    fontSize: 13,
    color: colors.muted,
    marginTop: 3,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: "Inter-Bold",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  points: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 15,
  },
  penalty: {
    fontFamily: "Inter-Regular",
    fontSize: 11,
    color: colors.muted,
  },
});
