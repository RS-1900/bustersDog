import { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, router } from "expo-router";
import { shopStore, useProductStore } from "../../stores/useProductStore";
import {
  Page,
  Header,
  Messages,
  Button,
  ui,
  s,
  Progress,
} from "../../components/OrderUI";
import { cents, money, statusLabels } from "../../domain/cart";
export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showCancellation, setShowCancellation] = useState(false);
  const {
    orders,
    hydrated,
    refreshOrder,
    cancelOrder,
    cancellingOrderId,
    clearMessage,
  } = useProductStore((s) => s);
  const order = orders.find((o) => o.id === id);
  useFocusEffect(
    useCallback(() => {
      if (!hydrated) return;
      clearMessage();
      const current = shopStore
        .getState()
        .orders.find((item) => item.id === id);
      if (current && !["delivered", "cancelled"].includes(current.status))
        void refreshOrder(id);
    }, [id, hydrated, refreshOrder, clearMessage]),
  );
  return (
    <Page>
      <Header title="Seguimiento" />
      <ScrollView
        contentContainerStyle={[ui.content, { gap: 12, paddingTop: 8 }]}
      >
        {!order ? (
          <Text style={ui.text}>
            {hydrated
              ? "Este pedido no está guardado en este dispositivo."
              : "Recuperando pedido…"}
          </Text>
        ) : (
          <>
            <View
              style={[
                s.folioCard,
                {
                  padding: 18,
                  gap: 8,
                },
              ]}
            >
              <View pointerEvents="none" style={s.folioRing} />
              <View pointerEvents="none" style={s.folioCircle} />
              <Text style={[s.eyebrow, { color: "#96601E" }]}>
                TU PEDIDO EN BUSTER’S
              </Text>
              <View style={styles.folioRow}>
                <Text
                  style={{
                    fontSize: 30,
                    fontWeight: "800",
                    color: "#493018",
                    letterSpacing: -0.7,
                  }}
                >
                  {order.folio}
                </Text>
                <Text
                  style={{ color: "#775B40", fontSize: 17, fontWeight: "600" }}
                >
                  {statusLabels[order.status]}
                </Text>
              </View>
              <Text style={{ color: "#86613A", fontSize: 12 }}>
                {new Date(order.created_at).toLocaleString("es-MX")}
              </Text>
            </View>
            <View style={[ui.card, styles.compactCard]}>
              <Text style={s.label}>
                {order.status === "ready"
                  ? "¡Ya puedes pasar por tu pedido!"
                  : order.status === "delivered"
                    ? "Gracias por compartir tu pausa"
                    : order.status === "cancelled"
                      ? "Pedido cancelado"
                      : "Nosotros nos encargamos"}
              </Text>
              <Text style={ui.muted}>
                {order.status === "ready"
                  ? "Muestra tu folio en la cafetería al recoger."
                  : order.status === "cancelled"
                    ? "La cancelación quedó registrada. Este pedido ya no será preparado."
                    : order.status === "delivered"
                      ? "Este pedido ya fue entregado."
                      : "Tu pausa está en marcha. Consulta aquí el estado de tu pedido."}
              </Text>
              <Progress status={order.status} />
              <Text style={styles.pickup}>Recoger en cafetería · Campus</Text>
            </View>
            <View style={[ui.card, styles.compactCard]}>
              <Text style={s.eyebrow}>LO QUE ELEGISTE</Text>
              {order.items.map((item) => (
                <View key={item.id} style={styles.item}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>
                      {item.quantity} × {item.product_name}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {money(cents(item.line_total))}
                    </Text>
                  </View>
                  <Text style={ui.muted}>
                    {item.presentation_label}
                    {item.volume_ml ? ` · ${item.volume_ml} ml` : ""}
                  </Text>
                  {item.options.map((option) => (
                    <Text key={option.option_id} style={ui.muted}>
                      {option.option_name}
                      {cents(option.price) > 0
                        ? ` (+${money(cents(option.price))} por unidad)`
                        : ""}
                    </Text>
                  ))}
                </View>
              ))}
              <View style={styles.folioRow}>
                <Text style={s.label}>Total confirmado</Text>
                <Text style={styles.total}>{money(cents(order.total))}</Text>
              </View>
            </View>
            {!!order.notes && (
              <View style={ui.card}>
                <Text style={ui.heading}>Indicaciones especiales</Text>
                <Text style={ui.text}>{order.notes}</Text>
              </View>
            )}
            <Text style={ui.muted}>
              Última consulta:{" "}
              {new Date(order.checkedAt).toLocaleString("es-MX")}
            </Text>
            <Messages />
            <Button
              title="Actualizar estado"
              secondary
              onPress={() => void refreshOrder(id)}
            />
            {order.status === "new" && (
              <Button
                title={
                  cancellingOrderId === order.id
                    ? "Cancelando pedido…"
                    : "Cancelar pedido"
                }
                danger
                disabled={cancellingOrderId === order.id}
                onPress={() => setShowCancellation(true)}
              />
            )}
          </>
        )}
        <Button
          title="Ver mis pedidos"
          secondary
          onPress={() => router.replace("/orders")}
        />
      </ScrollView>
      <Modal
        visible={showCancellation && order?.status === "new"}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowCancellation(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            accessibilityViewIsModal
            accessibilityLabel="Confirmar cancelación del pedido"
            style={styles.modalCard}
          >
            <View style={styles.modalMark}>
              <Text style={styles.modalMarkText}>!</Text>
            </View>
            <Text style={styles.modalEyebrow}>ANTES DE CANCELAR</Text>
            <Text style={styles.modalTitle}>¿Cancelamos este pedido?</Text>
            <Text style={styles.modalText}>
              Puedes cancelarlo mientras la cafetería todavía no haya comenzado
              a prepararlo.
            </Text>
            <View style={styles.modalNotice}>
              <Text style={styles.modalNoticeText}>
                El pedido quedará guardado en tu historial como cancelado.
              </Text>
            </View>
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowCancellation(false)}
                style={({ pressed }) => [
                  styles.keepButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.keepButtonText}>Conservar mi pedido</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setShowCancellation(false);
                  if (order) void cancelOrder(order.id);
                }}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.cancelButtonText}>Sí, cancelar pedido</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Page>
  );
}

