import { View, Pressable, Text } from "react-native";
import type { PressableProps } from "react-native";
import { ReactNode } from "react";

type Props = Omit<PressableProps, "children"> & {
  title: string;
  subtitle?: string;
  meta?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
};

export function ListItem({ title, subtitle, meta, leading, trailing, onPress, ...rest }: Props) {
  const Container: any = onPress ? Pressable : View;
  return (
    <Container
      onPress={onPress}
      className="flex-row items-center gap-ds-3 px-ds-4 min-h-[56px] bg-ds-bg-surface border-b border-ds-line-muted active:bg-ds-bg-raised"
      hitSlop={onPress ? 4 : undefined}
      {...rest}
    >
      {leading ? <View>{leading}</View> : null}
      <View className="flex-1 gap-ds-1 py-ds-2">
        <Text numberOfLines={1} className="font-ds-text-sb text-ds-body text-ds-fg-hi">
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} className="font-ds-text text-ds-small text-ds-fg-mute">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {meta ? (
        <Text className="font-ds-mono text-ds-tiny text-ds-fg-dim">{meta}</Text>
      ) : null}
      {trailing}
    </Container>
  );
}
