import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Alert, Platform } from "react-native";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { Card } from "@/components/ds/Card";
import { Logo } from "@/components/ui/Logo";
import Svg, { Path, Circle } from "react-native-svg";

const ROLE_LABEL: Record<string, string> = {
  student: "Estudiante",
  trainer: "Entrenador",
  utec_staff: "Staff UTEC",
  admin_staff: "Administrador",
};

const MUTED = "#9AA0AB";
const DANGER = "#FF6464";

const IconBell = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      stroke={MUTED} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const IconLock = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      stroke={MUTED} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const IconHelp = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={MUTED} strokeWidth={1.6} />
    <Path
      d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01"
      stroke={MUTED} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const IconLogout = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      stroke={DANGER} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

function SettingRow({
  label,
  icon,
  onPress,
  danger,
  last,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center py-4 ${last ? "" : "border-b border-ds-line-muted"}`}
    >
      <View style={{ width: 28, alignItems: "center" }}>{icon}</View>
      <Text
        className={`flex-1 font-ds-text-m text-[14px] ml-2 ${danger ? "text-ds-danger" : "text-ds-fg-base"}`}
      >
        {label}
      </Text>
      <Text className="font-ds-text text-[20px] text-ds-fg-dim">›</Text>
    </Pressable>
  );
}

function PrefChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={
        active
          ? "bg-ds-brand-cyan rounded-ds-pill px-ds-3 py-1.5"
          : "border border-ds-line rounded-ds-pill px-ds-3 py-1.5"
      }
    >
      <Text
        className={
          active
            ? "font-ds-text-sb text-ds-tiny text-ds-fg-on-accent"
            : "font-ds-text text-ds-tiny text-ds-fg-base"
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user, logout, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  // Estado local de preferencias (sincronizado con user)
  const [days, setDays] = useState<number | null>(user?.preferred_days_per_week ?? null);
  const [minutes, setMinutes] = useState<number | null>(user?.preferred_minutes_per_session ?? null);
  const [sexo, setSexo] = useState<"M" | "F" | "Otro" | null>((user?.sexo as any) ?? null);

  useEffect(() => {
    setDays(user?.preferred_days_per_week ?? null);
    setMinutes(user?.preferred_minutes_per_session ?? null);
    setSexo((user?.sexo as any) ?? null);
  }, [user?.id]);

  const savePref = useMutation({
    mutationFn: (body: Record<string, number | string>) =>
      api.patch("/users/me/preferences", body).then((r) => r.data),
    onSuccess: (data) => {
      if (user) {
        setUser({
          ...user,
          preferred_days_per_week: data.preferred_days_per_week,
          preferred_minutes_per_session: data.preferred_minutes_per_session,
          sexo: data.sexo,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["routine-recommended"] });
    },
  });

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

  const doLogout = async () => {
    queryClient.clear();
    await logout();
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("¿Cerrar sesión?")) doLogout();
      return;
    }
    Alert.alert("Cerrar sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: doLogout },
    ]);
  };

  return (
    <ScrollView
      className="flex-1 bg-ds-bg-base"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 }}
    >
      <Text className="font-ds-display text-[28px] text-ds-fg-hi tracking-[1px] mb-5">Perfil</Text>

      {/* Hero card */}
      <Card
        variant="surface"
        className="items-center py-6 mb-4"
        style={
          Platform.OS === "ios"
            ? { shadowColor: "#22D3EE", shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } }
            : undefined
        }
      >
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-4 border-2 border-ds-brand-cyan"
          style={{ backgroundColor: "rgba(34,211,238,0.10)" }}
        >
          <Text className="font-ds-display text-[28px] text-ds-brand-cyan">{initials}</Text>
        </View>
        <Text className="font-ds-display text-[20px] text-ds-fg-hi">{user?.full_name}</Text>
        <Text className="font-ds-text text-[13px] text-ds-fg-mute mt-1">{user?.email}</Text>
        <View
          className="mt-3 px-4 py-1 rounded-full"
          style={{ backgroundColor: "rgba(34,211,238,0.12)" }}
        >
          <Text className="font-ds-text-sb text-[11px] text-ds-brand-cyan tracking-widest">
            {ROLE_LABEL[user?.role ?? "student"]}
          </Text>
        </View>
      </Card>

      {/* Stats row */}
      <View className="flex-row gap-1.5 mb-2">
        <Card variant="brand" className="flex-1 items-center py-4">
          <Text className="font-ds-display text-[24px] text-ds-brand-cyan">{user?.points ?? 0}</Text>
          <Text className="font-ds-text text-[11px] text-ds-fg-mute mt-0.5">Puntos</Text>
        </Card>
        <Card variant="surface" className="flex-1 items-center py-4">
          <Text className="font-ds-display text-[24px] text-ds-fg-hi">
            {isLoading ? "—" : (stats?.total_sesiones ?? "—")}
          </Text>
          <Text className="font-ds-text text-[11px] text-ds-fg-mute mt-0.5">Sesiones</Text>
        </Card>
        <Card variant="surface" className="flex-1 items-center py-4">
          <Text className="font-ds-display text-[24px] text-ds-fg-hi">
            {isLoading ? "—" : (stats?.horas_totales ?? "—")}
          </Text>
          <Text className="font-ds-text text-[11px] text-ds-fg-mute mt-0.5">Horas</Text>
        </Card>
      </View>

      {/* Streak — feature único vs Smart Fit/Bodytech */}
      <Card variant="surface" className="flex-row items-center justify-between py-3 mb-4">
        <View className="flex-row items-center gap-3">
          <Text style={{ fontSize: 24 }}>🔥</Text>
          <View>
            <Text className="font-ds-display text-[18px] text-ds-fg-hi">
              {user?.current_streak ?? 0} {(user?.current_streak ?? 0) === 1 ? "día" : "días"}
            </Text>
            <Text className="font-ds-text text-[11px] text-ds-fg-mute">Racha actual</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="font-ds-text-sb text-[13px] text-ds-fg-base">{user?.max_streak ?? 0}</Text>
          <Text className="font-ds-text text-[10px] text-ds-fg-mute">Mejor racha</Text>
        </View>
      </Card>

      {/* Mi horario — preferencias de entrenamiento */}
      <Card variant="surface" className="mb-4">
        <Text className="font-ds-text-sb text-ds-small text-ds-fg-mute uppercase tracking-[2px] mb-3">
          Mi horario
        </Text>

        <Text className="font-ds-text text-[12px] text-ds-fg-base mb-2">Días por semana</Text>
        <View className="flex-row gap-1.5 flex-wrap mb-3">
          {[2, 3, 4, 5, 6].map((n) => (
            <PrefChip
              key={n}
              label={String(n)}
              active={days === n}
              onPress={() => {
                setDays(n);
                savePref.mutate({ preferred_days_per_week: n });
              }}
            />
          ))}
        </View>

        <Text className="font-ds-text text-[12px] text-ds-fg-base mb-2">Tiempo por sesión</Text>
        <View className="flex-row gap-1.5 flex-wrap mb-3">
          {[30, 45, 60, 90].map((m) => (
            <PrefChip
              key={m}
              label={`${m} min`}
              active={minutes === m}
              onPress={() => {
                setMinutes(m);
                savePref.mutate({ preferred_minutes_per_session: m });
              }}
            />
          ))}
        </View>

        <Text className="font-ds-text text-[12px] text-ds-fg-base mb-2">Sexo</Text>
        <View className="flex-row gap-1.5 flex-wrap">
          {(["M", "F", "Otro"] as const).map((s) => (
            <PrefChip
              key={s}
              label={s}
              active={sexo === s}
              onPress={() => {
                setSexo(s);
                savePref.mutate({ sexo: s });
              }}
            />
          ))}
        </View>
      </Card>

      {/* Settings */}
      <Card variant="surface" className="py-0 px-4">
        <SettingRow icon={<IconBell />} label="Notificaciones" onPress={() => {}} />
        <SettingRow icon={<IconLock />} label="Seguridad / Face ID" onPress={() => {}} />
        <SettingRow icon={<IconHelp />} label="Ayuda" onPress={() => {}} />
        <SettingRow icon={<IconLogout />} label="Cerrar sesión" onPress={handleLogout} danger last />
      </Card>

      <View className="flex-row items-center justify-center gap-2 mt-8 pt-4">
        <Logo size={18} color="#6B7280" />
        <Text className="font-ds-text text-[11px] text-ds-fg-dim tracking-widest">UTEC GYM v1.0</Text>
      </View>
    </ScrollView>
  );
}
