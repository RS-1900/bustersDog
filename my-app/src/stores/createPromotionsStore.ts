import { createStore } from "zustand/vanilla";
import { welcomePromotion, type Promotion } from "../types/promotion";

export function createPromotionsStore(read: () => Promise<Promotion[]>) {
  let pending: Promise<void> | undefined;
  return createStore<{
    items: Promotion[];
    refresh(): Promise<void>;
  }>((set) => ({
    items: [welcomePromotion],
    refresh: () => {
      if (pending) return pending;
      pending = (async () => {
        try {
          set({ items: await read() });
        } catch {
          // No conservar ofertas antiguas si no podemos verificar su vigencia.
          // Un fallo de anuncios nunca bloquea catálogo, carrito o pedidos.
          set({ items: [welcomePromotion] });
        }
      })().finally(() => {
        pending = undefined;
      });
      return pending;
    },
  }));
}