const styles = StyleSheet.create({
  compactCard: { padding: 16, gap: 10, borderRadius: 22 },
  folioRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  pickup: {
    fontSize: 12,
    lineHeight: 18,
    color: "#86613A",
    borderTopWidth: 1,
    borderColor: "#EFE7DC",
    paddingTop: 8,
  },
  item: {
    gap: 3,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#EFE7DC",
  },
  itemHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 8,
  },
  itemName: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "65%",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: "#513821",
  },
  itemPrice: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: "#633600",
  },
  total: { fontSize: 22, lineHeight: 28, fontWeight: "800", color: "#493018" },
  modalBackdrop: {
    flex: 1,
    padding: 24,
    backgroundColor: "rgba(42, 31, 22, 0.62)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    padding: 24,
    borderRadius: 28,
    backgroundColor: "#FFF9F1",
    borderWidth: 1,
    borderColor: "#EBCFAE",
    alignItems: "center",
    shadowColor: "#2E1A0D",
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  modalMark: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginBottom: 15,
    backgroundColor: "#F7DFC0",
    borderWidth: 1,
    borderColor: "#E7BF8C",
    alignItems: "center",
    justifyContent: "center",
  },
  modalMarkText: { color: "#8A571E", fontSize: 27, fontWeight: "900" },
  modalEyebrow: {
    color: "#A66A25",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginBottom: 7,
  },
  modalTitle: {
    color: "#493018",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    textAlign: "center",
  },
  modalText: {
    color: "#725C47",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
  },
  modalNotice: {
    width: "100%",
    marginTop: 18,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "#FFF0D8",
  },
  modalNoticeText: {
    color: "#7B542A",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  modalActions: { width: "100%", gap: 10, marginTop: 20 },
  keepButton: {
    minHeight: 50,
    borderRadius: 25,
    backgroundColor: "#6A4222",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  keepButtonText: { color: "#FFF", fontSize: 15, fontWeight: "800" },
  cancelButton: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: "#FFF0EC",
    borderWidth: 1,
    borderColor: "#E0B4AA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  cancelButtonText: { color: "#9A392C", fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.78 },
});
