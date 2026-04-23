import { View, Text, StyleSheet } from "react-native";
import type { ReactElement } from "react";
import Svg, { Path, Circle, Line, Rect } from "react-native-svg";
import { colors, fonts } from "@/constants/theme";

type Illustration = "no-sessions" | "no-active" | "no-data" | "no-ranking";

interface EmptyStateProps {
  illustration: Illustration;
  title: string;
  subtitle?: string;
}

function NoSessionsIllustration() {
  return (
    <Svg width={120} height={120} viewBox="0 0 120 120" fill="none">
      <Circle cx={60} cy={60} r={50} stroke={colors.muted} strokeWidth={0.8} strokeDasharray="4 4" />
      {/* Running figure — minimal sketch */}
      <Path
        d="M52 45 Q54 38 58 40 Q62 42 60 46 L58 50"
        stroke={colors.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={58} cy={36} r={4} stroke={colors.primary} strokeWidth={1.5} fill="none" />
      <Path
        d="M54 50 L48 62 L44 72 M54 50 L62 60 L68 70"
        stroke={colors.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M58 50 L52 58 M58 50 L66 56"
        stroke={colors.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      <Line x1={30} y1={78} x2={90} y2={78} stroke={colors.muted} strokeWidth={0.5} strokeDasharray="2 3" />
    </Svg>
  );
}

function NoActiveIllustration() {
  return (
    <Svg width={120} height={120} viewBox="0 0 120 120" fill="none">
      <Circle cx={60} cy={60} r={50} stroke={colors.muted} strokeWidth={0.8} strokeDasharray="4 4" />
      {/* QR outline sketch */}
      <Rect x={38} y={38} width={44} height={44} rx={4} stroke={colors.primary} strokeWidth={1.5} fill="none" />
      <Rect x={44} y={44} width={12} height={12} rx={2} stroke={colors.primary} strokeWidth={1} fill="none" />
      <Rect x={64} y={44} width={12} height={12} rx={2} stroke={colors.primary} strokeWidth={1} fill="none" />
      <Rect x={44} y={64} width={12} height={12} rx={2} stroke={colors.primary} strokeWidth={1} fill="none" />
      {/* Dots */}
      <Circle cx={70} cy={70} r={2} fill={colors.muted} opacity={0.4} />
      <Circle cx={70} cy={76} r={1.5} fill={colors.muted} opacity={0.3} />
      <Circle cx={76} cy={70} r={1.5} fill={colors.muted} opacity={0.3} />
    </Svg>
  );
}

function NoDataIllustration() {
  return (
    <Svg width={120} height={120} viewBox="0 0 120 120" fill="none">
      <Circle cx={60} cy={60} r={50} stroke={colors.muted} strokeWidth={0.8} strokeDasharray="4 4" />
      {/* Empty gym — bench sketch */}
      <Line x1={30} y1={80} x2={90} y2={80} stroke={colors.muted} strokeWidth={0.5} />
      <Rect x={40} y={60} width={40} height={6} rx={2} stroke={colors.primary} strokeWidth={1.5} fill="none" />
      <Line x1={45} y1={66} x2={45} y2={80} stroke={colors.primary} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={75} y1={66} x2={75} y2={80} stroke={colors.primary} strokeWidth={1.5} strokeLinecap="round" />
      {/* Barbell */}
      <Line x1={35} y1={50} x2={85} y2={50} stroke={colors.muted} strokeWidth={1} strokeLinecap="round" />
      <Rect x={32} y={45} width={6} height={10} rx={1.5} stroke={colors.primary} strokeWidth={1} fill="none" />
      <Rect x={82} y={45} width={6} height={10} rx={1.5} stroke={colors.primary} strokeWidth={1} fill="none" />
    </Svg>
  );
}

function NoRankingIllustration() {
  return (
    <Svg width={120} height={120} viewBox="0 0 120 120" fill="none">
      <Circle cx={60} cy={60} r={50} stroke={colors.muted} strokeWidth={0.8} strokeDasharray="4 4" />
      {/* Podium sketch */}
      <Rect x={28} y={62} width={20} height={18} rx={2} stroke={colors.primary} strokeWidth={1.5} fill="none" />
      <Rect x={50} y={48} width={20} height={32} rx={2} stroke={colors.primary} strokeWidth={1.5} fill="none" />
      <Rect x={72} y={56} width={20} height={24} rx={2} stroke={colors.primary} strokeWidth={1.5} fill="none" />
      <Line x1={28} y1={80} x2={92} y2={80} stroke={colors.muted} strokeWidth={0.5} />
      {/* Numbers */}
      <Path d="M37 70 L39 70" stroke={colors.muted} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M59 58 L61 58" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
      <Path d="M81 66 L83 66" stroke={colors.muted} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

const illustrations: Record<Illustration, () => ReactElement> = {
  "no-sessions": NoSessionsIllustration,
  "no-active": NoActiveIllustration,
  "no-data": NoDataIllustration,
  "no-ranking": NoRankingIllustration,
};

export function EmptyState({ illustration, title, subtitle }: EmptyStateProps) {
  const Illu = illustrations[illustration];
  return (
    <View style={styles.container}>
      <Illu />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 40,
  },
  title: {
    fontFamily: "Inter-SemiBold",
    fontSize: 15,
    color: colors.muted,
    marginTop: 20,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter-Regular",
    fontSize: 12,
    color: colors.muted,
    marginTop: 6,
    textAlign: "center",
    opacity: 0.7,
  },
});
