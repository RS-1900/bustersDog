import assert from "node:assert/strict";
import { test } from "node:test";
import { createPromotionsClient } from "../src/services/promotions-client";
import { createPromotionsStore } from "../src/stores/createPromotionsStore";
import { welcomePromotion } from "../src/types/promotion";

test("promociones: lectura pública sin cookies, orden conservado y solo anuncios activos", async () => {
  const client = createPromotionsClient("https://example.test", (async (
    url,
    init,
  ) => {
    assert.equal(url, "https://example.test/api/v1/promociones");
    assert.equal(init?.credentials, "omit");
    assert.equal(init?.headers, undefined);
    return Response.json({
      items: [
        welcomePromotion,
        {
          ...welcomePromotion,
          id: "00000000-0000-4000-8000-000000000002",
          active: false,
        },
      ],
    });
  }) as typeof fetch);
  assert.deepEqual(await client(), [welcomePromotion]);
});
test("promociones: contratos e imágenes inseguras se rechazan, lista vacía válida", async () => {
  for (const body of [
    null,
    { items: [{ ...welcomePromotion, image: "javascript:alert(1)" }] },
    { items: [welcomePromotion, welcomePromotion] },
  ]) {
    const client = createPromotionsClient("https://example.test", (async () =>
      Response.json(body)) as typeof fetch);
    await assert.rejects(client);
  }
  assert.deepEqual(
    await createPromotionsClient("https://example.test", (async () =>
      Response.json({ items: [] })) as typeof fetch)(),
    [],
  );
  await assert.rejects(
    createPromotionsClient("https://example.test", (async () =>
      Response.json({}, { status: 503 })) as typeof fetch),
  );
});
test("promociones: fallo no conserva ofertas viejas ni bloquea pedidos; ocultar todas vacía el carrusel", async () => {
  let fail = false;
  let items = [{ ...welcomePromotion, title: "Anuncio publicado" }];
  const store = createPromotionsStore(async () => {
    if (fail) throw Error("Sin conexión");
    return items;
  });
  await store.getState().refresh();
  assert.equal(store.getState().items[0].title, "Anuncio publicado");
  fail = true;
  await store.getState().refresh();
  assert.deepEqual(store.getState().items, [welcomePromotion]);
  fail = false;
  items = [];
  await store.getState().refresh();
  assert.deepEqual(store.getState().items, []);
});
test("promociones: consultas simultáneas comparten una petición", async () => {
  let finish!: (value: (typeof welcomePromotion)[]) => void;
  let calls = 0;
  const store = createPromotionsStore(() => {
    calls++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  const a = store.getState().refresh(),
    b = store.getState().refresh();
  assert.equal(a, b);
  assert.equal(calls, 1);
  finish([]);
  await a;
  assert.deepEqual(store.getState().items, []);
});
