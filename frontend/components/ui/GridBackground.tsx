import { View } from "react-native";
import Svg, { Line, Defs, Pattern, Rect } from "react-native-svg";

interface GridBackgroundProps {
  spacing?: number;
  opacity?: number;
  color?: string;
}

export function GridBackground({
  spacing: cellSize = 28,
  opacity = 0.035,
  color = "#F5F7FA",
}: GridBackgroundProps) {
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
      }}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id="grid"
            width={cellSize}
            height={cellSize}
            patternUnits="userSpaceOnUse"
          >
            <Line
              x1={cellSize}
              y1={0}
              x2={cellSize}
              y2={cellSize}
              stroke={color}
              strokeWidth={0.5}
              opacity={opacity}
            />
            <Line
              x1={0}
              y1={cellSize}
              x2={cellSize}
              y2={cellSize}
              stroke={color}
              strokeWidth={0.5}
              opacity={opacity}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grid)" />
      </Svg>
    </View>
  );
}
