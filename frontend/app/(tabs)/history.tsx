import { View, Text, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ds/Card";
import { EmptyState } from "@/components/ds/EmptyState";
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
  manual: "#5EEAA0",
  geofence_timeout: "#22D3EE",
  auto_kill: "#FF6464",
};

function SessionCard({ session }: { session: Session }) {
  const entrada = new Date(session.hora_entrada);
  const fecha = entrada.toLocaleDateString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const hora = entrada.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

  const method = session.metodo_salida;
  const isActive = session.esta_activa;
  const isAutoKill = method === "auto_kill";

  const accentColor = isActive
    ? "#5EEAA0"
    : method
    ? METHOD_COLOR[method]
    : "#23262E";

  const borderColor = isActive ? "#5EEAA050" : "#23262E";
  const bgColor = isActive ? "#061512" : "#101115";

  return (
    <View
      style={{ backgroundColor: bgColor, borderColor }}
      className="flex-row rounded-ds-lg border mb-2 overflow-hidden"
    >
      {/* Accent bar */}
      <View style={{ width: 3, backgroundColor: accentColor }} />

      <View className="flex-1 px-4 py-3.5">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="font-ds-text-sb text-[14px] text-ds-fg-hi capitalize">
              {fecha} · {hora}
            </Text>
            <Text className="font-ds-text text-[13px] text-ds-fg-mute mt-0.5">
              {isActive
                ? "En curso..."
                : session.duracion_minutos !== null
                ? `${session.duracion_minutos} min`
                : "—"}
            </Text>
          </View>

          <View className="items-end gap-1">
            {isActive && (
              <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: "#5EEAA020" }}>
                <Text className="font-ds-text-sb text-[10px] text-ds-success tracking-widest">
                  ACTIVA
                </Text>
              </View>
            )}
            {method && !isActive && (
              <View
                className="px-2 py-0.5 rounded-md"
                style={{ backgroundColor: METHOD_COLOR[method] + "18" }}
              >
                <Text
                  className="font-ds-text-sb text-[10px] tracking-widest"
                  style={{ color: METHOD_COLOR[method] }}
                >
                  {METHOD_LABEL[method]}
                </Text>
              </View>
            )}
          </View>
        </View>

        {!isActive && session.puntos_otorgados !== null && (
          <View
            className="flex-row items-center gap-1.5 mt-2.5 pt-2.5 border-t border-ds-line-muted"
          >
            <Text
              className="font-ds-display text-[15px]"
              style={{ color: isAutoKill ? "#FFB454" : "#22D3EE" }}
            >
              +{session.puntos_otorgados} pts
            </Text>
            {isAutoKill && (
              <Text className="font-ds-text text-[11px] text-ds-fg-mute">(penalización −20%)</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function SkeletonCard() {
  return (
    <View className="flex-row rounded-ds-lg border border-ds-line bg-ds-bg-surface mb-2 overflow-hidden" style={{ height: 72 }}>
      <View style={{ width: 3, backgroundColor: "#23262E" }} />
      <View className="flex-1 px-4 py-3.5 gap-2">
        <View style={{ height: 14, width: "55%", backgroundColor: "#23262E", borderRadius: 4 }} />
        <View style={{ height: 11, width: "28%", backgroundColor: "#23262E", borderRadius: 4 }} />
      </View>
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
      className="flex-1 bg-ds-bg-base"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 }}
    >
      <Text className="font-ds-display text-[28px] text-ds-fg-hi tracking-[1px] mb-5">
        Mis sesiones
      </Text>

      {isLoading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}

      {!isLoading && sessions.length === 0 && (
        <Card variant="surface">
          <EmptyState
            title="Aún no tienes sesiones"
            description="Escanea tu QR en la entrada del gym"
          />
        </Card>
      )}

      {sessions.map((ses) => (
        <SessionCard key={ses.id} session={ses} />
      ))}
    </ScrollView>
  );
}
