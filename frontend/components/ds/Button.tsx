import { Pressable, Text, ActivityIndicator, View, Platform } from "react-native";
import type { PressableProps } from "react-native";
import { ReactNode } from "react";

type Variant = "primary" | "brand" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = Omit<PressableProps, "children"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
  fullWidth?: boolean;
};

const containerByVariant: Record<Variant, string> = {
  primary: "bg-ds-action active:bg-ds-action-press",
  brand:   "bg-ds-brand-cyan active:bg-ds-brand-cyan-dim",
  ghost:   "bg-transparent border border-ds-line active:bg-ds-bg-raised",
  danger:  "bg-ds-danger active:opacity-80",
};

const textByVariant: Record<Variant, string> = {
  primary: "text-ds-fg-on-accent",
  brand:   "text-ds-fg-on-accent",
  ghost:   "text-ds-fg-hi",
  danger:  "text-ds-fg-hi",
};

const sizeContainer: Record<Size, string> = {
  sm: "h-9 px-ds-3 rounded-ds-md",
  md: "h-11 px-ds-5 rounded-ds-md",
  lg: "h-14 px-ds-6 rounded-ds-lg",
};

const sizeText: Record<Size, string> = {
  sm: "text-ds-small",
  md: "text-ds-body",
  lg: "text-ds-lead",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  children,
  fullWidth,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      hitSlop={8}
      className={`flex-row items-center justify-center gap-ds-2 ${sizeContainer[size]} ${containerByVariant[variant]} ${
        isDisabled ? "opacity-50" : ""
      } ${fullWidth ? "w-full" : ""}`}
      style={
        // glow real solo en iOS (Android no soporta colored elevation)
        variant === "brand" && Platform.OS === "ios"
          ? { shadowColor: "#22D3EE", shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } }
          : undefined
      }
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "ghost" ? "#F4F5F7" : "#0A0B0D"} />
      ) : (
        <>
          {leftIcon ? <View>{leftIcon}</View> : null}
          <Text className={`font-ds-text-sb ${sizeText[size]} ${textByVariant[variant]}`}>{children}</Text>
          {rightIcon ? <View>{rightIcon}</View> : null}
        </>
      )}
    </Pressable>
  );
}
