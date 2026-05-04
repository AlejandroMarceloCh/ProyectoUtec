import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ds/Card";
import { Badge } from "@/components/ds/Badge";
import { EmptyState } from "@/components/ds/EmptyState";
import { MuscleMap } from "@/components/domain/MuscleMap";
import { adaptMuscleData } from "@/lib/muscle-mapping";
import { useState } from "react";

const METHOD_LABEL: Record<string, string> = {
  manual: "Manual",
  geofence_timeout: "Geofence",
  auto_kill: "Auto",
};

const METHOD_TONE: Record<string, "success" | "info" | "danger"> = {
  manual: "success",
  geofence_timeout: "info",
  auto_kill: "danger",
};

type Exercise = {
  nombre: string;
  grupo_primario: string;
  series: number;
  reps?: number;
};

type SessionDetail = {
  id: string;
  hora_entrada: string;
  hora_salida: string | null;
  duracion_minutos: number | null;
  puntos_otorgados: number | null;
  metodo_salida: string | null;
  ejercicios?: Exercise[];
  resumen_muscular?: Record<string, number>;
};

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [muscleView, setMuscleView] = useState<"front" | "back">("front");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["session-detail", id],
    queryFn: () => api.get(`/sessions/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const session: SessionDetail | undefined = data?.session ?? data;

  const entrada = session ? new Date(session.hora_entrada) : null;
  const fecha = entrada?.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hora = entrada?.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

  const muscleData = adaptMuscleData(session?.resumen_muscular ?? {});

  return (
    <>
      <Stack.Screen options={{ title: "Detalle de sesión", headerShown: false }} />
      <ScrollView
        className="flex-1 bg-ds-bg-base"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 }}
      >
        <Text className="font-ds-display text-[28px] text-ds-fg-hi tracking-[1px] mb-5">
          Sesión
        </Text>

        {isLoading && (
          <View className="gap-3">
            {[80, 120, 200].map((h) => (
              <View key={h} style={{ height: h, backgroundColor: "#181A20", borderRadius: 14 }} />
            ))}
          </View>
        )}

        {isError && (
          <Card variant="surface">
            <EmptyState title="No se pudo cargar la sesión" />
          </Card>
        )}

        {session && (
          <>
            {/* Header info */}
            <Card variant="surface" className="mb-4">
              <Text className="font-ds-text-sb text-[13px] text-ds-fg-mute capitalize mb-1">
                {fecha}
              </Text>
              <Text className="font-ds-display text-[22px] text-ds-fg-hi">{hora}</Text>

              <View className="flex-row items-center gap-3 mt-4">
                <View className="flex-1">
                  <Text className="font-ds-text text-[11px] text-ds-fg-mute">Duración</Text>
                  <Text className="font-ds-display text-[20px] text-ds-brand-cyan mt-0.5">
                    {session.duracion_minutos !== null ? `${session.duracion_minutos} min` : "—"}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-ds-text text-[11px] text-ds-fg-mute">Puntos</Text>
                  <Text className="font-ds-display text-[20px] text-ds-action mt-0.5">
                    {session.puntos_otorgados !== null ? `+${session.puntos_otorgados}` : "—"}
                  </Text>
                </View>
                {session.metodo_salida && (
                  <Badge tone={METHOD_TONE[session.metodo_salida] ?? "info"}>
                    {METHOD_LABEL[session.metodo_salida] ?? session.metodo_salida}
                  </Badge>
                )}
              </View>
            </Card>

            {/* Ejercicios */}
            <Card variant="surface" className="mb-4">
              <Text className="font-ds-display text-[16px] text-ds-fg-hi mb-3">Ejercicios</Text>
              {session.ejercicios && session.ejercicios.length > 0 ? (
                session.ejercicios.map((ex, i) => (
                  <View key={i} className="py-2.5 border-b border-ds-line-muted">
                    <Text className="font-ds-text-sb text-[14px] text-ds-fg-hi">{ex.nombre}</Text>
                    <Text className="font-ds-text text-[11px] text-ds-fg-mute mt-0.5">
                      {ex.grupo_primario}
                      {ex.series ? ` · ${ex.series} series` : ""}
                      {ex.reps ? ` × ${ex.reps}` : ""}
                    </Text>
                  </View>
                ))
              ) : (
                <EmptyState
                  title="Sin detalle de ejercicios"
                  description="Disponible próximamente — análisis por ejercicio en desarrollo."
                />
              )}
            </Card>

            {/* Mapa muscular */}
            <Card variant="surface">
              <Text className="font-ds-display text-[16px] text-ds-fg-hi mb-3">
                Grupos trabajados
              </Text>
              {session.resumen_muscular && Object.keys(session.resumen_muscular).length > 0 ? (
                <>
                  <View className="flex-row gap-2 mb-4">
                    {(["front", "back"] as const).map((v) => (
                      <Text
                        key={v}
                        onPress={() => setMuscleView(v)}
                        className={
                          muscleView === v
                            ? "font-ds-text-sb text-[13px] text-ds-brand-cyan"
                            : "font-ds-text text-[13px] text-ds-fg-mute"
                        }
                      >
                        {v === "front" ? "Frente" : "Espalda"}
                      </Text>
                    ))}
                  </View>
                  <MuscleMap data={muscleData} view={muscleView} />
                </>
              ) : (
                <EmptyState
                  title="Sin análisis muscular"
                  description="Disponible próximamente — análisis muscular en desarrollo."
                />
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </>
  );
}
