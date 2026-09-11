import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useProductStore } from "../../stores/useProductStore";
import { Page, Header, Messages, Button, ui } from "../../components/ShopUI";
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
  const variant =
    product.variants.find((v) => v.id === selectedId) ||
    (!selectedId ? product.variants.find((v) => v.available) : undefined);
  const invalid = selectionError(product, variant?.id || "", options);
  const extra = product.modifier_groups
    .flatMap((g) => g.options)
    .filter((o) => options.includes(o.id))
    .reduce((n, o) => n + cents(o.price), 0);
  const favorite = favoriteIds.includes(product.id);
  return (
    <Page>
      <Header />
      <ScrollView contentContainerStyle={ui.content}>
        <ProductImage
          uri={product.image}
          style={{
            width: "100%",
            height: 240,
            borderRadius: 28,
            backgroundColor: "#FFF8EF",
          }}
        />
        <View style={ui.row}>
          <Text style={[ui.title, { flex: 1 }]}>{product.name}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              favorite ? "Quitar de favoritos" : "Agregar a favoritos"
            }
            onPress={() => toggleFavorite(product.id)}
            style={{ padding: 12 }}
          >
            <Text style={{ fontSize: 30, color: "#B31944" }}>
              {favorite ? "♥" : "♡"}
            </Text>
          </Pressable>
        </View>
        <Text style={ui.muted}>{product.category}</Text>
        <Text style={ui.text}>{product.description}</Text>
        <View style={ui.card}>
          <Text style={ui.heading}>Elige tu presentación</Text>
          <View style={ui.wrap}>
            {product.variants.map((v) => (
              <Pressable
                key={v.id}
                accessibilityRole="radio"
                accessibilityState={{
                  checked: variant?.id === v.id,
                  disabled: !v.available,
                }}
                disabled={!v.available}
                onPress={() => setSelectedId(v.id)}
                style={[
                  ui.choice,
                  variant?.id === v.id && ui.selected,
                  !v.available && ui.disabled,
                ]}
              >
                <Text style={ui.link}>
                  {v.label}
                  {v.volume_ml ? ` · ${v.volume_ml} ml` : ""}
                </Text>
                <Text style={ui.text}>{money(cents(v.price))}</Text>
                {!v.available && <Text style={ui.muted}>Agotado</Text>}
              </Pressable>
            ))}
          </View>
        </View>
        {product.modifier_groups.map((group) => (
          <View key={group.id} style={ui.card}>
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
        {invalid && <Text style={ui.muted}>{invalid}</Text>}
        <View style={ui.row}>
          <Text style={ui.title}>
            {variant
              ? money(cents(variant.price) + extra)
              : "Sin disponibilidad"}
          </Text>
          <Button
            title="Agregar"
            disabled={
              !!invalid ||
              !!pending ||
              submitting ||
              !hydrated ||
              !!storageError
            }
            onPress={() => addToCart(product.id, variant!.id, options)}
          />
        </View>
        <Button
          title="Ver carrito"
          secondary
          onPress={() => router.push("/checkout")}
        />
      </ScrollView>
    </Page>
  );
}
