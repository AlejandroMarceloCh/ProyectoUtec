import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors } from "@/constants/theme";

interface PulseRingProps {
  /** Diameter of the inner content area */
  size: number;
  color?: string;
  /** Number of concentric rings. Default 2 */
  rings?: number;
  /** Duration of one full pulse cycle in ms. Default 2200 */
  duration?: number;
  children?: React.ReactNode;
}

/**
 * Arcane-style expanding rings that pulse outward from a center element.
 * Uses staggered delays so each ring is offset in phase.
 */
export function PulseRing({
  size,
  color = colors.primary,
  rings = 2,
  duration = 2200,
  children,
}: PulseRingProps) {
  const anims = useRef(
    Array.from({ length: rings }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const loops = anims.map((anim, i) => {
      const delay = (duration / rings) * i;
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    });
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [duration, rings]);

  const maxExpand = size * 0.32; // rings expand 32% outward from edge

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {anims.map((anim, i) => {
        const scale = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1 + (maxExpand / (size / 2)) * 1.6],
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0.55, 0.35, 0],
        });
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[
              styles.ring,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderColor: color,
                opacity,
                transform: [{ scale }],
              },
            ]}
          />
        );
      })}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderWidth: 1.5,
  },
});
