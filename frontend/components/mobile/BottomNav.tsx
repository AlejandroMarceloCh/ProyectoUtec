import { View, Pressable, Text } from "react-native";
import { ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type BottomNavTab<T extends string> = {
  key: T;
  label: string;
  icon: (active: boolean) => ReactNode;
};

type Props<T extends string> = {
  tabs: BottomNavTab<T>[];
  active: T;
  onChange: (k: T) => void;
};

export function BottomNav<T extends string>({ tabs, active, onChange }: Props<T>) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-row bg-ds-bg-sunken border-t border-ds-line"
      style={{ paddingBottom: insets.bottom }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(tab.key)}
            hitSlop={6}
            className="flex-1 items-center justify-center gap-ds-1 py-ds-2 min-h-[56px]"
          >
            {tab.icon(isActive)}
            <Text
              className={`font-ds-text-m text-ds-caption tracking-ds-tight ${
                isActive ? "text-ds-brand-cyan" : "text-ds-fg-dim"
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
