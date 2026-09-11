import { createStore } from "zustand/vanilla";
import type { CafeApi } from "../services/api-client";
import { ApiError } from "../services/api-client";
import {
  persistedSchema,
  type Product,
  type CartItem,
  type SavedOrder,
  type PendingOrder,
  type ShoppingSession,
} from "../types/product";
import {
  addLine,
  makeLine,
  limitError,
  refreshCart,
  validateCart,
  orderBody,
} from "../domain/cart";

export interface ShopDependencies {
  api: CafeApi;
  storage: {
    read(): Promise<string | null>;
    write(value: string): Promise<void>;
  };
  vault: {
    read(): Promise<ShoppingSession | null>;
    write(value: ShoppingSession): Promise<void>;
  };
  uuid(): string;
  now(): number;
}
export interface ShopState {
  products: Product[];
  cart: CartItem[];
  favoriteIds: string[];
  orders: SavedOrder[];
  pending: PendingOrder | null;
  hydrated: boolean;
  loading: boolean;
  catalogReady: boolean;
  catalogError: string | null;
  error: string | null;
  notice: string | null;
  storageError: string | null;
  submitting: boolean;
  hydrate(): Promise<void>;
  loadCatalog(): Promise<boolean>;
  toggleFavorite(id: string): void;
  addToCart(productId: string, variantId: string, optionIds: string[]): boolean;
  changeQuantity(key: string, delta: number): void;
  removeFromCart(key: string): void;
  submitOrder(): Promise<SavedOrder | null>;
  refreshOrder(id: string): Promise<void>;
  clearMessage(): void;
}
const message = (e: unknown) =>
  e instanceof Error ? e.message : "No se pudo completar la operación.";
