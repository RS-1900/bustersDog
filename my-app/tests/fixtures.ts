import { randomUUID } from "node:crypto";
import type { Product, Order, ShoppingSession } from "../src/types/product";
import {
  createShopStore,
  type ShopDependencies,
} from "../src/stores/createShopStore";
export const product = (name = "Café"): Product => ({
  id: randomUUID(),
  name,
  description: "Café de prueba",
  image: "",
  category_id: randomUUID(),
  category: "Bebidas",
  price: "37.15",
  available: true,
  variants: ["M", "G", "+G"].map((label, i) => ({
    id: randomUUID(),
    presentation_id: randomUUID(),
    label,
    volume_ml: [350, 470, 590][i],
    price: ["37.15", "40.00", "45.00"][i],
    available: true,
  })),
  modifier_groups: [],
});
export function harness() {
  const p = product();
  let raw: string | null = null;
  let session: ShoppingSession | null = null;
  const order: Order = {
    id: randomUUID(),
    folio: "B-123",
    status: "new",
    currency: "MXN",
    total: "37.15",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [],
  };
  const calls: { body: unknown; token: string; key: string }[] = [];
  const deps: ShopDependencies = {
    uuid: randomUUID,
    now: Date.now,
    storage: {
      read: async () => raw,
      write: async (value) => {
        raw = value;
      },
    },
    vault: {
      read: async () => session,
      write: async (value) => {
        session = value;
      },
    },
    api: {
      catalog: async () => ({ currency: "MXN", products: [p] }),
      createSession: async () => ({
        token: "a".repeat(64),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      }),
      createOrder: async (body, token, key) => {
        calls.push({ body, token, key });
        return order;
      },
      getOrder: async () => order,
    },
  };
  return {
    p,
    order,
    deps,
    calls,
    make: () => createShopStore(deps),
    raw: () => raw,
    setRaw: (value: string) => {
      raw = value;
    },
  };
}
