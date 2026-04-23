import { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, Dimensions, ImageBackground } from "react-native";
import { Logo } from "@/components/ui/Logo";
import { colors } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

/** Franja central: contain = edificio completo sin zoom; un poco más alto para que lea bien. */
const BAND_HEIGHT = height * 0.48;
const BAND_TOP = (height - BAND_HEIGHT) / 2;

interface SplashAnimatedProps {
  onFinish: () => void;
}

export function SplashAnimated({ onFinish }: SplashAnimatedProps) {
  const bandOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(16)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(bandOpacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),

      Animated.delay(500),

      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslate, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),

      Animated.delay(900),

      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: fadeOut }]}>
      <View style={StyleSheet.absoluteFill} />

      <Animated.View
        style={[
          styles.bandWrap,
          { opacity: bandOpacity, pointerEvents: "none" },
        ]}
      >
        <ImageBackground
          source={require("@/assets/images/utec_building.png")}
          style={styles.bandImage}
          resizeMode="contain"
          imageStyle={styles.bandImageInner}
        />
      </Animated.View>

      {/* Leve velado global (como login); no tapar el edificio como antes */}
      <Animated.View
        style={[
          styles.softOverlay,
          { opacity: overlayOpacity, pointerEvents: "none" },
        ]}
      />

      <View style={styles.center}>
        <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

        <Animated.View
          style={{
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
          }}
        >
          <Logo size={width * 0.28} color={colors.primary} />
        </Animated.View>

        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textTranslate }],
            marginTop: 24,
            alignItems: "center",
          }}
        >
          <Text style={styles.title}>UTEC GYM</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    zIndex: 999,
  },
  bandWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: BAND_TOP,
    height: BAND_HEIGHT,
    overflow: "hidden",
    backgroundColor: colors.bg,
    justifyContent: "center",
  },
  bandImage: {
    width: "100%",
    height: "100%",
  },
  bandImageInner: {
    opacity: 0.52,
  },
  softOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(13,13,13,0.32)",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: width * 0.48,
    height: width * 0.22,
    borderRadius: width * 0.14,
    backgroundColor: colors.primary,
    opacity: 0.16,
  },
  title: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 30,
    color: colors.text,
    letterSpacing: 8,
  },
});
