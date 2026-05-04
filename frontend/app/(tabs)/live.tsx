import { View, Text, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ds/Card";
import { EmptyState } from "@/components/ds/EmptyState";
import { Progress } from "@/components/ds/Progress";
import { Heatmap } from "@/components/domain/Heatmap";
import { useAuthStore } from "@/store/auth";

const SUCCESS = "#5EEAA0";
const WARNING = "#FFB454";
const DANGER = "#FF6464";

function OccupancyCard({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? value / max : 0;
  const color = pct < 0.6 ? SUCCESS : pct < 0.8 ? WARNING : DANGER;
  const label = pct >= 0.8 ? "Casi lleno" : pct >= 0.6 ? "Moderado" : "Disponible";

  return (
    <View className="items-center pt-3">
      <View className="flex-row items-flex-end gap-1.5 mb-1">
        <Text style={{ color }} className="font-ds-display text-[72px] leading-[76px]">
          {value}
        </Text>
        <Text className="font-ds-display text-[22px] text-ds-fg-mute mb-2.5">/ {max}</Text>
      </View>
      <Text style={{ color }} className="font-ds-text-sb text-[13px] tracking-widest uppercase mb-4">
        {label}
      </Text>
      <View className="w-11/12">
        <Progress value={pct} tone={pct < 0.6 ? "success" : pct < 0.8 ? "warning" : "danger"} />
      </View>
      <View className="flex-row justify-between w-11/12 mt-1.5">
        <Text className="font-ds-text text-[11px] text-ds-fg-mute">{Math.round(pct * 100)}% del aforo</Text>
        <Text className="font-ds-text text-[11px] text-ds-fg-mute">Capacidad: {max}</Text>
      </View>
    </View>
  );
}

function SkeletonBlock({ height = 18 }: { height?: number }) {
  return <View style={{ height, backgroundColor: "#181A20", borderRadius: 4 }} className="w-full mb-1.5" />;
}

export default function LiveScreen() {
  const { user } = useAuthStore();

  const { data: occupancy, isLoading: loadingOcc } = useQuery({
    queryKey: ["occupancy"],
    queryFn: () => api.get("/sessions/occupancy").then((r) => r.data),
    enabled: !!user,
    refetchInterval: 15_000,
  });

  const { data: heatmap, isLoading: loadingHeat } = useQuery({
    queryKey: ["heatmap"],
    queryFn: () => api.get("/analytics/heatmap?semanas=4").then((r) => r.data),
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  const { data: byFaculty } = useQuery({
    queryKey: ["occupancy-by-faculty"],
    queryFn: () => api.get("/sessions/occupancy/by-faculty").then((r) => r.data),
    enabled: !!user,
    refetchInterval: 30_000,
  });

  return (
    <ScrollView
      className="flex-1 bg-ds-bg-base"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 }}
    >
      <Text className="font-ds-display text-[28px] text-ds-fg-hi tracking-[1px] mb-5">En Vivo</Text>

      {/* Occupancy card */}
      <Card variant="surface" className="mb-4">
        <Text className="font-ds-text-sb text-[15px] text-ds-fg-hi mb-1">Aforo actual</Text>
        {loadingOcc ? (
          <View className="gap-2 mt-4">
            <SkeletonBlock height={56} />
            <SkeletonBlock height={10} />
          </View>
        ) : occupancy ? (
          <OccupancyCard value={occupancy.ocupacion_actual} max={occupancy.capacidad} />
        ) : (
          <EmptyState title="Sin datos de ocupación" />
        )}
      </Card>

      {/* Aforo por facultad — comunidad */}
      {byFaculty?.by_faculty && byFaculty.by_faculty.length > 0 && (
        <Card variant="surface" className="mb-4">
          <Text className="font-ds-text-sb text-[15px] text-ds-fg-hi mb-3">
            Quién está entrenando ahora
          </Text>
          {byFaculty.by_faculty.slice(0, 6).map((row: { faculty_code: string; faculty_name: string; count: number }) => (
            <View
              key={row.faculty_code}
              className="flex-row items-center justify-between py-2 border-b border-ds-line-muted"
            >
              <View className="flex-row items-center gap-2">
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "#22D3EE" }}
                />
                <Text className="font-ds-text-sb text-[13px] text-ds-fg-base">
                  {row.faculty_name}
                </Text>
                <Text className="font-ds-mono text-[11px] text-ds-fg-dim">{row.faculty_code}</Text>
              </View>
              <Text className="font-ds-display text-[16px] text-ds-brand-cyan">
                {row.count}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* Heatmap card */}
      <Card variant="surface">
        <Text className="font-ds-text-sb text-[15px] text-ds-fg-hi mb-1">
          Horas pico — últimas 4 semanas
        </Text>
        {loadingHeat ? (
          <View className="gap-1.5 mt-3">
            {Array.from({ length: 7 }).map((_, i) => <SkeletonBlock key={i} />)}
          </View>
        ) : heatmap?.cells ? (
          <Heatmap cells={heatmap.cells} />
        ) : (
          <EmptyState title="Sin datos de heatmap" />
        )}
      </Card>
    </ScrollView>
  );
}
