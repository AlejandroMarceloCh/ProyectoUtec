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
import { useAuthStore } from "@/store/auth";

function BrandMark({ size = 72 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Defs>
        <Mask id="bm">
          <Rect width="40" height="40" fill="#fff" />
          <Path d="M20 9 L31 22 L26 22 L20 15 L14 22 L9 22 Z" fill="#000" />
          <Path d="M20 20 L31 33 L26 33 L20 26 L14 33 L9 33 Z" fill="#000" />
        </Mask>
      </Defs>
      <Rect width="40" height="40" rx="9" fill="#22D3EE" mask="url(#bm)" />
      <Circle cx="20" cy="36.5" r="1.4" fill="#22D3EE" />
    </Svg>
  );
}

export default function LoginScreen() {
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
          {/* Header — pegado al form, no en medio de la imagen */}
          <View className="items-center mb-ds-6">
            <BrandMark size={56} />
            <Text className="font-ds-text-sb text-[11px] text-ds-brand-cyan tracking-[6px] mt-ds-3 uppercase">
              UTEC · GYM
            </Text>
            <Text className="font-ds-display text-[32px] text-ds-fg-hi mt-ds-1">
              Bienvenido
            </Text>
            <Text className="font-ds-text text-ds-body text-ds-fg-mute mt-ds-1">
              Inicia sesión con tu correo UTEC
            </Text>
          </View>

          {/* Form */}
          <View className="gap-ds-4">
            <Input
              label="Correo institucional"
              placeholder="a20230001@utec.edu.pe"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
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
              rightIcon={
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#9AA0AB"
                  />
                </Pressable>
              }
            />
            <Pressable className="self-end -mt-ds-2 mb-ds-1">
              <Text className="font-ds-text text-ds-small text-ds-fg-mute">¿Olvidaste tu contraseña?</Text>
            </Pressable>

            <Button variant="primary" size="lg" fullWidth loading={loading} onPress={handleLogin}>
              Iniciar sesión
            </Button>
          </View>

          {/* Footer */}
          <View className="flex-row justify-center mt-ds-6 gap-ds-1">
            <Text className="font-ds-text text-ds-body text-ds-fg-mute">¿No tienes cuenta?</Text>
            <Link href="/(auth)/register">
              <Text className="font-ds-text-sb text-ds-body text-ds-brand-cyan">Regístrate</Text>
            </Link>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
