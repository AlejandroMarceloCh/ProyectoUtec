import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { GlowView } from "@/components/ui/GlowView";
import { Skeleton } from "@/components/ui/Skeleton";
import { Logo } from "@/components/ui/Logo";
import { colors } from "@/constants/theme";
import Svg, { Path, Circle } from "react-native-svg";

const ROLE_LABEL: Record<string, string> = {
  student: "Estudiante",
  trainer: "Entrenador",
  utec_staff: "Staff UTEC",
  admin_staff: "Administrador",
};

function StatBox({
  value,
  label,
  loading,
  highlight,
}: {
  value: string | number;
  label: string;
  loading?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={[s.statBox, highlight && s.statBoxHighlight]}>
      {loading ? (
        <Skeleton width={40} height={24} borderRadius={6} />
      ) : (
        <Text style={[s.statValue, highlight && { color: colors.primary }]}>{value}</Text>
      )}
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function SettingRow({
  label,
  icon,
  onPress,
  danger,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={s.settingRow} activeOpacity={0.7}>
      <View style={s.settingIcon}>{icon}</View>
      <Text style={[s.settingLabel, danger && { color: colors.error }]}>{label}</Text>
      <Text style={s.settingArrow}>›</Text>
    </TouchableOpacity>
  );
}

const IconBell = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      stroke={colors.muted}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const IconLock = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      stroke={colors.muted}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const IconHelp = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={colors.muted} strokeWidth={1.6} />
    <Path
      d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01"
      stroke={colors.muted}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const IconLogout = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      stroke={colors.error}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["my-stats"],
    queryFn: () => api.get("/users/me/stats").then((r) => r.data),
    enabled: !!user,
    staleTime: 60_000,
  });

  const initials =
    user?.full_name
      .split(" ")
      .slice(0, 2)
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() ?? "?";

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={s.scroll}
    >
      <Text style={s.pageTitle}>Perfil</Text>

      {/* Avatar hero card */}
      <GlowView
        color={colors.primary}
        radius={100}
        intensity={0.14}
        breathe
        style={s.avatarGlow}
      >
        <Card style={s.heroCard}>
          <View style={s.avatarRing}>
            <Text style={s.avatarInitials}>{initials}</Text>
          </View>
          <Text style={s.userName}>{user?.full_name}</Text>
          <Text style={s.userEmail}>{user?.email}</Text>
          <View style={s.roleBadge}>
            <Text style={s.roleText}>{ROLE_LABEL[user?.role ?? "student"]}</Text>
          </View>
        </Card>
      </GlowView>

      {/* Stats */}
      <View style={s.statsRow}>
        <StatBox
          value={user?.points ?? 0}
          label="Puntos"
          highlight
        />
        <StatBox
          value={stats?.total_sesiones ?? "—"}
          label="Sesiones"
          loading={isLoading}
        />
        <StatBox
          value={stats?.horas_totales ?? "—"}
          label="Horas"
          loading={isLoading}
        />
      </View>

      {/* Settings */}
      <Card style={s.settingsCard}>
        <SettingRow icon={<IconBell />} label="Notificaciones" onPress={() => {}} />
        <SettingRow icon={<IconLock />} label="Seguridad / Face ID" onPress={() => {}} />
        <SettingRow icon={<IconHelp />} label="Ayuda" onPress={() => {}} />
        <SettingRow icon={<IconLogout />} label="Cerrar sesión" onPress={handleLogout} danger />
      </Card>

      <View style={s.footer}>
        <Logo size={18} color={colors.muted} />
        <Text style={s.footerText}>UTEC GYM v1.0</Text>
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
  pageTitle: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 28,
    color: colors.text,
    marginBottom: 20,
    letterSpacing: 1,
  },
  avatarGlow: {
    width: "100%",
    marginBottom: 16,
  },
  heroCard: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 24,
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + "15",
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarInitials: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 28,
    color: colors.primary,
  },
  userName: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 20,
    color: colors.text,
  },
  userEmail: {
    fontFamily: "Inter-Regular",
    fontSize: 13,
    color: colors.muted,
    marginTop: 3,
  },
  roleBadge: {
    marginTop: 10,
    backgroundColor: colors.primary + "18",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  roleText: {
    fontFamily: "Inter-Bold",
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: colors.surface2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statBoxHighlight: {
    borderColor: colors.primary + "50",
    backgroundColor: "#0D1F21",
  },
  statValue: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 24,
    color: colors.text,
  },
  statLabel: {
    fontFamily: "Inter-Regular",
    fontSize: 11,
    color: colors.muted,
    marginTop: 3,
  },
  settingsCard: {
    paddingVertical: 4,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  settingIcon: {
    width: 28,
    alignItems: "center",
  },
  settingLabel: {
    flex: 1,
    fontFamily: "Inter-Medium",
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  settingArrow: {
    fontFamily: "Inter-Regular",
    fontSize: 20,
    color: colors.muted,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 32,
    paddingTop: 16,
  },
  footerText: {
    fontFamily: "Inter-Regular",
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1,
  },
});
