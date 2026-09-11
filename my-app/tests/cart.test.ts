import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { product } from "./fixtures";
import {
  addLine,
  makeLine,
  validateCart,
  cents,
  money,
  totalCents,
} from "../src/domain/cart";
test("3 unidades agregadas por producto, incluso entre tamaños y complementos", () => {
  const p = product();
  const option = {
    id: randomUUID(),
    name: "Vainilla",
    price: "12.35",
    available: true,
  };
  p.modifier_groups = [
    {
      id: randomUUID(),
      name: "Sabor",
      min_selections: 0,
      max_selections: 1,
      options: [option],
    },
  ];
  const cart = [
    makeLine(p, p.variants[0].id, [], 2),
    makeLine(p, p.variants[1].id, [option.id]),
  ];
  assert.equal(validateCart(cart, [p]), null);
  assert.throws(
    () => addLine(cart, makeLine(p, p.variants[2].id, [])),
    /3 unidades/,
  );
  assert.throws(
    () => addLine(cart, makeLine(p, p.variants[0].id, [option.id])),
    /3 unidades/,
  );
});
test("admite 3 productos con 3 unidades; rechaza el cuarto", () => {
  const products = [product(), product(), product(), product()];
  const cart = products
    .slice(0, 3)
    .map((p) => makeLine(p, p.variants[0].id, [], 3));
  assert.equal(validateCart(cart, products), null);
  assert.throws(
    () => addLine(cart, makeLine(products[3], products[3].variants[0].id, [])),
    /3 productos/,
  );
});
test("precios exactos y combinación de opciones canónica; no inventa tamaños", () => {
  const p = product();
  const options = ["A", "B"].map((name) => ({
    id: randomUUID(),
    name,
    price: "12.35",
    available: true,
  }));
  p.modifier_groups = [
    {
      id: randomUUID(),
      name: "Sabores",
      min_selections: 1,
      max_selections: 2,
      options,
    },
  ];
  const ids = options.map((o) => o.id);
  const line = makeLine(p, p.variants[0].id, ids, 2);
  assert.equal(totalCents([line]), 12370);
  assert.match(money(12370), /123.70/);
  assert.equal(cents("0.10"), 10);
  assert.equal(makeLine(p, p.variants[0].id, [...ids].reverse()).key, line.key);
  assert.throws(() => makeLine(p, randomUUID(), ids), /disponible/);
  assert.throws(() => makeLine(p, p.variants[0].id, []), /elige/);
  assert.throws(
    () => makeLine(p, p.variants[0].id, [ids[0], ids[0]]),
    /repitas/,
  );
  options[0].available = false;
  assert.throws(() => makeLine(p, p.variants[0].id, ids), /disponible/);
  p.available = false;
  assert.throws(() => makeLine(p, p.variants[0].id, [ids[1]]), /disponible/);
});
