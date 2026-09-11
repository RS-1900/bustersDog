import { useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  View,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Image,
} from "react-native";
import { router } from "expo-router";
import { ProductCard } from "../../components/ProductCard";
import { Page, Header, Messages, Button, ui } from "../../components/ShopUI";
import { useProductStore } from "../../stores/useProductStore";
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const categoryName = (name: string) =>
  ({ bebida: "Bebidas", platillo: "Platillos", snack: "Antojos" })[
    name.toLowerCase() as "bebida" | "platillo" | "snack"
  ] || name;
export default function ProductsScreen() {
  const { products, loading, catalogError, loadCatalog } = useProductStore(
    (s) => s,
  );
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const categories = Array.from(
    new Map(products.map((p) => [p.category_id, p.category])).entries(),
  );
  const filtered = products.filter(
    (p) =>
      (!category || p.category_id === category) &&
      normalize(p.name).includes(normalize(search)),
  );
  return (
    <Page>
      <Header home />
      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={(p) => p.id}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={() => void loadCatalog()}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.sections}>
            <View style={styles.hero}>
              <View pointerEvents="none" style={styles.ring} />
              <View pointerEvents="none" style={styles.smallCircle} />
              <Text style={styles.eyebrow}>TU PAUSA FAVORITA</Text>
              <Text style={styles.headline}>
                Un buen día empieza{"\n"}con Buster’s.
              </Text>
              <Text style={styles.subtitle}>
                Algo rico para acompañar tu día.
              </Text>
              <View style={styles.heroRule} />
              <Text style={styles.heroFoot}>
                Elige a tu gusto · Lo preparamos para ti
              </Text>
            </View>
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/favorites")}
                style={({ pressed }) => [
                  styles.shortcut,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.shortcutIcon}>♡</Text>
                <View>
                  <Text style={styles.shortcutTitle}>Favoritos</Text>
                  <Text style={styles.shortcutCaption}>Tus imperdibles</Text>
                </View>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/orders")}
                style={({ pressed }) => [
                  styles.shortcut,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.shortcutIcon}>≡</Text>
                <View>
                  <Text style={styles.shortcutTitle}>Mis pedidos</Text>
                  <Text style={styles.shortcutCaption}>Sigue tu antojo</Text>
                </View>
              </Pressable>
            </View>
            <View style={styles.search}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                accessibilityLabel="Buscar productos"
                placeholder="¿Qué se te antoja hoy?"
                placeholderTextColor="#867769"
                value={search}
                onChangeText={setSearch}
                style={styles.input}
              />
              {search.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Limpiar búsqueda"
                  onPress={() => setSearch("")}
                  style={styles.clear}
                >
                  <Text style={ui.link}>×</Text>
                </Pressable>
              )}
            </View>
            <View style={ui.row}>
              <Text style={styles.menuTitle}>Nuestro menú</Text>
              <Text style={ui.muted}>
                {products.length
                  ? `${filtered.length} opciones`
                  : "Hecho para tu pausa"}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabs}
            >
              {[["", "Todos"], ...categories].map(([id, name]) => (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: category === id }}
                  onPress={() => setCategory(id)}
                  style={[styles.tab, category === id && styles.tabSelected]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      category === id && styles.tabTextSelected,
                    ]}
                  >
                    {categoryName(name)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Messages />
            {catalogError && (
              <View style={styles.connection}>
                <Text style={styles.menuTitle}>Tu menú está en camino</Text>
                <Text style={ui.text}>
                  {catalogError.includes("configurado")
                    ? "Vuelve a abrir el proyecto actualizado desde Expo Go para conectar con la cafetería."
                    : "No pudimos cargar el menú. Comprueba tu conexión e intenta de nuevo."}
                </Text>
                <Button
                  title="Volver a intentar"
                  onPress={() => void loadCatalog()}
                  disabled={loading}
                />
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <ActivityIndicator color="#A7610C" />
              <Text style={ui.muted}>Preparando el menú…</Text>
            </View>
          ) : !catalogError ? (
            <View style={styles.empty}>
              <Text style={ui.heading}>No encontramos ese antojo</Text>
              <Text style={ui.muted}>
                Prueba otro nombre o una categoría diferente.
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>BUSTER’S · BEAGLE & BAGEL</Text>
            <Image
              accessibilityLabel="Universidad Tecmilenio"
              source={require("../../../assets/tecm.png")}
              resizeMode="contain"
              style={styles.university}
            />
          </View>
        }
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </Page>
  );
}
const styles = StyleSheet.create({
  list: { padding: 20, paddingTop: 12, paddingBottom: 0 },
  sections: { gap: 20 },
  hero: {
    borderRadius: 26,
    backgroundColor: "#FFF0D8",
    padding: 24,
    overflow: "hidden",
    gap: 10,
    borderWidth: 1,
    borderColor: "#F7DFC0",
  },
  eyebrow: {
    color: "#96601E",
    fontSize: 10,
    letterSpacing: 2.2,
    fontWeight: "700",
  },
  headline: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "800",
    color: "#493018",
    letterSpacing: -0.7,
  },
  subtitle: { color: "#775B40", fontSize: 14, lineHeight: 21 },
  heroRule: {
    width: 34,
    height: 3,
    backgroundColor: "#D98E29",
    borderRadius: 3,
    marginTop: 3,
  },
  heroFoot: { color: "#86613A", fontSize: 11, lineHeight: 18 },
  ring: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 26,
    borderColor: "#F9E0B7",
    right: -100,
    top: -60,
  },
  smallCircle: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FBE5C4",
    right: -35,
    bottom: -45,
  },
  actions: { flexDirection: "row", gap: 12 },
  shortcut: {
    flex: 1,
    minHeight: 74,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EFE1CF",
    backgroundColor: "#FFFCF7",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
  },
  pressed: { backgroundColor: "#FFF0D8" },
  shortcutIcon: { color: "#A96A20", fontSize: 26 },
  shortcutTitle: { color: "#513821", fontSize: 14, fontWeight: "700" },
  shortcutCaption: { color: "#8B7560", fontSize: 10, marginTop: 3 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "#F7F5F2",
    borderWidth: 1,
    borderColor: "#EEE9E2",
    paddingHorizontal: 14,
    gap: 9,
  },
  searchIcon: { fontSize: 30, color: "#8B7560" },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 15,
    fontSize: 14,
    color: "#302314",
  },
  clear: {
    width: 32,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTitle: { fontSize: 20, color: "#493018", fontWeight: "700" },
  tabs: { gap: 8 },
  tab: {
    paddingHorizontal: 19,
    minHeight: 44,
    borderRadius: 22,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8DED2",
    backgroundColor: "#FFFFFF",
  },
  tabSelected: { backgroundColor: "#694222", borderColor: "#694222" },
  tabText: { color: "#80644A", fontWeight: "600", fontSize: 13 },
  tabTextSelected: { color: "#FFFFFF" },
  connection: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: "#FFF8EF",
    borderWidth: 1,
    borderColor: "#F0D7BA",
    gap: 12,
  },
  empty: { paddingVertical: 40, alignItems: "center", gap: 12 },
  footer: { alignItems: "center", paddingTop: 35, gap: 14 },
  footerLine: { width: 36, height: 2, backgroundColor: "#ECD6B8" },
  footerText: { color: "#977653", fontSize: 9, letterSpacing: 1.8 },
  university: { width: 126, height: 100, marginTop: -12 },
});
