import { useState } from "react";
import {
  View, Text, ScrollView, KeyboardAvoidingView,
  Platform, Alert, StyleSheet, ImageBackground,
} from "react-native";
import { Link } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { useAuthStore } from "@/store/auth";
import { colors } from "@/constants/theme";

export default function LoginScreen() {
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.includes("@utec")) e.email = "Usa tu correo @utec.edu.pe o @utec.pe";
    if (password.length < 8) e.password = "Mínimo 8 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.detail ?? "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/images/utec_building.png")}
      style={styles.root}
      resizeMode="cover"
    >
      {/* Dark overlay so form is readable */}
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Logo size={72} color={colors.primary} />
            <Text style={styles.title}>UTEC GYM</Text>
            <Text style={styles.subtitle}>Inicia sesión con tu correo UTEC</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Correo institucional"
              placeholder="a20230001@utec.edu.pe"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />
            <Input
              label="Contraseña"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />
            <Button label="Iniciar sesión" onPress={handleLogin} loading={loading} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta?</Text>
            <Link href="/(auth)/register">
              <Text style={styles.footerLink}>Regístrate</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(13,13,13,0.78)",
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 30,
    color: colors.text,
    letterSpacing: 4,
    marginTop: 16,
  },
  subtitle: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: colors.muted,
    marginTop: 6,
  },
  form: {
    gap: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    gap: 4,
  },
  footerText: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: colors.muted,
  },
  footerLink: {
    fontFamily: "Inter-SemiBold",
    fontSize: 14,
    color: colors.primary,
  },
});
