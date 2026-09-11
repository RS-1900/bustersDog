import { useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  View,
  Pressable,
  ActivityIndicator,
  ScrollView,
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
      <Header />
      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={(p) => p.id}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
        refreshing={loading}
        onRefresh={() => void loadCatalog()}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            <Text style={ui.heading}>Un buen día empieza con Buster’s</Text>
            <View style={ui.row}>
              <Button
                title="♡ Favoritos"
                secondary
                onPress={() => router.push("/favorites")}
              />
              <Button
                title="Mis pedidos"
                secondary
                onPress={() => router.push("/orders")}
              />
            </View>
            <TextInput
              accessibilityLabel="Buscar productos"
              placeholder="Buscar un producto…"
              value={search}
              onChangeText={setSearch}
              style={{
                padding: 14,
                borderRadius: 24,
                backgroundColor: "#F2F2F7",
                fontSize: 16,
                color: "#302314",
              }}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {[["", "Todos"], ...categories].map(([id, name]) => (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: category === id }}
                  onPress={() => setCategory(id)}
                  style={[ui.choice, category === id && ui.selected]}
                >
                  <Text style={ui.link}>{name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Messages />
            {catalogError && (
              <>
                <Text style={ui.error}>{catalogError}</Text>
                <Button
                  title="Actualizar catálogo"
                  onPress={() => void loadCatalog()}
                  disabled={loading}
                />
              </>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ margin: 40 }} color="#A7610C" />
          ) : (
            <Text style={[ui.text, { textAlign: "center", margin: 30 }]}>
              {catalogError
                ? "El catálogo no está disponible por el momento."
                : "No hay productos para esta búsqueda."}
            </Text>
          )
        }
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </Page>
  );
}
