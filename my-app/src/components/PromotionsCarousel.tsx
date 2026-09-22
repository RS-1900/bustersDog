import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Modal,
  StyleSheet,
  Platform,
  AppState,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { imageUrl } from "../services/config";
import { usePromotions, type Promotion } from "../stores/promotions";
import { Button, ui } from "./OrderUI";
const fallback = require("../../assets/promo-coffee-photo.png");
export function PromotionsCarousel() {
  const { items, refresh } = usePromotions();
  const slides = items.filter((p) => p.active);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [detail, setDetail] = useState<Promotion | null>(null);
  const scroll = useRef<ScrollView>(null);
  const signature = slides.map((p) => p.id).join(",");
  useFocusEffect(
    useCallback(() => {
      const update = () => {
        if (AppState.currentState === "active") void refresh();
      };
      void refresh();
      const timer = setInterval(update, 30000);
      const subscription = AppState.addEventListener("change", update);
      return () => {
        clearInterval(timer);
        subscription.remove();
      };
    }, [refresh]),
  );
  useEffect(() => {
    setDetail((current) =>
      current
        ? (items.find((p) => p.id === current.id && p.active) ?? null)
        : null,
    );
  }, [items]);
  useEffect(() => {
    setIndex(0);
    scroll.current?.scrollTo({ x: 0, animated: false });
  }, [signature, width]);
  function go(n: number) {
    setIndex(n);
    scroll.current?.scrollTo({ x: n * width, animated: true });
  }
  function source(p: Promotion) {
    return imageUrl(p.image) && !failedImages.includes(p.image)
      ? { uri: imageUrl(p.image) }
      : fallback;
  }
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {!!slides.length && width > 0 && (
        <View style={styles.frame}>
          <ScrollView
            ref={scroll}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setIndex(
                Math.min(
                  slides.length - 1,
                  Math.max(
                    0,
                    Math.round(e.nativeEvent.contentOffset.x / width),
                  ),
                ),
              )
            }
          >
            {slides.map((p) => (
              <View key={p.id} style={[styles.slide, { width }]}>
                <Image
                  source={source(p)}
                  resizeMode="cover"
                  style={[
                    StyleSheet.absoluteFill,
                    { width: "100%", height: "100%" },
                  ]}
                  onError={() =>
                    setFailedImages((previous) => [...previous, p.image])
                  }
                />
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: "rgba(25,12,5,0.28)" },
                  ]}
                />
                <View style={styles.copy}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText} numberOfLines={1}>
                      {p.label}
                    </Text>
                  </View>
                  <Text style={styles.title} numberOfLines={2}>
                    {p.title}
                  </Text>
                  <Text style={styles.description} numberOfLines={2}>
                    {p.description}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Ver promoción: ${p.title}`}
                    onPress={() => setDetail(p)}
                    style={styles.ctaTarget}
                  >
                    <View style={styles.cta}>
                      <Text style={styles.ctaText}>Conocer más</Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
          {slides.length > 1 && (
            <View style={styles.pagination}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ alignItems: "center" }}
              >
                {slides.map((p, i) => (
                  <Pressable
                    key={p.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Ver promoción ${i + 1}: ${p.title}`}
                    accessibilityState={{ selected: index === i }}
                    onPress={() => go(i)}
                    style={styles.dotTarget}
                  >
                    <View
                      style={[styles.dot, index === i && styles.dotActive]}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}
      <Modal
        visible={!!detail}
        transparent
        animationType="fade"
        onRequestClose={() => setDetail(null)}
      >
        <View style={styles.modalBackdrop}>
          <View accessibilityViewIsModal style={styles.modalCard}>
            {detail && (
              <ScrollView contentContainerStyle={{ gap: 14 }}>
                <Image
                  source={source(detail)}
                  resizeMode="cover"
                  style={{ width: "100%", height: 170, borderRadius: 18 }}
                />
                <Text style={ui.muted}>{detail.label}</Text>
                <Text style={ui.title}>{detail.title}</Text>
                <Text style={ui.text}>{detail.description}</Text>
                <Text style={ui.muted}>
                  Consulta disponibilidad y aplicación de la promoción en
                  cafetería. El carrito no aplica descuentos automáticos.
                </Text>
                <Button
                  title="Cerrar promoción"
                  onPress={() => setDetail(null)}
                />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  frame: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#392013",
    borderWidth: 1,
    borderColor: "#4C3020",
  },
  slide: {
    minHeight: 190,
    justifyContent: "center",
    paddingTop: 22,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  copy: { gap: 5, alignItems: "flex-start", paddingRight: 14 },
  badge: {
    backgroundColor: "#AF691F",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: "100%",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  title: {
    color: "#FFF9EF",
    fontSize: 21,
    lineHeight: 25,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: -0.4,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    color: "#F3E7DA",
    fontSize: 12,
    lineHeight: 18,
    maxWidth: "90%",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ctaTarget: { minHeight: 44, justifyContent: "center" },
  cta: {
    backgroundColor: "#FFF",
    borderRadius: 11,
    paddingHorizontal: 15,
    paddingVertical: 7,
  },
  ctaText: { color: "#342419", fontSize: 12, fontWeight: "700" },
  pagination: {
    position: "absolute",
    right: 12,
    bottom: 0,
    maxWidth: "82%",
    height: 32,
  },
  dotTarget: {
    minHeight: 32,
    width: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,.6)",
  },
  dotActive: { width: 18, backgroundColor: "#F3B858" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(20,12,6,.65)",
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "85%",
    padding: 20,
    backgroundColor: "#FFFAF3",
    borderRadius: 24,
  },
});
