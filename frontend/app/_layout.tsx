import "../global.css";
import { useEffect, useState, useCallback } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { setUnauthorizedHandler } from "@/lib/api";
import { SplashAnimated } from "@/components/SplashAnimated";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AuthGate() {
  const { user, isLoading, loadFromStorage, logout } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadFromStorage();
    setUnauthorizedHandler(() => {
      queryClient.clear();
      logout();
    });
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
  const { user, accessToken } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);
  const [hardStop, setHardStop] = useState(false);
  const fastSplash = !!accessToken;

  const [loaded, fontsError] = useFonts({
    "SpaceGrotesk-Bold": require("../assets/fonts/SpaceGrotesk-Bold.otf"),
    "SpaceGrotesk-Medium": require("../assets/fonts/SpaceGrotesk-Medium.otf"),
    "SpaceGrotesk-Regular": require("../assets/fonts/SpaceGrotesk-Regular.otf"),
    "Inter-Regular": require("../assets/fonts/Inter-Regular.ttf"),
    "Inter-Medium": require("../assets/fonts/Inter-Medium.ttf"),
    "Inter-SemiBold": require("../assets/fonts/Inter-SemiBold.ttf"),
    "Inter-Bold": require("../assets/fonts/Inter-Bold.ttf"),
    "InterTight-Regular":   require("../assets/fonts/InterTight-Regular.ttf"),
    "InterTight-Medium":    require("../assets/fonts/InterTight-Medium.ttf"),
    "InterTight-SemiBold":  require("../assets/fonts/InterTight-SemiBold.ttf"),
    "InterTight-Bold":      require("../assets/fonts/InterTight-Bold.ttf"),
    "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf"),
  });

  // Hard-stop a 5s independiente del bridge de useFonts.
  // Si el bridge se cuelga, la app abre igual con system-ui como fallback.
  useEffect(() => {
    const timer = setTimeout(() => {
      setHardStop(true);
      SplashScreen.hideAsync();
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loaded || fontsError) SplashScreen.hideAsync();
  }, [loaded, fontsError]);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (!loaded && !fontsError && !hardStop) return null;

  const content = (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
      {showSplash && <SplashAnimated onFinish={handleSplashFinish} fast={fastSplash} />}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0D0D0D" } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );

  return content;
}
