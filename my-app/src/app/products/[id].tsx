import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useProductStore } from "../../stores/useProductStore";
import {
  Page,
  Header,
  Messages,
  Button,
  ui,
  s,
} from "../../components/OrderUI";
import { ProductImage } from "../../components/ProductImage";
import { cents, money, selectionError } from "../../domain/cart";
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    products,
    favoriteIds,
    loading,
    loadCatalog,
    toggleFavorite,
    addToCart,
    pending,
    submitting,
    hydrated,
    storageError,
    clearMessage,
  } = useProductStore((s) => s);
  const [selectedId, setSelectedId] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  useEffect(() => {
    setSelectedId("");
    setOptions([]);
    clearMessage();
  }, [id, clearMessage]);
  const product = products.find((p) => p.id === id);
  if (!product)
    return (
      <Page>
        <Header />
        <View style={ui.content}>
          <Text style={ui.text}>
            {loading
              ? "Cargando producto…"
              : "Este producto no está disponible."}
          </Text>
          <Button
            title="Actualizar catálogo"
            onPress={() => void loadCatalog()}
            disabled={loading}
          />
        </View>
      </Page>
    );
  const productSoldOut =
    !product.available || !product.variants.some((item) => item.available);
  const variant =
    product.variants.find((v) => v.id === selectedId) ||
    (!selectedId && product.available
      ? product.variants.find((v) => v.available)
      : undefined);
  const invalid = selectionError(product, variant?.id || "", options);
  const extra = product.modifier_groups
    .flatMap((g) => g.options)
    .filter((o) => options.includes(o.id))
    .reduce((n, o) => n + cents(o.price), 0);
  const favorite = favoriteIds.includes(product.id);
  return (
    <Page>
      <Header />
      <ScrollView
        contentContainerStyle={[ui.content, { gap: 12, paddingBottom: 16 }]}
      >
        <View style={[s.hero, { padding: 16, gap: 8 }]}>
          <Text style={s.eyebrow}>HECHO PARA TU PAUSA</Text>
          <ProductImage
            uri={product.image}
            style={{
              width: "100%",
              height: 185,
              borderRadius: 28,
              backgroundColor: "#FFF8EF",
            }}
          />
          <Text style={ui.muted}>
            Preparado al momento · Recoge en cafetería
          </Text>
        </View>
        <View style={{ gap: 4 }}>
          <View style={ui.row}>
            <Text style={[ui.title, { flex: 1, fontSize: 24, lineHeight: 30 }]}>
              {product.name}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                favorite ? "Quitar de favoritos" : "Agregar a favoritos"
              }
              onPress={() => toggleFavorite(product.id)}
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 30, color: "#B31944" }}>
                {favorite ? "♥" : "♡"}
              </Text>
            </Pressable>
          </View>
          <Text style={[ui.muted, { fontWeight: "600" }]}>
            {product.category.trim().charAt(0).toLocaleUpperCase("es-MX") +
              product.category.trim().slice(1)}
          </Text>
          {product.description ? (
            <Text style={ui.text}>{product.description}</Text>
          ) : null}
        </View>
        {productSoldOut && (
          <View style={s.soldOutNotice}>
            <Text style={s.soldOutTitle}>AGOTADO</Text>
            <Text style={ui.muted}>
              Este producto sigue en el menú, pero no se puede pedir por ahora.
            </Text>
          </View>
        )}
        <View style={[ui.card, { padding: 16, gap: 8 }]}>
          <Text style={ui.heading}>Elige tu presentación</Text>
          <View style={ui.wrap}>
            {product.variants.map((v) => (
              <Pressable
                key={v.id}
                accessibilityRole="radio"
                accessibilityState={{
                  checked: variant?.id === v.id,
                  disabled: productSoldOut || !v.available,
                }}
                disabled={productSoldOut || !v.available}
                onPress={() => setSelectedId(v.id)}
                style={[
                  ui.choice,
                  variant?.id === v.id && ui.selected,
                  (productSoldOut || !v.available) && ui.disabled,
                ]}
              >
                <Text style={ui.link}>
                  {v.label}
                  {v.volume_ml ? ` · ${v.volume_ml} ml` : ""}
                </Text>
                <Text style={ui.text}>{money(cents(v.price))}</Text>
                {(productSoldOut || !v.available) && (
                  <Text style={ui.muted}>Agotado</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>
        {product.modifier_groups.map((group) => (
          <View key={group.id} style={[ui.card, { padding: 16, gap: 8 }]}>
            <Text style={ui.heading}>{group.name}</Text>
            <Text style={ui.muted}>
              {group.min_selections
                ? `Elige de ${group.min_selections} a ${group.max_selections}.`
                : `Opcional: hasta ${group.max_selections}.`}
            </Text>
            <View style={ui.wrap}>
              {group.options.map((option) => (
                <Pressable
                  key={option.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{
                    checked: options.includes(option.id),
                    disabled: !option.available,
                  }}
                  disabled={!option.available}
                  style={[
                    ui.choice,
                    options.includes(option.id) && ui.selected,
                    !option.available && ui.disabled,
                  ]}
                  onPress={() => {
                    setOptions((previous) => {
                      if (previous.includes(option.id))
                        return previous.filter((x) => x !== option.id);
                      if (group.max_selections === 1)
                        return [
                          ...previous.filter(
                            (x) => !group.options.some((o) => o.id === x),
                          ),
                          option.id,
                        ];
                      if (
                        previous.filter((x) =>
                          group.options.some((o) => o.id === x),
                        ).length >= group.max_selections
                      )
                        return previous;
                      return [...previous, option.id];
                    });
                  }}
                >
                  <Text style={ui.link}>
                    {options.includes(option.id) ? "✓ " : ""}
                    {option.name}
                  </Text>
                  <Text style={ui.muted}>+{money(cents(option.price))}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        <Messages />
        {invalid && !productSoldOut && <Text style={ui.muted}>{invalid}</Text>}
      </ScrollView>
      <View style={[s.dock, { paddingTop: 10, gap: 8 }]}>
        <View style={{ gap: 10 }}>
          <View style={{ gap: 4, minWidth: 0 }}>
            <Text style={s.eyebrow}>
              {productSoldOut ? "DISPONIBILIDAD" : "TU ELECCIÓN"}
            </Text>
            <Text
              style={{
                color: "#513821",
                fontSize: 20,
                lineHeight: 26,
                fontWeight: "700",
              }}
            >
              {productSoldOut
                ? "Agotado por ahora"
                : variant
                  ? money(cents(variant.price) + extra)
                  : "Elige una presentación"}
            </Text>
          </View>
          <Button
            title={productSoldOut ? "Producto agotado" : "Agregar al carrito +"}
            disabled={
              !variant ||
              !!invalid ||
              productSoldOut ||
              !!pending ||
              submitting ||
              !hydrated ||
              !!storageError
            }
            onPress={() => {
              if (!variant || productSoldOut || invalid) return;
              addToCart(product.id, variant.id, options);
            }}
          />
        </View>
        <Button
          title="Ver carrito"
          secondary
          onPress={() => router.push("/checkout")}
        />
      </View>
    </Page>
  );
}
