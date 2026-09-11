import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
export default function BrandSplash({
  onFinish,
  onReady,
}: {
  onFinish(): void;
  onReady(): void;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [loaded, setLoaded] = useState(0);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const ready = useCallback(() => setLoaded((n) => n + 1), []);
  useEffect(() => {
    if (loaded < 2) return;
    onReady();
    const timer = setTimeout(
      () =>
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) onFinish();
        }),
      1200,
    );
    return () => {
      clearTimeout(timer);
      opacity.stopAnimation();
    };
  }, [loaded, onReady, onFinish, opacity]);
  useEffect(() => {
    const timer = setTimeout(onReady, 1500);
    return () => clearTimeout(timer);
  }, [onReady]);
  return (
    <Animated.View
      accessibilityLabel="Bienvenido a Buster’s, Universidad Tecmilenio"
      style={[styles.page, { opacity }]}
    >
      <View style={styles.center}>
        <Image
          accessibilityLabel="Buster’s Beagle & Bagel"
          source={require("../../assets/buster.png")}
          onLoadEnd={ready}
          style={{
            width: Math.min(width * 0.53, 240),
            height: Math.min(width * 0.53, 240),
          }}
          resizeMode="contain"
        />
      </View>
      <Image
        accessibilityLabel="Universidad Tecmilenio"
        source={require("../../assets/tecm.png")}
        onLoadEnd={ready}
        resizeMode="contain"
        style={[styles.university, { bottom: Math.max(insets.bottom, 12) }]}
      />
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  page: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    zIndex: 100,
  },
  center: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  university: { position: "absolute", width: 150, height: 140 },
});
