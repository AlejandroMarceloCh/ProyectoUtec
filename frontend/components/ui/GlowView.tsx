import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "@/constants/theme";

interface GlowViewProps {
  children: React.ReactNode;
  color?: string;
  /** Glow radius in px. Default 60 */
  radius?: number;
  /** 0-1. Default 0.22 */
  intensity?: number;
  /** Animate a slow breathe. Default true */
  breathe?: boolean;
  style?: ViewStyle;
}

/**
 * Wraps children with a soft radial glow halo — the Arcane "hextech energy" effect.
 * The halo breathes slowly when `breathe` is true.
 */
export function GlowView({
  children,
  color = colors.primary,
  radius = 60,
  intensity = 0.22,
  breathe = true,
  style,
}: GlowViewProps) {
  const anim = useRef(new Animated.Value(intensity * 0.7)).current;

  useEffect(() => {
    if (!breathe) {
      anim.setValue(intensity);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: intensity,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: intensity * 0.5,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breathe, intensity]);

  return (
    <View style={[styles.wrap, style]}>
      <Animated.View
        style={[
          styles.halo,
          {
            width: radius * 2,
            height: radius,
            borderRadius: radius,
            backgroundColor: color,
            opacity: anim,
          },
        ]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
  },
});
