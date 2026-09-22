import { test } from "node:test";
import assert from "node:assert/strict";
import { harness } from "./fixtures";
import { ApiError } from "../src/services/api-client";
async function ready(h: ReturnType<typeof harness>) {
  const s = h.make();
  await s.getState().hydrate();
  await s.getState().loadCatalog();
  s.getState().addToCart(h.p.id, h.p.variants[0].id, []);
  return s;
}
test("indicaciones se conservan al reiniciar y se limpian al confirmar", async () => {
  const h = harness();
  const first = await ready(h);
  first.getState().setOrderNotes("  Hot dog sin mostaza\nSin cebolla  ");
  // Esperar la cola de almacenamiento simulada antes de abrir otra instancia.
  await new Promise((resolve) => setTimeout(resolve, 0));
  const restored = h.make();
  await restored.getState().hydrate();
  assert.equal(
    restored.getState().orderNotes,
    "  Hot dog sin mostaza\nSin cebolla  ",
  );
  await restored.getState().submitOrder();
  assert.equal(
    (h.calls[0].body as { notes: string }).notes,
    "Hot dog sin mostaza\nSin cebolla",
  );
  assert.equal(restored.getState().orderNotes, "");
  assert.equal(JSON.parse(h.raw()!).orderNotes, "");
});
test("indicaciones de un envío incierto no se pueden editar ni cambiar al reintentar", async () => {
  const h = harness();
  const original = h.deps.api.createOrder;
  h.deps.api.createOrder = async (...args) => {
    await original(...args);
    throw new ApiError("Sin conexión");
  };
  const s = await ready(h);
  s.getState().setOrderNotes("Sin mostaza");
  await s.getState().submitOrder();
  s.getState().setOrderNotes("Con mostaza");
  assert.equal(s.getState().orderNotes, "Sin mostaza");
  const restored = h.make();
  await restored.getState().hydrate();
  h.deps.api.createOrder = original;
  await restored.getState().submitOrder();
  assert.deepEqual(h.calls[0], h.calls[1]);
  assert.equal((h.calls[1].body as { notes: string }).notes, "Sin mostaza");
});
test("indicaciones respetan el límite y se conservan al rechazar un pedido", async () => {
  const h = harness();
  const s = await ready(h);
  s.getState().setOrderNotes("x".repeat(500));
  s.getState().setOrderNotes("x".repeat(501));
  assert.equal(s.getState().orderNotes.length, 500);
  assert.match(s.getState().error!, /500/);
  s.getState().setOrderNotes("Sin mostaza");
  h.deps.api.createOrder = async () => {
    throw new ApiError("Cerrada", 409, 0, "CAFE_CLOSED");
  };
  await s.getState().submitOrder();
  assert.equal(s.getState().orderNotes, "Sin mostaza");
  assert.equal(s.getState().pending, null);
});
test("carritos anteriores sin indicaciones se recuperan sin errores", async () => {
  const h = harness();
  const s = await ready(h);
  await new Promise((resolve) => setTimeout(resolve, 0));
  const old = JSON.parse(h.raw()!);
  delete old.orderNotes;
  h.setRaw(JSON.stringify(old));
  const restored = h.make();
  await restored.getState().hydrate();
  assert.equal(restored.getState().orderNotes, "");
  assert.equal(restored.getState().storageError, null);
  assert.equal(restored.getState().cart.length, s.getState().cart.length);
});
test("persiste antes del envío; un doble toque crea una sola compra", async () => {
  const h = harness();
  const original = h.deps.api.createOrder;
  h.deps.api.createOrder = async (...args) => {
    assert.equal(JSON.parse(h.raw()!).pending.key, args[2]);
    return original(...args);
  };
  const s = await ready(h);
  const result = await Promise.all([
    s.getState().submitOrder(),
    s.getState().submitOrder(),
  ]);
  assert.equal(h.calls.length, 1);
  assert.equal(result.filter(Boolean).length, 1);
  assert.equal(s.getState().cart.length, 0);
  assert.equal(s.getState().orders[0].folio, "B-123");
  assert.deepEqual(Object.keys(h.calls[0].body as object), ["items"]);
});
test("respuesta perdida, reinicio y reintento conservan sesión, clave y cuerpo", async () => {
  const h = harness();
  const original = h.deps.api.createOrder;
  h.deps.api.createOrder = async (...args) => {
    await original(...args);
    throw new ApiError("Sin conexión");
  };
  const first = await ready(h);
  await first.getState().submitOrder();
  assert.ok(first.getState().pending);
  assert.equal(
    first.getState().addToCart(h.p.id, h.p.variants[1].id, []),
    false,
  );
  h.deps.api.createOrder = original;
  const restored = h.make();
  await restored.getState().hydrate();
  await restored.getState().submitOrder();
  assert.deepEqual(h.calls[0], h.calls[1]);
  assert.equal(restored.getState().pending, null);
  assert.equal(restored.getState().orders.length, 1);
});
test("sin almacenamiento durable no se envía ningún pedido", async () => {
  const h = harness();
  const s = await ready(h);
  h.deps.storage.write = async () => {
    throw new Error("Disco lleno");
  };
  await s.getState().submitOrder();
  assert.equal(h.calls.length, 0);
  assert.ok(s.getState().storageError);
});
test("cambio de precio exige volver a confirmar; no añade impuestos", async () => {
  const h = harness();
  const s = await ready(h);
  h.p.variants[0].price = "40.00";
  await s.getState().submitOrder();
  assert.equal(h.calls.length, 0);
  assert.match(s.getState().notice!, /Cambió un precio/);
  assert.equal(s.getState().cart[0].unitCents, 4000);
  await s.getState().submitOrder();
  assert.equal(h.calls.length, 1);
});
test("producto agotado bloquea el envío; rechazo definitivo libera carrito", async () => {
  const h = harness();
  const s = await ready(h);
  h.p.available = false;
  await s.getState().submitOrder();
  assert.equal(h.calls.length, 0);
  h.p.available = true;
  h.deps.api.createOrder = async () => {
    throw new ApiError("Agotado", 409, 0, "ORDER_REJECTED");
  };
  await s.getState().submitOrder();
  assert.equal(s.getState().pending, null);
  assert.equal(s.getState().cart.length, 1);
});
test("conflicto de clave o error temporal conserva el envío original", async () => {
  for (const status of [409, 429, 500, 502]) {
    const h = harness();
    h.deps.api.createOrder = async () => {
      throw new ApiError("Temporal", status);
    };
    const s = await ready(h);
    await s.getState().submitOrder();
    assert.ok(s.getState().pending);
    assert.equal(s.getState().cart.length, 1);
  }
});
test("sesión perdida no se reemplaza si existe un pedido pendiente", async () => {
  const h = harness();
  h.deps.api.createOrder = async () => {
    throw new ApiError("Sin conexión");
  };
  const s = await ready(h);
  await s.getState().submitOrder();
  h.deps.vault.read = async () => null;
  h.deps.api.createSession = async () => {
    throw new Error("No debe crear sesión");
  };
  await s.getState().submitOrder();
  assert.match(s.getState().error!, /sesión del pedido pendiente/);
  assert.ok(s.getState().pending);
});
test("datos locales inválidos bloquean nuevas compras sin borrar el original", async () => {
  const h = harness();
  h.setRaw("{datos corruptos");
  const s = h.make();
  await s.getState().hydrate();
  await s.getState().submitOrder();
  assert.ok(s.getState().storageError);
  assert.equal(h.raw(), "{datos corruptos");
  assert.equal(h.calls.length, 0);
});

