import { useState } from "react";
import {
  View, Text, ScrollView, KeyboardAvoidingView,
  Platform, Alert, Image, Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Rect, Path, Circle, Defs, Mask } from "react-native-svg";
import { Button } from "@/components/ds/Button";
import { Input } from "@/components/ds/Input";
import { FacultyPicker } from "@/components/ui/FacultyPicker";
import { useAuthStore } from "@/store/auth";

type FacultyOption = { id: string; name: string; code: string };

function BrandMark({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Defs>
        <Mask id="bm-reg">
          <Rect width="40" height="40" fill="#fff" />
          <Path d="M20 9 L31 22 L26 22 L20 15 L14 22 L9 22 Z" fill="#000" />
          <Path d="M20 20 L31 33 L26 33 L20 26 L14 33 L9 33 Z" fill="#000" />
        </Mask>
      </Defs>
      <Rect width="40" height="40" rx="9" fill="#22D3EE" mask="url(#bm-reg)" />
      <Circle cx="20" cy="36.5" r="1.4" fill="#22D3EE" />
    </Svg>
  );
}

export default function RegisterScreen() {
  const { register } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
      await register(email.trim().toLowerCase(), password, fullName.trim(), faculty?.id, {});
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.detail ?? "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  const eyeIcon = (visible: boolean, toggle: () => void) => (
    <Pressable onPress={toggle} hitSlop={8}>
      <Ionicons
        name={visible ? "eye-off-outline" : "eye-outline"}
        size={20}
        color="#9AA0AB"
      />
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0B0D" }}>
      {/* Imagen absolute en el top — el form la cubre encima */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, aspectRatio: 768 / 1375 }}>
        <Image
          source={require("@/assets/images/login_bg.jpg")}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "transparent", "#0A0B0Dee", "#0A0B0D"]}
          locations={[0, 0.4, 0.85, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
          pointerEvents="none"
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-ds-6 pb-ds-9 pt-ds-9">
            {/* Header */}
            <View className="items-center mb-ds-6">
              <BrandMark size={56} />
              <Text className="font-ds-text-sb text-[11px] text-ds-brand-cyan tracking-[6px] mt-ds-3 uppercase">
                UTEC · GYM
              </Text>
              <Text className="font-ds-display text-[32px] text-ds-fg-hi mt-ds-1">
                Crear cuenta
              </Text>
              <Text className="font-ds-text text-ds-body text-ds-fg-mute mt-ds-1">
                Solo correos @utec.edu.pe o @utec.pe
              </Text>
            </View>

            {/* Form */}
            <View className="gap-ds-4">
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
                leftIcon={
                  <Ionicons name="mail-outline" size={18} color="#6B7280" />
                }
              />
              <Input
                label="Contraseña"
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                rightIcon={eyeIcon(showPassword, () => setShowPassword((v) => !v))}
              />
              <Input
                label="Confirmar contraseña"
                placeholder="••••••••"
                secureTextEntry={!showConfirm}
                value={confirm}
                onChangeText={setConfirm}
                error={errors.confirm}
                rightIcon={eyeIcon(showConfirm, () => setShowConfirm((v) => !v))}
              />
              <FacultyPicker
                value={faculty}
                onChange={setFaculty}
                error={errors.faculty}
              />

              <Button variant="primary" size="lg" fullWidth loading={loading} onPress={handleRegister}>
                Crear cuenta
              </Button>
            </View>

            {/* Footer */}
            <View className="flex-row justify-center mt-ds-6 gap-ds-1">
              <Text className="font-ds-text text-ds-body text-ds-fg-mute">¿Ya tienes cuenta?</Text>
              <Link href="/(auth)/login">
                <Text className="font-ds-text-sb text-ds-body text-ds-brand-cyan">Inicia sesión</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
