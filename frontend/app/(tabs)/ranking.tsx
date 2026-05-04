import { View, Text, ScrollView, Platform } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { Card } from "@/components/ds/Card";
import { EmptyState } from "@/components/ds/EmptyState";

type FacultyItem = {
  rank: number;
  faculty_id: string;
  name: string;
  code: string;
  total_points: number;
  logo_url: string | null;
};

const MEDAL: Record<number, { color: string; bg: string; border: string }> = {
  1: { color: "#FFD700", bg: "#1A1500", border: "#FFD70040" },
  2: { color: "#C0C0C0", bg: "#151515", border: "#C0C0C040" },
  3: { color: "#CD7F32", bg: "#130F00", border: "#CD7F3240" },
};

function SkeletonRow() {
  return (
    <View className="flex-row items-center px-4 py-3.5 mb-1.5 rounded-ds-lg bg-ds-bg-surface border border-ds-line">
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#23262E" }} />
      <View className="flex-1 ml-3 gap-1.5">
        <View style={{ height: 14, width: "60%", backgroundColor: "#23262E", borderRadius: 4 }} />
        <View style={{ height: 10, width: "25%", backgroundColor: "#23262E", borderRadius: 4 }} />
      </View>
      <View style={{ height: 14, width: 52, backgroundColor: "#23262E", borderRadius: 4 }} />
    </View>
  );
}

function FacultyRow({ item, isMyFaculty }: { item: FacultyItem; isMyFaculty: boolean }) {
  const medal = MEDAL[item.rank];
  const rankColor = medal?.color ?? "#9AA0AB";
  const borderColor = isMyFaculty ? "#22D3EE" : medal?.border ?? "#23262E";
  const bgColor = isMyFaculty ? "#061519" : medal?.bg ?? "#101115";

  return (
    <View
      style={{ backgroundColor: bgColor, borderColor }}
      className="flex-row items-center px-4 py-3.5 mb-1.5 rounded-ds-lg border"
    >
      <View
        style={{ borderColor: rankColor }}
        className="w-9 h-9 rounded-full border items-center justify-center"
      >
        <Text style={{ color: rankColor }} className="font-ds-display text-[14px]">
          {item.rank}
        </Text>
      </View>

      <View className="flex-1 ml-3">
        <Text
          style={{ color: isMyFaculty ? "#22D3EE" : "#F4F5F7" }}
          className="font-ds-text-sb text-[14px]"
        >
          {item.name}
        </Text>
        <Text className="font-ds-text text-[11px] text-ds-fg-mute mt-0.5">{item.code}</Text>
      </View>

      <Text
        style={{ color: isMyFaculty ? "#22D3EE" : rankColor }}
        className="font-ds-display text-[16px] text-right"
      >
        {item.total_points.toLocaleString()}
        {"\n"}
        <Text className="font-ds-text text-[10px] text-ds-fg-mute">pts</Text>
      </Text>
    </View>
  );
}

export default function RankingScreen() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["faculty-ranking"],
    queryFn: () => api.get("/analytics/faculty-ranking").then((r) => r.data),
    enabled: !!user,
    staleTime: 60_000,
  });

  const ranking: FacultyItem[] = data?.ranking ?? [];
  const myFaculty = ranking.find((f) => f.faculty_id === user?.faculty_id);

  return (
    <ScrollView
      className="flex-1 bg-ds-bg-base"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 }}
    >
      <Text className="font-ds-display text-[28px] text-ds-fg-hi tracking-[1px] mb-1">Ranking</Text>
      <Text className="font-ds-text text-[13px] text-ds-fg-mute mb-6">
        Puntos acumulados por facultad
      </Text>

      {myFaculty && (
        <Card
          variant="brand"
          className="mb-5"
          style={
            Platform.OS === "ios"
              ? { shadowColor: "#22D3EE", shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } }
              : undefined
          }
        >
          <Text className="font-ds-text text-[11px] text-ds-fg-mute mb-1">Tu facultad</Text>
          <View className="flex-row items-center justify-between mt-1">
            <Text className="font-ds-text-sb text-[16px] text-ds-brand-cyan flex-1 mr-2">
              {myFaculty.name}
            </Text>
            <Text className="font-ds-display text-[20px] text-ds-brand-cyan">
              #{myFaculty.rank}
            </Text>
          </View>
          <View className="flex-row items-center justify-between mt-1">
            <Text className="font-ds-text text-[12px] text-ds-fg-mute">
              {myFaculty.total_points.toLocaleString()} pts totales
            </Text>
            <Text className="font-ds-text-m text-[12px] text-ds-fg-base">
              Tu aporte: {user?.points ?? 0} pts
            </Text>
          </View>
        </Card>
      )}

      {isLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

      {!isLoading && ranking.length === 0 && (
        <Card variant="surface">
          <EmptyState title="Sin datos de facultades aún" />
        </Card>
      )}

      {ranking.map((item) => (
        <FacultyRow
          key={item.faculty_id}
          item={item}
          isMyFaculty={item.faculty_id === user?.faculty_id}
        />
      ))}
    </ScrollView>
  );
}
