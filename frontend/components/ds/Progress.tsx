import { View, Text } from "react-native";

type Tone = "brand" | "action" | "success" | "warning" | "danger";

type Props = {
  value: number; // 0..1
  tone?: Tone;
  label?: string;
  showPercent?: boolean;
  size?: "sm" | "md";
};

const fillByTone: Record<Tone, string> = {
  brand:   "bg-ds-brand-cyan",
  action:  "bg-ds-action",
  success: "bg-ds-success",
  warning: "bg-ds-warning",
  danger:  "bg-ds-danger",
};

const heightBySize = { sm: "h-1.5", md: "h-2.5" };

export function Progress({ value, tone = "brand", label, showPercent = false, size = "md" }: Props) {
  const clamped = Math.max(0, Math.min(1, value));
  const pct = Math.round(clamped * 100);
  return (
    <View className="gap-ds-1">
      {(label || showPercent) ? (
        <View className="flex-row items-center justify-between">
          {label ? (
            <Text className="font-ds-text-m text-ds-caption uppercase tracking-ds-tight text-ds-fg-mute">
              {label}
            </Text>
          ) : <View />}
          {showPercent ? (
            <Text className="font-ds-mono text-ds-tiny text-ds-fg-base">{pct}%</Text>
          ) : null}
        </View>
      ) : null}
      <View className={`w-full ${heightBySize[size]} bg-ds-bg-raised rounded-ds-pill overflow-hidden`}>
        <View
          className={`${heightBySize[size]} ${fillByTone[tone]} rounded-ds-pill`}
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}
