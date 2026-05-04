import React from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { Path, G } from "react-native-svg";

const CYAN = "#22D3EE";
const BG = "#23262E";
const OUTLINE = "#2D3139";

function clamp(v: number) {
  return Math.max(0, Math.min(1, v));
}

function FrontView({ get }: { get: (k: string) => number }) {
  return (
    <Svg width={180} height={400} viewBox="0 0 180 400">
      <G stroke={OUTLINE} strokeWidth={1}>
        {/* Cabeza */}
        <Path d="M90 10 C100 10 110 20 110 35 C110 50 100 58 90 58 C80 58 70 50 70 35 C70 20 80 10 90 10 Z" fill="#181A20" />
        {/* Cuello */}
        <Path d="M82 58 L98 58 L100 70 L80 70 Z" fill="#181A20" />
        {/* Trapecio */}
        <Path d="M60 70 L120 70 L130 85 L50 85 Z" fill={BG} />
        <Path d="M60 70 L120 70 L130 85 L50 85 Z" fill={CYAN} fillOpacity={clamp(get("trapecio"))} />
        {/* Hombros anterior */}
        <Path d="M50 85 L40 110 L55 115 L60 90 Z" fill={BG} />
        <Path d="M50 85 L40 110 L55 115 L60 90 Z" fill={CYAN} fillOpacity={clamp(get("hombros_anterior"))} />
        <Path d="M130 85 L140 110 L125 115 L120 90 Z" fill={BG} />
        <Path d="M130 85 L140 110 L125 115 L120 90 Z" fill={CYAN} fillOpacity={clamp(get("hombros_anterior"))} />
        {/* Hombros lateral */}
        <Path d="M40 110 L35 130 L52 135 L55 115 Z" fill={BG} />
        <Path d="M40 110 L35 130 L52 135 L55 115 Z" fill={CYAN} fillOpacity={clamp(get("hombros_lateral"))} />
        <Path d="M140 110 L145 130 L128 135 L125 115 Z" fill={BG} />
        <Path d="M140 110 L145 130 L128 135 L125 115 Z" fill={CYAN} fillOpacity={clamp(get("hombros_lateral"))} />
        {/* Pecho */}
        <Path d="M60 90 L120 90 L120 130 L90 140 L60 130 Z" fill={BG} />
        <Path d="M60 90 L120 90 L120 130 L90 140 L60 130 Z" fill={CYAN} fillOpacity={clamp(get("pecho"))} />
        {/* Abdomen */}
        <Path d="M70 140 L110 140 L108 195 L72 195 Z" fill={BG} />
        <Path d="M70 140 L110 140 L108 195 L72 195 Z" fill={CYAN} fillOpacity={clamp(get("abdomen"))} />
        {/* Oblicuos */}
        <Path d="M60 130 L70 140 L72 195 L62 195 Z" fill={BG} />
        <Path d="M60 130 L70 140 L72 195 L62 195 Z" fill={CYAN} fillOpacity={clamp(get("oblicuos"))} />
        <Path d="M120 130 L110 140 L108 195 L118 195 Z" fill={BG} />
        <Path d="M120 130 L110 140 L108 195 L118 195 Z" fill={CYAN} fillOpacity={clamp(get("oblicuos"))} />
        {/* Bíceps */}
        <Path d="M35 130 L30 175 L48 180 L52 135 Z" fill={BG} />
        <Path d="M35 130 L30 175 L48 180 L52 135 Z" fill={CYAN} fillOpacity={clamp(get("biceps"))} />
        <Path d="M145 130 L150 175 L132 180 L128 135 Z" fill={BG} />
        <Path d="M145 130 L150 175 L132 180 L128 135 Z" fill={CYAN} fillOpacity={clamp(get("biceps"))} />
        {/* Antebrazo */}
        <Path d="M30 175 L25 220 L42 225 L48 180 Z" fill={BG} />
        <Path d="M30 175 L25 220 L42 225 L48 180 Z" fill={CYAN} fillOpacity={clamp(get("antebrazo"))} />
        <Path d="M150 175 L155 220 L138 225 L132 180 Z" fill={BG} />
        <Path d="M150 175 L155 220 L138 225 L132 180 Z" fill={CYAN} fillOpacity={clamp(get("antebrazo"))} />
        {/* Cuádriceps */}
        <Path d="M62 195 L88 195 L86 290 L60 290 Z" fill={BG} />
        <Path d="M62 195 L88 195 L86 290 L60 290 Z" fill={CYAN} fillOpacity={clamp(get("cuadriceps"))} />
        <Path d="M92 195 L118 195 L120 290 L94 290 Z" fill={BG} />
        <Path d="M92 195 L118 195 L120 290 L94 290 Z" fill={CYAN} fillOpacity={clamp(get("cuadriceps"))} />
        {/* Aductores */}
        <Path d="M80 195 L100 195 L96 240 L84 240 Z" fill={BG} />
        <Path d="M80 195 L100 195 L96 240 L84 240 Z" fill={CYAN} fillOpacity={clamp(get("aductores"))} />
        {/* Gemelos (frontal) */}
        <Path d="M60 290 L86 290 L84 370 L62 370 Z" fill={BG} />
        <Path d="M60 290 L86 290 L84 370 L62 370 Z" fill={CYAN} fillOpacity={clamp(get("gemelos"))} />
        <Path d="M94 290 L120 290 L118 370 L96 370 Z" fill={BG} />
        <Path d="M94 290 L120 290 L118 370 L96 370 Z" fill={CYAN} fillOpacity={clamp(get("gemelos"))} />
      </G>
    </Svg>
  );
}

