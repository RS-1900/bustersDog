import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProductStore } from "../stores/useProductStore";

export function CartToast() {
  const notice = useProductStore((state) => state.notice);
  const cartCount = useProductStore((state) =>
    state.cart.reduce((total, item) => total + item.quantity, 0),
  );
  const clearNotice = useProductStore((state) => state.clearNotice);
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-18)).current;

  useEffect(() => {
    if (!notice) return;
    opacity.setValue(0);
    translateY.setValue(-18);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        speed: 22,
        bounciness: 4,
        useNativeDriver: true,
      }),
    ]).start();
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -12,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) clearNotice();
      });
    }, 2600);
    return () => clearTimeout(timer);
  }, [notice, cartCount, clearNotice, opacity, translateY]);

  if (!notice) return null;
  return (
    <View pointerEvents="none" style={[styles.layer, { top: insets.top + 12 }]}>
      <Animated.View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={[styles.toast, { opacity, transform: [{ translateY }] }]}
      >
        <View style={styles.check}>
          <Text style={styles.checkText}>✓</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {notice}
        </Text>
        <View style={styles.count}>
          <Text style={styles.countText}>{cartCount}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    left: 18,
    right: 18,
    zIndex: 1000,
    elevation: 20,
    alignItems: "center",
  },
  toast: {
    width: "100%",
    maxWidth: 370,
    minHeight: 58,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: 18,
    backgroundColor: "#2D251F",
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  check: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#26B978",
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { color: "#FFF", fontSize: 15, fontWeight: "900" },
  message: {
    flex: 1,
    color: "#FFF",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
  count: {
    minWidth: 27,
    height: 27,
    borderRadius: 14,
    paddingHorizontal: 6,
    backgroundColor: "#FFF1DC",
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { color: "#6F4218", fontSize: 12, fontWeight: "800" },
});
