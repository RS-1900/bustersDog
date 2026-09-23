import { Text, View, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import type { Product } from "../types/product";
import { useProductStore } from "../stores/useProductStore";
import { ProductImage } from "./ProductImage";
import { cents, money } from "../domain/cart";
export function ProductCard({ product }: { product: Product }) {
  const favorite = useProductStore((s) => s.favoriteIds.includes(product.id));
  const toggle = useProductStore((s) => s.toggleFavorite);
  const availableVariants = product.variants.filter(
    (variant) => variant.available,
  );
  const soldOut = !product.available || availableVariants.length === 0;
  const displayPrice = availableVariants.length
    ? Math.min(...availableVariants.map((variant) => cents(variant.price)))
    : cents(product.price);
  return (
    <View style={[styles.wrapper, soldOut && styles.soldOutWrapper]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver ${product.name}`}
        onPress={() => router.push(`/products/${product.id}`)}
        style={[styles.card, soldOut && styles.soldOutCard]}
      >
        <ProductImage uri={product.image} style={styles.image} />
        {soldOut && <Text style={styles.soldOutBadge}>AGOTADO</Text>}
        <Text style={styles.category}>
          {product.category === "bebida"
            ? "BEBIDA"
            : product.category === "platillo"
              ? "PLATILLO"
              : "ANTOJO"}
        </Text>
        <Text style={styles.name} numberOfLines={3}>
          {product.name}
        </Text>
        <Text style={styles.price}>
          {availableVariants.length > 1 ? "Desde " : ""}
          {money(displayPrice)}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${favorite ? "Quitar de" : "Agregar a"} favoritos: ${product.name}`}
        accessibilityState={{ selected: favorite }}
        onPress={() => toggle(product.id)}
        style={styles.heart}
      >
        <Text style={{ color: favorite ? "#B31944" : "#713C09", fontSize: 26 }}>
          {favorite ? "♥" : "♡"}
        </Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: { width: "47.5%", marginTop: 48, marginBottom: 8 },
  soldOutWrapper: { opacity: 0.72 },
  card: {
    backgroundColor: "#FFD18B",
    borderWidth: 1,
    borderColor: "#F2BF73",
    borderRadius: 25,
    padding: 12,
    paddingTop: 78,
    paddingBottom: 44,
    height: 224,
    alignItems: "center",
  },
  soldOutCard: { backgroundColor: "#E8DED2", borderColor: "#D5C8BA" },
  image: {
    width: 112,
    height: 112,
    borderRadius: 56,
    position: "absolute",
    top: -44,
    borderWidth: 3,
    borderColor: "#FFF",
    backgroundColor: "#FFF8EF",
  },
  name: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
    color: "#302314",
    minHeight: 54,
    lineHeight: 19,
  },
  category: {
    color: "#936126",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 7,
  },
  price: {
    color: "#633600",
    fontSize: 15,
    fontWeight: "700",
    marginTop: "auto",
    textAlign: "center",
  },
  soldOutBadge: {
    position: "absolute",
    top: 12,
    right: 10,
    backgroundColor: "#694222",
    color: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    overflow: "hidden",
  },
  heart: {
    position: "absolute",
    bottom: 2,
    right: 6,
    width: 44,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
});
