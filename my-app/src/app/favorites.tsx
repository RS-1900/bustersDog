import { FlatList, Text } from "react-native";
import { ProductCard } from "../components/ProductCard";
import { Page, Header, ui } from "../components/ShopUI";
import { useProductStore } from "../stores/useProductStore";
export default function FavoritesScreen() {
  const { products, favoriteIds, loading, catalogError, loadCatalog } =
    useProductStore((s) => s);
  return (
    <Page>
      <Header title="Favoritos" />
      <FlatList
        data={products.filter((p) => favoriteIds.includes(p.id))}
        numColumns={2}
        keyExtractor={(p) => p.id}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ padding: 20 }}
        refreshing={loading}
        onRefresh={() => void loadCatalog()}
        ListEmptyComponent={
          <Text style={ui.text}>
            {catalogError ||
              "Marca el corazón de un producto para encontrarlo aquí. Los productos agotados vuelven a aparecer cuando están disponibles."}
          </Text>
        }
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </Page>
  );
}
