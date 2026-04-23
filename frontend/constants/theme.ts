export const colors = {
  bg:           "#0D0D0D",
  surface:      "#141414",
  surface2:     "#1C1C1C",
  border:       "#2A2A2A",
  primary:      "#00C9D8",
  primaryLight: "#33D9E5",
  primaryDark:  "#009FAB",
  text:         "#F5F7FA",
  muted:        "#7A7A7A",
  success:      "#22C55E",
  warning:      "#F59E0B",
  error:        "#EF4444",
} as const;

export const fonts = {
  heading: "SpaceGrotesk-Bold",
  headingMedium: "SpaceGrotesk-Medium",
  body: "Inter-Regular",
  bodyMedium: "Inter-Medium",
  bodySemiBold: "Inter-SemiBold",
  bodyBold: "Inter-Bold",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
