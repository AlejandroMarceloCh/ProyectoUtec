import { View, Text } from "react-native";
import { ReactNode } from "react";
import { Card } from "./Card";

type Props = {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  icon?: ReactNode;
  emphasis?: "neutral" | "brand" | "action";
};

const trendColor: Record<NonNullable<Props["trend"]>["direction"], string> = {
  up:   "text-ds-success",
  down: "text-ds-danger",
  flat: "text-ds-fg-mute",
};

const trendArrow: Record<NonNullable<Props["trend"]>["direction"], string> = {
  up:   "▲",
  down: "▼",
  flat: "—",
};

const valueColor: Record<NonNullable<Props["emphasis"]>, string> = {
  neutral: "text-ds-fg-hi",
  brand:   "text-ds-brand-cyan",
  action:  "text-ds-action",
};

export function Stat({ label, value, unit, hint, trend, icon, emphasis = "neutral" }: Props) {
  return (
    <Card variant="surface" className="gap-ds-2">
      <View className="flex-row items-center justify-between">
        <Text className="font-ds-text-m text-ds-caption uppercase tracking-ds-tight text-ds-fg-mute">
          {label}
        </Text>
        {icon}
      </View>
      <View className="flex-row items-baseline gap-ds-1">
        <Text className={`font-ds-display text-ds-h2 tracking-ds-tight ${valueColor[emphasis]}`}>
          {value}
        </Text>
        {unit ? <Text className="font-ds-text text-ds-body text-ds-fg-mute">{unit}</Text> : null}
      </View>
      {trend ? (
        <View className="flex-row items-center gap-ds-1">
          <Text className={`font-ds-mono text-ds-tiny ${trendColor[trend.direction]}`}>
            {trendArrow[trend.direction]} {trend.value}
          </Text>
          {hint ? <Text className="font-ds-text text-ds-tiny text-ds-fg-dim">· {hint}</Text> : null}
        </View>
      ) : hint ? (
        <Text className="font-ds-text text-ds-tiny text-ds-fg-dim">{hint}</Text>
      ) : null}
    </Card>
  );
}
