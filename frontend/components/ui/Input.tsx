import { TextInput, View, Text, TextInputProps, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={{ width: "100%", gap: 6 }}>
      {label && <Text style={s.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.muted}
        style={[
          s.input,
          error ? { borderColor: colors.error } : { borderColor: colors.border },
          style,
        ]}
        {...props}
      />
      {error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  label: {
    fontFamily: "Inter-SemiBold",
    fontSize: 13,
    color: colors.muted,
  },
  input: {
    fontFamily: "Inter-Regular",
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  error: {
    fontFamily: "Inter-Regular",
    fontSize: 11,
    color: colors.error,
  },
});
