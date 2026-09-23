import type { PropsWithChildren } from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ui as base, Messages, Button, CafeStatusBanner } from "./ShopUI";
export { Messages, Button };
export function Page({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F3ED" }}>
      <View
        style={{ flex: 1, width: "100%", maxWidth: 620, alignSelf: "center" }}
      >
        <CafeStatusBanner />
        {children}
      </View>
    </SafeAreaView>
  );
}
export function Header({ title = "A tu gusto" }: { title?: string }) {
  return (
    <View style={s.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver al menú"
        onPress={() => router.replace("/products")}
        style={s.back}
      >
        <Text style={s.backIcon}>←</Text>
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={s.brand}>Buster’s</Text>
        <Text style={s.caption}>{title}</Text>
      </View>
      <Image
        source={require("../../assets/buster.png")}
        style={{ width: 46, height: 46 }}
      />
    </View>
  );
}
export function PickupCard() {
  return (
    <View
      style={[s.card, { flexDirection: "row", alignItems: "center", gap: 14 }]}
    >
      <View style={s.icon}>
        <Text style={{ fontSize: 23 }}>☕</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.label}>Recoger en cafetería</Text>
        <Text style={base.muted}>Tu pausa favorita, aquí en el campus.</Text>
      </View>
      <Text style={{ color: "#8B4C08", fontSize: 20 }}>✓</Text>
    </View>
  );
}
export function Progress({ status }: { status: string }) {
  const labels = ["Recibido", "Preparando", "Listo", "Entregado"];
  const current = ["new", "preparing", "ready", "delivered"].indexOf(status);
  if (current < 0)
    return <Text style={base.error}>Este pedido fue cancelado.</Text>;
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 5 }}>
        {labels.map((l, i) => (
          <View
            key={l}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 4,
              backgroundColor: i <= current ? "#E39B32" : "#EAE2D7",
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row" }}>
        {labels.map((l, i) => (
          <Text
            key={l}
            style={{
              flex: 1,
              fontSize: 11,
              fontWeight: i === current ? "800" : "400",
              color: i <= current ? "#754A20" : "#82786D",
              textAlign: "center",
            }}
          >
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}
export const s = StyleSheet.create({
  folioCard: {
    borderRadius: 26,
    backgroundColor: "#FFF0D8",
    padding: 24,
    overflow: "hidden",
    gap: 12,
    borderWidth: 1,
    borderColor: "#F7DFC0",
  },
  folioRing: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 26,
    borderColor: "#F9E0B7",
    right: -100,
    top: -60,
  },
  folioCircle: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FBE5C4",
    right: -35,
    bottom: -45,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 14,
    gap: 12,
  },
  back: {
    height: 44,
    width: 44,
    borderRadius: 16,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 22,
    lineHeight: 24,
    color: "#513821",
    fontWeight: "700",
  },
  brand: {
    fontSize: 24,
    fontWeight: "800",
    color: "#513821",
    letterSpacing: -0.7,
  },
  caption: { fontSize: 12, color: "#8A755F", marginTop: 2 },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: "#EFE7DC",
  },
  label: { fontSize: 16, fontWeight: "700", color: "#513821" },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FFF1D9",
    alignItems: "center",
    justifyContent: "center",
  },
  dock: {
    backgroundColor: "#FFF",
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 12,
    borderTopWidth: 1,
    borderColor: "#EBE2D7",
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.8,
    color: "#977148",
    fontWeight: "700",
  },
  hero: {
    backgroundColor: "#F1DEC2",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  soldOutNotice: {
    backgroundColor: "#F2E8DC",
    borderColor: "#D7C4AE",
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 5,
  },
  soldOutTitle: {
    color: "#694222",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
});
export const ui = {
  ...base,
  card: s.card,
  content: { padding: 20, gap: 16, paddingBottom: 24 },
  heading: { ...base.heading, textAlign: "left" as const, fontSize: 18 },
  title: { ...base.title, fontSize: 28 },
  choice: {
    ...base.choice,
    borderRadius: 16,
    borderColor: "#E8DFD3",
    minWidth: 96,
  },
  selected: {
    ...base.selected,
    backgroundColor: "#FFF0D7",
    borderColor: "#CF8B2B",
  },
};
