import { View, Text, ScrollView, StyleSheet, Dimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { GlowView } from "@/components/ui/GlowView";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { colors } from "@/constants/theme";
import { useAuthStore } from "@/store/auth";

const { width } = Dimensions.get("window");

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function intensityToColor(intensity: number): string {
  if (intensity === 0) return colors.surface2;
  if (intensity < 0.25) return "#003F44";
  if (intensity < 0.5) return "#006870";
  if (intensity < 0.75) return "#009FAB";
  return colors.primary;
}

function OccupancyDisplay({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? value / max : 0;
  const color = pct < 0.6 ? colors.success : pct < 0.8 ? colors.warning : colors.error;
  const label = pct >= 0.8 ? "Casi lleno" : pct >= 0.6 ? "Moderado" : "Disponible";

  return (
    <View style={s.occWrap}>
      {/* Big number */}
      <GlowView color={color} radius={80} intensity={0.2} breathe style={s.occGlow}>
        <View style={s.occNumberWrap}>
          <Text style={[s.occNumber, { color }]}>{value}</Text>
          <Text style={s.occMax}>/ {max}</Text>
        </View>
        <Text style={[s.occLabel, { color }]}>{label}</Text>
      </GlowView>

      {/* Progress bar */}
      <View style={s.occTrack}>
        <View
          style={[
            s.occFill,
            { width: `${Math.min(pct * 100, 100)}%`, backgroundColor: color },
          ]}
        />
      </View>

      <View style={s.occRow}>
        <Text style={s.occSub}>{Math.round(pct * 100)}% del aforo</Text>
        <Text style={s.occSub}>Capacidad: {max}</Text>
      </View>
    </View>
  );
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

  const cellMap = new Map<string, number>();
  heatmap?.cells?.forEach((c: { dia: number; hora: number; intensidad: number }) => {
    cellMap.set(`${c.dia}-${c.hora}`, c.intensidad);
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={s.scroll}
    >
      <Text style={s.pageTitle}>En Vivo</Text>

      {/* Occupancy card */}
      <Card glow style={s.occCard}>
        <Text style={s.cardTitle}>Aforo actual</Text>
        {loadingOcc ? (
          <View style={{ gap: 8, marginTop: 16 }}>
            <Skeleton width="60%" height={56} borderRadius={8} style={{ alignSelf: "center" }} />
            <Skeleton width="100%" height={10} />
          </View>
        ) : occupancy ? (
          <OccupancyDisplay
            value={occupancy.ocupacion_actual}
            max={occupancy.capacidad}
          />
        ) : (
          <EmptyState illustration="no-data" title="Sin datos de ocupación" />
        )}
      </Card>

      {/* Heatmap card */}
      <Card>
        <Text style={s.cardTitle}>Horas pico — últimas 4 semanas</Text>

        {loadingHeat ? (
          <View style={{ gap: 6, marginTop: 12 }}>
            {DAYS.map((_, i) => (
              <Skeleton key={i} width="100%" height={18} />
            ))}
          </View>
        ) : (
          <>
            <View style={{ flexDirection: "row", marginLeft: 32, marginBottom: 4, marginTop: 12 }}>
              {HOURS.filter((_, i) => i % 2 === 0).map((h) => (
                <Text key={h} style={s.axisLabel}>{h}h</Text>
              ))}
            </View>

            {DAYS.map((day, dia) => (
              <View key={dia} style={s.heatRow}>
                <Text style={s.dayLabel}>{day}</Text>
                {HOURS.map((hora) => {
                  const intensity = cellMap.get(`${dia}-${hora}`) ?? 0;
                  return (
                    <View
                      key={hora}
                      style={{
                        flex: 1,
                        height: 18,
                        backgroundColor: intensityToColor(intensity),
                        marginHorizontal: 0.5,
                        borderRadius: 3,
                      }}
                    />
                  );
                })}
              </View>
            ))}

            <View style={s.legend}>
              {[
                { label: "Vacío", color: colors.surface2 },
                { label: "Bajo", color: "#006870" },
                { label: "Moderado", color: "#009FAB" },
                { label: "Lleno", color: colors.primary },
              ].map(({ label, color }) => (
                <View key={label} style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: color }]} />
                  <Text style={s.legendText}>{label}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </Card>
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
  cardTitle: {
    fontFamily: "Inter-SemiBold",
    fontSize: 15,
    color: colors.text,
    marginBottom: 4,
  },
  occCard: {
    marginBottom: 16,
  },
  occWrap: {
    alignItems: "center",
    paddingTop: 12,
  },
  occGlow: {
    marginBottom: 16,
  },
  occNumberWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  occNumber: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 72,
    lineHeight: 76,
  },
  occMax: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 22,
    color: colors.muted,
    marginBottom: 10,
  },
  occLabel: {
    fontFamily: "Inter-Bold",
    fontSize: 13,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 2,
  },
  occTrack: {
    width: "90%",
    height: 6,
    backgroundColor: colors.surface2,
    borderRadius: 999,
    overflow: "hidden",
  },
  occFill: {
    height: "100%",
    borderRadius: 999,
  },
  occRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginTop: 6,
  },
  occSub: {
    fontFamily: "Inter-Regular",
    fontSize: 11,
    color: colors.muted,
  },
  heatRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 1,
  },
  dayLabel: {
    fontFamily: "Inter-Medium",
    fontSize: 9,
    color: colors.muted,
    width: 32,
  },
  axisLabel: {
    fontFamily: "Inter-Regular",
    fontSize: 8,
    color: colors.muted,
    flex: 1,
    textAlign: "center",
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontFamily: "Inter-Regular",
    fontSize: 9,
    color: colors.muted,
  },
});
