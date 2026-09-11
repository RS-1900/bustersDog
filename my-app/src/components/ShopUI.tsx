import type { PropsWithChildren } from "react";
import { Text, View, Pressable, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useProductStore } from "../stores/useProductStore";

export function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
}: {
  title: string;
  onPress(): void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[ui.button, secondary && ui.secondary, disabled && ui.disabled]}
    >
      <Text style={ui.buttonText}>{title}</Text>
    </Pressable>
  );
}
export function Page({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={ui.safe}>
      <View style={ui.page}>{children}</View>
    </SafeAreaView>
  );
}
export function Header({ title }: { title?: string }) {
  const count = useProductStore((s) =>
    s.cart.reduce((n, i) => n + i.quantity, 0),
  );
  return (
    <View style={ui.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver al menú"
        onPress={() => router.replace("/products")}
        style={ui.nav}
      >
        <Text style={ui.link}>‹ Menú</Text>
      </Pressable>
      <View style={ui.brand}>
        <Image source={require("../../assets/buster.png")} style={ui.logo} />
        {title && <Text style={ui.heading}>{title}</Text>}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir carrito, ${count} unidades`}
        onPress={() => router.push("/checkout")}
        style={ui.nav}
      >
        <Text style={ui.link}>Carrito ({count})</Text>
      </Pressable>
    </View>
  );
}
export function Messages() {
  const error = useProductStore((s) => s.error);
  const notice = useProductStore((s) => s.notice);
  const storageError = useProductStore((s) => s.storageError);
  return (
    <>
      {(storageError || error) && (
        <Text accessibilityRole="alert" style={ui.error}>
          {storageError || error}
        </Text>
      )}
      {notice && (
        <Text accessibilityLiveRegion="polite" style={ui.notice}>
          {notice}
        </Text>
      )}
    </>
  );
}
export const ui = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  page: { flex: 1, width: "100%", maxWidth: 760, alignSelf: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#F1E9DE",
    gap: 6,
  },
  nav: { minHeight: 44, justifyContent: "center" },
  brand: { flex: 1, alignItems: "center" },
  logo: { width: 48, height: 48, resizeMode: "contain" },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#302314",
    textAlign: "center",
  },
  title: { fontSize: 26, fontWeight: "700", color: "#302314" },
  link: { color: "#8B4C08", fontWeight: "600", fontSize: 14 },
  content: { padding: 20, gap: 16, paddingBottom: 36 },
  text: { color: "#554C43", fontSize: 15, lineHeight: 22 },
  muted: { color: "#74695E", fontSize: 13, lineHeight: 20 },
  button: {
    backgroundColor: "#FFAE34",
    minHeight: 48,
    padding: 12,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#442803",
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
  },
  secondary: {
    backgroundColor: "#FFF2DD",
    borderWidth: 1,
    borderColor: "#E8CDAC",
  },
  disabled: { opacity: 0.45 },
  error: {
    color: "#992E24",
    backgroundColor: "#FFF0EC",
    padding: 12,
    borderRadius: 12,
    lineHeight: 21,
  },
  notice: {
    color: "#315827",
    backgroundColor: "#EDF6E9",
    padding: 12,
    borderRadius: 12,
    lineHeight: 21,
  },
  card: {
    backgroundColor: "#FFF8EF",
    padding: 16,
    borderRadius: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: "#F1E4D2",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    minHeight: 52,
    minWidth: 92,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D7CFC4",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  selected: {
    backgroundColor: "#FFE5B6",
    borderColor: "#AA5E09",
    borderWidth: 2,
  },
  price: { color: "#8B4C08", fontWeight: "700", fontSize: 22 },
});
