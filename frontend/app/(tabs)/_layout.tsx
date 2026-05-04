import { Tabs } from "expo-router";
import { Platform, View, StyleSheet } from "react-native";
import Svg, { Path, Circle, Rect } from "react-native-svg";

const CYAN   = "#22D3EE"
const MUTED  = "#9AA0AB"
const CYAN_GLOW = "rgba(34,211,238,0.14)"

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const c = focused ? CYAN : MUTED;
  const sw = 1.8;

  const icon = (() => {
    switch (name) {
      case "index":
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Rect x={3} y={3} width={18} height={18} rx={3} stroke={c} strokeWidth={sw} />
            <Rect x={7} y={7} width={4} height={4} rx={1} stroke={c} strokeWidth={sw} />
            <Rect x={13} y={7} width={4} height={4} rx={1} stroke={c} strokeWidth={sw} />
            <Rect x={7} y={13} width={4} height={4} rx={1} stroke={c} strokeWidth={sw} />
            <Circle cx={15} cy={15} r={1.5} fill={c} />
          </Svg>
        );
      case "live":
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={4} stroke={c} strokeWidth={sw} />
            <Path d="M7 7a7 7 0 010 10" stroke={c} strokeWidth={sw} strokeLinecap="round" />
            <Path d="M17 7a7 7 0 000 10" stroke={c} strokeWidth={sw} strokeLinecap="round" />
          </Svg>
        );
      case "history":
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={sw} />
            <Path d="M12 7v5l3 3" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );
      case "ranking":
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Rect x={3} y={14} width={5} height={7} rx={1} stroke={c} strokeWidth={sw} />
            <Rect x={9.5} y={8} width={5} height={13} rx={1} stroke={c} strokeWidth={sw} />
            <Rect x={16} y={11} width={5} height={10} rx={1} stroke={c} strokeWidth={sw} />
            <Path d="M12 3l1 2.5h2.5l-2 1.5.8 2.5L12 8l-2.3 1.5.8-2.5-2-1.5H11z" fill={c} />
          </Svg>
        );
      case "profile":
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={8} r={4} stroke={c} strokeWidth={sw} />
            <Path d="M5 20c0-4 3-6 7-6s7 2 7 6" stroke={c} strokeWidth={sw} strokeLinecap="round" />
          </Svg>
        );
      case "routine":
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M12 3v18M5 8l3-3m8 0l3 3M5 16l3 3m8 0l3-3" stroke={c} strokeWidth={sw} strokeLinecap="round" />
            <Circle cx={12} cy={12} r={3} stroke={c} strokeWidth={sw} />
          </Svg>
        );
      default:
        return null;
    }
  })();

  return (
    <View style={[s.iconWrap, focused && s.iconWrapFocused]}>
      {focused && <View style={s.energyLine} />}
      {icon}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#101115",
          borderTopColor: "#23262E",
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 24 : 8,
        },
        tabBarActiveTintColor: CYAN,
        tabBarInactiveTintColor: MUTED,
        tabBarLabelStyle: {
          fontFamily: "InterTight-Medium",
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Mi QR",
          tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: "En Vivo",
          tabBarIcon: ({ focused }) => <TabIcon name="live" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="routine"
        options={{
          title: "Rutina",
          tabBarIcon: ({ focused }) => <TabIcon name="routine" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historial",
          tabBarIcon: ({ focused }) => <TabIcon name="history" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: "Ranking",
          tabBarIcon: ({ focused }) => <TabIcon name="ranking" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    paddingTop: 4,
  },
  iconWrapFocused: {
    backgroundColor: CYAN_GLOW,
    borderRadius: 14,
    paddingHorizontal: 10,
  },
  energyLine: {
    position: "absolute",
    top: -8,
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: CYAN,
  },
});
