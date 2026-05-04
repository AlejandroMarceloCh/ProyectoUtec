import React from "react";
import { View, Text } from "react-native";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function intensityColor(intensity: number): string {
  if (intensity === 0) return "#23262E";
  if (intensity < 0.25) return "#0E7490";
  if (intensity < 0.5) return "#0891B2";
  if (intensity < 0.75) return "#06B6D4";
  return "#22D3EE";
}

interface Cell {
  dia: number;
  hora: number;
  intensidad: number;
}

interface Props {
  cells: Cell[];
}

export const Heatmap = React.memo(function Heatmap({ cells }: Props) {
  const cellMap = new Map<string, number>();
  cells.forEach((c) => cellMap.set(`${c.dia}-${c.hora}`, c.intensidad));

  return (
    <View>
      {/* Hour axis */}
      <View style={{ flexDirection: "row", marginLeft: 32, marginBottom: 4, marginTop: 12 }}>
        {HOURS.filter((_, i) => i % 2 === 0).map((h) => (
          <Text key={h} className="font-ds-mono text-[8px] text-ds-fg-dim flex-1 text-center">
            {h}h
          </Text>
        ))}
      </View>

      {DAYS.map((day, dia) => (
        <View key={dia} style={{ flexDirection: "row", alignItems: "center", marginBottom: 1 }}>
          <Text className="font-ds-text text-[9px] text-ds-fg-mute" style={{ width: 32 }}>
            {day}
          </Text>
          {HOURS.map((hora) => {
            const intensity = cellMap.get(`${dia}-${hora}`) ?? 0;
            return (
              <View
                key={hora}
                style={{
                  flex: 1,
                  height: 18,
                  backgroundColor: intensityColor(intensity),
                  marginHorizontal: 0.5,
                  borderRadius: 3,
                }}
              />
            );
          })}
        </View>
      ))}

      {/* Legend */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 16 }}>
        {[
          { label: "Vacío", color: "#23262E" },
          { label: "Bajo", color: "#0891B2" },
          { label: "Moderado", color: "#06B6D4" },
          { label: "Lleno", color: "#22D3EE" },
        ].map(({ label, color }) => (
          <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
            <Text className="font-ds-text text-[9px] text-ds-fg-mute">{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});
