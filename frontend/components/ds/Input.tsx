import { TextInput, View, Text, Platform } from "react-native";
import type { TextInputProps } from "react-native";
import { useState, ReactNode } from "react";

type Props = Omit<TextInputProps, "style"> & {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function Input({ label, hint, error, leftIcon, rightIcon, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;

  // glow cyan real solo en iOS al focus; Android usa borde reforzado.
  const focusShadow =
    focused && !hasError && Platform.OS === "ios"
      ? { shadowColor: "#22D3EE", shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }
      : undefined;

  const borderClass = hasError
    ? "border-ds-danger"
    : focused
    ? "border-ds-brand-cyan"
    : "border-ds-line";

  return (
    <View className="gap-ds-1">
      {label ? (
        <Text className="font-ds-text-m text-ds-tiny text-ds-fg-mute uppercase tracking-ds-tight">
          {label}
        </Text>
      ) : null}
      <View
        className={`flex-row items-center gap-ds-2 px-ds-3 h-12 rounded-ds-md bg-ds-bg-raised border ${borderClass}`}
        style={focusShadow}
      >
        {leftIcon}
        <TextInput
          className="flex-1 font-ds-text text-ds-body text-ds-fg-hi h-full"
          placeholderTextColor="#6B7280"
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {rightIcon}
      </View>
      {error ? (
        <Text className="font-ds-text text-ds-tiny text-ds-danger">{error}</Text>
      ) : hint ? (
        <Text className="font-ds-text text-ds-tiny text-ds-fg-dim">{hint}</Text>
      ) : null}
    </View>
  );
}
