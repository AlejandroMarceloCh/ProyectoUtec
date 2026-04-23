import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { GlowView } from "@/components/ui/GlowView";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { colors } from "@/constants/theme";

type FacultyItem = {
  rank: number;
  faculty_id: string;
  name: string;
  code: string;
  total_points: number;
  logo_url: string | null;
};

const MEDAL_COLORS: Record<number, string> = {
  1: "#FFD700",
  2: "#C0C0C0",
  3: "#CD7F32",
};

function FacultyRow({ item, isMyFaculty }: { item: FacultyItem; isMyFaculty: boolean }) {
  const isTop3 = item.rank <= 3;
  const medalColor = MEDAL_COLORS[item.rank];

  const rankCircle = (
    <View style={[s.rankCircle, isTop3 && { borderColor: medalColor }]}>
      <Text style={[s.rankNumber, isTop3 && { color: medalColor }]}>{item.rank}</Text>
    </View>
  );

  return (
    <View
      style={[
        s.facultyRow,
        {
          borderColor: isMyFaculty ? colors.primary : isTop3 ? medalColor + "40" : colors.border,
          backgroundColor: isMyFaculty
            ? "#0D1F21"
            : isTop3
            ? "#111111"
            : colors.surface,
        },
      ]}
    >
      {isTop3 ? (
        <GlowView
          color={medalColor}
          radius={24}
          intensity={0.35}
          breathe={isTop3}
        >
          {rankCircle}
        </GlowView>
      ) : (
        rankCircle
      )}

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[s.facultyName, isMyFaculty && { color: colors.primary }]}>
          {item.name}
        </Text>
        <Text style={s.facultyCode}>{item.code}</Text>
      </View>

      <Text style={[s.facultyPoints, isTop3 && { color: medalColor }, isMyFaculty && { color: colors.primary }]}>
        {item.total_points.toLocaleString()}
        {"\n"}
        <Text style={s.ptsLabel}>pts</Text>
      </Text>
    </View>
  );
}

function LoadingSkeleton() {
  return (
    <View style={{ gap: 8 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={[s.facultyRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Skeleton width={36} height={36} borderRadius={18} />
          <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
            <Skeleton width="70%" height={14} />
            <Skeleton width="30%" height={10} />
          </View>
          <Skeleton width={60} height={14} />
        </View>
      ))}
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
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={s.scroll}
    >
      <Text style={s.pageTitle}>Ranking</Text>
      <Text style={s.pageSubtitle}>Puntos acumulados por facultad</Text>

      {myFaculty && (
        <GlowView color={colors.primary} radius={120} intensity={0.15} breathe style={s.myGlow}>
          <Card glow style={s.myCard}>
            <Text style={s.myLabel}>Tu facultad</Text>
            <View style={s.myRow}>
              <Text style={s.myName}>{myFaculty.name}</Text>
              <Text style={s.myRank}>#{myFaculty.rank}</Text>
            </View>
            <View style={s.myRow}>
              <Text style={s.myPoints}>{myFaculty.total_points.toLocaleString()} pts totales</Text>
              <Text style={s.myContrib}>Tu aporte: {user?.points ?? 0} pts</Text>
            </View>
          </Card>
        </GlowView>
      )}

      {isLoading && <LoadingSkeleton />}

      {!isLoading && ranking.length === 0 && (
        <Card>
          <EmptyState illustration="no-ranking" title="Sin datos de facultades aún" />
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
    letterSpacing: 1,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontFamily: "Inter-Regular",
    fontSize: 13,
    color: colors.muted,
    marginBottom: 24,
  },
  myGlow: {
    width: "100%",
    marginBottom: 20,
  },
  myCard: {
    width: "100%",
  },
  myLabel: {
    fontFamily: "Inter-Regular",
    fontSize: 11,
    color: colors.muted,
    marginBottom: 4,
  },
  myRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  myName: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 16,
    color: colors.primary,
    flex: 1,
    marginRight: 8,
  },
  myRank: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 20,
    color: colors.primary,
  },
  myPoints: {
    fontFamily: "Inter-Regular",
    fontSize: 12,
    color: colors.muted,
  },
  myContrib: {
    fontFamily: "Inter-Medium",
    fontSize: 12,
    color: colors.text,
  },
  facultyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  rankCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  rankNumber: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 14,
    color: colors.muted,
  },
  facultyName: {
    fontFamily: "Inter-SemiBold",
    fontSize: 14,
    color: colors.text,
  },
  facultyCode: {
    fontFamily: "Inter-Regular",
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  facultyPoints: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 16,
    color: colors.muted,
    textAlign: "right",
  },
  ptsLabel: {
    fontFamily: "Inter-Regular",
    fontSize: 10,
    color: colors.muted,
  },
});