function BackView({ get }: { get: (k: string) => number }) {
  return (
    <Svg width={180} height={400} viewBox="0 0 180 400">
      <G stroke={OUTLINE} strokeWidth={1}>
        <Path d="M90 10 C100 10 110 20 110 35 C110 50 100 58 90 58 C80 58 70 50 70 35 C70 20 80 10 90 10 Z" fill="#181A20" />
        <Path d="M82 58 L98 58 L100 70 L80 70 Z" fill="#181A20" />
        {/* Trapecio */}
        <Path d="M55 70 L125 70 L135 100 L45 100 Z" fill={BG} />
        <Path d="M55 70 L125 70 L135 100 L45 100 Z" fill={CYAN} fillOpacity={clamp(get("trapecio"))} />
        {/* Hombros posterior */}
        <Path d="M45 100 L35 130 L55 135 L60 110 Z" fill={BG} />
        <Path d="M45 100 L35 130 L55 135 L60 110 Z" fill={CYAN} fillOpacity={clamp(get("hombros_posterior"))} />
        <Path d="M135 100 L145 130 L125 135 L120 110 Z" fill={BG} />
        <Path d="M135 100 L145 130 L125 135 L120 110 Z" fill={CYAN} fillOpacity={clamp(get("hombros_posterior"))} />
        {/* Espalda alta */}
        <Path d="M60 100 L120 100 L122 150 L58 150 Z" fill={BG} />
        <Path d="M60 100 L120 100 L122 150 L58 150 Z" fill={CYAN} fillOpacity={clamp(get("espalda_alta"))} />
        {/* Espalda baja */}
        <Path d="M62 150 L118 150 L115 195 L65 195 Z" fill={BG} />
        <Path d="M62 150 L118 150 L115 195 L65 195 Z" fill={CYAN} fillOpacity={clamp(get("espalda_baja"))} />
        {/* Tríceps */}
        <Path d="M35 130 L30 175 L48 180 L55 135 Z" fill={BG} />
        <Path d="M35 130 L30 175 L48 180 L55 135 Z" fill={CYAN} fillOpacity={clamp(get("triceps"))} />
        <Path d="M145 130 L150 175 L132 180 L125 135 Z" fill={BG} />
        <Path d="M145 130 L150 175 L132 180 L125 135 Z" fill={CYAN} fillOpacity={clamp(get("triceps"))} />
        {/* Antebrazo */}
        <Path d="M30 175 L25 220 L42 225 L48 180 Z" fill={BG} />
        <Path d="M30 175 L25 220 L42 225 L48 180 Z" fill={CYAN} fillOpacity={clamp(get("antebrazo"))} />
        <Path d="M150 175 L155 220 L138 225 L132 180 Z" fill={BG} />
        <Path d="M150 175 L155 220 L138 225 L132 180 Z" fill={CYAN} fillOpacity={clamp(get("antebrazo"))} />
        {/* Glúteos */}
        <Path d="M65 195 L115 195 L118 245 L62 245 Z" fill={BG} />
        <Path d="M65 195 L115 195 L118 245 L62 245 Z" fill={CYAN} fillOpacity={clamp(get("gluteos"))} />
        {/* Isquios */}
        <Path d="M62 245 L88 245 L86 290 L60 290 Z" fill={BG} />
        <Path d="M62 245 L88 245 L86 290 L60 290 Z" fill={CYAN} fillOpacity={clamp(get("isquios"))} />
        <Path d="M92 245 L118 245 L120 290 L94 290 Z" fill={BG} />
        <Path d="M92 245 L118 245 L120 290 L94 290 Z" fill={CYAN} fillOpacity={clamp(get("isquios"))} />
        {/* Gemelos */}
        <Path d="M60 290 L86 290 L84 370 L62 370 Z" fill={BG} />
        <Path d="M60 290 L86 290 L84 370 L62 370 Z" fill={CYAN} fillOpacity={clamp(get("gemelos"))} />
        <Path d="M94 290 L120 290 L118 370 L96 370 Z" fill={BG} />
        <Path d="M94 290 L120 290 L118 370 L96 370 Z" fill={CYAN} fillOpacity={clamp(get("gemelos"))} />
      </G>
    </Svg>
  );
}

interface Props {
  data: Record<string, number>;
  view?: "front" | "back";
}

export const MuscleMap = React.memo(function MuscleMap({ data, view = "front" }: Props) {
  const get = (k: string) => data?.[k] ?? 0;

  return (
    <View className="items-center">
      {view === "front" ? <FrontView get={get} /> : <BackView get={get} />}

      {/* Legend */}
      <View className="flex-row items-center gap-2 mt-2">
        <Text className="font-ds-text text-[11px] text-ds-fg-mute">Menos</Text>
        <View className="flex-row rounded-md overflow-hidden">
          {[0.05, 0.3, 0.55, 0.8, 1].map((v) => (
            <View
              key={v}
              style={{ width: 18, height: 8, backgroundColor: CYAN, opacity: v }}
            />
          ))}
        </View>
        <Text className="font-ds-text text-[11px] text-ds-fg-mute">Más</Text>
      </View>
    </View>
  );
});
