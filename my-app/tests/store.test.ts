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
