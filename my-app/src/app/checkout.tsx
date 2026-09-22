import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { useProductStore } from "../stores/useProductStore";
import {
  Page,
  Header,
  Messages,
  Button,
  ui,
  s,
  PickupCard,
} from "../components/OrderUI";
import { ProductImage } from "../components/ProductImage";
import { money, totalCents } from "../domain/cart";
import { ORDER_NOTES_MAX } from "../types/product";
export default function CheckoutScreen() {
  const {
    cart,
    orderNotes,
    setOrderNotes,
    cafeteria,
    cafeError,
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
      <ScrollView
        contentContainerStyle={ui.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={s.eyebrow}>TU PAUSA ESTÁ CASI LISTA</Text>
        <PickupCard />
        <Text style={ui.muted}>
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Quitar ${item.productName}`}
              disabled={locked}
              onPress={() => removeFromCart(item.key)}
              style={{
                minHeight: 44,
                justifyContent: "center",
                alignSelf: "flex-end",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "#8A6750",
                  textDecorationLine: "underline",
                }}
              >
                Quitar del pedido
              </Text>
            </Pressable>
          </View>
        ))}
        {!cart.length && <Text style={ui.text}>Tu carrito está vacío.</Text>}
        {(cart.length > 0 || pending) && (
          <View style={ui.card}>
            <Text style={styles.notesTitle}>
              Indicaciones especiales (opcional)
            </Text>
            <Text style={ui.muted}>
              Si la indicación es para un producto, menciona cuál.
            </Text>
            <TextInput
              accessibilityLabel="Indicaciones especiales del pedido"
              placeholder="Ej.: hot dog sin mostaza y hamburguesa sin cebolla."
              placeholderTextColor="#74695E"
              value={pending ? pending.body.notes || "" : orderNotes}
              onChangeText={setOrderNotes}
              editable={!locked}
              maxLength={ORDER_NOTES_MAX}
              multiline
              textAlignVertical="top"
              style={[styles.notesInput, locked && ui.disabled]}
            />
            <Text style={ui.muted}>
              {(pending ? pending.body.notes || "" : orderNotes).length}/
              {ORDER_NOTES_MAX} caracteres
            </Text>
          </View>
        )}
        <Messages />
        {pending && (
          <Text style={ui.notice}>
            Hay un envío pendiente de confirmación. Reintenta aquí para
            recuperar el mismo pedido sin duplicarlo. Conserva esta sesión hasta
            obtener el folio.
          </Text>
        )}
        <View style={ui.card}>
          <Text style={s.label}>Resumen del pedido</Text>
          <View style={ui.row}>
            <Text style={ui.muted}>
              Productos ({cart.reduce((n, i) => n + i.quantity, 0)})
            </Text>
            <Text style={ui.text}>{money(totalCents(cart))}</Text>
          </View>
          <View style={{ height: 1, backgroundColor: "#EFE7DC" }} />
          <View style={ui.row}>
            <Text style={ui.heading}>Total estimado</Text>
            <Text style={ui.title}>{money(totalCents(cart))}</Text>
          </View>
          <Text style={ui.muted}>
            El total se confirma con los precios vigentes de la cafetería al
            enviar el pedido.
          </Text>
        </View>
        <Button
          title="Seguir eligiendo"
          secondary
          onPress={() => router.replace("/products")}
        />
      </ScrollView>
      <View style={s.dock}>
        <Button
          title={
            submitting
              ? "Confirmando…"
              : pending
                ? "Confirmar pedido pendiente"
                : !cafeteria || cafeError
                  ? "Esperando estado de la cafetería"
                  : !cafeteria.is_open
                    ? "Cafetería cerrada"
                    : "Confirmar pedido"
          }
          disabled={
            submitting ||
            !hydrated ||
            !!storageError ||
            (!pending && (!cafeteria?.is_open || !!cafeError)) ||
            (!cart.length && !pending)
          }
          onPress={() => void confirm()}
        />
      </View>
    </Page>
  );
}
const styles = StyleSheet.create({
  notesTitle: { fontSize: 17, fontWeight: "700", color: "#302314" },
  notesInput: {
    minHeight: 110,
    padding: 12,
    borderWidth: 1,
    borderColor: "#D7CFC4",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    color: "#302314",
    fontSize: 16,
    lineHeight: 22,
  },
});
