import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  fullWidth = true,
}: ButtonProps) {
  const bg =
    variant === "primary" ? colors.primary :
    variant === "danger" ? colors.error :
    "transparent";

  const borderColor = variant === "ghost" ? colors.border : "transparent";

  const textColor =
    variant === "primary" ? colors.bg :
    variant === "danger" ? "#fff" :
    colors.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        s.base,
        { backgroundColor: bg, borderColor },
        fullWidth ? { width: "100%" } : { paddingHorizontal: 24 },
        (disabled || loading) && { opacity: 0.5 },
      ]}
    >
      {loading && <ActivityIndicator size="small" color={variant === "primary" ? colors.bg : colors.primary} style={{ marginRight: 8 }} />}
      <Text style={[s.label, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1,
  },
  label: {
    fontFamily: "Inter-Bold",
    fontSize: 15,
  },
});
