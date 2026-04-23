import "../global.css";
import { useEffect, useState, useCallback } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { SplashAnimated } from "@/components/SplashAnimated";
import { BiometricGate } from "@/components/BiometricGate";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AuthGate() {
  const { user, isLoading, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === "(auth)";
    if (!user && !inAuth) router.replace("/(auth)/login");
    if (user && inAuth) router.replace("/(tabs)");
  }, [user, isLoading, segments]);

  return null;
}

export default function RootLayout() {
  const { user } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);

  const [loaded] = useFonts({
    "SpaceGrotesk-Bold": require("../assets/fonts/SpaceGrotesk-Bold.otf"),
    "SpaceGrotesk-Medium": require("../assets/fonts/SpaceGrotesk-Medium.otf"),
    "SpaceGrotesk-Regular": require("../assets/fonts/SpaceGrotesk-Regular.otf"),
    "Inter-Regular": require("../assets/fonts/Inter-Regular.ttf"),
    "Inter-Medium": require("../assets/fonts/Inter-Medium.ttf"),
    "Inter-SemiBold": require("../assets/fonts/Inter-SemiBold.ttf"),
    "Inter-Bold": require("../assets/fonts/Inter-Bold.ttf"),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (!loaded) return null;

  const content = (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
      {showSplash && <SplashAnimated onFinish={handleSplashFinish} />}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0D0D0D" } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );

  if (user) {
    return <BiometricGate>{content}</BiometricGate>;
  }

  return content;
}
