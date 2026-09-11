import { ScrollView, View, Text } from "react-native";
import { router } from "expo-router";
import { useProductStore } from "../stores/useProductStore";
import { Page, Header, Messages, Button, ui } from "../components/ShopUI";
import { ProductImage } from "../components/ProductImage";
import { money, totalCents } from "../domain/cart";
export default function CheckoutScreen() {
  const {
    cart,
    pending,
    submitting,
    hydrated,
    storageError,
    changeQuantity,
    removeFromCart,
    submitOrder,
  } = useProductStore((s) => s);
  const locked = !!pending || submitting || !hydrated || !!storageError;
  async function confirm() {
    const order = await submitOrder();
    if (order) router.replace(`/orders/${order.id}`);
  }
  return (
    <Page>
      <Header title="Tu pedido" />
      <ScrollView contentContainerStyle={ui.content}>
        <Text style={ui.text}>
          Hasta 3 productos distintos y 3 unidades por producto, sumando tamaños
          y complementos.
        </Text>
        {cart.map((item) => (
          <View key={item.key} style={ui.card}>
            <View style={ui.row}>
              <ProductImage
                uri={item.image}
                style={{ width: 64, height: 64, borderRadius: 16 }}
              />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[ui.heading, { textAlign: "left", fontSize: 17 }]}>
                  {item.productName}
                </Text>
                <Text style={ui.muted}>
                  {item.presentationLabel}
                  {item.volumeMl ? ` · ${item.volumeMl} ml` : ""}
                </Text>
                {item.optionNames.length > 0 && (
                  <Text style={ui.muted}>{item.optionNames.join(", ")}</Text>
                )}
                <Text style={ui.muted}>{money(item.unitCents)} por unidad</Text>
              </View>
            </View>
            <View style={ui.row}>
              <View style={ui.row}>
                <Button
                  title="−"
                  secondary
                  disabled={locked}
                  onPress={() => changeQuantity(item.key, -1)}
                />
                <Text
                  accessibilityLabel={`Cantidad: ${item.quantity}`}
                  style={ui.heading}
                >
                  {item.quantity}
                </Text>
                <Button
                  title="+"
                  secondary
                  disabled={locked}
                  onPress={() => changeQuantity(item.key, 1)}
                />
              </View>
              <Text style={ui.heading}>
                {money(item.unitCents * item.quantity)}
              </Text>
            </View>
            <Button
              title="Quitar producto"
              secondary
              disabled={locked}
              onPress={() => removeFromCart(item.key)}
            />
          </View>
        ))}
        {!cart.length && <Text style={ui.text}>Tu carrito está vacío.</Text>}
        <Messages />
        {pending && (
          <Text style={ui.notice}>
            Hay un envío pendiente de confirmación. Reintenta aquí para
            recuperar el mismo pedido sin duplicarlo. Conserva esta sesión hasta
            obtener el folio.
          </Text>
        )}
        <View style={ui.row}>
          <Text style={ui.heading}>Total estimado</Text>
          <Text style={ui.title}>{money(totalCents(cart))}</Text>
        </View>
        <Text style={ui.muted}>
          El total se confirma con los precios vigentes de la cafetería al
          enviar el pedido.
        </Text>
        <Button
          title={
            submitting
              ? "Confirmando…"
              : pending
                ? "Confirmar pedido pendiente"
                : "Confirmar pedido"
          }
          disabled={
            submitting ||
            !hydrated ||
            !!storageError ||
            (!cart.length && !pending)
          }
          onPress={() => void confirm()}
        />
        <Button
          title="Seguir eligiendo"
          secondary
          onPress={() => router.replace("/products")}
        />
        <Button
          title="Mis pedidos"
          secondary
          onPress={() => router.push("/orders")}
        />
      </ScrollView>
    </Page>
  );
}
