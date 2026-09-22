import { useCallback } from "react";
import { AppState, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, router } from "expo-router";
import { useProductStore, shopStore } from "../../stores/useProductStore";
import {
  Page,
  Header,
  Messages,
  Button,
  ui,
  s,
  Progress,
  PickupCard,
} from "../../components/OrderUI";
import { cents, money, statusLabels } from "../../domain/cart";
export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, hydrated, refreshOrder, clearMessage } = useProductStore(
    (s) => s,
  );
  const order = orders.find((o) => o.id === id);
  useFocusEffect(
    useCallback(() => {
      if (!hydrated) return;
      clearMessage();
      function update() {
        const current = shopStore.getState().orders.find((o) => o.id === id);
        if (
          current &&
          AppState.currentState === "active" &&
          !["delivered", "cancelled"].includes(current.status)
        )
          void refreshOrder(id);
      }
      update();
      const timer = setInterval(update, 15000);
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") update();
      });
      return () => {
        clearInterval(timer);
        subscription.remove();
      };
    }, [id, hydrated, refreshOrder, clearMessage]),
  );
  return (
    <Page>
      <Header title="Seguimiento" />
      <ScrollView contentContainerStyle={ui.content}>
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
                  paddingVertical: 28,
                },
              ]}
            >
              <View pointerEvents="none" style={s.folioRing} />
              <View pointerEvents="none" style={s.folioCircle} />
              <Text style={[s.eyebrow, { color: "#96601E" }]}>
                TU PEDIDO EN BUSTER’S
              </Text>
              <Text
                style={{
                  fontSize: 38,
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
              <View
                style={{
                  width: 34,
                  height: 3,
                  backgroundColor: "#D98E29",
                  borderRadius: 3,
                }}
              />
              <Text style={{ color: "#86613A", fontSize: 12 }}>
                {new Date(order.created_at).toLocaleString("es-MX")}
              </Text>
            </View>
            <View style={ui.card}>
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
                  : "Tu pausa está en marcha. Consulta aquí el estado de tu pedido."}
              </Text>
              <Progress status={order.status} />
            </View>
            <PickupCard />
            <Text style={s.eyebrow}>LO QUE ELEGISTE</Text>
            {order.items.map((item) => (
              <View key={item.id} style={ui.card}>
                <Text style={ui.heading}>
                  {item.quantity} × {item.product_name}
                </Text>
                <Text style={ui.text}>
                  {item.presentation_label}
                  {item.volume_ml ? ` · ${item.volume_ml} ml` : ""}
                </Text>
                {item.options.map((option) => (
                  <Text key={option.option_id} style={ui.muted}>
                    {option.option_name} (+{money(cents(option.price))} por
                    unidad)
                  </Text>
                ))}
                <Text style={ui.text}>{money(cents(item.line_total))}</Text>
              </View>
            ))}
            <View style={ui.row}>
              <Text style={ui.heading}>Total confirmado</Text>
              <Text style={ui.title}>{money(cents(order.total))}</Text>
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
          </>
        )}
        <Button
          title="Ver mis pedidos"
          secondary
          onPress={() => router.replace("/orders")}
        />
      </ScrollView>
    </Page>
  );
}
