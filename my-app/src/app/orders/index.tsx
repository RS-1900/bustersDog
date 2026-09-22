import { useState } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useProductStore } from "../../stores/useProductStore";
import { Page, Header, Button, ui, s, Progress } from "../../components/OrderUI";
import { cents, money, statusLabels } from "../../domain/cart";
export default function OrdersScreen() {
  const orders = useProductStore((s) => s.orders);
  const hydrated = useProductStore((s) => s.hydrated);
  const [filter, setFilter] = useState("Todos");
  const active = (status: string) =>
    ["new", "preparing", "ready"].includes(status);
  const sorted = [...orders].sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
  );
  const counts = {
    Todos: orders.length,
    Activos: orders.filter((o) => active(o.status)).length,
    Historial: orders.filter((o) => !active(o.status)).length,
  };
  const shown = sorted.filter(
    (o) =>
      filter === "Todos" ||
      (filter === "Activos" ? active(o.status) : !active(o.status)),
  );
  return (
    <Page>
      <Header title="Mis pedidos" />
      <ScrollView contentContainerStyle={ui.content}>
        <View style={s.folioCard}>
          <View pointerEvents="none" style={s.folioRing} />
          <View pointerEvents="none" style={s.folioCircle} />
          <Text style={s.eyebrow}>TUS PAUSAS EN BUSTER’S</Text>
          <Text style={styles.title}>Cada antojo,{"\n"}una buena pausa.</Text>
          <Text style={ui.text}>
            Aquí encuentras tus pedidos y sus detalles.
          </Text>
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {counts.Activos}{" "}
              {counts.Activos === 1 ? "pedido activo" : "pedidos activos"}
            </Text>
            <Text style={ui.muted}>Guardados en este dispositivo</Text>
          </View>
        </View>
        <View style={styles.filters}>
          {(Object.keys(counts) as (keyof typeof counts)[]).map((label) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === label }}
              onPress={() => setFilter(label)}
              style={[styles.filter, filter === label && styles.selected]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === label && { color: "#513821" },
                ]}
              >
                {label} · {counts[label]}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={ui.row}>
          <Text style={s.eyebrow}>
            {filter === "Activos"
              ? "EN MARCHA"
              : filter === "Historial"
                ? "TUS PAUSAS ANTERIORES"
                : "TUS PEDIDOS"}
          </Text>
          <Text style={ui.muted}>Más recientes primero</Text>
        </View>
        {shown.map((order) => {
          const tone =
            order.status === "cancelled"
              ? { backgroundColor: "#FBECE6", color: "#963F2D" }
              : order.status === "ready"
                ? { backgroundColor: "#ECF2E3", color: "#476031" }
                : order.status === "delivered"
                  ? { backgroundColor: "#F0ECE6", color: "#75634F" }
                  : { backgroundColor: "#FFF0D8", color: "#8A571E" };
          const quantity = order.items.reduce(
            (n, item) => n + item.quantity,
            0,
          );
          return (
            <Pressable
              key={order.id}
              accessibilityRole="button"
              accessibilityLabel={`Abrir pedido ${order.folio}, ${statusLabels[order.status]}, ${money(cents(order.total))}`}
              onPress={() => router.push(`/orders/${order.id}`)}
              style={({ pressed }) => [
                styles.card,
                pressed && { backgroundColor: "#FFFAF2" },
                order.status === "ready" && { borderColor: "#C9D6B7" },
              ]}
            >
              <View style={styles.top}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={s.eyebrow}>PEDIDO</Text>
                  <Text style={styles.folio}>{order.folio}</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: tone.backgroundColor },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: tone.color,
                    }}
                  >
                    {statusLabels[order.status]}
                  </Text>
                </View>
              </View>
              <Text style={ui.muted}>
                {new Date(order.created_at).toLocaleString("es-MX", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <View style={styles.products}>
                {order.items.slice(0, 2).map((item) => (
                  <Text key={item.id} style={ui.text} numberOfLines={1}>
                    <Text style={{ fontWeight: "700", color: "#8B4C08" }}>
                      {item.quantity} ×{" "}
                    </Text>
                    {item.product_name}
                  </Text>
                ))}
                {order.items.length > 2 && (
                  <Text style={ui.muted}>
                    + {order.items.length - 2} más en tu pedido
                  </Text>
                )}
              </View>
              {active(order.status) && <Progress status={order.status} />}
              <View style={styles.footer}>
                <View>
                  <Text style={ui.muted}>
                    {quantity} {quantity === 1 ? "unidad" : "unidades"}
                  </Text>
                  <Text style={styles.total}>{money(cents(order.total))}</Text>
                </View>
                <Text style={styles.detail}>
                  {active(order.status) ? "Seguir pedido" : "Ver detalle"} →
                </Text>
              </View>
            </Pressable>
          );
        })}
        {!shown.length && (
          <View
            style={[ui.card, { alignItems: "center", paddingVertical: 30 }]}
          >
            <View style={s.icon}>
              <Text style={{ fontSize: 26, color: "#96601E" }}>☕</Text>
            </View>
            <Text style={s.label}>
              {!hydrated
                ? "Recuperando tus pedidos…"
                : !orders.length
                  ? "Tu primera pausa te espera"
                  : filter === "Activos"
                    ? "Todo está al día"
                    : "Aquí quedarán tus pausas"}
            </Text>
            <Text style={[ui.muted, { textAlign: "center" }]}>
              {!hydrated
                ? "Un momento, por favor."
                : !orders.length
                  ? "Elige algo del menú. Cuando confirmes, tu pedido aparecerá aquí."
                  : filter === "Activos"
                    ? "No tienes pedidos activos en este dispositivo."
                    : "Los pedidos entregados o cancelados aparecerán en el historial."}
            </Text>
            {hydrated && (
              <Button
                title="Explorar el menú"
                onPress={() => router.replace("/products")}
              />
            )}
          </View>
        )}
        {!!shown.length && (
          <Text style={[ui.muted, { textAlign: "center", fontSize: 11 }]}>
            Abre un pedido para consultar su estado actualizado.
          </Text>
        )}
      </ScrollView>
    </Page>
  );
}
const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: "#493018",
    letterSpacing: -0.7,
  },
  summary: { gap: 5, marginTop: 8 },
  summaryText: { fontSize: 13, fontWeight: "700", color: "#8A571E" },
  filters: {
    flexDirection: "row",
    padding: 5,
    borderRadius: 18,
    backgroundColor: "#EEE7DD",
    gap: 4,
  },
  filter: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 3,
  },
  filterText: { fontSize: 12, fontWeight: "600", color: "#776A5C" },
  selected: { backgroundColor: "#FFF" },
  card: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EDE3D7",
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  folio: { fontSize: 23, fontWeight: "800", color: "#513821" },
  badge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  products: {
    backgroundColor: "#FAF7F2",
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  footer: {
    borderTopWidth: 1,
    borderColor: "#F0E9DF",
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  total: { fontSize: 22, fontWeight: "800", color: "#513821" },
  detail: { fontSize: 13, fontWeight: "700", color: "#9A601A" },
});