export function createShopStore(deps: ShopDependencies) {
  let hydration: Promise<void> | undefined;
  let catalogTask: Promise<boolean> | undefined;
  let writes: Promise<void> = Promise.resolve();
  const refreshes = new Map<string, Promise<void>>();
  return createStore<ShopState>((set, get) => {
    async function save() {
      const { cart, favoriteIds, orders, pending } = get();
      const value = JSON.stringify({
        version: 1,
        cart,
        favoriteIds,
        orders: orders.slice(0, 50),
        pending,
      });
      writes = writes.catch(() => {}).then(() => deps.storage.write(value));
      try {
        await writes;
      } catch {
        set({
          storageError:
            "No pudimos guardar este pedido en el dispositivo. Libera espacio o habilita el almacenamiento y vuelve a abrir la app.",
        });
        throw new Error("No se pudo guardar el pedido.");
      }
    }
    function remember() {
      void save().catch(() => {});
    }
    function editable() {
      if (!get().hydrated || get().storageError) {
        set({ error: "El almacenamiento todavía no está disponible." });
        return false;
      }
      if (get().pending || get().submitting) {
        set({
          error:
            "Primero confirma el resultado del pedido pendiente desde el carrito.",
        });
        return false;
      }
      return true;
    }
    return {
      products: [],
      cart: [],
      favoriteIds: [],
      orders: [],
      pending: null,
      hydrated: false,
      loading: false,
      catalogReady: false,
      catalogError: null,
      error: null,
      notice: null,
      storageError: null,
      submitting: false,
      clearMessage: () => set({ error: null, notice: null }),
      hydrate: () =>
        (hydration ??= (async () => {
          try {
            const raw = await deps.storage.read();
            if (raw) {
              const data = persistedSchema.parse(JSON.parse(raw));
              set({
                cart: data.cart,
                favoriteIds: data.favoriteIds,
                orders: data.orders,
                pending: data.pending,
              });
            }
            set({ hydrated: true });
          } catch {
            set({
              hydrated: true,
              storageError:
                "No pudimos recuperar los datos guardados. No envíes otro pedido hasta revisar el pedido anterior con la cafetería.",
            });
          }
        })()),
      loadCatalog: () =>
        (catalogTask ??= (async () => {
          set({ loading: true, catalogError: null });
          try {
            const { products } = await deps.api.catalog();
            set({ products, catalogReady: true });
            return true;
          } catch (e) {
            set({ catalogError: message(e) });
            return false;
          } finally {
            set({ loading: false });
            catalogTask = undefined;
          }
        })()),
      toggleFavorite: (id) => {
        if (!get().hydrated || get().storageError) return;
        set({
          favoriteIds: get().favoriteIds.includes(id)
            ? get().favoriteIds.filter((x) => x !== id)
            : [...get().favoriteIds, id],
        });
        remember();
      },
      addToCart: (productId, variantId, optionIds) => {
        if (!editable()) return false;
        try {
          const product = get().products.find((p) => p.id === productId);
          if (!product) throw new Error("El producto ya no está disponible.");
          set({
            cart: addLine(get().cart, makeLine(product, variantId, optionIds)),
            error: null,
            notice: "Producto agregado al carrito.",
          });
          remember();
          return true;
        } catch (e) {
          set({ error: message(e), notice: null });
          return false;
        }
      },
      changeQuantity: (key, delta) => {
        if (!editable() || ![-1, 1].includes(delta)) return;
        const next = get()
          .cart.map((item) =>
            item.key === key
              ? { ...item, quantity: item.quantity + delta }
              : item,
          )
          .filter((item) => item.quantity > 0);
        const error = limitError(next);
        if (error) {
          set({ error, notice: null });
          return;
        }
        set({ cart: next, error: null, notice: null });
        remember();
      },
      removeFromCart: (key) => {
        if (editable()) {
          set({
            cart: get().cart.filter((item) => item.key !== key),
            error: null,
            notice: null,
          });
          remember();
        }
      },
      submitOrder: async () => {
        if (get().submitting || !get().hydrated || get().storageError)
          return null;
        set({ submitting: true, error: null, notice: null });
        try {
          let pending = get().pending;
          let session = await deps.vault.read();
          if (!pending) {
            if (!(await get().loadCatalog()))
              throw new Error(
                "No pudimos comprobar los precios y la disponibilidad. Intenta de nuevo.",
              );
            const { cart, products } = get();
            const invalid = validateCart(cart, products);
            if (invalid) throw new Error(invalid);
            const updated = refreshCart(cart, products);
            if (
              updated.some((item, i) => item.unitCents !== cart[i].unitCents)
            ) {
              set({
                cart: updated,
                notice:
                  "Cambió un precio. Revisa el nuevo total y confirma otra vez.",
              });
              await save();
              return null;
            }
            if (
              !session ||
              Date.parse(session.expires_at) <= deps.now() + 60000
            ) {
              session = {
                ...(await deps.api.createSession()),
                localId: deps.uuid(),
              };
              await deps.vault.write(session);
            }
            pending = {
              key: deps.uuid(),
              sessionId: session.localId,
              body: orderBody(updated),
              createdAt: new Date(deps.now()).toISOString(),
            };
            set({ pending, cart: updated });
            // Persist the exact request and key before POST so a lost response can be retried.
            await save();
          }
          if (
            !session ||
            session.localId !== pending.sessionId ||
            Date.parse(session.expires_at) <= deps.now()
          )
            throw new Error(
              "La sesión del pedido pendiente ya no está disponible. Consulta con la cafetería antes de hacer otro pedido.",
            );
          const response = await deps.api.createOrder(
            pending.body,
            session.token,
            pending.key,
          );
          const order = {
            ...response,
            sessionId: session.localId,
            checkedAt: new Date(deps.now()).toISOString(),
          };
          set({
            orders: [
              order,
              ...get().orders.filter((o) => o.id !== order.id),
            ].slice(0, 50),
            cart: [],
            pending: null,
          });
          await save();
          return order;
        } catch (e) {
          if (
            e instanceof ApiError &&
            ([400, 413].includes(e.status) || e.code === "ORDER_REJECTED")
          ) {
            set({ pending: null });
            await save().catch(() => {});
            void get().loadCatalog();
          }
          // A 409 may refer to an already-used key; never silently start a different order.
          set({ error: message(e) });
          return null;
        } finally {
          set({ submitting: false });
        }
      },
      refreshOrder: (id) => {
        const existing = refreshes.get(id);
        if (existing) return existing;
        const task = (async () => {
          try {
            const saved = get().orders.find((o) => o.id === id);
            if (!saved)
              throw new Error(
                "Este pedido no está guardado en el dispositivo.",
              );
            const session = await deps.vault.read();
            if (
              !session ||
              session.localId !== saved.sessionId ||
              Date.parse(session.expires_at) <= deps.now()
            )
              throw new Error(
                "La sesión de consulta terminó. Se muestra el último estado guardado.",
              );
            const order = await deps.api.getOrder(id, session.token);
            set({
              orders: get().orders.map((o) =>
                o.id === id
                  ? {
                      ...order,
                      sessionId: saved.sessionId,
                      checkedAt: new Date(deps.now()).toISOString(),
                    }
                  : o,
              ),
              error: null,
            });
            await save();
          } catch (e) {
            set({ error: message(e) });
          } finally {
            refreshes.delete(id);
          }
        })();
        refreshes.set(id, task);
        return task;
      },
    };
  });
}