test("cerrada permite catálogo y carrito, bloquea pedidos y reabrir permite confirmar", async () => {
  const h = harness();
  h.cafeteria.is_open = false;
  const s = await ready(h);
  assert.equal(s.getState().products.length, 1);
  assert.equal(s.getState().cart.length, 1);
  s.getState().changeQuantity(s.getState().cart[0].key, 1);
  await s.getState().submitOrder();
  assert.equal(h.calls.length, 0);
  assert.equal(s.getState().pending, null);
  assert.equal(s.getState().cart[0].quantity, 2);
  assert.match(s.getState().error!, /cerrada/);
  h.cafeteria.is_open = true;
  await s.getState().refreshCafeStatus();
  await s.getState().submitOrder();
  assert.equal(h.calls.length, 1);
});

test("cierre entre validar y enviar libera pendiente sin borrar el carrito", async () => {
  const h = harness();
  const s = await ready(h);
  h.deps.api.createOrder = async () => {
    h.cafeteria.is_open = false;
    throw new ApiError("La cafetería está cerrada", 409, 0, "CAFE_CLOSED");
  };
  await s.getState().submitOrder();
  assert.equal(s.getState().pending, null);
  assert.equal(s.getState().cart.length, 1);
  assert.equal(JSON.parse(h.raw()!).cart.length, 1);
  assert.equal(JSON.parse(h.raw()!).pending, null);
  assert.equal(s.getState().cafeteria?.is_open, false);
});

test("un pedido con respuesta perdida puede recuperarse después del cierre", async () => {
  const h = harness();
  const original = h.deps.api.createOrder;
  h.deps.api.createOrder = async (...args) => {
    await original(...args);
    throw new ApiError("Respuesta perdida");
  };
  const s = await ready(h);
  await s.getState().submitOrder();
  h.cafeteria.is_open = false;
  await s.getState().refreshCafeStatus();
  h.deps.api.createOrder = original;
  const recovered = await s.getState().submitOrder();
  assert.equal(recovered?.id, h.order.id);
  assert.deepEqual(h.calls[0], h.calls[1]);
  assert.equal(s.getState().pending, null);
});

test("fallo al consultar estado se informa y una respuesta antigua no revierte un cierre", async () => {
  const h = harness();
  const s = await ready(h);
  h.deps.api.cafeStatus = async () => {
    throw new Error("Sin conexión");
  };
  await s.getState().refreshCafeStatus();
  assert.match(s.getState().cafeError!, /comprobar/);
  const newer = {
    is_open: false,
    updated_at: new Date(Date.now() + 10000).toISOString(),
  };
  h.deps.api.cafeStatus = async () => newer;
  await s.getState().refreshCafeStatus();
  assert.equal(s.getState().cafeError, null);
  await s.getState().loadCatalog();
  assert.equal(s.getState().cafeteria?.is_open, false);
});
