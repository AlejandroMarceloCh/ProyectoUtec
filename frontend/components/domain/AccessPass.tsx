import React from "react";
import { View, Text, Pressable, Platform, Dimensions } from "react-native";
import QRCode from "react-native-qrcode-svg";

const QR_TTL = 14;
const { width } = Dimensions.get("window");
const QR_SIZE = Math.min(width * 0.55, 220);

const CYAN = "#22D3EE";
const WARNING = "#FFB454";
const DANGER = "#FF6464";

function CountdownBar({ seconds }: { seconds: number }) {
  const pct = Math.max(seconds / QR_TTL, 0);
  const color = seconds > 12 ? CYAN : seconds > 6 ? WARNING : DANGER;
  return (
    <View className="w-4/5 h-[3px] bg-ds-bg-raised rounded-full overflow-hidden mt-5">
      <View style={{ width: `${pct * 100}%` as `${number}%`, backgroundColor: color }} className="h-full rounded-full" />
    </View>
  );
}

interface Props {
  token: string | undefined;
  countdown: number;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
}

export const AccessPass = React.memo(function AccessPass({
  token,
  countdown,
  isFetching,
  isError,
  onRetry,
}: Props) {
  const borderColor = countdown > 12 ? CYAN : countdown > 6 ? WARNING : DANGER;

  return (
    <View
      className="items-center py-7 mb-4 rounded-ds-xl bg-ds-bg-surface border border-ds-line"
      style={
        Platform.OS === "ios"
          ? { shadowColor: CYAN, shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } }
          : undefined
      }
    >
      <View
        style={{
          width: QR_SIZE + 32,
          height: QR_SIZE + 32,
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor,
          padding: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#101115",
        }}
      >
        {token ? (
          <QRCode value={token} size={QR_SIZE} ecl="Q" color="#000000" backgroundColor="#FFFFFF" />
        ) : isError ? (
          <View style={{ width: QR_SIZE, alignItems: "center", padding: 16, gap: 12 }}>
            <Text className="font-ds-text text-[13px] text-ds-danger text-center">
              No se pudo cargar el QR
            </Text>
            <Pressable
              onPress={onRetry}
              disabled={isFetching}
              className="border border-ds-brand-cyan rounded-lg px-4 py-2"
            >
              <Text className="font-ds-text-m text-[13px] text-ds-brand-cyan">
                {isFetching ? "..." : "Reintentar"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ width: QR_SIZE, height: QR_SIZE, backgroundColor: "#1C1C1C", borderRadius: 12 }} />
        )}
      </View>

      <CountdownBar seconds={countdown} />
      <Text className="font-ds-text text-[11px] text-ds-fg-mute mt-2">
        {isFetching && countdown <= 5 ? "Renovando..." : `Renueva en ${Math.max(countdown, 1)}s`}
      </Text>
    </View>
  );
});
