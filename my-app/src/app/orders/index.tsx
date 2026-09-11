import { ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { useProductStore } from "../../stores/useProductStore";
import { Page, Header, Button, ui } from "../../components/ShopUI";
import { cents, money, statusLabels } from "../../domain/cart";
export default function OrdersScreen() {
  const orders = useProductStore((s) => s.orders);
  return (
    <Page>
      <Header title="Mis pedidos" />
      <ScrollView contentContainerStyle={ui.content}>
        <Text style={ui.muted}>
          Pedidos guardados en este dispositivo. Abre uno para consultar su
          estado.
        </Text>
        {orders.map((order) => (
          <Button
            key={order.id}
            secondary
            title={`${order.folio} · ${statusLabels[order.status]} · ${money(cents(order.total))}`}
            onPress={() => router.push(`/orders/${order.id}`)}
          />
        ))}
        {!orders.length && (
          <Text style={ui.text}>Todavía no tienes pedidos confirmados.</Text>
        )}
      </ScrollView>
    </Page>
  );
}
