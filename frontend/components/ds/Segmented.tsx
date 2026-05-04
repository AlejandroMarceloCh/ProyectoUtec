import { View, Pressable, Text } from "react-native";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
};

export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View className="flex-row p-ds-1 bg-ds-bg-raised rounded-ds-md border border-ds-line">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.value)}
            hitSlop={6}
            className={`flex-1 h-9 items-center justify-center rounded-ds-sm ${
              active ? "bg-ds-brand-cyan" : "bg-transparent"
            }`}
          >
            <Text
              className={`font-ds-text-sb text-ds-small tracking-ds-tight ${
                active ? "text-ds-fg-on-accent" : "text-ds-fg-mute"
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
