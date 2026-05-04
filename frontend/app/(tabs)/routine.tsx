import { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Card } from "@/components/ds/Card";
import { Button } from "@/components/ds/Button";
import { Segmented } from "@/components/ds/Segmented";
import { EmptyState } from "@/components/ds/EmptyState";
import { MuscleMap } from "@/components/domain/MuscleMap";
import { adaptMuscleData } from "@/lib/muscle-mapping";

type Sexo = "M" | "F" | "Otro";
type Enfoque = "hipertrofia" | "fuerza" | "perdida_grasa" | "resistencia" | "recomp";
type Range = "day" | "week" | "month" | "all";

const ENFOQUE_LABEL: Record<Enfoque, string> = {
  hipertrofia: "Hipertrofia",
  fuerza: "Fuerza",
  perdida_grasa: "Pérdida de grasa",
  resistencia: "Resistencia",
  recomp: "Recomp",
};

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "day", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "all", label: "Total" },
];

const VIEW_OPTIONS: { value: "front" | "back"; label: string }[] = [
  { value: "front", label: "Frente" },
  { value: "back", label: "Espalda" },
];

function Chip<T extends string>({
  value,
  active,
  onPress,
  label,
}: {
  value: T;
  active: boolean;
  onPress: (v: T) => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={() => onPress(value)}
      className={
        active
          ? "px-3.5 py-2 rounded-full bg-ds-brand-cyan border border-ds-brand-cyan"
          : "px-3.5 py-2 rounded-full bg-ds-bg-raised border border-ds-line"
      }
    >
      <Text
        className={
          active
            ? "font-ds-text-sb text-[12px] text-ds-fg-on-accent"
            : "font-ds-text-m text-[12px] text-ds-fg-mute"
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function RoutineScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [dias, setDias] = useState(4);
  const [sexo, setSexo] = useState<Sexo>("M");
  const [enfoque, setEnfoque] = useState<Enfoque>("hipertrofia");
  const [view, setView] = useState<"front" | "back">("front");
  const [range, setRange] = useState<Range>("week");

  const { data: routine } = useQuery({
    queryKey: ["my-routine"],
    queryFn: () => api.get("/routines/me").then((r) => r.data),
    enabled: !!user,
  });

  // Fallback recomendado cuando no hay rutina fija (consume preferencias + historial)
  const { data: recommended } = useQuery({
    queryKey: ["routine-recommended", user?.preferred_days_per_week, user?.preferred_minutes_per_session, user?.sexo],
    queryFn: () => api.get("/routines/recommended").then((r) => r.data),
    enabled: !!user && !routine,
    staleTime: 5 * 60_000,
  });

  // Fuente única de verdad para render: rutina manual si existe; si no, recomendada
  const activeRoutine = routine ?? recommended;
  const isRecommended = !routine && !!recommended;

  const { data: heatmap } = useQuery({
    queryKey: ["muscle-heatmap", range],
    queryFn: () => api.get(`/routines/heatmap?range=${range}`).then((r) => r.data),
    enabled: !!user,
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      api.post("/routines/generate", { dias_semana: dias, sexo, enfoque }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-routine"] }),
  });

  // Fija la rutina recomendada (envía contrato exacto, sin extras)
  const fixMutation = useMutation({
    mutationFn: () => {
      if (!recommended) throw new Error("sin recomendada");
      const payload = {
        dias_semana: recommended.dias_semana,
        sexo: recommended.sexo,
        enfoque: recommended.enfoque,
        rutina: recommended.rutina,
      };
      return api.post("/routines/save", payload).then((r) => r.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-routine"] }),
  });

  const logMutation = useMutation({
    mutationFn: (ex: {
      nombre: string;
      grupo_primario: string;
      grupos_secundarios: string[];
      series: number;
    }) => api.post("/routines/log", ex),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["muscle-heatmap"] }),
  });

  const muscleData = adaptMuscleData(heatmap?.groups ?? {});

  return (
    <ScrollView
      className="flex-1 bg-ds-bg-base"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 }}
    >
      <Text className="font-ds-display text-[28px] text-ds-fg-hi tracking-[1px] mb-5">Rutina</Text>

      {/* Generador */}
      <Card variant="surface" className="mb-4">
        <Text className="font-ds-display text-[16px] text-ds-fg-hi mb-4">Generar mi rutina</Text>

        <Text className="font-ds-text-sb text-[12px] text-ds-fg-mute uppercase tracking-widest mt-3 mb-2">
          Días por semana
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {[2, 3, 4, 5, 6].map((d) => (
            <Chip key={d} value={d as unknown as string} active={dias === d} onPress={(v) => setDias(Number(v))} label={`${d}d`} />
          ))}
        </View>

        <Text className="font-ds-text-sb text-[12px] text-ds-fg-mute uppercase tracking-widest mt-4 mb-2">
          Sexo
        </Text>
        <View className="flex-row gap-2">
          {(["M", "F", "Otro"] as Sexo[]).map((opt) => (
            <Chip key={opt} value={opt} active={sexo === opt} onPress={setSexo} label={opt} />
          ))}
        </View>

        <Text className="font-ds-text-sb text-[12px] text-ds-fg-mute uppercase tracking-widest mt-4 mb-2">
          Enfoque
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {(Object.keys(ENFOQUE_LABEL) as Enfoque[]).map((opt) => (
            <Chip key={opt} value={opt} active={enfoque === opt} onPress={setEnfoque} label={ENFOQUE_LABEL[opt]} />
          ))}
        </View>

        <Button
          variant="brand"
          size="md"
          fullWidth
          loading={generateMutation.isPending}
          onPress={() => generateMutation.mutate()}
          className="mt-5"
        >
          Generar rutina
        </Button>
      </Card>

      {/* Plan actual o recomendado */}
      {activeRoutine?.rutina ? (
        <Card variant="surface" className="mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-ds-display text-[16px] text-ds-fg-hi">
              {isRecommended ? "Plan recomendado" : "Mi plan"} ({activeRoutine.dias_semana}d · {ENFOQUE_LABEL[activeRoutine.enfoque as Enfoque]})
            </Text>
            {isRecommended && (
              <View className="px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(34,211,238,0.12)" }}>
                <Text className="font-ds-text-sb text-[10px] text-ds-brand-cyan tracking-widest">RECOMENDADA</Text>
              </View>
            )}
          </View>

          {isRecommended && activeRoutine.warning && (
            <View className="mb-3 px-3 py-2 rounded-ds-md" style={{ backgroundColor: "rgba(255,180,84,0.10)" }}>
              <Text className="font-ds-text text-[11px] text-ds-warning">{activeRoutine.warning}</Text>
            </View>
          )}

          {isRecommended && (
            <Pressable
              onPress={() => fixMutation.mutate()}
              disabled={fixMutation.isPending}
              className="self-start mb-3 px-3 py-1.5 rounded-ds-md border border-ds-brand-cyan"
            >
              <Text className="font-ds-text-sb text-[11px] text-ds-brand-cyan">
                {fixMutation.isPending ? "Fijando..." : "Fijar esta rutina"}
              </Text>
            </Pressable>
          )}

          {Object.entries(activeRoutine.rutina as Record<string, any[]>).map(([dia, exs]) => (
            <View key={dia} className="mt-4">
              <Text className="font-ds-text-sb text-[13px] text-ds-brand-cyan tracking-widest uppercase mb-2">
                {dia}
              </Text>
              {exs.map((ex, i) => (
                <View
                  key={i}
                  className="flex-row items-center py-2 border-b border-ds-line-muted"
                >
                  <View className="flex-1">
                    <Text className="font-ds-text-sb text-[14px] text-ds-fg-hi">{ex.nombre}</Text>
                    <Text className="font-ds-text text-[11px] text-ds-fg-mute mt-0.5">
                      {ex.grupo_primario} · {ex.series}×{ex.reps} · {ex.rir_intensidad}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      logMutation.mutate({
                        nombre: ex.nombre,
                        grupo_primario: ex.grupo_primario,
                        grupos_secundarios: ex.grupos_secundarios ?? [],
                        series: ex.series,
                      })
                    }
                    className="px-3 py-1.5 border border-ds-brand-cyan rounded-lg ml-2"
                  >
                    <Text className="font-ds-text-sb text-[12px] text-ds-brand-cyan">+ Log</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ))}
        </Card>
      ) : null}

      {/* Mapa muscular */}
      <Card variant="surface">
        <Text className="font-ds-display text-[16px] text-ds-fg-hi mb-4">Mapa muscular</Text>

        <View className="mb-4">
          <Segmented options={RANGE_OPTIONS} value={range} onChange={setRange} />
        </View>
        <View className="mb-4">
          <Segmented options={VIEW_OPTIONS} value={view} onChange={setView} />
        </View>

        <MuscleMap data={muscleData} view={view} />

        {heatmap?.max_sets === 0 ? (
          <EmptyState
            title="Sin registros"
            description="Toca + Log en tu plan para empezar a llenar el mapa."
          />
        ) : null}
      </Card>
    </ScrollView>
  );
}
