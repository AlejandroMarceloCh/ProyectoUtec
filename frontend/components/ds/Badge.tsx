import { View, Text } from "react-native";
import { ReactNode } from "react";

type Tone = "neutral" | "brand" | "action" | "success" | "warning" | "danger" | "info";

type Props = {
  tone?: Tone;
  children: ReactNode;
  icon?: ReactNode;
};

const styles: Record<Tone, { bg: string; text: string; border: string }> = {
  neutral: { bg: "bg-ds-bg-raised",   text: "text-ds-fg-base",       border: "border-ds-line" },
  brand:   { bg: "bg-ds-brand-cyan-glow", text: "text-ds-brand-cyan", border: "border-ds-brand-cyan-dim" },
  action:  { bg: "bg-ds-action-ghost", text: "text-ds-action",       border: "border-ds-action" },
  success: { bg: "bg-ds-success-bg",   text: "text-ds-success",      border: "border-ds-success" },
  warning: { bg: "bg-ds-warning-bg",   text: "text-ds-warning",      border: "border-ds-warning" },
  danger:  { bg: "bg-ds-danger-bg",    text: "text-ds-danger",       border: "border-ds-danger" },
  info:    { bg: "bg-ds-info-bg",      text: "text-ds-info",         border: "border-ds-info" },
};

export function Badge({ tone = "neutral", children, icon }: Props) {
  const s = styles[tone];
  return (
    <View className={`flex-row items-center gap-ds-1 px-ds-2 h-6 rounded-ds-pill border ${s.bg} ${s.border}`}>
      {icon}
      <Text className={`font-ds-text-m text-ds-caption uppercase tracking-ds-tight ${s.text}`}>{children}</Text>
    </View>
  );
}
