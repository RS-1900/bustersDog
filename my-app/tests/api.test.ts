import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createApiClient, ApiError } from "../src/services/api-client";
import { product, harness } from "./fixtures";
test("valida contrato y usa headers de compra, sin cookies", async () => {
  const h = harness();
  const key = randomUUID();
  const body = {
    items: [{ variant_id: h.p.variants[0].id, quantity: 1, option_ids: [] }],
  };
  const client = createApiClient(
    "https://cafeteria.example",
    async (url, init) => {
      assert.equal(url, "https://cafeteria.example/api/v1/pedidos");
      assert.equal(init?.credentials, "omit");
      assert.equal(new Headers(init?.headers).get("Idempotency-Key"), key);
      assert.equal(new Headers(init?.headers).get("X-Cafe-Request"), "1");
      assert.deepEqual(JSON.parse(init?.body as string), body);
      return Response.json(h.order, { status: 201 });
    },
  );
  assert.equal(
    (await client.createOrder(body, "a".repeat(64), key)).id,
    h.order.id,
  );
});
test("catálogo válido se transforma, contrato incorrecto se rechaza", async () => {
  const good = createApiClient("https://cafeteria.example", async () =>
    Response.json({ currency: "MXN", products: [product()] }),
  );
  assert.equal((await good.catalog()).products.length, 1);
  const bad = createApiClient("https://cafeteria.example", async () =>
    Response.json({ products: [{ price: 37 }] }),
  );
  await assert.rejects(
    () => bad.catalog(),
    (e: unknown) => e instanceof ApiError && e.status === 502,
  );
});
test("errores mantienen código de rechazo y tiempo de espera", async () => {
  const client = createApiClient("https://cafeteria.example", async () =>
    Response.json(
      { error: "Agotado", code: "ORDER_REJECTED" },
      { status: 409, headers: { "Retry-After": "60" } },
    ),
  );
  await assert.rejects(
    () => client.catalog(),
    (e: unknown) =>
      e instanceof ApiError &&
      e.code === "ORDER_REJECTED" &&
      e.retryAfter === 60,
  );
});
