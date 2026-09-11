import { useCallback } from "react";
import { AppState, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, router } from "expo-router";
import { useProductStore, shopStore } from "../../stores/useProductStore";
import { Page, Header, Messages, Button, ui } from "../../components/ShopUI";
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
            <View style={ui.card}>
              <Text style={ui.muted}>TU FOLIO</Text>
              <Text style={ui.title}>{order.folio}</Text>
              <Text style={ui.heading}>{statusLabels[order.status]}</Text>
              <Text style={ui.muted}>
                {new Date(order.created_at).toLocaleString("es-MX")}
              </Text>
            </View>
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
