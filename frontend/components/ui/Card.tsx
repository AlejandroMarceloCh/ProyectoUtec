import { View, ViewProps, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

interface CardProps extends ViewProps {
  elevated?: boolean;
  /** Turquoise glowing border — use for hero/active cards */
  glow?: boolean;
}

export function Card({ elevated = false, glow = false, className = "", style, children, ...props }: CardProps) {
  return (
    <View
      className={className}
      style={[
        cardStyles.base,
        elevated ? cardStyles.elevated : cardStyles.normal,
        glow && cardStyles.glow,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  base: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  normal: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  elevated: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
  },
  glow: {
    borderColor: colors.primary,
    backgroundColor: "#0D1F21",
  },
});
