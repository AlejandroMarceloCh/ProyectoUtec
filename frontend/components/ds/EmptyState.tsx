import { View, Text } from "react-native";
import { ReactNode } from "react";
import { Button } from "./Button";

type Props = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: { label: string; onPress: () => void; variant?: "primary" | "brand" | "ghost" };
};

export function EmptyState({ title, description, icon, action }: Props) {
  return (
    <View className="flex-1 items-center justify-center gap-ds-4 px-ds-6 py-ds-8">
      {icon ? <View className="opacity-60">{icon}</View> : null}
      <View className="gap-ds-2 items-center">
        <Text className="font-ds-display text-ds-h4 text-ds-fg-hi text-center tracking-ds-tight">
          {title}
        </Text>
        {description ? (
          <Text className="font-ds-text text-ds-body text-ds-fg-mute text-center max-w-xs">
            {description}
          </Text>
        ) : null}
      </View>
      {action ? (
        <Button variant={action.variant ?? "ghost"} onPress={action.onPress}>
          {action.label}
        </Button>
      ) : null}
    </View>
  );
}
