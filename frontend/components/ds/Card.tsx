import { View, Platform } from "react-native";
import type { ViewProps } from "react-native";
import { ReactNode } from "react";

type Variant = "surface" | "raised" | "brand" | "sunken";

type Props = ViewProps & {
  variant?: Variant;
  glow?: boolean;
  children: ReactNode;
  className?: string;
};

const bgByVariant: Record<Variant, string> = {
  surface: "bg-ds-bg-surface border border-ds-line",
  raised:  "bg-ds-bg-raised border border-ds-line",
  brand:   "bg-ds-bg-surface border border-ds-brand-cyan",
  sunken:  "bg-ds-bg-sunken border border-ds-line-muted",
};

export function Card({ variant = "surface", glow = false, children, className = "", ...rest }: Props) {
  // glow cyan real solo iOS; en Android el borde brand-cyan ya da el efecto visual.
  const glowStyle =
    glow && Platform.OS === "ios"
      ? { shadowColor: "#22D3EE", shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } }
      : undefined;

  return (
    <View
      className={`p-ds-5 rounded-ds-lg ${bgByVariant[variant]} ${className}`}
      style={glowStyle}
      {...rest}
    >
      {children}
    </View>
  );
}
