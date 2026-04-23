import { useState } from "react";
import {
  View, Text, ScrollView, KeyboardAvoidingView,
  Platform, Alert, StyleSheet, ImageBackground,
} from "react-native";
import { Link } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FacultyPicker } from "@/components/ui/FacultyPicker";
import { Logo } from "@/components/ui/Logo";
import { useAuthStore } from "@/store/auth";
import { colors } from "@/constants/theme";

type FacultyOption = { id: string; name: string; code: string };

export default function RegisterScreen() {
  const { register } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [faculty, setFaculty] = useState<FacultyOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (fullName.trim().length < 3) e.fullName = "Ingresa tu nombre completo";
    if (!/^[^@]+@(utec\.edu\.pe|utec\.pe)$/.test(email.toLowerCase()))
      e.email = "Usa tu correo @utec.edu.pe o @utec.pe";
    if (password.length < 8) e.password = "Mínimo 8 caracteres";
    if (password !== confirm) e.confirm = "Las contraseñas no coinciden";
    if (!faculty) e.faculty = "Selecciona tu carrera";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, fullName.trim(), faculty?.id);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.detail ?? "No se pudo crear la cuenta");
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
            <Logo size={64} color={colors.primary} />
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Solo correos @utec.edu.pe o @utec.pe</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Nombre completo"
              placeholder="Juan García"
              autoCapitalize="words"
              value={fullName}
              onChangeText={setFullName}
              error={errors.fullName}
            />
            <Input
              label="Correo institucional"
              placeholder="a20230001@utec.edu.pe"
              keyboardType="email-address"
              autoCapitalize="none"
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
            <Input
              label="Confirmar contraseña"
              placeholder="••••••••"
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
              error={errors.confirm}
            />
            <FacultyPicker
              value={faculty}
              onChange={setFaculty}
              error={errors.faculty}
            />
            <Button label="Crear cuenta" onPress={handleRegister} loading={loading} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
            <Link href="/(auth)/login">
              <Text style={styles.footerLink}>Inicia sesión</Text>
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
    backgroundColor: "rgba(13,13,13,0.80)",
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: "center",
    marginBottom: 36,
  },
  title: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 26,
    color: colors.text,
    letterSpacing: 2,
    marginTop: 14,
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
