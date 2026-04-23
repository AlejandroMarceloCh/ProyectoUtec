import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { colors } from "@/constants/theme";

interface BiometricGateProps {
  children: React.ReactNode;
}

/**
 * If the device supports biometrics (Face ID / fingerprint), require
 * authentication before showing the app content.
 * On web or if biometrics unavailable, passes through immediately.
 */
export function BiometricGate({ children }: BiometricGateProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [failed, setFailed] = useState(false);

  const authenticate = async () => {
    setFailed(false);
    try {
      if (Platform.OS === "web") {
        setAuthenticated(true);
        return;
      }

      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!compatible || !enrolled) {
        setAuthenticated(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Desbloquear UTEC Gym",
        fallbackLabel: "Usar contraseña",
        cancelLabel: "Cancelar",
      });

      if (result.success) {
        setAuthenticated(true);
      } else {
        setFailed(true);
      }
    } catch {
      setAuthenticated(true);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    authenticate();
  }, []);

  if (authenticated) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <View style={s.root}>
        <Logo size={48} color={colors.primary} />
      </View>
    );
  }

  if (failed) {
    return (
      <View style={s.root}>
        <Logo size={48} color={colors.primary} />
        <Text style={s.title}>Verificación requerida</Text>
        <Text style={s.subtitle}>Usa Face ID o huella para continuar</Text>
        <Button label="Reintentar" onPress={authenticate} />
      </View>
    );
  }

  return null;
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 32,
  },
  title: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 20,
    color: colors.text,
    marginTop: 16,
  },
  subtitle: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    marginBottom: 8,
  },
});
